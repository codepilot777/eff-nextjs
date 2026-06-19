"use client";
import { useState, useEffect } from "react";
import { useFlightData } from "@/hooks/useFlightData"; 
import { injectMETAR } from "@/services/weatherService";
import { fireCDUMacro } from "@/services/pmdgService";
import { adaptEfbPayloadToPmdg } from "@/services/payloadAdapter";
import { buildFullPayloadMacro, buildFuelMacro } from "@/services/dynamicMacroBuilder";
import { CDU } from "@/data/pmdgCommands";

interface InitModalProps {
  isOpen: boolean;
  onClose: () => void;
  sendToFSUIPC: (payload: any) => void; // 🌟 記得喺頂層傳入萬能發射掣
}

export default function InitModal({ isOpen, onClose, sendToFSUIPC }: InitModalProps) {
  const { flightData } = useFlightData();
  const [initStatus, setInitStatus] = useState<"IDLE" | "RUNNING" | "DONE">("IDLE");
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setInitStatus("IDLE");
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1️⃣ 提取並計算目標數值
  const zfwRaw = flightData?.weight_zfw_ofp;
  const targetZFW = zfwRaw ? Number(zfwRaw).toFixed(1) : "---";

  const fuelRaw = flightData?.plan_fuel_total;
  const targetFuel = fuelRaw ? (Number(fuelRaw) - 5).toFixed(1) : "---";

  const originIcao = flightData?.dep_icao || "UNKNOWN";
  const aircraftReg = flightData?.aircraft_reg || "B-HNQ";

  // 🚀 核心執行程序：手起刀落，連技爆發！
  const handleInitialize = async () => {
    if (!flightData) return;
    setInitStatus("RUNNING");
    
    try {
      // --------------------------------------------------------
      // 📡 STEP 1: 注入天氣環境 (METAR)
      // --------------------------------------------------------
      setCurrentStep(1);
      const metarString = `GLOB 000000Z 00000KT 9999 CAVOK 15/10 Q1013`; // 可以換成動態真實 METAR
      injectMETAR(sendToFSUIPC, metarString);
      await new Promise(resolve => setTimeout(resolve, 1500)); // 緩衝時間

      // --------------------------------------------------------
      // 📡 STEP 2: 動態計算並注入精準 Payload (CG Balancer)
      // --------------------------------------------------------
      setCurrentStep(2);
      
      // 裝填 EFB 先前算好的各分區數據 (公斤)
      const efbLoadingData = {
        paxWeights: {
          zoneOA: flightData?.zone_oa_weight || 0,
          zoneOB: flightData?.zone_ob_weight || 0,
          zoneOC: flightData?.zone_oc_weight || 0,
          zoneOD: flightData?.zone_od_weight || 0,
        },
        cargoWeights: {
          hold1: flightData?.hold1_weight || 0,
          hold2: flightData?.hold2_weight || 0,
          hold3: flightData?.hold3_weight || 0,
          hold4: flightData?.hold4_weight || 0,
          bulk:  flightData?.bulk_weight  || 0,
        }
      };

      // 丟進適配器，算出 PMDG 專用的 3舱3仓 數據
      const pmdgPayload = adaptEfbPayloadToPmdg(efbLoadingData, aircraftReg);
      
      // 生成 FMC 轉頁按鍵 (MENU -> FS ACTIONS -> PAYLOAD) 加上 數值打字連技
      const payloadSequence = [CDU.MENU, CDU.R6, CDU.L1] // 先跳去 Payload 頁面
        .concat(buildFullPayloadMacro(pmdgPayload));

      // 幽靈副機長開火！
      await fireCDUMacro(sendToFSUIPC, payloadSequence);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // --------------------------------------------------------
      // 📡 STEP 3: 注入 Standby Fuel
      // --------------------------------------------------------
      setCurrentStep(3);
      
      // 生成 FMC 轉頁按鍵 (MENU -> FS ACTIONS -> FUEL) 加上 燃油打字連技
      const fuelSequence = [CDU.MENU, CDU.R6, CDU.L2] // 先跳去 Fuel 頁面
        .concat(buildFuelMacro(targetFuel));

      // 幽靈副機長再次開火！
      await fireCDUMacro(sendToFSUIPC, fuelSequence);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // --------------------------------------------------------
      // 📡 STEP 4: 開放 ACARS Datalink 讓學生自己 Request Route
      // --------------------------------------------------------
      setCurrentStep(4);
      // 這裏日後會對接 Node.js API 自動寫入 .rte 檔案落 C Drive
      // 目前先亮起綠燈，代表 Datalink 路由分配站已 Standby
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setInitStatus("DONE");
    } catch (error) {
      console.error("Initialization Failed:", error);
      alert("Init Failed! Check Server Connection.");
      setInitStatus("IDLE");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#333] relative z-10">
          <h3 className="text-[#00bfa5] font-black text-xl tracking-widest uppercase flex items-center gap-3 m-0">
            <span>🚀 PRE-FLIGHT INITIALIZATION ({aircraftReg})</span>
            {initStatus === "RUNNING" && <span className="text-xs bg-[#FF9100] text-black px-2 py-0.5 rounded animate-pulse">INJECTING CODE</span>}
            {initStatus === "DONE" && <span className="text-xs bg-[#00E676] text-black px-2 py-0.5 rounded">SUCCESS</span>}
          </h3>
          <button 
            onClick={onClose}
            disabled={initStatus === "RUNNING"}
            className="text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* 左側：真實目標數據 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-500 font-bold text-xs tracking-widest uppercase border-b border-[#333] pb-2">Target Scenario</h4>
            <div className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-[#333]">
              <span className="text-gray-400 font-mono text-sm">📍 Origin Airport</span>
              <span className="font-black text-[#2979FF] tracking-wider">{originIcao}</span>
            </div>
            <div className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-[#333]">
              <span className="text-gray-400 font-mono text-sm">⚖️ Target ZFW</span>
              <span className="font-black tracking-wider text-white">{targetZFW} <span className="text-xs text-gray-500">TONS</span></span>
            </div>
            <div className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-[#333]">
              <span className="text-gray-400 font-mono text-sm">⛽ Standby Fuel (-5T)</span>
              <span className="font-black tracking-wider text-white">{targetFuel} <span className="text-xs text-gray-500">TONS</span></span>
            </div>
          </div>

          {/* 右側：精準連技進度 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-gray-500 font-bold text-xs tracking-widest uppercase border-b border-[#333] pb-2">Execution Sequence</h4>
            <ul className="flex flex-col gap-3 font-mono text-sm">
              <StepItem stepNum={1} currentStep={currentStep} label={`Inject ${originIcao} METAR Environment`} />
              <StepItem stepNum={2} currentStep={currentStep} label={`FMC Macro: Deploy Balanced Payload`} />
              <StepItem stepNum={3} currentStep={currentStep} label={`FMC Macro: Fill Standby Fuel (${targetFuel}T)`} />
              <StepItem stepNum={4} currentStep={currentStep} label="ACARS: Datalink Route Standby" />
            </ul>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-[#333] bg-[#111] relative z-10">
          <button
            onClick={handleInitialize}
            disabled={initStatus === "RUNNING"}
            className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all flex justify-center items-center gap-3 ${
              initStatus === "RUNNING"
                ? "bg-[#333] border border-[#555] text-gray-400 cursor-not-allowed"
                : initStatus === "DONE"
                  ? "bg-[#252525] border border-[#00E676] text-[#00E676] hover:bg-[#00E676] hover:text-black"
                  : "bg-[#00bfa5] text-black hover:bg-[#00bfa5]/80 active:scale-95 shadow-[0_0_15px_rgba(0,191,165,0.3)]"
            }`}
          >
            {initStatus === "RUNNING" ? (
              <><span className="animate-spin text-lg">⚙️</span> EXECUTING SCENARIO GHOST MACRO...</>
            ) : initStatus === "DONE" ? (
              <><span className="text-lg">✅</span> SIMULATOR COMPLETED</>
            ) : (
              <><span className="text-lg">⚡</span> CONFIRM AND EXECUTE</>
            )}
          </button>
          {initStatus === "IDLE" && (
            <p className="text-center text-[0.6rem] text-[#FF9100] mt-3 tracking-widest uppercase">
              * Ensure aircraft is parked at {originIcao} before execution
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

function StepItem({ stepNum, currentStep, label }: { stepNum: number; currentStep: number; label: string }) {
  const isRunning = currentStep === stepNum;
  const isDone = currentStep > stepNum || (currentStep === 0 && currentStep !== stepNum); 

  return (
    <li className={`flex items-center gap-3 transition-all duration-300 ${
      isRunning ? "text-[#FF9100] scale-105 ml-2 font-bold" : isDone ? "text-[#00E676]" : "text-gray-600"
    }`}>
      <span className="text-lg w-5 text-center flex-shrink-0">
        {isRunning ? "▶" : isDone ? "✓" : "○"}
      </span>
      <span>{label}</span>
    </li>
  );
}
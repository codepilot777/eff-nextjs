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
  sendToFSUIPC: (payload: any) => void;
}

// 定義每個 Step 嘅專屬狀態
type StepStatus = "IDLE" | "RUNNING" | "DONE" | "ERROR";

export default function InitModal({ isOpen, onClose, sendToFSUIPC }: InitModalProps) {
  const { flightData } = useFlightData();
  
  // 🎯 用 Object 獨立管理每一個 Step 嘅狀態
  const [stepStatus, setStepStatus] = useState<Record<string, StepStatus>>({
    config: "IDLE",
    metar: "IDLE",
    payload: "IDLE",
    fuel: "IDLE",
    acars: "IDLE"
  });

  useEffect(() => {
    if (isOpen) {
      // 每次打開 Modal 都重置所有狀態
      setStepStatus({
        config: "IDLE",
        metar: "IDLE",
        payload: "IDLE",
        fuel: "IDLE",
        acars: "IDLE"
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1️⃣ 提取並計算目標數值
  const zfwRaw = flightData?.weight_zfw_ofp;
  const targetZFW = zfwRaw ? Number(zfwRaw).toFixed(1) : "---";

  const fuelRaw = flightData?.plan_fuel_total;
  const targetFuel = fuelRaw ? (Number(fuelRaw) - 5).toFixed(1) : "---";

  const originIcao = flightData?.dep_icao || "UNKNOWN";
  const aircraftReg = flightData?.aircraft_reg || "B-KPA";

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 🚀 個別執行函數
  const updateStatus = (key: string, status: StepStatus) => {
    setStepStatus(prev => ({ ...prev, [key]: status }));
  };

  // Phase 0: 觸發下載 Airframe Config
  const handleDownloadConfig = async () => {
    updateStatus("config", "RUNNING");
    try {
      const fileUrl = `/configs/airframes/${aircraftReg}.ini`;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `${aircraftReg}.ini`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      await delay(800); // 視覺緩衝
      updateStatus("config", "DONE");
    } catch (e) {
      updateStatus("config", "ERROR");
    }
  };

  // Phase 1: 注入天氣
  const handleInjectMetar = async () => {
    updateStatus("metar", "RUNNING");
    try {
      const metarString = `GLOB 000000Z 00000KT 9999 CAVOK 15/10 Q1013`; 
      injectMETAR(sendToFSUIPC, metarString);
      await delay(1500);
      updateStatus("metar", "DONE");
    } catch (e) {
      updateStatus("metar", "ERROR");
    }
  };

  // Phase 2: 注入 Payload
  const handleInjectPayload = async () => {
    if (!flightData) return;
    updateStatus("payload", "RUNNING");
    try {
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

      const pmdgPayload = adaptEfbPayloadToPmdg(efbLoadingData, aircraftReg);
      const payloadSequence = [CDU.MENU, CDU.R6, CDU.L1].concat(buildFullPayloadMacro(pmdgPayload));

      await fireCDUMacro(sendToFSUIPC, payloadSequence);
      updateStatus("payload", "DONE");
    } catch (e) {
      updateStatus("payload", "ERROR");
    }
  };

  // Phase 3: 注入 Fuel
  const handleInjectFuel = async () => {
    updateStatus("fuel", "RUNNING");
    try {
      const fuelSequence = [CDU.MENU, CDU.R6, CDU.L2].concat(buildFuelMacro(targetFuel));
      await fireCDUMacro(sendToFSUIPC, fuelSequence);
      updateStatus("fuel", "DONE");
    } catch (e) {
      updateStatus("fuel", "ERROR");
    }
  };

  // Phase 4: ACARS Datalink
  const handleSetupAcars = async () => {
    updateStatus("acars", "RUNNING");
    try {
      await delay(1500); // 模擬連線
      updateStatus("acars", "DONE");
    } catch (e) {
      updateStatus("acars", "ERROR");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#333] relative z-10 bg-[#111]">
          <h3 className="text-[#00bfa5] font-black text-xl tracking-widest uppercase flex items-center gap-3 m-0">
            <span>🚀 PRE-FLIGHT INITIALIZATION ({aircraftReg})</span>
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* 左側：真實目標數據 */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <h4 className="text-gray-500 font-bold text-xs tracking-widest uppercase border-b border-[#333] pb-2">Target Scenario</h4>
            <div className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-[#333]">
              <span className="text-gray-400 font-mono text-xs">📍 Origin</span>
              <span className="font-black text-[#2979FF] tracking-wider">{originIcao}</span>
            </div>
            <div className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-[#333]">
              <span className="text-gray-400 font-mono text-xs">⚖️ Target ZFW</span>
              <span className="font-black tracking-wider text-white">{targetZFW} <span className="text-[0.6rem] text-gray-500">TONS</span></span>
            </div>
            <div className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-[#333]">
              <span className="text-gray-400 font-mono text-xs">⛽ Stdby Fuel</span>
              <span className="font-black tracking-wider text-white">{targetFuel} <span className="text-[0.6rem] text-gray-500">TONS</span></span>
            </div>
            <div className="mt-auto bg-[#ff9100]/10 border border-[#ff9100]/20 rounded-lg p-3">
              <p className="text-[0.65rem] text-[#ff9100] m-0 leading-relaxed uppercase font-mono">
                * Execute steps individually. FSUIPC WebSocket must be connected before triggering FMC macros.
              </p>
            </div>
          </div>

          {/* 右側：可獨立控制嘅連技列表 */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <h4 className="text-gray-500 font-bold text-xs tracking-widest uppercase border-b border-[#333] pb-2">Execution Modules</h4>
            
            <ActionRow 
              status={stepStatus.config} 
              onExecute={handleDownloadConfig}
              title={`Phase 0: Download ${aircraftReg}.ini`}
              desc="Save to PMDG Aircraft folder & Reload Panel State"
            />
            
            <ActionRow 
              status={stepStatus.metar} 
              onExecute={handleInjectMetar}
              title={`Phase 1: Inject ${originIcao} METAR`}
              desc="Update simulator active weather scenario"
            />
            
            <ActionRow 
              status={stepStatus.payload} 
              onExecute={handleInjectPayload}
              title={`Phase 2: FMC Payload Balancer`}
              desc={`Ghost Macro: Inject ZFW ${targetZFW}T into Stations`}
            />

            <ActionRow 
              status={stepStatus.fuel} 
              onExecute={handleInjectFuel}
              title={`Phase 3: FMC Standby Fuel`}
              desc={`Ghost Macro: Fill Block Fuel ${targetFuel}T`}
            />

            <ActionRow 
              status={stepStatus.acars} 
              onExecute={handleSetupAcars}
              title="Phase 4: ACARS Datalink"
              desc="Arm route uplink for crew request"
            />
            
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 專門用嚟 Render 每一行獨立任務嘅小組件
function ActionRow({ status, onExecute, title, desc }: { status: StepStatus, onExecute: () => void, title: string, desc: string }) {
  return (
    <div className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
      status === "RUNNING" ? "bg-[#333]/50 border-[#FF9100]" : 
      status === "DONE" ? "bg-[#00E676]/5 border-[#00E676]/30" : 
      "bg-[#1A1A1A] border-[#333] hover:border-[#555]"
    }`}>
      <div className="flex flex-col">
        <span className={`font-mono text-sm font-bold tracking-wide ${status === "DONE" ? "text-[#00E676]" : "text-white"}`}>
          {title}
        </span>
        <span className="text-[0.65rem] text-gray-500 uppercase">{desc}</span>
      </div>

      <button
        onClick={onExecute}
        disabled={status === "RUNNING" || status === "DONE"}
        className={`px-4 py-2 rounded font-black text-xs tracking-widest uppercase transition-all w-28 text-center ${
          status === "RUNNING" ? "bg-transparent text-[#FF9100] border border-[#FF9100]" :
          status === "DONE" ? "bg-transparent text-[#00E676]" :
          "bg-[#2A2A2A] text-white hover:bg-[#00bfa5] hover:text-black"
        }`}
      >
        {status === "RUNNING" ? "EXECUTING" : status === "DONE" ? "✓ DONE" : "EXECUTE"}
      </button>
    </div>
  );
}
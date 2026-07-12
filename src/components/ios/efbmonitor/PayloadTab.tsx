"use client";
import { useState, useEffect, useRef } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import { DEFAULT_OFP_FUEL_T, getStandbyFuelT } from "@/lib/fuelCalculator";
import { LoadsheetEngine, AutoLoader, PAX_CLASS_WEIGHTS, CREW_PANTRY_REGISTRY, getWaterWeight, getMainTankCapacity } from "@/lib/loadsheet/LoadsheetEngine";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { getEffectiveWeightLimits } from "@/lib/loadsheet/loadsheetHelpers";
// 🌟 引入我們先前編寫好的跨界適配器大腦
import { adaptEfbPayloadToPmdg, buildEfbLoadingPayload } from "@/services/payloadAdapter";
import { buildPayloadAndFuelSyncMacro } from "@/services/dynamicMacroBuilder";
import { fireCDUMacro } from "@/services/pmdgService";

// 引入子組件
import AircraftVisualizer from "./payload-tab/AircraftVisualizer";
import PaxCargoEditor from "./payload-tab/PaxCargoEditor";
import FuelManager from "./payload-tab/FuelManager";
import SimSyncController from "./payload-tab/SimSyncController";

export default function PayloadTab({ isConnected, sendToFSUIPC }: any) {
  const { flightData, updateFlightData, updateFlightDataAsync, calc, isUpdating } = useFlightData();

  // 🌟 新增：智能追蹤鎖 (追蹤 Target ZFW 同 Fuel Order 嘅變化)
  const loadedZfwRef = useRef<number>(0);
  const loadedFuelOrderRef = useRef<number>(0);

  // 🌟 模擬機連動狀態控制
  const [isSimSyncing, setIsSimSyncing] = useState(false);

  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  const [payload, setPayload] = useState<{
    pax: Record<string, number>;
    cargo: { h1: number; h2: number; h3: number; h4: number; bulk: number };
    fuel: { uplift: number; left: number; center: number; right: number; finalOrder: number };
  }>({
    pax: {},
    cargo: { h1: 0, h2: 0, h3: 0, h4: 0, bulk: 0 },
    fuel: { uplift: 0, left: 0, center: 0, right: 0, finalOrder: 0 }
  });

  if (!flightData) return null;

  // ==========================================
  // 🌟 數據定錨
  // ==========================================
  const targetZFW = flightData?.weight_zfw_ofp ? Math.round(flightData.weight_zfw_ofp * 1000) : 205000;
  const ofpTotalFuelKg = flightData?.plan_fuel_total ? Math.round(flightData.plan_fuel_total * 1000) : Math.round(DEFAULT_OFP_FUEL_T * 1000);
  // 🌟 同 RefuelAircraftColumn.tsx 用返同一個共用 helper，唔再各自寫死 "-5000"
  const standbyFuelKg = Math.round(getStandbyFuelT(flightData) * 1000);
  const fobKg = flightData?.fuel_on_board ? Math.round(flightData.fuel_on_board * 1000) : 0;
  const traineeFinalFuelKg = flightData?.final_fuel_request ? Math.round(flightData.final_fuel_request * 1000) : 0;

  const distributeFuel = (val: number) => {
    const maxMain = getMainTankCapacity(ahm);
    if (val <= maxMain * 2) {
      const half = Math.round(val / 2);
      return { left: half, center: 0, right: val - half };
    } else {
      return { left: maxMain, center: val - (maxMain * 2), right: maxMain };
    }
  };

  // ==========================================
  // 🌟 PMDG 實時跨界同步引擎：真係接返 sendToFSUIPC，唔再係得個 console.table
  // ==========================================
  const handleSyncToPmdgSim = async () => {
    if (isSimSyncing || !isConnected) return;
    setIsSimSyncing(true);

    try {
      // 📦 1. 抽離並組裝客艙總重量生肉（同 InitModal.tsx 共用同一個 helper）
      const efbLoadingPayload = buildEfbLoadingPayload(ahm, { pax: payload.pax, cargo: payload.cargo });
      const pmdgPayloadOutput = adaptEfbPayloadToPmdg(efbLoadingPayload, currentReg);
      const targetTotalFuelKg = payload.fuel.left + payload.fuel.center + payload.fuel.right;

      // 🎯 真正發送：入 PAYLOAD 頁打晒 payload，再入 FUEL 頁打總油量
      const sequence = buildPayloadAndFuelSyncMacro(pmdgPayloadOutput, targetTotalFuelKg / 1000);
      await fireCDUMacro(sendToFSUIPC, sequence);

      alert("✅ Payload & fuel synchronized to PMDG simulator.");
    } catch (error) {
      console.error("PMDG sim sync failed:", error);
      alert(`⚠️ PMDG sim sync failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSimSyncing(false);
    }
  };

  // ==========================================
  // 🌟 自動配載器 (完全對齊極簡版 DOW 與艙等屬性)
  // ==========================================
  const generateExactPayload = (targetZfwKg: number) => {
    const generated = AutoLoader.generatePayload(targetZfwKg, ahm);
    
    // 🌟 核心升級：精確讀取真實 DOW 作為減數基底（用返同 AutoLoader/engine 一樣嘅 registry，唔再各自硬編碼）
    const crewPantryWeight = (CREW_PANTRY_REGISTRY[ahm.acType] || CREW_PANTRY_REGISTRY["B773"]).weight;
    const waterWeight = getWaterWeight(ahm, 15).weight; // 假設飲用水 15/16 滿
    const engineDOW = ahm.basicData.BW + crewPantryWeight + waterWeight;

    const paxWt = Object.entries(generated.pax).reduce((sum, [zoneKey, count]) => {
      const zoneClass = ((ahm.stations.pax as any)[zoneKey]?.primaryClass || "Y") as "J" | "W" | "Y";
      const weight = PAX_CLASS_WEIGHTS[zoneClass] ?? PAX_CLASS_WEIGHTS.Y;
      return sum + (Number(count) * weight);
    }, 0);
    
    const reqCargo = Math.max(0, targetZfwKg - engineDOW - paxWt);
    const h1 = Math.round(reqCargo * 0.15); // 對齊 Aft Bias 貨艙權重
    const h2 = Math.round(reqCargo * 0.35); 
    const h3 = Math.round(reqCargo * 0.35);
    const h4 = Math.round(reqCargo * 0.10); 
    const bulk = Math.max(0, reqCargo - h1 - h2 - h3 - h4);
    
    const normalizedPax: Record<string, number> = {};
    Object.keys(ahm.stations.pax).forEach(k => {
      normalizedPax[k] = generated.pax[k] || 0;
    });

    return { 
      pax: normalizedPax, 
      cargo: { h1, h2, h3, h4, bulk } 
    };
  };

  // ==========================================
  // 🌟 1. 系統自動 Preload 邏輯 (智能解鎖版)
  // ==========================================
  useEffect(() => {
    if (!flightData || !flightData.weight_zfw_ofp) return;

    if (loadedZfwRef.current === targetZFW) return;

    const hasSavedPayload = flightData.pax_y > 0 || flightData.cargo_hold_1 > 0;

    if (hasSavedPayload) {
      const restoredPax: Record<string, number> = {}; 
      const zoneKeys = Object.keys(ahm.stations.pax);
      if (zoneKeys[0]) restoredPax[zoneKeys[0]] = flightData.pax_f || 0;
      if (zoneKeys[1]) restoredPax[zoneKeys[1]] = flightData.pax_j || 0;
      if (zoneKeys[2]) restoredPax[zoneKeys[2]] = flightData.pax_w || 0;
      if (zoneKeys[3]) restoredPax[zoneKeys[3]] = flightData.pax_y || 0;
      if (zoneKeys[4]) restoredPax[zoneKeys[4]] = 0;
      
      setPayload({
        pax: restoredPax,
        cargo: { h1: flightData.cargo_hold_1 || 0, h2: flightData.cargo_hold_2 || 0, h3: flightData.cargo_hold_3 || 0, h4: flightData.cargo_hold_4 || 0, bulk: flightData.cargo_bulk || 0 },
        fuel: {
          finalOrder: flightData.final_fuel_request ? flightData.final_fuel_request * 1000 : standbyFuelKg,
          // 🌟 actual_uplift 淨係教官真正送咗 fuel receipt 之後先有數；喺嗰之前
          // prefill 返學員自己嘅 estimated_uplift 做個起點，兩者唔會撞義
          uplift: flightData.actual_uplift ? flightData.actual_uplift * 1000 : (flightData.estimated_uplift ? flightData.estimated_uplift * 1000 : 0),
          left: flightData.fuel_left_main || distributeFuel(standbyFuelKg).left, center: flightData.fuel_center || distributeFuel(standbyFuelKg).center, right: flightData.fuel_right_main || distributeFuel(standbyFuelKg).right
        }
      });
    } else {
      const exactData = generateExactPayload(targetZFW); 
      const initialFuel = distributeFuel(standbyFuelKg);
      setPayload({ 
        pax: exactData.pax, 
        cargo: exactData.cargo, 
        fuel: { finalOrder: standbyFuelKg, uplift: 0, left: initialFuel.left, center: initialFuel.center, right: initialFuel.right } 
      });
    }
    
    loadedZfwRef.current = targetZFW;
  }, [flightData, targetZFW, standbyFuelKg, ahm]); 

  // 🌟 追蹤學員 Final Fuel Request 變更 (升級版：自動預填 Uplift)
  useEffect(() => {
    if (!flightData?.final_fuel_request) return;
    
    // 學員要的總油量 (Tons 轉成 KG)
    const traineeOrderKg = Math.round(flightData.final_fuel_request * 1000);
    
    if (traineeOrderKg !== loadedFuelOrderRef.current && traineeOrderKg !== payload.fuel.finalOrder) {
      const dist = distributeFuel(traineeOrderKg);
      
      // 🎯 核心核心：全自動幫教官計算 Uplift = 學員總要油量 - 機上現有殘油 (FOB)
      // 用 Math.max 防止算出來是負數
      const computedUplift = Math.max(0, traineeOrderKg - fobKg);
      
      setPayload(prev => ({ 
        ...prev, 
        fuel: { 
          ...prev.fuel, 
          finalOrder: traineeOrderKg, 
          left: dist.left, 
          center: dist.center, 
          right: dist.right,
          uplift: computedUplift // 👈 完美預填！教官唔需要再揼計數機
        } 
      }));
      
      loadedFuelOrderRef.current = traineeOrderKg;
    }
  }, [flightData?.final_fuel_request, fobKg]); // 🌟 記得將 fobKg 加到依賴陣列，確保殘油更新時會實時連動！

  // ==========================================
  // 🌟 2. 實時物理引擎大腦
  // ==========================================
  
  const revisedTaxiKg = (calc?.currTaxi || flightData?.fuel_taxi_ofp || 0.2) * 1000;
  const blockFuelKg = (Number(payload.fuel.left) || 0) + (Number(payload.fuel.center) || 0) + (Number(payload.fuel.right) || 0);
  const takeoffFuelKg = Math.max(0, blockFuelKg - revisedTaxiKg);
  // 🌟 修復：以前呢度恆定讀靜態 flightData.fuel_trip_ofp 計 LAW，同上面 taxi 已經用緊嘅
  // revised 數（calc.currTaxi）唔同步，令教官自己嘅 Payload Tab 都睇緊過時嘅 Landing Weight
  const revisedTripKg = (calc?.currTrip || flightData?.fuel_trip_ofp || 18.5) * 1000;

  const enginePayload = {
    pax: payload.pax as any,
    cargo: { hold1: Number(payload.cargo.h1) || 0, hold2: Number(payload.cargo.h2) || 0, hold3: Number(payload.cargo.h3) || 0, hold4: Number(payload.cargo.h4) || 0, bulk: Number(payload.cargo.bulk) || 0 },
    waterFraction: Number(flightData?.water_fraction) || 15,
    fuel: { takeoff: takeoffFuelKg, trip: revisedTripKg, isStandard: false, tanks: { leftMain: Number(payload.fuel.left) || 0, center: Number(payload.fuel.center) || 0, rightMain: Number(payload.fuel.right) || 0 } }
  };

  const engine = new LoadsheetEngine(ahm, enginePayload as any);
  const weights = engine.calculateWeights();
  const cg = engine.calculateCG();
  // 🌟 修復：以前呢度用 engine.checkLimits() 冇傳參數，恆定同 AHM 原廠上限比較，完全睇唔到
  // trainee 喺 ModalLoadsheet CUST 開關度設定嘅 custom_mzfw/mtow/mlaw——令教官自己嘅 Payload
  // Tab（Act ZFW 紅色警示）同 trainee 睇緊嘅 loadsheet 文本得出兩個唔同嘅「過唔過 limit」結論
  const effectiveLimits = getEffectiveWeightLimits(ahm, flightData);
  const limits = engine.checkLimits(effectiveLimits);
  
  const safeZFW = weights?.ZFW ? (weights.ZFW / 1000).toFixed(1) : "0.0";
  const safeLIZFW = cg?.LIZFW ? cg.LIZFW.toFixed(0) : "0"; 
  const safeMACZFW = cg?.MACZFW ? cg.MACZFW.toFixed(1) : "0.0"; 
  const safeMACTOW = cg?.MACTOW ? cg.MACTOW.toFixed(1) : "0.0";

  // src/components/ios/efbmonitor/PayloadTab.tsx 內部

  const handleTransmit = async (docType: string) => {
    const updates: any = {};
    const zoneKeys = Object.keys(ahm.stations.pax);
    
    if (zoneKeys[0]) updates.pax_f = payload.pax[zoneKeys[0]]; 
    if (zoneKeys[1]) updates.pax_j = payload.pax[zoneKeys[1]]; 
    if (zoneKeys[2]) updates.pax_w = payload.pax[zoneKeys[2]]; 
    if (zoneKeys[3]) updates.pax_y = payload.pax[zoneKeys[3]];
    
    updates.cargo_hold_1 = payload.cargo.h1; 
    updates.cargo_hold_2 = payload.cargo.h2; 
    updates.cargo_hold_3 = payload.cargo.h3; 
    updates.cargo_hold_4 = payload.cargo.h4; 
    updates.cargo_bulk = payload.cargo.bulk;
    
    const currentSnapshot = { pax: payload.pax, cargo: payload.cargo, fuel: payload.fuel };
    
    if (docType === "EZFW") { updates.ezfw_sent = true; updates.ezfw_snapshot = currentSnapshot; }
    if (docType === "AZF") { updates.azf_sent = true; updates.azf_snapshot = currentSnapshot; }
    
    // ==========================================
    // 🚨 修正點 1：PRELIM 發送時的版本控制
    // ==========================================
    if (docType === "PRELIM") { 
      updates.prelim_ls_sent = true; 
      const ver = flightData?.prelim_ls_version || 1; 
      updates.prelim_history = [...(flightData?.prelim_history || []), { version: ver, snapshot: currentSnapshot }]; 
      
      // 🌟 核心修復：下一次發送時，版本號必須自動 +1
      updates.prelim_ls_version = ver + 1;
      
      // 🌟 核心修復：既然已經發送了修正版，就要自動撤銷被拒絕的狀態，並清空原因
      updates.prelim_ls_rejected = false;
      updates.prelim_ls_reject_reason = "";
      
      updates.fuel_left_main = payload.fuel.left; 
      updates.fuel_center = payload.fuel.center; 
      updates.fuel_right_main = payload.fuel.right; 
    }
    
    // ==========================================
    // 🚨 修正點 2：FINAL 發送時的版本控制 (未雨綢繆，一併修正)
    // ==========================================
    if (docType === "FINAL") { 
      updates.final_ls_sent = true; 
      const ver = flightData?.final_ls_version || 1; 
      updates.final_history = [...(flightData?.final_history || []), { version: ver, snapshot: currentSnapshot }]; 
      
      // 🌟 核心修復：Final 版本號同步自增 +1
      updates.final_ls_version = ver + 1;
      
      // 🌟 核心修復：撤銷 Final 被拒絕狀態，並且因為是全新版本，需要機長重新簽署
      updates.final_ls_rejected = false;
      updates.final_ls_reject_reason = "";
      updates.pilots_signed_final = false; 
    }
    
    if (docType === "FUEL_RECEIPT") {
      updates.fuel_receipt_sent = true;
      updates.actual_uplift = payload.fuel.uplift / 1000;
      updates.fuel_left_main = payload.fuel.left;
      updates.fuel_center = payload.fuel.center;
      updates.fuel_right_main = payload.fuel.right;
      updates.final_fuel_request = payload.fuel.finalOrder / 1000;
      // 🌟 修復：以前 Total FOB 讀緊一個從未寫過嘅 trainee_log_fuel 欄位（恆定 0）。
      // 呢度凍結返派發嗰刻嘅機上殘油（fobKg），令 ModalRefuelling 之後就算 fuel_on_board
      // 再變動都唔會影響返個已經簽發咗嘅 receipt 顯示嘅 Total FOB。
      updates.fob_before_uplift = fobKg / 1000;
      // 🌟 新增：重新 dispatch 咗張改正嘅 receipt 就要清返之前嘅 rejected 狀態（同
      // PRELIM/FINAL 一樣嘅設計），並且要求機師對住新數重新 review 一次先可以 accept
      updates.fuel_receipt_rejected = false;
      updates.fuel_receipt_reject_reason = "";
      updates.pilots_signed_fuel = false;
    }
    
    // 🌟 PRELIM/FINAL 係真正嘅派發文件，超重/CG 爆晒都可以照送（呢個係訓練工具，
    // 教官可能刻意整個超重 scenario 考機師識唔識察覺），但一定要問清楚先，唔可以靜靜雞漏咗警告
    if ((docType === "PRELIM" || docType === "FINAL") && !limits.isValid) {
      const failed = Object.entries(limits.errors)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", ");
      if (!confirm(`⚠️ This loadsheet exceeds limits (${failed}). Transmit anyway?`)) return;
    }

    try {
      await updateFlightDataAsync(updates);
      alert(`${docType} snapshot transmitted to EFB!`);
    } catch (error) {
      console.error(`Failed to transmit ${docType}:`, error);
      alert(`⚠️ Failed to transmit ${docType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 font-sans text-white">
      {/* 🌟 修復：以前 lg:（1024px）就切 2 欄，但 iPad 橫向嘅實際可用 viewport
          （扣走 Safari 嘅 chrome 之後）通常啱啱好落喺 1024px 上下——加上呢個 tab
          仲要同隔籬嘅 InboxPanel 分緊寬度，實際分到嘅欄位遠比 1024px 窄。太早
          切 2 欄會將 AircraftVisualizer + 成疊 PaxCargoEditor/FuelManager 逼晒
          入窄欄，先至有「太多 info 逼埋一齊」嘅問題。而家淨係喺真正夠闊嘅
          xl:（1280px，desktop / 大 iPad Pro 橫向）先切 2 欄，iPad portrait 同
          大部分 iPad landscape 都保持成欄 stack，每個 card 攞晒成行寬度 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.3fr] gap-6 items-start relative">

        {/* 左側：飛機視圖 */}
        <div className="xl:sticky xl:top-6 z-10">
          <AircraftVisualizer 
            ahm={ahm} 
            payload={payload} 
            targetZFW={targetZFW} 
            limits={limits} 
            safeZFW={safeZFW} 
            safeLIZFW={safeLIZFW} 
            safeMACZFW={safeMACZFW} 
            safeMACTOW={safeMACTOW} 
          />
        </div>

        {/* 右側：控制面板 */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Payload Editor */}
          <PaxCargoEditor
            ahm={ahm}
            payload={payload}
            setPayload={setPayload}
            targetZFW={targetZFW}
            generateExactPayload={generateExactPayload}
            handleTransmit={handleTransmit}
            isUpdating={isUpdating}
          />
          
          {/* Card 2: Fuel Manager */}
          <FuelManager
            payload={payload}
            setPayload={setPayload}
            flightData={flightData}
            ofpTotalFuelKg={ofpTotalFuelKg}
            standbyFuelKg={standbyFuelKg}
            fobKg={fobKg}
            traineeFinalFuelKg={traineeFinalFuelKg}
            handleTransmit={handleTransmit}
            isUpdating={isUpdating}
          />

          {/* Card 3: Sim Sync */}
          <SimSyncController
            isConnected={isConnected}
            isSimSyncing={isSimSyncing}
            handleSyncToPmdgSim={handleSyncToPmdgSim}
          />

          {/* Card 4: Document Dispatch */}
          <div className="bg-lido-800 p-6 rounded-xl border border-[#333333] shadow-lg">
            <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2 border-b border-[#333333] pb-3 mb-4">
              <span className="text-[#FF9100]">4.</span> Document Dispatch
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTransmit("PRELIM")}
                disabled={isUpdating}
                className="bg-[#FF9100]/20 border border-[#FF9100] text-[#FF9100] py-4 rounded-lg font-black tracking-widest text-xs hover:bg-[#FF9100] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FF9100]/20 disabled:hover:text-[#FF9100]"
              >
                TRANSMIT PRELIM
              </button>
              <button
                onClick={() => handleTransmit("FINAL")}
                disabled={!flightData?.fuel_receipt_sent || isUpdating}
                className={`border py-4 rounded-lg font-black tracking-widest text-xs transition-all ${
                  flightData?.fuel_receipt_sent && !isUpdating
                    ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676] hover:bg-[#00E676] hover:text-black'
                    : 'bg-[#333] border-[#444] text-[#666] cursor-not-allowed'
                }`}
              >
                TRANSMIT FINAL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
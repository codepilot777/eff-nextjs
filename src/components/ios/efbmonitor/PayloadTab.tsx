"use client";
import { useState, useEffect, useRef } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import { LoadsheetEngine, AutoLoader } from "@/lib/loadsheet/LoadsheetEngine";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
// 🌟 引入我們先前編寫好的跨界適配器大腦
import { adaptEfbPayloadToPmdg } from "@/services/payloadAdapter";

// 引入子組件
import AircraftVisualizer from "./payload-tab/AircraftVisualizer";
import PaxCargoEditor from "./payload-tab/PaxCargoEditor";
import FuelManager from "./payload-tab/FuelManager";
import SimSyncController from "./payload-tab/SimSyncController";

export default function PayloadTab() {
  const { flightData, updateFlightData, calc } = useFlightData();

  // 🌟 新增：智能追蹤鎖 (追蹤 Target ZFW 同 Fuel Order 嘅變化)
  const loadedZfwRef = useRef<number>(0);
  const loadedFuelOrderRef = useRef<number>(0);
  
  // 🌟 模擬機連動狀態控制
  const [isSimSyncing, setIsSimSyncing] = useState(false);
  const [useRealTimeFuel, setUseRealTimeFuel] = useState(true); // 預設開啟實時加油
  const [simCurrentFuel, setSimCurrentFuel] = useState(0);      // 模擬機當前累計油量
  const refuelTimer = useRef<NodeJS.Timeout | null>(null);

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
  const ofpTotalFuelKg = flightData?.plan_fuel_total ? Math.round(flightData.plan_fuel_total * 1000) : 42000;
  const standbyFuelKg = Math.max(0, ofpTotalFuelKg - 5000);
  const fobKg = flightData?.fuel_on_board ? Math.round(flightData.fuel_on_board * 1000) : 0;
  const traineeFinalFuelKg = flightData?.final_fuel_request ? Math.round(flightData.final_fuel_request * 1000) : 0;

  const distributeFuel = (val: number) => {
    const maxMain = 29600;
    if (val <= maxMain * 2) {
      const half = Math.round(val / 2);
      return { left: half, center: 0, right: val - half };
    } else {
      return { left: maxMain, center: val - (maxMain * 2), right: maxMain };
    }
  };

  useEffect(() => {
    return () => { if (refuelTimer.current) clearInterval(refuelTimer.current); };
  }, []);

  // ==========================================
  // 🌟 核心黑魔法：PMDG 實時跨界同步引擎
  // ==========================================
  const handleSyncToPmdgSim = () => {
    if (isSimSyncing) return;
    setIsSimSyncing(true);

    console.log(`%c⚡ [FSUIPC CONNECT] Initializing PMDG 777-300ER Data Link...`, "color: #00E676; font-weight: bold;");

    // 📦 1. 抽離並組裝客艙總重量生肉
    const calculatedPaxWeights: Record<string, number> = {};
    Object.entries(payload.pax).forEach(([zoneKey, count]) => {
      // 🌟 核心修改：動態讀取 AHM 定義的 primaryClass 來決定重量 (85kg 或 81kg)
      const zoneClass = (ahm.stations.pax as any)[zoneKey]?.primaryClass || "Y";
      const standardWeight = zoneClass === "J" ? 85 : 81;
      calculatedPaxWeights[zoneKey] = count * standardWeight;
    });

    const efbLoadingPayload = {
      paxWeights: calculatedPaxWeights,
      cargoWeights: {
        hold1: payload.cargo.h1, hold2: payload.cargo.h2, hold3: payload.cargo.h3, hold4: payload.cargo.h4, bulk: payload.cargo.bulk
      }
    };

    const pmdgPayloadOutput = adaptEfbPayloadToPmdg(efbLoadingPayload, currentReg);

    console.log("%c📦 [ADAPTER PASSED] EFB Layout successfully adaptive-mapped to PMDG Stations:", "color: #2979FF; font-weight: bold;");
    console.table({
      "FMC LSK 1L (FWD CABIN)": `${pmdgPayloadOutput.paxCabins.fwd} KG`,
      "FMC LSK 2L (MID CABIN)": `${pmdgPayloadOutput.paxCabins.mid} KG`,
      "FMC LSK 3L (AFT CABIN)": `${pmdgPayloadOutput.paxCabins.aft} KG`,
      "FMC LSK 4L (FWD CARGO)": `${pmdgPayloadOutput.cargoHolds.fwd} KG`,
      "FMC LSK 5L (AFT CARGO)": `${pmdgPayloadOutput.cargoHolds.aft} KG`,
      "FMC LSK 6L (BULK CARGO)": `${pmdgPayloadOutput.cargoHolds.bulk} KG`,
      "TOTAL SIM PAYLOAD TRAFFIC": `${pmdgPayloadOutput.totalPayloadKg} KG`
    });

    const targetTotalFuel = payload.fuel.left + payload.fuel.center + payload.fuel.right;
    
    if (!useRealTimeFuel) {
      console.log(`%c⛽ [FUEL INSTANT] Direct-writing total fuel request: ${targetTotalFuel} KG`, "color: #FF9100; font-weight: bold;");
      setIsSimSyncing(false);
      alert("Immediate synchronization completed to PMDG via console!");
    } else {
      let currentFuelPumped = 0;
      setSimCurrentFuel(0);

      console.log(`%c⛽ [REFUELLING STARTED] High-pressure hydrants connected. Target Block Fuel: ${targetTotalFuel} KG`, "color: #FFD600; font-weight: bold; font-size: 14px;");

      refuelTimer.current = setInterval(() => {
        currentFuelPumped += 450;
        if (currentFuelPumped >= targetTotalFuel) {
          currentFuelPumped = targetTotalFuel;
          setSimCurrentFuel(targetTotalFuel);
          clearInterval(refuelTimer.current!);
          setIsSimSyncing(false);
          console.log(`%c✅ [REFUELLING COMPLETED] Total request achieved: ${targetTotalFuel} KG. Fuel nozzles disconnected.`, "color: #00E676; font-weight: bold;");
          alert("Real-time refuelling simulation loop finished successfully!");
        } else {
          setSimCurrentFuel(currentFuelPumped);
          const tickFuelSplit = distributeFuel(currentFuelPumped);
          console.log(`%c⚡ [PUMP TICK] Total Flowing: ${currentFuelPumped} kg (${((currentFuelPumped/targetTotalFuel)*100).toFixed(0)}%) | L_MAIN: ${tickFuelSplit.left}kg | CTR: ${tickFuelSplit.center}kg | R_MAIN: ${tickFuelSplit.right}kg`, "color: #8fa0a6;");
        }
      }, 200);
    }
  };

  // ==========================================
  // 🌟 自動配載器 (完全對齊極簡版 DOW 與艙等屬性)
  // ==========================================
  const generateExactPayload = (targetZfwKg: number) => {
    const generated = AutoLoader.generatePayload(targetZfwKg, ahm);
    
    // 🌟 核心升級：精確讀取真實 DOW 作為減數基底
    const crewPantryWeight = ahm.acType === "B77W" ? 7549 : 8652;
    const waterWeight = 805;
    const engineDOW = ahm.basicData.BW + crewPantryWeight + waterWeight;

    const paxWt = Object.entries(generated.pax).reduce((sum, [zoneKey, count]) => {
      const zoneClass = (ahm.stations.pax as any)[zoneKey]?.primaryClass || "Y";
      const weight = zoneClass === "J" ? 85 : 81;
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
        fuel: { finalOrder: flightData.final_fuel_request ? flightData.final_fuel_request * 1000 : standbyFuelKg, uplift: flightData.actual_uplift ? flightData.actual_uplift * 1000 : 0, left: flightData.fuel_left_main || distributeFuel(standbyFuelKg).left, center: flightData.fuel_center || distributeFuel(standbyFuelKg).center, right: flightData.fuel_right_main || distributeFuel(standbyFuelKg).right }
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

  const enginePayload = {
    pax: payload.pax as any, 
    paxWeights: { J: 85, Y: 81 }, // 這兩個基數保留給 LoadsheetEngine 調用
    cargo: { hold1: Number(payload.cargo.h1) || 0, hold2: Number(payload.cargo.h2) || 0, hold3: Number(payload.cargo.h3) || 0, hold4: Number(payload.cargo.h4) || 0, bulk: Number(payload.cargo.bulk) || 0 },
    waterFraction: Number(flightData?.water_fraction) || 15,
    fuel: { takeoff: takeoffFuelKg, trip: flightData?.fuel_trip_ofp ? Number(flightData.fuel_trip_ofp) * 1000 : 18500, isStandard: false, tanks: { leftMain: Number(payload.fuel.left) || 0, center: Number(payload.fuel.center) || 0, rightMain: Number(payload.fuel.right) || 0 } }
  };

  const engine = new LoadsheetEngine(ahm, enginePayload as any);
  const weights = engine.calculateWeights(); 
  const cg = engine.calculateCG(); 
  const limits = engine.checkLimits();
  
  const safeZFW = weights?.ZFW ? (weights.ZFW / 1000).toFixed(1) : "0.0";
  const safeLIZFW = cg?.LIZFW ? cg.LIZFW.toFixed(0) : "0"; 
  const safeMACZFW = cg?.MACZFW ? cg.MACZFW.toFixed(1) : "0.0"; 
  const safeMACTOW = cg?.MACTOW ? cg.MACTOW.toFixed(1) : "0.0";

  // src/components/ios/efbmonitor/PayloadTab.tsx 內部

  const handleTransmit = (docType: string) => {
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
      updates.fuel_is_standard = false; 
    }
    
    updateFlightData(updates);
    alert(`${docType} snapshot transmitted to EFB!`);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 font-sans text-white">
      {/* 🌟 升級 1：加入 lg:grid-cols-[1fr_1.2fr]，完美迎合 iPad 橫排尺寸 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] xl:grid-cols-[1fr_1.4fr] gap-6 items-start relative">
        
        {/* 左側：飛機視圖 */}
        {/* 🌟 升級 2：加入 sticky top-6，右邊碌嗰陣，架飛機定格不走！ */}
        <div className="lg:sticky lg:top-6 z-10">
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
          />
          
          {/* Card 3: Sim Sync */}
          <SimSyncController 
            useRealTimeFuel={useRealTimeFuel} 
            setUseRealTimeFuel={setUseRealTimeFuel} 
            isSimSyncing={isSimSyncing} 
            simCurrentFuel={simCurrentFuel} 
            targetTotalFuel={payload.fuel.left + payload.fuel.center + payload.fuel.right} 
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
                className="bg-[#FF9100]/20 border border-[#FF9100] text-[#FF9100] py-4 rounded-lg font-black tracking-widest text-xs hover:bg-[#FF9100] hover:text-black transition-all"
              >
                TRANSMIT PRELIM
              </button>
              <button 
                onClick={() => handleTransmit("FINAL")} 
                disabled={!flightData?.fuel_receipt_sent} 
                className={`border py-4 rounded-lg font-black tracking-widest text-xs transition-all ${
                  flightData?.fuel_receipt_sent 
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
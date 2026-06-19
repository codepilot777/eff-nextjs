"use client";
import { useState, useEffect } from "react";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { LoadsheetEngine, AutoLoader } from "@/lib/loadsheet/LoadsheetEngine";
import { B773_BHNQ } from "@/lib/loadsheet/MockAHM";

// 🌟 Props 大清洗：剷走晒 flightData 同 updateFlightData
export default function PayloadTab() {
  
  // 🌟 從天上直接抽取 Data 同 Update Function (自帶樂觀更新！)
  const { flightData, updateFlightData } = useFlightData();

  const [isInitialized, setIsInitialized] = useState(false);
  
  const [payload, setPayload] = useState({
    pax: { OA: 0, OB: 0, OC: 0, OD: 0 },
    cargo: { h1: 0, h2: 0, h3: 0, h4: 0, bulk: 0 },
    fuel: { uplift: 0, left: 0, center: 0, right: 0, finalOrder: 0 }
  });

  // 🌟 防呆保護：如果未 Load 到 Data 就唔 Render
  if (!flightData) return null;

  // ==========================================
  // 🌟 核心目標數據
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

  // 🌟 引擎窺探器：獲取 LoadsheetEngine 內部真實 DOW
  const getEngineDOW = () => {
    const tempEngine = new LoadsheetEngine(B773_BHNQ, {
      pax: { zoneOA: 0, zoneOB: 0, zoneOC: 0, zoneOD: 0 }, paxWeights: { J: 85, Y: 81 },
      cargo: { hold1: 0, hold2: 0, hold3: 0, hold4: 0, bulk: 0 },
      waterFraction: Number(flightData?.water_fraction) || 15,
      fuel: { takeoff: 0, trip: 0, isStandard: false, tanks: { leftMain: 0, center: 0, rightMain: 0 } }
    });
    return tempEngine.calculateWeights().DOW;
  };

  const generateExactPayload = (targetZfwKg: number) => {
    const generated = AutoLoader.generatePayload(targetZfwKg, B773_BHNQ);
    const engineDOW = getEngineDOW(); // 取得引擎內部真實 DOW (約 161968)

    const paxWt = (generated.pax.zone0A * 85) + ((generated.pax.zone0B + generated.pax.zone0C + generated.pax.zone0D) * 81);
    
    // 用真實 Engine DOW 去計 Cargo，確保 ZFW 0.0T 誤差！
    const reqCargo = Math.max(0, targetZfwKg - engineDOW - paxWt);
    const h1 = Math.round(reqCargo * 0.35);
    const h2 = Math.round(reqCargo * 0.35);
    const h3 = Math.round(reqCargo * 0.15);
    const h4 = Math.round(reqCargo * 0.10);
    const bulk = Math.max(0, reqCargo - h1 - h2 - h3 - h4); 
    
    return { 
      pax: { OA: generated.pax.zone0A, OB: generated.pax.zone0B, OC: generated.pax.zone0C, OD: generated.pax.zone0D }, 
      cargo: { h1, h2, h3, h4, bulk } 
    };
  };

  // ==========================================
  // 🌟 1. 系統自動 Preload 邏輯 (徹底解決 Race Condition)
  // ==========================================
  useEffect(() => {
    // 🛡️ 防禦：必須等 SimBrief 的 ZFW 到達才執行
    if (!flightData || !flightData.weight_zfw_ofp || isInitialized) return;

    const hasSavedPayload = flightData.pax_y > 0 || flightData.cargo_hold_1 > 0;

    if (hasSavedPayload) {
      setPayload({
        pax: { OA: flightData.pax_f || 0, OB: flightData.pax_j || 0, OC: flightData.pax_w || 0, OD: flightData.pax_y || 0 },
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
    setIsInitialized(true);
  }, [flightData, isInitialized, targetZFW, standbyFuelKg]);

  useEffect(() => {
    if (flightData?.final_fuel_request && isInitialized) {
      const traineeOrderKg = Math.round(flightData.final_fuel_request * 1000);
      if (traineeOrderKg !== payload.fuel.finalOrder) {
        const dist = distributeFuel(traineeOrderKg);
        setPayload(prev => ({ ...prev, fuel: { ...prev.fuel, finalOrder: traineeOrderKg, left: dist.left, center: dist.center, right: dist.right } }));
      }
    }
  }, [flightData?.final_fuel_request, isInitialized]);

  // ==========================================
  // 🌟 2. 實時物理引擎
  // ==========================================
  const enginePayload = {
    pax: { zoneOA: Number(payload.pax.OA) || 0, zoneOB: Number(payload.pax.OB) || 0, zoneOC: Number(payload.pax.OC) || 0, zoneOD: Number(payload.pax.OD) || 0 },
    paxWeights: { J: 85, Y: 81 },
    cargo: { hold1: Number(payload.cargo.h1) || 0, hold2: Number(payload.cargo.h2) || 0, hold3: Number(payload.cargo.h3) || 0, hold4: Number(payload.cargo.h4) || 0, bulk: Number(payload.cargo.bulk) || 0 },
    waterFraction: Number(flightData?.water_fraction) || 15,
    fuel: { 
      takeoff: (Number(payload.fuel.left) || 0) + (Number(payload.fuel.center) || 0) + (Number(payload.fuel.right) || 0), 
      trip: flightData?.fuel_trip_ofp ? Number(flightData.fuel_trip_ofp) * 1000 : 18500,
      isStandard: false, 
      tanks: { leftMain: Number(payload.fuel.left) || 0, center: Number(payload.fuel.center) || 0, rightMain: Number(payload.fuel.right) || 0 }
    }
  };

  const engine = new LoadsheetEngine(B773_BHNQ, enginePayload);
  const weights = engine.calculateWeights();
  const cg = engine.calculateCG();
  const limits = engine.checkLimits();

  const safeZFW = weights?.ZFW ? (weights.ZFW / 1000).toFixed(1) : "0.0";
  const safeLIZFW = cg?.LIZFW ? cg.LIZFW.toFixed(0) : "0";
  const safeMACZFW = cg?.MACZFW ? cg.MACZFW.toFixed(1) : "0.0";
  const safeMACTOW = cg?.MACTOW ? cg.MACTOW.toFixed(1) : "0.0";

  // ==========================================
  // 🌟 3. 發送至 Array History (完美對接 React Query)
  // ==========================================
  const handleTransmit = (docType: string) => {
    const updates: any = {};
    updates.pax_f = payload.pax.OA; updates.pax_j = payload.pax.OB; updates.pax_w = payload.pax.OC; updates.pax_y = payload.pax.OD;
    updates.cargo_hold_1 = payload.cargo.h1; updates.cargo_hold_2 = payload.cargo.h2; updates.cargo_hold_3 = payload.cargo.h3; updates.cargo_hold_4 = payload.cargo.h4; updates.cargo_bulk = payload.cargo.bulk;

    const currentSnapshot = { pax: payload.pax, cargo: payload.cargo, fuel: payload.fuel };

    if (docType === "EZFW") {
      updates.ezfw_sent = true;
      updates.ezfw_snapshot = currentSnapshot;
    }
    if (docType === "AZF") {
      updates.azf_sent = true;
      updates.azf_snapshot = currentSnapshot;
    }
    if (docType === "PRELIM") {
      updates.prelim_ls_sent = true;
      const ver = flightData?.prelim_ls_version || 1;
      updates.prelim_history = [...(flightData?.prelim_history || []), { version: ver, snapshot: currentSnapshot }];
      updates.fuel_left_main = payload.fuel.left;
      updates.fuel_center = payload.fuel.center;
      updates.fuel_right_main = payload.fuel.right;
    }
    if (docType === "FINAL") {
      updates.final_ls_sent = true;
      const ver = flightData?.final_ls_version || 1;
      updates.final_history = [...(flightData?.final_history || []), { version: ver, snapshot: currentSnapshot }];
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
      
      {flightData?.prelim_ls_rejected && (
        <div className="bg-[#FF1744]/15 border border-[#FF1744] rounded-lg p-4 flex justify-between items-center shadow-[0_0_15px_rgba(255,23,68,0.2)]">
          <div><h5 className="text-[#FF1744] font-black tracking-widest uppercase m-0">🚨 PRELIM REJECTED!</h5><p className="text-white text-sm mt-1">"{flightData.prelim_ls_reject_reason}"</p></div>
          <button onClick={() => updateFlightData({ prelim_ls_rejected: false, prelim_ls_version: (flightData?.prelim_ls_version || 1) + 1 })} className="bg-[#FF1744] text-white px-4 py-2 rounded font-black tracking-widest text-xs">ACKNOWLEDGE (V{(flightData?.prelim_ls_version || 1) + 1})</button>
        </div>
      )}
      {flightData?.final_ls_rejected && (
        <div className="bg-[#FF1744]/15 border border-[#FF1744] rounded-lg p-4 shadow-[0_0_15px_rgba(255,23,68,0.2)] flex justify-between items-center">
          <div><h5 className="text-[#FF1744] font-black tracking-widest uppercase m-0">🚨 FINAL REJECTED!</h5><p className="text-white text-sm mt-1">"{flightData.final_ls_reject_reason}"</p></div>
          <button onClick={() => updateFlightData({ final_ls_rejected: false, final_ls_version: (flightData?.final_ls_version || 1) + 1 })} className="bg-[#FF1744] text-white px-4 py-2 rounded font-black tracking-widest text-xs">ACKNOWLEDGE (V{(flightData?.final_ls_version || 1) + 1})</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-6 items-start">
        
        <div className="sticky top-6 flex flex-col gap-4">
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-xl p-6 flex flex-col items-center shadow-inner relative">
            <h4 className="text-[#00bfa5] font-black tracking-widest uppercase w-full text-center border-b border-[#333333] pb-3 mb-6">Aircraft Global State</h4>
            <div className="absolute top-4 left-4 text-[0.65rem] font-bold text-[#8fa0a6]">OFP TARGET ZFW<br/><span className="text-white text-lg">{(targetZFW / 1000).toFixed(1)} T</span></div>
            <div className="relative w-48 bg-[#1a1a1a] border-4 border-[#404040] rounded-t-full rounded-b-[50px] flex flex-col items-center py-6 shadow-2xl mt-4">
              <div className="w-16 h-8 border-b-2 border-dashed border-[#555] mb-6 flex justify-center items-center text-[0.6rem] text-[#8fa0a6] font-bold tracking-widest">COCKPIT</div>
              <div className="w-full px-4 flex flex-col gap-2 mb-8">
                {['OA', 'OB', 'OC', 'OD'].map(zone => (
                  <div key={zone} className="bg-[#00E676]/10 border border-[#00E676]/50 rounded p-2 text-center shadow-inner"><div className="text-[0.6rem] text-[#00E676] font-bold tracking-widest mb-1">ZONE {zone}</div><div className="text-white font-black">{(payload.pax as any)[zone]} <span className="text-[#8fa0a6] text-xs font-normal">PAX</span></div></div>
                ))}
              </div>
              <div className="relative w-full my-4 flex justify-center items-center z-10">
                <div className="absolute right-[100%] w-24 h-12 bg-[#2979FF]/20 border-y-2 border-l-2 border-[#2979FF] rounded-l-full flex flex-col justify-center items-center"><span className="text-[0.6rem] text-[#2979FF] font-black tracking-widest">L MAIN</span><span className="text-white font-mono text-xs">{(payload.fuel.left/1000).toFixed(1)}T</span></div>
                <div className="w-[90%] bg-[#2979FF]/30 border-2 border-[#2979FF] rounded p-2 text-center shadow-[0_0_15px_rgba(41,121,255,0.3)]"><div className="text-[0.6rem] text-[#2979FF] font-black tracking-widest">CTR TANK</div><div className="text-white font-mono text-sm">{(payload.fuel.center/1000).toFixed(1)}T</div></div>
                <div className="absolute left-[100%] w-24 h-12 bg-[#2979FF]/20 border-y-2 border-r-2 border-[#2979FF] rounded-r-full flex flex-col justify-center items-center"><span className="text-[0.6rem] text-[#2979FF] font-black tracking-widest">R MAIN</span><span className="text-white font-mono text-xs">{(payload.fuel.right/1000).toFixed(1)}T</span></div>
              </div>
              <div className="w-full px-4 flex flex-col gap-2 mt-4">
                <div className="bg-[#FF9100]/10 border border-[#FF9100]/50 rounded p-2 text-center shadow-inner"><div className="text-[0.6rem] text-[#FF9100] font-bold tracking-widest mb-1">HOLD 1 / 2</div><div className="text-white font-mono text-xs">{(payload.cargo.h1 + payload.cargo.h2).toLocaleString()} KG</div></div>
                <div className="bg-[#FF9100]/10 border border-[#FF9100]/50 rounded p-2 text-center shadow-inner"><div className="text-[0.6rem] text-[#FF9100] font-bold tracking-widest mb-1">HOLD 3 / 4</div><div className="text-white font-mono text-xs">{(payload.cargo.h3 + payload.cargo.h4).toLocaleString()} KG</div></div>
                <div className="bg-[#FF9100]/10 border border-[#FF9100]/50 rounded p-2 text-center shadow-inner"><div className="text-[0.6rem] text-[#FF9100] font-bold tracking-widest mb-1">BULK</div><div className="text-white font-mono text-xs">{payload.cargo.bulk.toLocaleString()} KG</div></div>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${limits.isValid ? 'bg-[#00E676]/10 border-[#00E676]' : 'bg-[#FF1744]/15 border-[#FF1744]'} grid grid-cols-2 gap-4 shadow-lg transition-colors`}>
            <div><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">Act ZFW</div><div className={`text-xl font-black ${limits.errors.isZFWExceeded ? 'text-[#FF1744]' : 'text-white'}`}>{safeZFW} T</div></div>
            <div className="text-right"><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">LIZFW</div><div className="text-xl font-mono font-black text-[#00bfa5]">{safeLIZFW}</div></div>
            <div><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">MAC ZFW</div><div className="text-xl font-mono font-black text-white">{safeMACZFW} %</div></div>
            <div className="text-right"><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">MAC TOW</div><div className="text-xl font-mono font-black text-[#2979FF]">{safeMACTOW} %</div></div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-lido-800 p-6 rounded-xl border border-[#333333] shadow-lg">
            <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-4">
              <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2"><span className="text-[#00E676]">1.</span> Payload & ZFW</h4>
              <button onClick={() => {const g = generateExactPayload(targetZFW); setPayload({...payload, pax: g.pax, cargo: g.cargo});}} className="bg-[#00E676]/20 border border-[#00E676] text-[#00E676] px-4 py-1.5 rounded font-bold text-xs tracking-widest hover:bg-[#00E676] hover:text-black transition-colors">🔄 RE-LOAD</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div className="col-span-2 text-[#00E676] text-xs font-black tracking-widest uppercase">Passengers</div>
              {['OA', 'OB', 'OC', 'OD'].map((z, i) => (
                <div key={z}><label className="flex justify-between text-xs text-[#8fa0a6] mb-1"><span>Zone {z}</span> <span>{(payload.pax as any)[z]}</span></label><input type="range" max={i===0?42:i===1?60:i===2?150:186} value={(payload.pax as any)[z]} onChange={(e) => setPayload({...payload, pax: {...payload.pax, [z]: parseInt(e.target.value) || 0}})} className="w-full accent-[#00E676]" /></div>
              ))}
              <div className="col-span-2 text-[#FF9100] text-xs font-black tracking-widest uppercase mt-2">Cargo (KG)</div>
              {['h1', 'h2', 'h3', 'h4', 'bulk'].map((h, i) => (
                <div key={h} className="flex items-center justify-between bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]"><span className="text-xs text-[#8fa0a6] uppercase">{h === 'bulk' ? 'Bulk' : `Hold ${i+1}`}</span><input type="number" value={(payload.cargo as any)[h]} onChange={(e) => setPayload({...payload, cargo: {...payload.cargo, [h]: parseInt(e.target.value) || 0}})} className="bg-transparent border-none text-right text-white w-20 outline-none font-mono text-sm" /></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-[#333333] pt-4">
              <button onClick={() => handleTransmit("EZFW")} className="bg-[#404040] text-white py-3 rounded-lg font-black tracking-widest text-xs hover:bg-[#555] transition-colors">TRANSMIT EZFW</button>
              <button onClick={() => handleTransmit("AZF")} className="bg-[#404040] text-white py-3 rounded-lg font-black tracking-widest text-xs hover:bg-[#555] transition-colors">TRANSMIT AZF</button>
            </div>
          </div>

          <div className="bg-lido-800 p-6 rounded-xl border border-[#333333] shadow-lg">
            <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2 border-b border-[#333333] pb-3 mb-4"><span className="text-[#2979FF]">2.</span> Fuel Control</h4>
            <div className="grid grid-cols-3 gap-4 bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg mb-4">
              <div><div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest">OFP Block Fuel</div><div className="text-sm font-mono font-black text-white">{(ofpTotalFuelKg / 1000).toFixed(1)} T</div></div>
              <div className="text-center"><div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest">Standby Fuel</div><div className="text-sm font-mono font-black text-[#8fa0a6]">{(standbyFuelKg / 1000).toFixed(1)} T</div></div>
              <div className="text-right"><div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest">Fuel On Board (FOB)</div><div className="text-sm font-mono font-black text-[#2979FF]">{(fobKg / 1000).toFixed(1)} T</div></div>
            </div>
            {traineeFinalFuelKg > 0 && (
              <div className="bg-[#FF9100]/15 border border-[#FF9100] rounded-lg p-4 mb-4 shadow-[0_0_15px_rgba(255,145,0,0.2)]">
                <div className="flex justify-between items-center mb-1"><h5 className="text-[#FF9100] font-black tracking-widest uppercase m-0 flex items-center gap-2 text-sm"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9100] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9100]"></span></span> Trainee Final Fuel Order</h5><div className="text-xl font-mono font-black text-[#FF9100]">{flightData.final_fuel_request.toFixed(1)} T</div></div>
                <div className="text-xs text-[#FF9100] uppercase tracking-widest opacity-80 mt-2 border-t border-[#FF9100]/30 pt-2 flex justify-between"><span>Expected Uplift:</span><span className="font-mono font-bold">{Math.max(0, traineeFinalFuelKg - fobKg).toLocaleString()} KG</span></div>
              </div>
            )}
            <div className="space-y-4">
              <div className="bg-[#111] p-4 rounded-lg border border-[#222]">
                <div className="text-xs font-bold text-[#8fa0a6] uppercase tracking-widest mb-2"><span className="text-[#00E676]">Step 1:</span> Fuel Receipt Uplift (KG)</div>
                <input type="number" value={payload.fuel.uplift} onChange={(e) => setPayload({ ...payload, fuel: { ...payload.fuel, uplift: parseInt(e.target.value) || 0 }})} className="w-full bg-[#1a1a1a] border border-[#404040] focus:border-[#2979FF] rounded p-3 text-white outline-none font-mono text-sm transition-colors" placeholder="e.g. 40000" />
              </div>
              <div className="bg-[#111] p-4 rounded-lg border border-[#222]">
                <div className="text-xs font-bold text-[#8fa0a6] uppercase tracking-widest mb-3"><span className="text-[#00E676]">Step 2:</span> Final Fuel in Tanks (KG)</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]"><div className="text-[0.6rem] text-[#8fa0a6] uppercase mb-1">L Main</div><input type="number" value={payload.fuel.left} onChange={(e) => setPayload({...payload, fuel: {...payload.fuel, left: parseInt(e.target.value) || 0}})} className="bg-transparent text-[#2979FF] w-full outline-none font-mono text-sm font-bold" /></div>
                  <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]"><div className="text-[0.6rem] text-[#8fa0a6] uppercase mb-1">Center</div><input type="number" value={payload.fuel.center} onChange={(e) => setPayload({...payload, fuel: {...payload.fuel, center: parseInt(e.target.value) || 0}})} className="bg-transparent text-[#2979FF] w-full outline-none font-mono text-sm font-bold" /></div>
                  <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]"><div className="text-[0.6rem] text-[#8fa0a6] uppercase mb-1">R Main</div><input type="number" value={payload.fuel.right} onChange={(e) => setPayload({...payload, fuel: {...payload.fuel, right: parseInt(e.target.value) || 0}})} className="bg-transparent text-[#2979FF] w-full outline-none font-mono text-sm font-bold" /></div>
                </div>
              </div>
            </div>
            <button onClick={() => handleTransmit("FUEL_RECEIPT")} className={`w-full py-3 mt-4 rounded-lg font-black tracking-widest text-xs transition-colors ${flightData?.fuel_receipt_sent ? 'bg-[#2979FF]/20 border border-[#2979FF] text-[#2979FF] cursor-not-allowed' : 'bg-[#2979FF] text-white hover:bg-blue-600 shadow-md'}`}>{flightData?.fuel_receipt_sent ? '✅ FUEL RECEIPT DISPATCHED' : 'DISPATCH FUEL RECEIPT'}</button>
          </div>

          <div className="bg-lido-800 p-6 rounded-xl border border-[#333333] shadow-lg">
            <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2 border-b border-[#333333] pb-3 mb-4"><span className="text-[#FF9100]">3.</span> Document Dispatch</h4>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleTransmit("PRELIM")} className="bg-[#FF9100]/20 border border-[#FF9100] text-[#FF9100] py-4 rounded-lg font-black tracking-widest text-xs hover:bg-[#FF9100] hover:text-black shadow-[0_0_15px_rgba(255,145,0,0.2)] transition-all">TRANSMIT PRELIM</button>
              <button onClick={() => handleTransmit("FINAL")} disabled={!flightData?.fuel_receipt_sent} className={`border py-4 rounded-lg font-black tracking-widest text-xs transition-all ${flightData?.fuel_receipt_sent ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676] hover:bg-[#00E676] hover:text-black shadow-[0_0_15px_rgba(0,230,118,0.2)]' : 'bg-[#333] border-[#444] text-[#666] cursor-not-allowed'}`}>TRANSMIT FINAL</button>
            </div>
            {!flightData?.fuel_receipt_sent && <div className="text-[0.65rem] text-[#8fa0a6] text-center mt-3 italic">⚠️ Fuel Receipt must be dispatched before Final Loadsheet lock opens</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";
import React from "react";
import { B773_BHNQ } from "@/lib/loadsheet/MockAHM";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦

// 🌟 Props 大清洗：只保留 setActiveModal，其他全部飛走！
export default function FuelWeightColumn({ setActiveModal }: { setActiveModal: any }) {
  
  // 🌟 一句說話，喺天上攞晒所有最新鮮嘅 Data！
  const { flightData, calc, handlers } = useFlightData();

  // 如果 data 仲未 ready (防呆)
  if (!flightData || !calc || !handlers) return null;

  // ==========================================
  // 1. Time / Endurance 計算邏輯 (保留純 UI 顯示用)
  // ==========================================
  const fuelFlow = parseFloat(flightData?.raw_simbrief?.fuel?.avg_fuel_flow) || 7653; 
  
  const getMins = (fuelTons: number) => {
    if (!fuelTons) return 0;
    return Math.round((fuelTons * 1000) / fuelFlow * 60);
  };
  
  const formatTime = (mins: number) => {
    if (mins === 0) return "0000";
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}${m}`;
  };

  // 根據 toggle 決定顯示邊組數
  const tripFuel = calc.showRevVal ? calc.currTrip : calc.ofpTrip;
  const contFuel = calc.showRevVal ? calc.currCont : calc.ofpCont;
  const altnFuel = calc.showRevVal ? calc.currAltnOfp : calc.baseAltnOfp;
  const tankFuel = calc.showRevVal ? calc.currTank : 0;
  const extraFuel = calc.showRevVal ? calc.currExtra : 0;

  const taxiMins = 20; 
  const tripMins = getMins(tripFuel);
  const contMins = getMins(contFuel);
  const holdMins = 0;
  const addMins = 0;
  const altnMins = calc.altnList?.find((a: any) => a.icao === calc.selectedAltn)?.time || getMins(altnFuel);
  const resMins = 30; 
  
  const reqdMins = taxiMins + tripMins + contMins + holdMins + addMins + altnMins + resMins;
  const tankMins = getMins(tankFuel);
  const extraMins = getMins(extraFuel);
  const totalMins = reqdMins + tankMins + extraMins;

  // ==========================================
  // 2. Structural Margin 計算邏輯
  // ==========================================
  const zfwVal = calc.showRevVal ? (calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) : calc.ofpZfw;
  const marginZfw = zfwVal - (B773_BHNQ.limits.MZFW / 1000);

  const towVal = calc.showRevVal ? calc.currTow : (flightData?.weight_tow_ofp || 0);
  const marginTow = towVal - (B773_BHNQ.limits.MTOW / 1000);

  const lwVal = calc.showRevVal ? calc.currLw : (flightData?.weight_lw_ofp || 0);
  const marginLw = lwVal - (B773_BHNQ.limits.MLAW / 1000);

  const getMarginStr = (m: number) => m > 0 ? `+${m.toFixed(1)}` : m.toFixed(1);
  const getMarginColor = (m: number) => m > 0 ? 'text-[#FF1744] font-black' : 'text-[#8fa0a6]';

  // ==========================================
  // 3. Row UI 組件 
  // ==========================================
  const Row = ({ label, ofp, rev, time, isInput, field, isBold, isTotal, isZfw, isTow }: any) => {
    const diff = rev - ofp;
    const hasDiff = Math.abs(diff) > 0.05;
    const diffSign = diff > 0 ? "+" : "";
    const diffText = hasDiff ? `${diffSign}${diff.toFixed(1)}` : "";
    const diffColor = "text-[#00E676]";
    const labelClass = isBold ? "text-white font-bold" : "text-[#8fa0a6]";
    
    let revClass = "text-right font-bold ";
    if (isTotal) revClass += "text-[#00E676] text-[0.95rem] leading-none";
    else if (isZfw) revClass = "bg-[#153f36] text-[#00E676] text-right font-bold py-0.5 px-2 rounded-l ml-auto w-max leading-none";
    else if (isTow) revClass = "bg-white text-[#1E1E1E] text-right font-bold py-0.5 px-2 rounded-l ml-auto w-max text-[0.9rem] leading-none";
    else revClass += "text-[#00E676] leading-none";

    return (
      <div className={`grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] gap-1 items-center py-0.5 ${isTotal || isTow ? 'border-y border-[#333]' : 'border-b border-dashed border-[#333]'}`}>
        <div className={`text-[0.65rem] ${labelClass} leading-none`}>{label}</div>
        <div className="text-right leading-none pr-2">
          <span className={`text-[0.8rem] ${isBold ? 'font-bold text-white' : 'text-white'}`}>{ofp?.toFixed(1) || '0.0'}</span>
        </div>
        <div className={`text-center text-[0.65rem] font-bold font-mono ${diffColor} leading-none`}>
          {calc.showRevVal ? diffText : ""}
        </div>
        <div className="text-right flex justify-end items-center pr-2">
          {isInput && calc.isManual ? (
            <input 
              type="number" step="0.1" defaultValue={rev || ''} 
              onBlur={(e) => handlers.handleFuelInput(field, e.target.value)}
              key={`${field}-${rev}`}
              className="w-14 bg-[#1a1a1a] text-[#00E676] text-right text-[0.8rem] font-bold rounded px-1 py-0.5 outline-none border border-[#333] focus:border-[#00E676] leading-none transition-colors" 
            />
          ) : (
            <div className={`${calc.showRevVal ? '' : 'opacity-0'} flex items-center`}>
              <div className={revClass}>{rev?.toFixed(1) || '0.0'}</div>
            </div>
          )}
        </div>
        <div className="text-right text-[0.6rem] text-[#00E676] font-mono pr-1 leading-none">{time}</div>
      </div>
    );
  };

  return (
    <div className="flex-[4] flex flex-col h-full overflow-hidden min-h-0 text-white font-sans w-full max-w-[420px]">
      <div className="bg-[#1E1E1E] rounded-xl flex flex-col h-full shadow-lg min-h-0 overflow-hidden">
        
        {/* Header & Toggle Switch */}
        <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-[#333] shrink-0">
          <h2 className="text-[1.05rem] font-bold leading-none">Fuel & Weight</h2>
          <div onClick={handlers.handleManualToggle} className="flex items-center gap-2 cursor-pointer bg-[#0a0a0a] border border-[#333] rounded-full px-2 py-1 hover:bg-[#252525] transition-colors">
            <span className={`text-[0.55rem] font-bold uppercase tracking-wider pl-1 leading-none transition-colors ${!calc.isManual ? 'text-white' : 'text-[#555]'}`}>Auto</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${calc.isManual ? 'bg-[#00E676]' : 'bg-[#555]'}`}>
               <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] shadow-sm transition-transform duration-300 ${calc.isManual ? 'translate-x-[16px]' : 'translate-x-[2px]'}`}></div>
            </div>
            <span className={`text-[0.55rem] font-bold uppercase tracking-wider pr-1 leading-none transition-colors ${calc.isManual ? 'text-[#00E676]' : 'text-[#555]'}`}>Manual</span>
          </div>
        </div>

        {/* Banner */}
        {calc.showRevVal ? (
          <div 
            onClick={!flightData?.final_fuel_accepted ? () => setActiveModal('AcceptFuel') : undefined} 
            className={`mx-4 mt-3 rounded-lg px-3 py-2 flex justify-between items-center text-black shadow-md transition-all shrink-0 ${flightData?.final_fuel_accepted ? 'bg-[#C6FF00]' : 'bg-[#FFD600] cursor-pointer animate-pulse'}`}
          >
            <div className="font-bold text-[0.8rem] leading-none flex items-center">
              {flightData?.final_fuel_accepted ? 'Final fuel' : 'Pending fuel'} <span className="text-[1rem] font-black ml-1.5 leading-none">{calc.currTotal.toFixed(1)}<span className="text-[0.6rem] font-bold ml-[1px]">T</span></span>
            </div>
            <div className="font-bold text-[0.65rem] flex items-center gap-1 leading-none">
              ALTN {calc.selectedAltn || "RJGG"} (A) <span className="text-lg leading-none pb-0.5">›</span>
            </div>
          </div>
        ) : (<div className="h-1 shrink-0"></div>)}

        {/* List Section */}
        <div className="flex-1 px-4 pb-3 mt-3 flex flex-col min-h-0">
          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider mb-2 border-b border-[#333] pb-1 shrink-0">
            <div></div><div className="text-right pr-2">OFP</div><div className="text-center">Diff</div><div className="text-right pr-2">Revised</div><div className="text-right">Time</div>
          </div>

          <div className="font-mono flex-[1.6] flex flex-col justify-between min-h-0">
            {Row({ label: "Taxi", ofp: calc.ofpTaxi, rev: calc.currTaxi, time: formatTime(taxiMins), isInput: true, field: 'taxi' })}
            {Row({ label: "Trip Fuel", ofp: calc.ofpTrip, rev: calc.currTrip, time: formatTime(tripMins), isInput: true, field: 'trip' })}
            {Row({ label: "Cont", ofp: calc.ofpCont, rev: calc.currCont, time: formatTime(contMins), isInput: true, field: 'cont' })}
            {Row({ label: "Dest Hold", ofp: 0.0, rev: 0.0, time: formatTime(holdMins) })}
            {Row({ label: "Additional", ofp: 0.0, rev: 0.0, time: formatTime(addMins) })}
            
            {/* Alternate Row */}
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] gap-1 items-center py-0.5 border-b border-dashed border-[#333]">
              <div className="text-[0.65rem] leading-none">
                <div className="bg-white text-black px-1 py-0.5 rounded text-[0.55rem] font-bold font-sans inline-block w-max leading-tight cursor-pointer">
                  ALTN<br/>
                  <select 
                     value={calc.selectedAltn} 
                     // 🌟 呢度唯一要改嘅位：因為 updateFlightData 無再傳入嚟，所以用 handlers 嚟改佢
                     onChange={(e) => handlers.handleFuelInput('selected_altn', e.target.value)} 
                     className="bg-transparent font-bold outline-none cursor-pointer appearance-none text-center">
                    {(calc.altnOptions || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select> ∨
                </div>
              </div>
              <div className="text-right leading-none pr-2"><span className="text-[0.8rem] text-white">{calc.baseAltnOfp?.toFixed(1) || '0.0'}</span></div>
              <div className="text-center text-[0.65rem] font-bold font-mono text-[#00E676] leading-none">
                {calc.showRevVal ? (Math.abs(calc.currAltnOfp - calc.baseAltnOfp) > 0.05 ? `+${Math.abs(calc.currAltnOfp - calc.baseAltnOfp).toFixed(1)}` : "") : ""}
              </div>
              <div className="text-right text-[#00E676] font-bold leading-none pr-2">{calc.showRevVal ? calc.currAltnOfp?.toFixed(1) : ''}</div>
              <div className="text-right text-[0.6rem] text-[#00E676] font-mono pr-1 leading-none">{formatTime(altnMins)}</div>
            </div>

            {Row({ label: "Reserve", ofp: calc.ofpRes, rev: calc.ofpRes, time: formatTime(resMins) })}
            {Row({ label: "Fuel Reqd", ofp: calc.ofpReqdBase, rev: calc.currReqdBase, time: formatTime(reqdMins), isBold: true, isTotal: true })}
            {Row({ label: "Tankering", ofp: 0.0, rev: calc.currTank, time: formatTime(tankMins), isInput: true, field: 'tankering' })}
            {Row({ label: "Extra", ofp: 0.0, rev: calc.currExtra, time: formatTime(extraMins), isInput: true, field: 'extra' })}
            {Row({ label: "Total Fuel", ofp: calc.ofpTotal, rev: calc.currTotal, time: formatTime(totalMins), isBold: true, isTotal: true, isInput: true, field: 'total' })}
          </div>

          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider mt-3 mb-2 shrink-0">
            <div></div><div className="text-right pr-2">OFP</div><div className="text-center">Diff</div><div className="text-right pr-2">Revised</div><div className="text-right pr-1">Margin</div>
          </div>
          
          <div className="font-mono flex-[0.5] flex flex-col justify-between min-h-0">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] gap-1 items-center py-0.5 border-b border-dashed border-[#333]">
              <div className="text-[0.65rem] text-[#8fa0a6] leading-none">ZFW</div>
              <div className="text-right leading-none pr-2">
                <span className="text-[0.8rem] font-bold text-white">{calc.ofpZfw?.toFixed(1)}</span>
              </div>
              <div className="text-center text-[0.65rem] font-bold font-mono text-[#00E676] leading-none">
                {calc.showRevVal ? (Math.abs(zfwVal - calc.ofpZfw) > 0.05 ? (
                  `${(zfwVal - calc.ofpZfw) > 0 ? '+' : ''}${(zfwVal - calc.ofpZfw).toFixed(1)}`
                ) : "") : ""}
              </div>
              <div className="text-right flex justify-end items-center pr-2">
                <input 
                  type="number" step="0.1" defaultValue={calc.actualZfw || ''} 
                  onBlur={(e) => handlers.handleZfwInput(e.target.value)}
                  key={`zfw-${calc.actualZfw}-${calc.isManual}`} 
                  className={`w-14 text-right text-[0.8rem] font-bold rounded px-1 py-0.5 outline-none leading-none transition-all ${
                    calc.isManual 
                      ? 'bg-[#1a1a1a] text-[#00E676] border border-[#00E676]/50 focus:border-[#00E676]' 
                      : 'bg-[#153f36] text-[#00E676] border border-transparent focus:border-[#00E676]/50'
                  }`}
                />
              </div>
              <div className={`text-right text-[0.6rem] pr-1 leading-none ${getMarginColor(marginZfw)}`}>
                {getMarginStr(marginZfw)}
              </div>
            </div>

            {Row({ label: "TOW", ofp: flightData?.weight_tow_ofp || 0, rev: calc.currTow, time: getMarginStr(marginTow), isBold: true, isTow: true })}
            {Row({ label: "LW", ofp: flightData?.weight_lw_ofp || 0, rev: calc.currLw, time: getMarginStr(marginLw), isZfw: true })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-[0.6rem] font-mono text-[#8fa0a6] border-t border-[#333] pt-3 shrink-0">
            <div className="flex justify-between leading-none"><span className="font-sans">LNDG CG</span><span className="text-white">+103 up -94 down</span></div>
            <div className="flex justify-between leading-none"><span className="font-sans">RAMP CG</span><span className="text-white">+93 up -86 down</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
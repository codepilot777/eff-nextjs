"use client";
import React from "react";
import { B773_BHNQ } from "@/lib/loadsheet/MockAHM";

export default function FuelWeightColumn({ flightData, updateFlightData, calc, handlers }: { flightData: any, updateFlightData: any, calc: any, handlers: any }) {
  
  // 🌟 Cathay 風格 Row 組件
  const Row = ({ label, ofp, rev, time, isInput, field, isBold, isTotal, isZfw, isTow }: any) => {
    const diff = rev - ofp;
    const hasDiff = Math.abs(diff) > 0.05;
    const diffColor = diff > 0 ? "text-[#00E676]" : "text-[#FF1744]";
    const diffSign = diff > 0 ? "+" : "";

    // 判斷 Label 顏色
    const labelClass = isBold ? "text-white font-bold" : "text-[#8fa0a6]";
    
    // 判斷 Revised 數字嘅樣式 (ZFW / TOW 會有高光 Box)
    let revClass = "text-right font-bold ";
    if (isTotal) {
      revClass += "text-[#00E676] text-[0.95rem]";
    } else if (isZfw) {
      revClass = "bg-[#153f36] text-[#00E676] text-right font-bold py-1 px-2 rounded-l ml-auto w-max";
    } else if (isTow) {
      revClass = "bg-white text-[#1E1E1E] text-right font-bold py-1 px-2 rounded-l ml-auto w-max text-[0.9rem]";
    } else {
      revClass += "text-[#00E676]";
    }

    return (
      <div className={`grid grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-1 items-center py-2 ${isTotal || isTow ? 'border-y border-[#333]' : 'border-b border-dashed border-[#333]'}`}>
        {/* Label */}
        <div className={`text-[0.7rem] ${labelClass}`}>{label}</div>
        
        {/* OFP + Diff */}
        <div className="text-right flex items-center justify-end gap-1.5">
          <span className={`text-[0.8rem] ${isBold ? 'font-bold text-white' : 'text-white'}`}>{ofp.toFixed(1)}</span>
          {hasDiff && calc.showRevVal && !isInput && (
            <span className={`text-[0.6rem] ${diffColor}`}>{diffSign}{diff.toFixed(1)}</span>
          )}
        </div>

        {/* Revised / Input */}
        <div className="text-right flex justify-end">
          {isInput && calc.isManual ? (
            <input 
              type="number" step="0.1" 
              defaultValue={rev || ''} 
              onBlur={(e) => handlers.handleFuelInput(field, e.target.value)}
              key={`${field}-${rev}`}
              className="w-16 bg-[#2a2a2a] text-[#00E676] text-right text-[0.8rem] font-bold rounded px-1 outline-none border border-[#444] focus:border-[#00E676]" 
            />
          ) : (
            <div className={`${calc.showRevVal ? '' : 'opacity-0'}`}>
              <div className={revClass}>
                {rev.toFixed(1)}
              </div>
            </div>
          )}
        </div>

        {/* Time */}
        <div className="text-right text-[0.65rem] text-[#00E676] font-mono pr-1">
          {time}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-[4] flex flex-col h-full overflow-hidden text-white font-sans w-full max-w-[420px]">
      <div className="bg-[#1E1E1E] rounded-xl flex flex-col h-full shadow-lg">
        
        {/* 🌟 Header & Auto Toggle */}
        <div className="flex justify-between items-center p-4 border-b border-[#333] shrink-0">
          <h2 className="text-[1.1rem] font-bold">Fuel & Weight</h2>
          <div 
            onClick={handlers.handleManualToggle}
            className="flex items-center gap-2 cursor-pointer bg-[#333] rounded-full px-2 py-1 hover:bg-[#444] transition-colors"
          >
            <span className="text-[0.65rem] font-bold text-white uppercase tracking-wider pl-1">
              {calc.isManual ? 'Manual' : 'Auto'}
            </span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${!calc.isManual ? 'bg-[#00bfa5]' : 'bg-[#555]'}`}>
               <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] shadow-sm transition-transform ${!calc.isManual ? 'right-[2px]' : 'left-[2px]'}`}></div>
            </div>
          </div>
        </div>

        {/* 🌟 螢光綠 Final Fuel Banner */}
        {calc.showRevVal ? (
          <div 
            onClick={!flightData?.final_fuel_accepted ? handlers.handleAcceptFuel : undefined}
            className={`mx-4 mt-4 rounded-lg p-3 flex justify-between items-center text-black shadow-md transition-all ${flightData?.final_fuel_accepted ? 'bg-[#C6FF00]' : 'bg-[#FFD600] cursor-pointer animate-pulse'}`}
          >
            <div className="font-bold text-sm">
              {flightData?.final_fuel_accepted ? 'Final fuel' : 'Pending fuel'} <span className="text-base font-black ml-1">{calc.currTotal.toFixed(1)}<span className="text-[0.65rem] font-bold ml-[1px]">T</span></span>
            </div>
            <div className="font-bold text-xs flex items-center gap-1">
              ALTN {calc.selectedAltn || "RJGG"} (A) <span className="text-lg leading-none pb-0.5">›</span>
            </div>
          </div>
        ) : (
          <div className="h-4 shrink-0"></div> // Spacer when banner is hidden
        )}

        {/* 🌟 Main Table Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 mt-4">
          
          {/* Table Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] text-[0.6rem] text-[#8fa0a6] uppercase tracking-wider mb-2 border-b border-[#333] pb-1">
            <div></div>
            <div className="text-right pr-2">OFP</div>
            <div className="text-right pr-2">Revised</div>
            <div className="text-right">Time</div>
          </div>

          {/* Fuel Rows */}
          <div className="font-mono mb-6">
            {Row({ label: "Taxi", ofp: calc.ofpTaxi, rev: calc.currTaxi, time: "0019", isInput: true, field: 'taxi' })}
            {Row({ label: "Trip Fuel", ofp: calc.ofpTrip, rev: calc.currTrip, time: "0305", isInput: true, field: 'trip' })}
            {Row({ label: "Cont", ofp: calc.ofpCont, rev: calc.currCont, time: "0026", isInput: true, field: 'cont' })}
            {Row({ label: "Dest Hold", ofp: 0.0, rev: 0.0, time: "0000" })}
            {Row({ label: "Additional", ofp: 0.0, rev: 0.0, time: "0000" })}
            
            {/* ALTN Dropdown Row */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-1 items-center py-2 border-b border-dashed border-[#333]">
              <div className="text-[0.7rem]">
                <div className="bg-white text-black px-1 py-0.5 rounded text-[0.6rem] font-bold font-sans inline-block w-max leading-tight cursor-pointer">
                  ALTN<br/>
                  <select 
                    value={calc.selectedAltn}
                    onChange={(e) => updateFlightData({ selected_altn: e.target.value, final_fuel_accepted: false })}
                    className="bg-transparent font-bold outline-none cursor-pointer appearance-none text-center"
                  >
                    {calc.altnOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select> ∨
                </div>
              </div>
              <div className="text-right flex items-center justify-end gap-1.5">
                <span className="text-[0.8rem] text-white">{calc.baseAltnOfp.toFixed(1)}</span>
                {calc.showRevVal && Math.abs(calc.currAltnOfp - calc.baseAltnOfp) > 0.05 && (
                  <span className="text-[0.6rem] text-[#00E676]">+{Math.abs(calc.currAltnOfp - calc.baseAltnOfp).toFixed(1)}</span>
                )}
              </div>
              <div className="text-right text-[#00E676] font-bold">{calc.showRevVal ? calc.currAltnOfp.toFixed(1) : ''}</div>
              <div className="text-right text-[0.65rem] text-[#00E676] font-mono pr-1">0039</div>
            </div>

            {Row({ label: "Reserve", ofp: calc.ofpRes, rev: calc.ofpRes, time: "0030" })}
            {Row({ label: "Fuel Reqd", ofp: calc.ofpReqdBase, rev: calc.currReqdBase, time: "0459", isBold: true, isTotal: true })}
            {Row({ label: "Tankering", ofp: 0.0, rev: calc.currTank, time: "0000", isInput: true, field: 'tankering' })}
            {Row({ label: "Extra", ofp: 0.0, rev: calc.currExtra, time: "0000", isInput: true, field: 'extra' })}
            {Row({ label: "Total Fuel", ofp: calc.ofpTotal, rev: calc.currTotal, time: "0459", isBold: true, isTotal: true, isInput: true, field: 'total' })}
          </div>

          {/* Weight Table Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] text-[0.6rem] text-[#8fa0a6] uppercase tracking-wider mb-2">
            <div></div>
            <div></div>
            <div></div>
            <div className="text-right pr-1">Margin</div>
          </div>
          
          {/* Weight Rows */}
          <div className="font-mono">
            {/* ZFW Input */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-1 items-center py-2 border-b border-dashed border-[#333]">
              <div className="text-[0.7rem] text-[#8fa0a6]">ZFW</div>
              <div className="text-right flex items-center justify-end gap-1.5">
                <span className="text-[0.85rem] font-bold text-white">{calc.ofpZfw.toFixed(1)}</span>
                {calc.showRevVal && Math.abs((calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) - calc.ofpZfw) > 0.05 && (
                  <span className={`text-[0.6rem] ${(calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) - calc.ofpZfw > 0 ? 'text-[#00E676]' : 'text-[#FF1744]'}`}>
                    {((calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) - calc.ofpZfw) > 0 ? '+' : ''}{((calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) - calc.ofpZfw).toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-right flex justify-end">
                {calc.isManual ? (
                  <input 
                    type="number" step="0.1" 
                    defaultValue={calc.actualZfw || ''} 
                    onBlur={(e) => handlers.handleZfwInput(e.target.value)}
                    key={`zfw-${calc.actualZfw}`}
                    className="w-16 bg-[#1a1a1a] border border-[#00bfa5] text-[#00bfa5] text-right text-[0.8rem] font-bold rounded px-1 outline-none"
                  />
                ) : (
                  <div className={`${calc.showRevVal ? 'opacity-100' : 'opacity-0'} bg-[#153f36] text-[#00E676] text-right font-bold py-1 px-2 rounded-l ml-auto w-max`}>
                    {(calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw).toFixed(1)}
                  </div>
                )}
              </div>
              <div className="text-right text-[0.65rem] text-[#8fa0a6] pr-1">
                {(B773_BHNQ.limits.MZFW / 1000 - (calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw)).toFixed(1)}
              </div>
            </div>

            {Row({ label: "TOW", ofp: flightData?.weight_tow_ofp || 0, rev: calc.currTow, time: "-12.7", isBold: true, isTow: true })}
            {Row({ label: "LW", ofp: flightData?.weight_lw_ofp || 0, rev: calc.currLw, time: "-11.5", isZfw: true })}
          </div>

          {/* CG Info Footer */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-[0.65rem] font-mono text-[#8fa0a6] border-t border-[#333] pt-4">
            <div className="flex justify-between">
              <span className="font-sans">LNDG</span>
              <span className="text-white">+103 up -94 down</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans">RAMP</span>
              <span className="text-white">+93 up -86 down</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
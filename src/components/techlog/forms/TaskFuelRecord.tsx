"use client";
import { useState } from "react";

export function TaskFuelRecord({ flightData, tlData, updateTechLogData, setActiveTask }: any) {
  const [fuelTotDep, setFuelTotDep] = useState("");
  const [fuelActual, setFuelActual] = useState("");
  const [fuelCycling, setFuelCycling] = useState(false);

  // 🌟 將原本寫死 5.0 嗰行，改做同 Top Bar 統一嘅 10.5
  // tlData?.tl_prev_fob 會自動裝載上一程 (Normal Close / Diversion / Return) 輸入過嘅 Arrival Fuel！
  const fobBefore = parseFloat(tlData?.tl_prev_fob || flightData?.prev_fob || "10.5");
  const parsedTotDep = parseFloat(fuelTotDep) || 0;
  const parsedActual = parseFloat(fuelActual) || 0;
  const expectedUplift = Math.max(0, parsedTotDep - fobBefore);
  const discrepancy = (fuelTotDep !== "" && fuelActual !== "") ? parsedActual - expectedUplift : 0;
  const isValid = fuelTotDep !== "" && fuelActual !== "" && fuelCycling;

  const handleConfirm = () => {
    if (!isValid) return;
    updateTechLogData({ 
      tl_fuel_record_completed: true, 
      tl_total_departure_fuel: parsedTotDep, 
      tl_actual_uplift: parsedActual 
    }); 
    setActiveTask("acceptance");
  };

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* 🌟 Header */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3 shrink-0">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
        </svg>
        Fuel Record
      </h3>

      {/* 🌟 表單內容區 */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">
        
        {/* Total Departure Fuel */}
        <div>
          <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 flex justify-between">
            <span>Total Departure Fuel</span>
            <span className="text-[#555]">T (KGS x 1000)</span>
          </label>
          <input 
            type="number" 
            step="0.1" 
            value={fuelTotDep} 
            onChange={e => setFuelTotDep(e.target.value)} 
            className="w-full bg-[#0a0a0a] border border-[#00E676]/50 p-4 rounded-xl font-mono font-bold text-white text-lg outline-none focus:border-[#00E676] transition-colors shadow-inner placeholder:text-[#333]" 
            placeholder="e.g. 42.0"
          />
        </div>
        
        {/* System Read-only Data (FOB & Expected) */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>FOB Before Uplift</span>
            </label>
            <input 
              type="text" 
              disabled 
              value={fobBefore.toFixed(1)} 
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] outline-none cursor-not-allowed shadow-inner" 
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>Expected Uplift</span>
            </label>
            <input 
              type="text" 
              disabled 
              value={expectedUplift.toFixed(1)} 
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] outline-none cursor-not-allowed shadow-inner" 
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>
        
        {/* Actual Uplift & Discrepancy */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-[#FF9100] font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>Actual Uplift</span>
            </label>
            <input 
              type="number" 
              step="0.1" 
              value={fuelActual} 
              onChange={e => setFuelActual(e.target.value)} 
              className="w-full bg-[#0a0a0a] border border-[#FF9100]/50 p-4 rounded-xl font-mono font-bold text-[#FF9100] text-lg outline-none focus:border-[#FF9100] transition-colors shadow-inner placeholder:text-[#444]" 
              placeholder="e.g. 37.0"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>Discrepancy</span>
            </label>
            <input 
              type="text" 
              disabled 
              value={discrepancy > 0 ? `+${discrepancy.toFixed(1)}` : discrepancy.toFixed(1)} 
              className={`w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-lg outline-none cursor-not-allowed shadow-inner transition-colors ${Math.abs(discrepancy) > 1.0 ? 'text-[#FF1744] border-[#FF1744]/50 bg-[#FF1744]/5' : discrepancy !== 0 ? 'text-white' : 'text-[#555]'}`} 
            />
          </div>
        </div>
        
        {/* Refuelling Door Cycling Toggle */}
        <div 
          onClick={() => setFuelCycling(!fuelCycling)} 
          className="flex items-center justify-between bg-[#0a0a0a] border border-[#444] p-5 rounded-xl mt-2 cursor-pointer hover:border-[#666] transition-colors select-none shadow-inner"
        >
          <div className="flex flex-col pr-4">
            <div className="text-white font-bold uppercase tracking-widest text-[0.75rem] leading-snug">Confirm "Refuelling Station Door Cycling Procedure" Performed</div>
            <div className="text-[#555] text-[0.65rem] mt-1.5 font-bold uppercase tracking-widest">Ref AD 2020-11-11</div>
          </div>
          <div className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner shrink-0 ${fuelCycling ? 'bg-[#00E676]' : 'bg-[#333]'}`}>
            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${fuelCycling ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </div>

      {/* 🌟 底部 Confirm 按鈕 */}
      <button 
        onClick={handleConfirm} 
        disabled={!isValid}
        className={`w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 ${
          isValid 
            ? 'bg-[#C6FF00] text-black hover:bg-[#a8db00] shadow-[0_4px_15px_rgba(198,255,0,0.3)]' 
            : 'bg-[#1a1a1a] text-[#444] border border-[#333] cursor-not-allowed'
        }`}
      >
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Confirm Fuel Record
      </button>

    </div>
  );
}
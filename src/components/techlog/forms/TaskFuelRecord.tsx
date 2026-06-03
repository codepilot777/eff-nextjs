"use client";
import { useState } from "react";

export function TaskFuelRecord({ flightData, tlData, updateTechLogData, setActiveTask }: any) {
  const [fuelTotDep, setFuelTotDep] = useState("");
  const [fuelActual, setFuelActual] = useState("");
  const [fuelCycling, setFuelCycling] = useState(false);

  const fobBefore = parseFloat(tlData?.tl_prev_fob || flightData?.prev_fob || "5.0");
  const parsedTotDep = parseFloat(fuelTotDep) || 0;
  const parsedActual = parseFloat(fuelActual) || 0;
  const expectedUplift = Math.max(0, parsedTotDep - fobBefore);
  const discrepancy = (fuelTotDep !== "" && fuelActual !== "") ? parsedActual - expectedUplift : 0;
  const isValid = fuelTotDep !== "" && fuelActual !== "" && fuelCycling;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-6 shrink-0">
        <h3 className="text-2xl font-black text-[#00E676]">Fuel Record</h3>
        {isValid && <button onClick={() => { updateTechLogData({ tl_fuel_record_completed: true, tl_total_departure_fuel: parsedTotDep, tl_actual_uplift: parsedActual }); setActiveTask("acceptance"); }} className="bg-[#00E676] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(0,230,118,0.3)] animate-fade-in tracking-widest">CONFIRM</button>}
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5">
        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Total Departure Fuel T(KGSX1000)</label><input type="number" step="0.1" value={fuelTotDep} onChange={e => setFuelTotDep(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#00bfa5] p-3 rounded font-bold text-[#00bfa5] outline-none focus:border-white text-lg" placeholder="e.g. 42.0"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">FOB before uplift T(KGSX1000)</label><input type="text" disabled value={fobBefore.toFixed(1)} className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Expected Uplift T(KGSX1000)</label><input type="text" disabled value={expectedUplift.toFixed(1)} className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Actual Uplift T(KGSX1000)</label><input type="number" step="0.1" value={fuelActual} onChange={e => setFuelActual(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#FF9100] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" placeholder="e.g. 37.0"/></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Discrepancy T(KGSX1000)</label><input type="text" disabled value={discrepancy > 0 ? `+${discrepancy.toFixed(1)}` : discrepancy.toFixed(1)} className={`w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold outline-none ${Math.abs(discrepancy) > 1.0 ? 'text-[#FF1744]' : 'text-[#e2e8f0]'}`} /></div>
        </div>
        <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg mt-2">
          <div><div className="text-white font-bold text-sm">Confirm "Refuelling Station Door Cycling Procedure" performed</div><div className="text-[#8fa0a6] text-xs mt-0.5">(Ref AD 2020-11-11)</div></div>
          <div onClick={() => setFuelCycling(!fuelCycling)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer shadow-inner shrink-0 ${fuelCycling ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${fuelCycling ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
        </div>
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";

export function TaskAcceptance({ tlData, updateTechLogData, setActiveTask }: any) {
  const [acceptToggle, setAcceptToggle] = useState(false);
  const { tl_release: isReleased, tl_total_departure_fuel: totalDepFuel, tl_actual_uplift: actualUplift, tl_prep_flt, tl_prep_dep, tl_prep_arr, tl_cmdr, tl_galaxy_id } = tlData;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-4 shrink-0">
        <h3 className="text-2xl font-black text-[#00E676]">Commander's Acceptance</h3>
        {acceptToggle && isReleased && (
          <button onClick={() => { updateTechLogData({tl_accept: true, tl_flight_started: true, tl_flight_status: "IN_FLIGHT"}); setActiveTask("info"); }} className="bg-[#00E676] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(0,230,118,0.3)] animate-fade-in tracking-widest">CONFIRM</button>
        )}
      </div>
      {!isReleased ? (
        <div className="bg-[#FF1744]/15 border border-[#FF1744] p-4 rounded text-[#FF1744] font-bold">🛑 Aircraft has not been released by Engineering yet. Acceptance is disabled.</div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] border border-[#404040] p-3 rounded-lg">
              <h4 className="text-[#00bfa5] font-bold text-xs uppercase tracking-widest mb-2 border-b border-[#333333] pb-1">Maintenance Work</h4>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>EDTO Transit Check</span><span className="text-[#00E676] font-bold">COMPLETED</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>Daily Check</span><span className="text-[#00E676] font-bold">COMPLETED</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between"><span>Weekly Check</span><span className="text-[#00E676] font-bold">COMPLETED</span></div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#404040] p-3 rounded-lg">
              <h4 className="text-[#00bfa5] font-bold text-xs uppercase tracking-widest mb-2 border-b border-[#333333] pb-1">Servicing Uplift</h4>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>APU Oil</span><span className="font-mono">0.0 Qts</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>Engine Oil</span><span className="font-mono">0.0 Qts</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between"><span>Hydraulic Fluid</span><span className="font-mono">0.0 Qts</span></div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#404040] p-3 rounded-lg flex justify-between items-center">
            <div className="flex-1"><h4 className="text-[#00bfa5] font-bold text-xs uppercase tracking-widest mb-1">Fuel Record</h4><div className="text-xs text-[#8fa0a6]">Total Departure Fuel: <span className="text-white font-mono">{totalDepFuel || 'N/A'} T</span></div></div>
            <div className="flex-1 border-l border-[#333333] pl-4"><div className="text-xs text-[#8fa0a6]">Actual Uplift: <span className="text-white font-mono">{actualUplift || 'N/A'} T</span></div></div>
          </div>
          <hr className="border-dashed border-[#404040]" />
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Flight Number</label><input type="text" value={tl_prep_flt} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-[#8fa0a6]" /></div>
              <div className="flex-[2] flex items-end gap-2">
                <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Origin</label><input type="text" value={tl_prep_dep} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-center text-[#8fa0a6]" /></div>
                <div className="text-[#00bfa5] pb-2">✈️</div>
                <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Destination</label><input type="text" value={tl_prep_arr} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-center text-[#8fa0a6]" /></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander</label><input type="text" value={tl_cmdr} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-[#8fa0a6]" /></div>
              <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={tl_galaxy_id} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-[#8fa0a6]" /></div>
            </div>
          </div>
          <hr className="border-dashed border-[#404040]" />
          <div className="bg-[#00E676]/10 border border-[#00E676]/30 p-4 rounded-xl flex flex-col items-center gap-4 mt-2">
            <p className="text-sm text-center text-[#e2e8f0] font-bold px-4">"I accept the aircraft's declared airworthiness and certify that the fuel grade, distribution and quantity is sufficient for the intended flight."</p>
            <div className="flex flex-col items-center gap-2">
              <div onClick={() => setAcceptToggle(!acceptToggle)} className={`w-16 h-8 flex items-center rounded-full p-1 cursor-pointer shadow-inner ${acceptToggle ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${acceptToggle ? 'translate-x-8' : 'translate-x-0'}`}>{acceptToggle && <span className="text-[#00E676] text-xs font-black">✓</span>}</div></div>
              <span className={`text-xs font-black tracking-widest uppercase transition-colors ${acceptToggle ? 'text-[#00E676]' : 'text-[#8fa0a6]'}`}>Accept Aircraft</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
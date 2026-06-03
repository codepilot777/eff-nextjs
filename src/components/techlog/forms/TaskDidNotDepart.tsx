"use client";
import { useState } from "react";

export function TaskDidNotDepart({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const [arrivalFuel, setArrivalFuel] = useState("");
  const [showAckModal, setShowAckModal] = useState(false);

  const isFormValid = arrivalFuel.trim() !== "";

  const handleAcknowledge = () => {
    const hasSubmittedDefects = defects.length > 0;
    const updates: any = {
      tl_flight_started: false,
      tl_accept: false,
      tl_prepared: false,
      tl_flight_status: "SCHEDULED",
      tl_prev_fob: arrivalFuel 
    };

    if (hasSubmittedDefects) {
      updates.tl_release = false;
      updates.tl_defects = false;
    }

    updateTechLogData(updates);
    setShowAckModal(false);
    setActiveTask(null);
    alert(hasSubmittedDefects ? "Flight Cancelled. Maintenance Release BROKEN due to open defects. Engineer action required!" : "Flight Cancelled. Returned to previous pre-acceptance state safely.");
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="border-b border-[#333333] pb-3 mb-6 shrink-0 pr-48">
        <h3 className="text-2xl font-black text-white">Did Not Depart Gate</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
        <div className="bg-[#1a1a1a] border-l-4 border-white p-4 rounded text-sm text-[#e2e8f0] italic leading-relaxed">
          Please Confirm to cancel acceptance and return to previous sector.
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Fuel T(KGSX1000)</label>
            <input type="number" step="0.1" value={arrivalFuel} onChange={e => setArrivalFuel(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-white transition-colors" placeholder="e.g. 42.0" />
          </div>
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Station (Gate Return)</label>
            <input type="text" value={tlData?.tl_prep_dep || "HKG"} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none uppercase" />
          </div>
        </div>
      </div>

      {isFormValid && (
        <button onClick={() => setShowAckModal(true)} className="w-full mt-4 bg-[#404040] text-white border border-[#606060] font-black px-6 py-4 rounded-lg hover:bg-white hover:text-black transition-colors shadow-lg tracking-widest uppercase shrink-0">
          CONFIRM
        </button>
      )}

      {showAckModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1a] border-2 border-[#FF1744] rounded-xl w-full max-w-lg p-6 shadow-[0_0_50px_rgba(255,23,68,0.3)] flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[#FF1744] border-b border-[#333333] pb-3"><span className="text-xl">⚠️</span><h4 className="text-lg font-black tracking-widest">ACKNOWLEDGEMENT REQUIRED</h4></div>
            <p className="text-sm text-[#e2e8f0] leading-relaxed font-bold">This will re-open the previous sector. Any defect raised will be recorded in the previous sector and will break the Maintenance Release.</p>
            <div className="flex gap-4 mt-2">
              <button onClick={() => setShowAckModal(false)} className="flex-1 py-3 bg-[#2a2a2a] border border-[#404040] text-[#8fa0a6] font-bold rounded-lg hover:text-white hover:bg-[#404040] transition-colors">CANCEL</button>
              <button onClick={handleAcknowledge} className="flex-1 py-3 bg-[#FF1744] text-white font-black tracking-widest rounded-lg hover:bg-[#D50000] transition-colors shadow-lg">ACKNOWLEDGE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
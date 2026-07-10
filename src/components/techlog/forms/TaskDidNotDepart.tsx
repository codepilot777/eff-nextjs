"use client";
import { useState } from "react";

export function TaskDidNotDepart({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const [arrivalFuel, setArrivalFuel] = useState("");
  const [showAckModal, setShowAckModal] = useState(false);

  const isFormValid = arrivalFuel.trim() !== "";

  const handleAcknowledge = () => {
    // 🌟 修復：舊時 defects.length > 0 冇理狀態，連已經 CLEARED/DEFERRED 嘅都計埋，
    // 令一個冇任何 OPEN defect 嘅 sector 都會誤觸發「Maintenance Release BROKEN」警告
    const hasOpenDefects = defects.some((d: any) => d.status === "OPEN");
    const updates: any = {
      tl_flight_started: false,
      tl_accept: false,
      tl_prepared: false,
      tl_flight_status: "SCHEDULED",
      tl_prev_fob: arrivalFuel
    };

    if (hasOpenDefects) {
      updates.tl_release = false;
      updates.tl_defects = false;
    }

    updateTechLogData({ data: updates });
    setShowAckModal(false);
    setActiveTask(null);
    alert(hasOpenDefects ? "Flight Cancelled. Maintenance Release BROKEN due to open defects. Engineer action required!" : "Flight Cancelled. Returned to previous pre-acceptance state safely.");
  };

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* 🌟 Header (純白/銀灰主題) */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-white border-b border-[#333] pb-4 mb-6 flex items-center gap-3 shrink-0">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-[#8fa0a6]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Did Not Depart Gate
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">
        
        {/* 🌟 系統提示框 */}
        <div className="bg-[#0a0a0a] border-l-4 border-[#8fa0a6] p-5 rounded-r-xl shadow-inner">
          <p className="text-[0.7rem] text-[#8fa0a6] font-bold tracking-widest uppercase leading-relaxed">
            Please Confirm to cancel acceptance and return to previous sector state.
          </p>
        </div>

        {/* 🌟 Fuel & Station */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-white font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>Arrival Fuel</span>
              <span className="text-[#555]">T (KGS x 1000)</span>
            </label>
            <input 
              type="number" step="0.1" 
              value={arrivalFuel} 
              onChange={e => setArrivalFuel(e.target.value)} 
              className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white text-lg outline-none focus:border-white shadow-inner transition-colors placeholder:text-[#333]" 
              placeholder="e.g. 42.0" 
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Arrival Station (Gate Return)</label>
            <input 
              type="text" 
              value={tlData?.tl_prep_dep || "HKG"} 
              disabled 
              className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] text-center text-lg outline-none cursor-not-allowed shadow-inner uppercase" 
            />
          </div>
        </div>
      </div>

      {/* 🌟 底部 Confirm 按鈕 (打開 Modal) */}
      {isFormValid ? (
        <button 
          onClick={() => setShowAckModal(true)} 
          className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 bg-[#252525] text-white border border-[#444] hover:bg-white hover:text-black shadow-[0_4px_15px_rgba(255,255,255,0.1)]"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Confirm Cancellation
        </button>
      ) : (
        <div className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest flex items-center justify-center gap-3 shrink-0 bg-[#1a1a1a] text-[#444] border border-[#333] cursor-not-allowed">
          Please Enter Arrival Fuel
        </div>
      )}

      {/* 🚨 警告 Modal */}
      {showAckModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-[#0a0a0a] border border-[#FF1744] rounded-2xl w-full max-w-lg p-8 shadow-[0_0_60px_rgba(255,23,68,0.2)] flex flex-col gap-6 relative overflow-hidden">
            
            <div className="flex items-center gap-4 text-[#FF1744] border-b border-[#333] pb-4">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-[1.1rem] font-black tracking-widest uppercase">Acknowledgement Required</h4>
            </div>
            
            <p className="text-[0.85rem] text-[#e2e8f0] leading-relaxed font-bold">
              This will re-open the previous sector. Any defect raised will be recorded in the previous sector and will break the <span className="text-[#FF1744]">Maintenance Release</span>.
            </p>
            
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setShowAckModal(false)} 
                className="flex-1 py-4 bg-transparent border border-[#444] text-[#8fa0a6] font-bold tracking-widest uppercase text-[0.75rem] rounded-xl hover:text-white hover:bg-[#252525] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAcknowledge} 
                className="flex-1 py-4 bg-[#FF1744] text-white font-black tracking-widest uppercase text-[0.75rem] rounded-xl hover:bg-[#D50000] transition-colors shadow-[0_4px_15px_rgba(255,23,68,0.3)] flex items-center justify-center gap-2"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
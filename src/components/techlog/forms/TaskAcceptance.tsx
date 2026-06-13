"use client";
import { useState } from "react";

export function TaskAcceptance({ tlData, updateTechLogData, setActiveTask }: any) {
  const [acceptToggle, setAcceptToggle] = useState(false);
  const { tl_release: isReleased, tl_total_departure_fuel: totalDepFuel, tl_actual_uplift: actualUplift, tl_prep_flt, tl_prep_dep, tl_prep_arr, tl_cmdr, tl_galaxy_id } = tlData;

  const handleConfirm = () => {
    updateTechLogData({
      tl_accept: true, 
      tl_flight_started: true, 
      tl_flight_status: "IN_FLIGHT"
    }); 
    setActiveTask("info");
  };

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* 🌟 Header */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3 shrink-0">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Commander's Acceptance
      </h3>

      {!isReleased ? (
        /* 🛑 未 Release 警告畫面 */
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-[#FF1744]/10 border border-[#FF1744]/50 rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_0_30px_rgba(255,23,68,0.15)] max-w-md">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#FF1744] mb-4 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-[#FF1744] font-black uppercase tracking-widest text-lg mb-2">Aircraft Not Released</h4>
            <p className="text-[#e2e8f0] text-[0.75rem] font-bold leading-relaxed">
              The aircraft has not been released by Engineering yet. Commander's acceptance is currently disabled.
            </p>
          </div>
        </div>
      ) : (
        /* ✅ 已 Release 表單畫面 */
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">
          
          {/* 第 1 行：Maintenance & Servicing */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-[#0a0a0a] border border-[#333] p-5 rounded-xl shadow-inner">
              <h4 className="text-white font-bold text-[0.65rem] uppercase tracking-widest mb-4 border-b border-[#333] pb-2 flex items-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M15.17 11.42a4.5 4.5 0 11-6.34-6.34 4.5 4.5 0 016.34 6.34zM10 14H6l-3 3v3h3l3-3v-4z" /></svg>
                Maintenance Work
              </h4>
              <div className="flex flex-col gap-2.5">
                <div className="text-[0.75rem] text-[#e2e8f0] flex justify-between items-center"><span className="text-[#8fa0a6] font-bold">EDTO Transit Check</span><span className="text-[#00E676] font-black tracking-widest text-[0.65rem] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/30">COMPLETED</span></div>
                <div className="text-[0.75rem] text-[#e2e8f0] flex justify-between items-center"><span className="text-[#8fa0a6] font-bold">Daily Check</span><span className="text-[#00E676] font-black tracking-widest text-[0.65rem] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/30">COMPLETED</span></div>
                <div className="text-[0.75rem] text-[#e2e8f0] flex justify-between items-center"><span className="text-[#8fa0a6] font-bold">Weekly Check</span><span className="text-[#00E676] font-black tracking-widest text-[0.65rem] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/30">COMPLETED</span></div>
              </div>
            </div>
            
            <div className="bg-[#0a0a0a] border border-[#333] p-5 rounded-xl shadow-inner">
              <h4 className="text-white font-bold text-[0.65rem] uppercase tracking-widest mb-4 border-b border-[#333] pb-2 flex items-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" /></svg>
                Servicing Uplift
              </h4>
              <div className="flex flex-col gap-2.5">
                <div className="text-[0.75rem] text-[#e2e8f0] flex justify-between items-center"><span className="text-[#8fa0a6] font-bold">APU Oil</span><span className="font-mono font-bold">0.0 Qts</span></div>
                <div className="text-[0.75rem] text-[#e2e8f0] flex justify-between items-center"><span className="text-[#8fa0a6] font-bold">Engine Oil</span><span className="font-mono font-bold">0.0 Qts</span></div>
                <div className="text-[0.75rem] text-[#e2e8f0] flex justify-between items-center"><span className="text-[#8fa0a6] font-bold">Hydraulic Fluid</span><span className="font-mono font-bold">0.0 Qts</span></div>
              </div>
            </div>
          </div>

          {/* 第 2 行：Fuel Record */}
          <div className="bg-[#0a0a0a] border border-[#333] p-5 rounded-xl flex justify-between items-center shadow-inner">
            <div className="flex-1 flex flex-col gap-2">
              <h4 className="text-white font-bold text-[0.65rem] uppercase tracking-widest mb-1 flex items-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#FF9100]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                Fuel Record summary
              </h4>
              <div className="text-[0.75rem] text-[#8fa0a6] font-bold">
                Total Departure Fuel: <span className="text-white font-mono font-bold ml-2 text-sm">{totalDepFuel || 'N/A'} T</span>
              </div>
            </div>
            <div className="flex-1 border-l border-[#333] pl-6 flex flex-col justify-end">
              <div className="text-[0.75rem] text-[#8fa0a6] font-bold">
                Actual Uplift: <span className="text-[#00E676] font-mono font-bold ml-2 text-sm">{actualUplift || 'N/A'} T</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#333] w-full my-1"></div>

          {/* 第 3 行：Flight Details */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[1fr_2fr] gap-5">
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Flight Number</label>
                <input type="text" value={tl_prep_flt} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 text-center">Origin</label>
                  <input type="text" value={tl_prep_dep} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-center text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
                </div>
                <div className="text-[#555] pt-5">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                </div>
                <div className="flex-1">
                  <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 text-center">Destination</label>
                  <input type="text" value={tl_prep_arr} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-center text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Commander</label>
                <input type="text" value={tl_cmdr} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">GalaCXy ID</label>
                <input type="text" value={tl_galaxy_id} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#333] w-full my-1"></div>

          {/* 第 4 行：Declaration & Toggle */}
          <div 
            onClick={() => setAcceptToggle(!acceptToggle)} 
            className={`flex items-center justify-between bg-[#0a0a0a] border p-5 rounded-xl cursor-pointer transition-colors select-none shadow-inner ${acceptToggle ? 'border-[#00E676]/50' : 'border-[#444] hover:border-[#666]'}`}
          >
            <div className="flex flex-col pr-6">
              <p className={`text-[0.75rem] font-mono leading-relaxed italic transition-colors ${acceptToggle ? 'text-[#00E676]' : 'text-[#8fa0a6]'}`}>
                "I accept the aircraft's declared airworthiness and certify that the fuel grade, distribution and quantity is sufficient for the intended flight."
              </p>
            </div>
            <div className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner shrink-0 ${acceptToggle ? 'bg-[#00E676]' : 'bg-[#333]'}`}>
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${acceptToggle ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>

          {/* 🌟 底部 Confirm 按鈕 */}
          <button 
            onClick={handleConfirm} 
            disabled={!acceptToggle}
            className={`w-full py-4.5 mt-2 rounded-xl font-black text-[0.8rem] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 ${
              acceptToggle 
                ? 'bg-[#00E676] text-black hover:bg-[#00c263] shadow-[0_4px_15px_rgba(0,230,118,0.3)]' 
                : 'bg-[#1a1a1a] text-[#444] border border-[#333] cursor-not-allowed'
            }`}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Sign & Accept Aircraft
          </button>

        </div>
      )}
    </div>
  );
}
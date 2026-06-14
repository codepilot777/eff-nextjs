"use client";
import { useState } from "react";

export function TaskAcceptance({ tlData, updateTechLogData, setActiveTask }: any) {
  const [acceptToggle, setAcceptToggle] = useState(false);
  const { 
    tl_release: isReleased, tl_total_departure_fuel: totalDepFuel, tl_actual_uplift: actualUplift, 
    tl_prep_flt, tl_prep_dep, tl_prep_arr, tl_cmdr, tl_galaxy_id, 
    crs_id, tl_entries 
  } = tlData;

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
          
          {/* 🌟 頂部：Maintenance Release (CRS) 狀態橫幅 */}
          <div className="bg-[#00E676]/10 border border-[#00E676]/30 p-4 rounded-xl flex items-center justify-between shadow-inner">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#00E676]/20 rounded-full flex items-center justify-center text-[#00E676]">
                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9 9-4.03 9-9z" /></svg>
               </div>
               <div>
                 <div className="text-[#00E676] font-black text-[0.7rem] uppercase tracking-widest">Maintenance Release Issued</div>
                 <div className="text-white font-mono font-bold text-sm mt-0.5">{crs_id || 'CRS-PENDING'}</div>
               </div>
             </div>
             <div className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest text-right">
               Status:<br/><span className="text-[#00E676]">Airworthy</span>
             </div>
          </div>

          {/* 🌟 全新區塊：Pre-flight Engineering Actions (讀取 tl_entries) */}
          <div className="bg-[#0a0a0a] border border-[#333] p-5 rounded-xl shadow-inner">
            <h4 className="text-white font-bold text-[0.65rem] uppercase tracking-widest mb-4 border-b border-[#333] pb-2 flex items-center gap-2">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#00E676]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
              Pre-flight Action Log
            </h4>
            
            <div className="flex flex-col gap-3">
              {tl_entries && tl_entries.length > 0 ? (
                tl_entries.map((entry: any) => (
                  <div key={entry.id} className="flex gap-4 p-3 bg-[#1a1a1a] border border-[#333] rounded-lg items-start">
                    <div className="text-[0.65rem] text-[#8fa0a6] font-mono font-bold mt-0.5">{entry.time}</div>
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[0.55rem] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                          entry.action.includes("RECTIFIED") ? "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30" : 
                          entry.action.includes("SERVICING") ? "bg-[#FF9100]/10 text-[#FF9100] border-[#FF9100]/30" : 
                          entry.action.includes("RAISED") ? "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/30" :
                          "bg-[#2979FF]/10 text-[#2979FF] border-[#2979FF]/30"
                        }`}>
                          {entry.action}
                        </span>
                        <span className="text-white font-mono font-bold text-[0.7rem]">
                          {entry.ref !== "N/A" ? `REF: ${entry.ref}` : entry.id}
                        </span>
                      </div>
                      
                      {/* 🌟 全新加入：如果有 Original Desc (原問題)，就用一個子區塊顯示出嚟 */}
                      {entry.original_desc && (
                        <div className="mb-2 bg-[#0a0a0a] border-l-2 border-[#FF9100] p-2 rounded-r-md">
                          <div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-0.5">Reported Issue:</div>
                          <div className="text-[0.7rem] text-[#ccc] font-mono leading-snug">{entry.original_desc}</div>
                        </div>
                      )}

                      <div className="text-[0.75rem] text-[#e2e8f0] leading-relaxed">
                        <span className="text-[#8fa0a6] font-bold mr-1">{entry.original_desc ? "Action Taken:" : ""}</span>
                        {entry.desc}
                      </div>
                      
                      <div className="text-[0.6rem] text-[#555] font-mono font-bold mt-2 text-right">{entry.sign}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#555] text-[0.75rem] font-bold py-4 uppercase tracking-widest">
                  No engineering actions recorded for this sector.
                </div>
              )}
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
                ? 'bg-[#C6FF00] text-black hover:bg-[#a8db00] shadow-[0_4px_15px_rgba(198,255,0,0.3)]' 
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
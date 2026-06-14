"use client";

export default function TechLogLeftPanel({ tlData, roleMode, setActiveTask, setSelectedEntry, updateTechLogData, defects }: any) {
  const {
    tl_prepared: isPrepared,
    tl_fuel_record_completed: isFuelDone,
    tl_accept: isAccepted,
    tl_flight_started: isStarted,
    tl_fluids: isFluids,
    tl_checks: isChecks,
    tl_defects: isDefects,
    tl_release: isReleased,
  } = tlData;

  // 🌟 嚴格過濾：必須係 OPEN 先入 TL Entries，必須係 DEFERRED 先入對應嘅 ADD list
  const openEntries = (defects || []).filter((d: any) => d.status === "OPEN");
  const paddEntries = (defects || []).filter((d: any) => d.status === "DEFERRED" && d.id.startsWith("P"));
  const saddEntries = (defects || []).filter((d: any) => d.status === "DEFERRED" && d.id.startsWith("S"));
  const addEntries  = (defects || []).filter((d: any) => d.status === "DEFERRED" && d.id.startsWith("A"));

  return (
    <div className="flex-[4] flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent font-sans">
      
      {/* 🌟 1. Servicing Summary */}
      <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-5 shadow-lg shrink-0">
        <h4 className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest mb-4 border-b border-[#333] pb-3 flex items-center gap-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          Servicing Summary
        </h4>
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-dashed border-[#333] pb-2">
            <span className="text-[#8fa0a6] text-[0.75rem] font-bold">EDTO Transit</span> 
            <span className={`text-[0.7rem] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isChecks ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30' : 'bg-[#FF9100]/10 text-[#FF9100] border border-[#FF9100]/30'}`}>
              {isChecks ? 'Completed' : 'Required'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-[#333] pb-2">
            <span className="text-[#8fa0a6] text-[0.75rem] font-bold">Daily Check</span> 
            <span className="text-white font-mono text-[0.75rem] font-bold">{isChecks ? '24h 00m' : '0h 45m'}</span>
          </div>
          <div className="flex justify-between items-center border-b border-dashed border-[#333] pb-2">
            <span className="text-[#8fa0a6] text-[0.75rem] font-bold">Weekly Check</span> 
            <span className="text-white font-mono text-[0.75rem] font-bold">{isChecks ? '7d 00m' : '4d 12h'}</span>
          </div>
        </div>
        
        {roleMode === "ENGINEER" && !isChecks && (
          <button onClick={() => setActiveTask("maint_check")} className="w-full mt-4 py-3 bg-[#0a0a0a] border border-[#444] text-[#e2e8f0] rounded-xl font-bold hover:bg-[#252525] hover:text-white transition-colors text-[0.75rem] uppercase tracking-widest flex justify-center items-center gap-2">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M15.17 11.42a4.5 4.5 0 11-6.34-6.34 4.5 4.5 0 016.34 6.34zM10 14H6l-3 3v3h3l3-3v-4z" /></svg>
            Maintenance Check
          </button>
        )}
        
        {/* Notices to Crew (警告框) */}
        <div className="mt-5 bg-[#FF9100]/10 border border-[#FF9100]/30 rounded-lg p-3 flex items-start gap-3">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#FF9100] shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div className="flex flex-col">
            <strong className="text-[#FF9100] text-[0.65rem] uppercase tracking-widest mb-1">Notices to Crew</strong>
            <span className="text-[#e2e8f0] font-mono text-[0.75rem] leading-snug">[MSG 01] EXTRA POTABLE WATER UPLIFT REQUIRED.</span>
          </div>
        </div>
      </div>

      {/* 🌟 2. Tasks / Actions */}
      {(!isStarted || roleMode === "ENGINEER") && (
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-5 shadow-lg shrink-0">
          <h4 className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest mb-4 border-b border-[#333] pb-3 flex items-center gap-2">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            Pending Actions
          </h4>
          
          <div className="flex flex-col gap-3">
            {roleMode === "FLIGHT CREW" ? (
              !isPrepared ? (
                <button onClick={() => setActiveTask("prepare")} className="w-full py-3.5 bg-transparent border border-[#555] text-[#e2e8f0] font-bold rounded-xl hover:border-[#00E676] hover:bg-[#00E676]/10 hover:text-[#00E676] transition-colors text-[0.75rem] uppercase tracking-widest">
                  Prepare Flight
                </button>
              ) : !isFuelDone ? (
                <button onClick={() => setActiveTask("fuel_record")} className="w-full py-3.5 bg-transparent border border-[#555] text-[#e2e8f0] font-bold rounded-xl hover:border-[#00E676] hover:bg-[#00E676]/10 hover:text-[#00E676] transition-colors text-[0.75rem] uppercase tracking-widest">
                  Fuel Record
                </button>
              ) : !isAccepted ? (
                <>
                  <button onClick={() => setActiveTask("acceptance")} className="w-full py-3.5 bg-[#C6FF00] text-black font-black rounded-xl hover:bg-[#a8db00] transition-colors shadow-[0_4px_15px_rgba(198,255,0,0.3)] text-[0.75rem] uppercase tracking-widest">
                    Commander's Acceptance
                  </button>
                  <button onClick={() => { updateTechLogData({tl_prepared: false, tl_fuel_record_completed: false, tl_accept: false}); setActiveTask(null); }} className="w-full py-3 mt-1 bg-transparent border border-[#FF1744]/50 text-[#FF1744] text-[0.65rem] font-bold rounded-xl hover:bg-[#FF1744]/10 transition-colors uppercase tracking-widest">
                    Cancel Prepared Flight
                  </button>
                </>
              ) : (
                <div className="text-center text-[#00E676] font-bold text-[0.75rem] tracking-widest p-4 border border-dashed border-[#00E676]/50 rounded-xl bg-[#00E676]/5">
                  AWAITING ENGINE START
                </div>
              )
            ) : (
              // ENGINEER MODE
              <>
                {!isFluids && (
                  <button onClick={() => setActiveTask("fluids_uplift")} className="w-full py-3.5 bg-transparent border border-[#555] text-[#e2e8f0] font-bold rounded-xl hover:border-[#00E676] hover:bg-[#00E676]/10 hover:text-[#00E676] transition-colors text-[0.75rem] uppercase tracking-widest flex items-center justify-center gap-2">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" /></svg>
                    Fluids Uplift
                  </button>
                )}
                {openEntries.length === 0 && !isDefects && (
                  <button onClick={() => updateTechLogData({tl_defects: true})} className="w-full py-3.5 bg-transparent border border-[#555] text-[#e2e8f0] font-bold rounded-xl hover:border-[#00E676] hover:bg-[#00E676]/10 hover:text-[#00E676] transition-colors text-[0.75rem] uppercase tracking-widest flex items-center justify-center gap-2">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Sign Off Defects Log
                  </button>
                )}
                {isFluids && isChecks && isDefects && !isReleased && (
                  <button onClick={() => setActiveTask("release_aircraft")} className="w-full py-3.5 bg-[#C6FF00] text-black font-black rounded-xl hover:bg-[#a8db00] transition-colors shadow-[0_4px_15px_rgba(198,255,0,0.3)] text-[0.75rem] uppercase tracking-widest flex items-center justify-center gap-2">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                    Release Aircraft
                  </button>
                )}
                {isReleased && (
                  <div className="text-center text-[#00E676] font-bold text-[0.75rem] tracking-widest p-4 border border-dashed border-[#00E676]/50 rounded-xl bg-[#00E676]/5 flex items-center justify-center gap-2">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    COMPLETED SIGN-OFF
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 🌟 3. Defect Categories (Accordions) */}
      <div className="flex flex-col gap-3 pb-4">
        {[
          { title: "Open TL Entries", data: openEntries, color: "text-[#FF9100]", border: "border-[#FF9100]/30" },
          { title: "PADD", data: paddEntries, color: "text-white", border: "border-[#333]" },
          { title: "SADD", data: saddEntries, color: "text-white", border: "border-[#333]" },
          { title: "ADD - MEL/CDL", data: addEntries, color: "text-white", border: "border-[#333]" }
        ].map((cat, idx) => (
          <details key={idx} className="bg-[#1E1E1E] border border-[#333] rounded-xl p-1 group cursor-pointer" open={idx === 0}>
            <summary className={`font-bold ${cat.color} outline-none list-none flex justify-between items-center p-3 text-[0.75rem] uppercase tracking-widest`}>
              <span>{cat.title} ({cat.data.length})</span>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#8fa0a6] group-open:rotate-180 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </summary>
            
            <div className={`flex flex-col gap-2 p-3 border-t ${cat.border} bg-[#0a0a0a] rounded-b-lg mx-1 mb-1`}>
              {cat.data.length === 0 ? (
                <div className="text-[0.65rem] text-[#555] font-bold uppercase tracking-widest italic text-center py-2">No entries.</div>
              ) : (
                cat.data.map((e:any) => (
                  <button 
                    key={e.id} 
                    onClick={() => {setSelectedEntry(e.id); setActiveTask("view_entry");}} 
                    className="text-left text-[0.75rem] font-mono bg-[#1a1a1a] border border-[#333] p-3 rounded-lg text-[#e2e8f0] hover:border-[#00E676] hover:text-[#00E676] transition-colors truncate flex gap-3"
                  >
                    <span className="font-bold shrink-0">[{e.id}]</span>
                    <span className="truncate opacity-80">{e.description}</span>
                  </button>
                ))
              )}
            </div>
          </details>
        ))}
      </div>

    </div>
  );
}
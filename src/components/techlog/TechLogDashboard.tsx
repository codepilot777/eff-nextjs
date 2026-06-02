"use client";

export default function TechLogDashboard({ tlData, flightData, roleMode, activeTask, setActiveTask, selectedEntry, setSelectedEntry, showInFlightMenu, setShowInFlightMenu, updateTechLogData }: any) {
  const currFlt = flightData?.flight_no || "CPA 564";
  const dep = flightData?.dep_icao || "VHHH";
  const arr = flightData?.arr_icao || "RJBB";

  const {
    tl_prepared: isPrepared,
    tl_fuel_record_completed: isFuelDone,
    tl_accept: isAccepted,
    tl_flight_started: isStarted,
    tl_fluids: isFluids,
    tl_checks: isChecks,
    tl_defects: isDefects,
    tl_release: isReleased,
    tl_total_departure_fuel: totalDepFuel,
    tl_actual_uplift: actualUplift,
    defects = []
  } = tlData;

  const openEntries = defects.filter((d: any) => d.status === "OPEN");
  const paddEntries = defects.filter((d: any) => d.deferral_type === "PADD" || d.status === "DEFERRED" && d.deferral_type === "PADD");
  const saddEntries = defects.filter((d: any) => d.deferral_type === "SADD" || d.status === "DEFERRED" && d.deferral_type === "SADD");
  const addEntries = defects.filter((d: any) => d.deferral_type === "ADD" || d.status === "DEFERRED" && d.deferral_type === "ADD");

  const handleClearDefect = (id: string, actionDesc: string) => {
    const updated = defects.map((d: any) => d.id === id ? { ...d, status: "CLEARED", action_desc: actionDesc } : d);
    updateTechLogData({ defects: updated });
    setActiveTask(null);
  };

  const handleDeferDefect = (id: string, type: string, mel: string, reason: string) => {
    const updated = defects.map((d: any) => d.id === id ? { ...d, status: "DEFERRED", deferral_type: type, mel_ref: mel, deferral_reason: reason } : d);
    updateTechLogData({ defects: updated });
    setActiveTask(null);
  };

  return (
    <>
      {/* 👈 LEFT PANEL */}
      <div className="flex-[4] flex flex-col gap-4 overflow-y-auto pr-2">
        <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 shadow-lg">
          <h4 className="text-[#00bfa5] font-bold mb-3 border-b border-[#333333] pb-2">Servicing Summary</h4>
          <div className="text-sm mb-2"><span className="text-[#8fa0a6] font-bold">EDTO transit:</span> <span className={`font-bold ${isChecks ? 'text-[#00E676]' : 'text-[#FF9100]'}`}>{isChecks ? 'Completed' : 'Required'}</span></div>
          <div className="text-sm mb-2"><span className="text-[#8fa0a6] font-bold">Daily Check:</span> <span className="text-white font-bold">{isChecks ? '24h 00m remaining' : '0h 45m remaining'}</span></div>
          <div className="text-sm mb-4"><span className="text-[#8fa0a6] font-bold">Weekly Check:</span> <span className="text-white font-bold">{isChecks ? '7d 00m remaining' : '4d 12h remaining'}</span></div>
          
          {roleMode === "ENGINEER" && !isChecks && (
            <button onClick={() => setActiveTask("maint_check")} className="w-full py-2 bg-[#2a2a2a] border border-[#404040] text-white rounded font-bold hover:bg-[#404040] text-sm">🔧 Maintenance Check</button>
          )}
          <div className="mt-4 bg-[#1a1a1a] border border-[#FF9100] rounded p-2 text-xs text-[#e2e8f0]">
            <strong className="text-[#FF9100]">Notices to Crew:</strong><br/>
            ⚠️ [MSG 01] EXTRA POTABLE WATER UPLIFT REQUIRED.
          </div>
        </div>

        {(!isStarted || roleMode === "ENGINEER") && (
          <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 shadow-lg">
            <h4 className="text-[#00bfa5] font-bold mb-3 border-b border-[#333333] pb-2">Tasks</h4>
            {roleMode === "FLIGHT CREW" ? (
              !isPrepared ? (
                <button onClick={() => setActiveTask("prepare")} className="w-full py-3 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040]">Prepare flight</button>
              ) : !isFuelDone ? (
                <button onClick={() => setActiveTask("fuel_record")} className="w-full py-3 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040]">Fuel Record</button>
              ) : !isAccepted ? (
                <>
                  <button onClick={() => setActiveTask("acceptance")} className="w-full py-3 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040] mb-2">Commander's Acceptance</button>
                  <button onClick={() => { updateTechLogData({tl_prepared: false, tl_fuel_record_completed: false, tl_accept: false}); setActiveTask(null); }} className="w-full py-2 bg-[#FF1744]/10 border border-[#FF1744] text-[#FF1744] text-xs font-bold rounded">Cancel Prepared Flight</button>
                </>
              ) : (
                <div className="text-center text-status-green font-bold text-xs p-2 border border-dashed border-status-green rounded">AWAITING ENGINE START</div>
              )
            ) : (
              <>
                {!isFluids && <button onClick={() => setActiveTask("fluids_uplift")} className="w-full py-2 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040] mb-2">💧 Fluids Uplift</button>}
                {openEntries.length === 0 && !isDefects && <button onClick={() => updateTechLogData({tl_defects: true})} className="w-full py-2 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040] mb-2">✅ Sign Off Defects Log</button>}
                {isFluids && isChecks && isDefects && !isReleased && (
                  <button onClick={() => setActiveTask("release_aircraft")} className="w-full py-3 bg-[#00E676] text-black font-black rounded shadow-[0_4px_10px_rgba(0,230,118,0.4)]">✈️ Release Aircraft</button>
                )}
                {isReleased && <div className="text-center text-status-green text-xs font-bold p-2 border border-dashed border-status-green rounded">🔧 COMPLETED SIGN-OFF</div>}
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer" open>
            <summary className="font-bold text-[#00bfa5] outline-none">Open TL Entries ({openEntries.length})</summary>
            <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#333333]">
              {openEntries.length === 0 ? <div className="text-xs text-[#8fa0a6]">No open entries.</div> : openEntries.map((e:any) => (
                <button key={e.id} onClick={() => {setSelectedEntry(e.id); setActiveTask("view_entry");}} className="text-left text-xs bg-[#0a0a0a] border border-[#404040] p-2 rounded text-white hover:border-[#00bfa5] truncate">{`[${e.id}] ${e.description}`}</button>
              ))}
            </div>
          </details>
          <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer"><summary className="font-bold text-[#00bfa5] outline-none">PADD ({paddEntries.length})</summary></details>
          <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer"><summary className="font-bold text-[#00bfa5] outline-none">SADD ({saddEntries.length})</summary></details>
          <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer"><summary className="font-bold text-[#00bfa5] outline-none">ADD - MEL/CDL ({addEntries.length})</summary></details>
        </div>
      </div>

      {/* 👉 RIGHT PANEL */}
      <div className="flex-[6] bg-[#2a2a2a] border border-[#333333] rounded-xl p-6 shadow-lg overflow-y-auto relative">
        {isStarted && roleMode === "FLIGHT CREW" && (
          <div className="absolute top-6 right-6 z-50">
            <button onClick={() => setShowInFlightMenu(!showInFlightMenu)} className="bg-[#00E676]/15 border border-[#00E676] text-[#00E676] text-[0.65rem] font-black px-4 py-2.5 rounded hover:bg-[#00E676] hover:text-black transition-all shadow-lg tracking-widest uppercase flex items-center gap-2">
              <span>✈️ In-Flight Controls</span><span className="text-[0.5rem]">{showInFlightMenu ? "▲" : "▼"}</span>
            </button>
            {showInFlightMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                <button onClick={() => {setActiveTask("op_normal_close"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#00E676] text-xs font-bold hover:bg-[#2a2a2a] transition-colors">🏁 Normal Close Flight</button>
                <button onClick={() => {setActiveTask("op_diversion"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#FF9100] text-xs font-bold hover:bg-[#2a2a2a] transition-colors">🔀 Diversion</button>
                <button onClick={() => {setActiveTask("op_ground_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#FF1744] text-xs font-bold hover:bg-[#2a2a2a] transition-colors">🔙 Ground Return</button>
                <button onClick={() => {setActiveTask("op_air_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#FF1744] text-xs font-bold hover:bg-[#2a2a2a] transition-colors">🔄 Air Return</button>
                <button onClick={() => {setActiveTask("op_cancel_gate"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 text-white text-xs font-bold hover:bg-[#2a2a2a] transition-colors">🚪 Did Not Depart Gate</button>
              </div>
            )}
          </div>
        )}

        {!activeTask ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8fa0a6] italic">
            {isStarted && roleMode === "FLIGHT CREW" ? (
              <><span className="text-4xl mb-3">☝️</span>Use the top-right menu for in-flight operations.</>
            ) : (
              <><span className="text-4xl mb-3">👈</span>Select an action or log entry from the left dashboard.</>
            )}
          </div>
        ) : (
          <div className="animate-fade-in h-full flex flex-col">
            {/* 這裡包含所有 activeTask 表單，為節省空間已精簡排版 */}
            {activeTask === "op_normal_close" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3 pr-48">Normal Close Flight</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-[#8fa0a6] mb-1">Landing Time (UTC)</label><input id="arr_time" type="text" className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded text-white" /></div>
                  <div><label className="block text-xs text-[#8fa0a6] mb-1">Arrival FOB (Tons)</label><input id="arr_fuel" type="number" step="0.1" className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded text-white" /></div>
                </div>
                <button onClick={() => { updateTechLogData({ tl_flight_started: false, tl_flight_status: "ARRIVED", tl_accept: false, tl_prepared: false }); setActiveTask(null); }} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-4">SUBMIT SECTOR CLOSE</button>
              </div>
            )}
            
            {activeTask === "op_diversion" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-black text-[#FF9100] border-b border-[#333333] pb-3 pr-48">In-Flight Diversion</h3>
                <div><label className="block text-xs text-[#8fa0a6] mb-1">Alternate ICAO</label><input id="div_icao" type="text" className="w-full bg-[#1a1a1a] border border-[#00bfa5] p-3 rounded text-white font-bold uppercase" /></div>
                <button onClick={() => { updateTechLogData({ tl_flight_status: "DIVERTED", tl_flight_started: false }); setActiveTask(null); }} className="w-full py-4 bg-[#FF9100] text-black font-black rounded-lg mt-4">DECLARE DIVERSION</button>
              </div>
            )}

            {activeTask === "op_ground_return" && (
              <div className="flex flex-col gap-4"><h3 className="text-2xl font-black text-[#FF1744] border-b border-[#333333] pb-3 pr-48">Ground Return</h3><button onClick={() => { updateTechLogData({ tl_flight_started: false, tl_flight_status: "RETURNED", tl_accept: false }); setActiveTask(null); }} className="w-full py-4 bg-[#FF1744] text-white font-black rounded-lg">CONFIRM GROUND RETURN</button></div>
            )}

            {activeTask === "op_air_return" && (
              <div className="flex flex-col gap-4"><h3 className="text-2xl font-black text-[#FF1744] border-b border-[#333333] pb-3 pr-48">Air Return</h3><button onClick={() => { updateTechLogData({ tl_flight_started: false, tl_flight_status: "RETURNED" }); setActiveTask(null); }} className="w-full py-4 bg-[#FF1744] text-white font-black rounded-lg">DECLARE AIR RETURN</button></div>
            )}

            {activeTask === "op_cancel_gate" && (
              <div className="flex flex-col gap-4"><h3 className="text-2xl font-black text-white border-b border-[#333333] pb-3 pr-48">Did Not Depart</h3><button onClick={() => { updateTechLogData({ tl_flight_started: false, tl_accept: false, tl_flight_status: "SCHEDULED" }); setActiveTask(null); }} className="w-full py-4 bg-[#404040] text-white font-black rounded-lg">RESET STATE</button></div>
            )}

            {activeTask === "prepare" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3">Prepare flight</h3>
                <button onClick={() => {updateTechLogData({tl_prepared: true, tl_flight_status: "PREPARED"}); setActiveTask("fuel_record");}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">CONFIRM</button>
              </div>
            )}

            {activeTask === "fuel_record" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3">Fuel Record</h3>
                <div><label className="block text-xs text-[#8fa0a6] mb-1">Total Departure Fuel</label><input id="fr_tot" type="number" step="0.1" defaultValue={flightData?.final_fuel_request || 42.0} className="w-full bg-[#1a1a1a] p-3 rounded text-[#00bfa5] font-bold" /></div>
                <div><label className="block text-xs text-[#8fa0a6] mb-1">Actual Uplift</label><input id="fr_act" type="number" step="0.1" defaultValue={actualUplift || 0} className="w-full bg-[#1a1a1a] p-3 rounded text-white" /></div>
                <button onClick={() => {updateTechLogData({tl_fuel_record_completed: true, tl_total_departure_fuel: (document.getElementById('fr_tot') as HTMLInputElement).value, tl_actual_uplift: (document.getElementById('fr_act') as HTMLInputElement).value}); setActiveTask("acceptance");}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">CONFIRM FUEL RECORD</button>
              </div>
            )}

            {activeTask === "acceptance" && (
              <div className="flex flex-col h-full">
                <h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3 mb-6">Commander's Acceptance</h3>
                {!isReleased ? (
                   <div className="bg-[#FF1744]/15 border border-[#FF1744] p-4 rounded text-[#FF1744] font-bold">🛑 Aircraft not released.</div>
                ) : (
                   <div className="flex flex-col gap-4 mt-auto">
                     <label className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg border border-[#00bfa5] cursor-pointer">
                       <span className="font-bold text-white">Accept & Sign TechLog</span><input type="checkbox" id="chk_accept" className="w-6 h-6 accent-[#00bfa5]" />
                     </label>
                     <button onClick={() => { if((document.getElementById('chk_accept') as HTMLInputElement).checked) { updateTechLogData({tl_accept: true, tl_flight_started: true, tl_flight_status: "IN_FLIGHT"}); setActiveTask("info"); } }} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg">SIGN ACCEPTMENT</button>
                   </div>
                )}
              </div>
            )}

            {activeTask === "maint_check" && (
              <div className="flex flex-col gap-4"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3 mb-6">Maintenance Check</h3><button onClick={() => {updateTechLogData({tl_checks: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">CONFIRM SIGN-OFF</button></div>
            )}
            
            {activeTask === "fluids_uplift" && (
              <div className="flex flex-col h-full"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3">Fluids Uplift</h3><button onClick={() => {updateTechLogData({tl_fluids: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">CONFIRM FLUIDS RECORD</button></div>
            )}

            {activeTask === "release_aircraft" && (
              <div className="flex flex-col gap-4 h-full"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3">Release Aircraft</h3><button onClick={() => {updateTechLogData({tl_release: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">SIGN RELEASING STATEMENT</button></div>
            )}

            {activeTask === "view_entry" && selectedEntry && (
              defects.filter((d:any)=>d.id === selectedEntry).map((sel:any) => (
                <div key={sel.id} className="flex flex-col h-full">
                  <div className="flex justify-between items-start border-b border-[#333333] pb-3 mb-4"><h3 className="text-2xl font-black text-[#00E676] m-0">Defect: {sel.id}</h3></div>
                  <div className="flex-1 overflow-y-auto pr-2 text-sm text-[#e2e8f0] flex flex-col gap-3">
                    <div><strong className="text-[#8fa0a6]">Reported By:</strong> {sel.reported_by} &nbsp;|&nbsp; <strong className="text-[#8fa0a6]">Status:</strong> <span className="text-[#FF1744] font-bold">{sel.status}</span></div>
                    <div className="bg-[#0a0a0a] p-4 rounded border border-[#404040] font-mono mt-2">{sel.description}</div>
                    {roleMode === "ENGINEER" && (
                      <div className="mt-6 border-t border-dashed border-[#404040] pt-4">
                        <select id="eng_action_type" className="w-full bg-[#1a1a1a] p-2 rounded text-white mb-3" onChange={(e) => { document.getElementById('clear_div')!.style.display = e.target.value === 'Clear Defect' ? 'block' : 'none'; document.getElementById('defer_div')!.style.display = e.target.value === 'Defer Defect' ? 'block' : 'none'; }}>
                          <option value="">-- Select Disposition --</option><option value="Clear Defect">Clear Defect (Rectify)</option><option value="Defer Defect">Defer Defect (MEL Deferral)</option>
                        </select>
                        <div id="clear_div" style={{display:'none'}}><textarea id="val_clear_desc" className="w-full h-24 bg-[#1a1a1a] p-2 rounded text-white mb-2" /><button onClick={() => handleClearDefect(sel.id, (document.getElementById('val_clear_desc') as HTMLTextAreaElement).value)} className="w-full py-3 bg-[#00E676] text-black font-bold rounded">CLEAR DEFECT</button></div>
                        <div id="defer_div" style={{display:'none'}}>
                          <div className="grid grid-cols-2 gap-2 mb-2"><select id="val_def_type" className="w-full bg-[#1a1a1a] p-2 rounded text-white"><option>ADD</option><option>SADD</option><option>PADD</option></select><input id="val_def_mel" type="text" placeholder="MEL Ref" className="w-full bg-[#1a1a1a] p-2 rounded text-white" /></div>
                          <textarea id="val_def_reason" className="w-full h-16 bg-[#1a1a1a] p-2 rounded text-white mb-2" />
                          <button 
                            onClick={() => handleDeferDefect(
                              sel.id, 
                              (document.getElementById('val_def_type') as HTMLSelectElement).value, 
                              (document.getElementById('val_def_mel') as HTMLInputElement).value, // 🌟 補返呢行就過關！
                              (document.getElementById('val_def_reason') as HTMLTextAreaElement).value
                            )} 
                            className="w-full py-3 bg-[#FF9100] text-black font-bold rounded hover:bg-[#FFA000] transition-colors"
                          >
                            DEFER DEFECT
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {activeTask === "info" && (
              <div className="text-[#e2e8f0] text-sm leading-loose">
                <h3 className="text-2xl font-black text-[#00bfa5] border-b border-[#333333] pb-3 mb-6 pr-48">Flight Info</h3>
                <div><strong className="text-[#8fa0a6]">Flight Number:</strong> {currFlt}</div>
                <div><strong className="text-[#8fa0a6]">Route:</strong> {dep} ➔ {arr}</div>
                <div><strong className="text-[#8fa0a6]">Total Fuel Loaded:</strong> {totalDepFuel} T</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
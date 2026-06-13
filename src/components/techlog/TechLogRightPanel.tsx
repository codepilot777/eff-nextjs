"use client";
import { 
  TaskPrepareFlight, TaskFuelRecord, TaskAcceptance, 
  TaskNormalClose, TaskGroundReturn, TaskAirReturn, 
  TaskDiversion, TaskDidNotDepart 
} from "./forms";

export default function TechLogRightPanel({ tlData, flightData, roleMode, activeTask, setActiveTask, selectedEntry, showInFlightMenu, setShowInFlightMenu, updateTechLogData, defects }: any) {
  
  const { tl_flight_started: isStarted, tl_total_departure_fuel: totalDepFuel } = tlData;

  // Engineer 處理 Defects 嘅邏輯
  const handleClearDefect = (id: string, actionDesc: string) => {
    updateTechLogData({ defects: defects.map((d: any) => d.id === id ? { ...d, status: "CLEARED", action_desc: actionDesc } : d) });
    setActiveTask(null);
  };

  const handleDeferDefect = (id: string, type: string, mel: string, reason: string) => {
    const numMatch = id.match(/\d+/);
    const num = numMatch ? numMatch[0] : Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const prefix = type === "PADD" ? "P" : type === "SADD" ? "S" : "A";
    const newId = `${prefix}${num}`;

    updateTechLogData({ 
      defects: defects.map((d: any) => d.id === id ? { 
        ...d, 
        id: newId, 
        status: "DEFERRED", 
        deferral_type: type, 
        mel_ref: mel, 
        deferral_reason: reason 
      } : d) 
    });
    setActiveTask(null);
  };

  return (
    <div className="flex-[6] bg-[#1E1E1E] border border-[#333] rounded-2xl p-7 shadow-lg overflow-y-auto relative font-sans scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
      
      {/* ✈️ 右上角 In-Flight Dropdown */}
      {isStarted && roleMode === "FLIGHT CREW" && (
        <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={() => setShowInFlightMenu(!showInFlightMenu)} 
            className="bg-[#00E676]/10 border border-[#00E676]/50 text-[#00E676] text-[0.65rem] font-bold px-4 py-2.5 rounded-xl hover:bg-[#00E676] hover:text-black transition-all shadow-lg tracking-widest uppercase flex items-center gap-2 outline-none"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            <span>In-Flight Controls</span>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${showInFlightMenu ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          
          {showInFlightMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-fade-in p-1 z-50">
              <button onClick={() => {setActiveTask("op_normal_close"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#00E676] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#00E676]/10 rounded-lg flex items-center gap-3 transition-colors">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Normal Close Flight
              </button>
              <div className="h-px bg-[#333] my-1 mx-2"></div>
              <button onClick={() => {setActiveTask("op_diversion"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#FF9100] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#FF9100]/10 rounded-lg flex items-center gap-3 transition-colors">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                Diversion
              </button>
              <div className="h-px bg-[#333] my-1 mx-2"></div>
              <button onClick={() => {setActiveTask("op_ground_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#FF1744] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#FF1744]/10 rounded-lg flex items-center gap-3 transition-colors">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                Ground Return
              </button>
              <button onClick={() => {setActiveTask("op_air_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#FF1744] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#FF1744]/10 rounded-lg flex items-center gap-3 transition-colors mt-1">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                Air Return
              </button>
              <div className="h-px bg-[#333] my-1 mx-2"></div>
              <button onClick={() => {setActiveTask("op_cancel_gate"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#8fa0a6] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#252525] hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Did Not Depart Gate
              </button>
            </div>
          )}
        </div>
      )}

      {/* 👈 無選擇任何 Task 的空狀態 */}
      {!activeTask ? (
        <div className="h-full flex flex-col items-center justify-center text-[#555] select-none">
          {isStarted && roleMode === "FLIGHT CREW" ? (
            <>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mb-6 text-[#333] animate-pulse"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" /></svg>
              <span className="text-[0.8rem] font-bold tracking-widest uppercase text-[#555]">Use Top-Right Menu For In-Flight Operations</span>
            </>
          ) : (
            <>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mb-6 text-[#333] animate-pulse"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" /></svg>
              <span className="text-[0.8rem] font-bold tracking-widest uppercase text-[#555]">Select An Action From The Left Dashboard</span>
            </>
          )}
        </div>
      ) : (
        <div className="animate-fade-in h-full flex flex-col">
          
          {/* 🌟 Flight Crew: 8 大模組化表單 */}
          {activeTask === "prepare" && <TaskPrepareFlight flightData={flightData} tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "fuel_record" && <TaskFuelRecord flightData={flightData} tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "acceptance" && <TaskAcceptance tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_normal_close" && <TaskNormalClose tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_ground_return" && <TaskGroundReturn tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_air_return" && <TaskAirReturn tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_diversion" && <TaskDiversion tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_cancel_gate" && <TaskDidNotDepart tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}

          {/* 🔧 Engineer 表單 (UI 升級版) */}
          {activeTask === "maint_check" && (
            <div className="flex flex-col gap-4 h-full">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M15.17 11.42a4.5 4.5 0 11-6.34-6.34 4.5 4.5 0 016.34 6.34zM10 14H6l-3 3v3h3l3-3v-4z" /></svg>
                Maintenance Check
              </h3>
              <button onClick={() => {updateTechLogData({tl_checks: true}); setActiveTask(null);}} className="w-full py-4.5 bg-[#00E676] text-black text-[0.8rem] uppercase tracking-widest font-black rounded-xl mt-auto shadow-[0_4px_15px_rgba(0,230,118,0.3)] hover:bg-[#00c263] transition-colors">
                CONFIRM SIGN-OFF
              </button>
            </div>
          )}
          
          {activeTask === "fluids_uplift" && (
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" /></svg>
                Fluids Uplift
              </h3>
              <button onClick={() => {updateTechLogData({tl_fluids: true}); setActiveTask(null);}} className="w-full py-4.5 bg-[#00E676] text-black text-[0.8rem] uppercase tracking-widest font-black rounded-xl mt-auto shadow-[0_4px_15px_rgba(0,230,118,0.3)] hover:bg-[#00c263] transition-colors">
                CONFIRM FLUIDS RECORD
              </button>
            </div>
          )}
          
          {activeTask === "release_aircraft" && (
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                Release Aircraft
              </h3>
              <button onClick={() => {updateTechLogData({tl_release: true}); setActiveTask(null);}} className="w-full py-4.5 bg-[#00E676] text-black text-[0.8rem] uppercase tracking-widest font-black rounded-xl mt-auto shadow-[0_4px_15px_rgba(0,230,118,0.3)] hover:bg-[#00c263] transition-colors">
                SIGN RELEASING STATEMENT
              </button>
            </div>
          )}

          {/* 📋 查看/處理 Defects 詳情 */}
          {activeTask === "view_entry" && selectedEntry && (
            defects.filter((d:any)=>d.id === selectedEntry).map((sel:any) => (
              <div key={sel.id} className="flex flex-col h-full">
                <div className="flex justify-between items-center border-b border-[#333] pb-4 mb-5">
                  <h3 className="text-xl font-bold uppercase tracking-widest font-mono text-white flex items-center gap-3">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#FF9100]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    DEFECT: {sel.id}
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 text-sm text-[#e2e8f0] flex flex-col gap-4 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
                  
                  <div className="flex gap-4 text-[0.65rem] uppercase tracking-widest font-bold">
                    <div className="bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2">
                      <span className="text-[#8fa0a6] mr-2">Reported By:</span>
                      <span className="text-white">{sel.reported_by}</span>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2">
                      <span className="text-[#8fa0a6] mr-2">Status:</span>
                      <span className={`${sel.status === 'OPEN' ? 'text-[#FF1744]' : 'text-[#FF9100]'}`}>{sel.status}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] font-mono text-[0.75rem] leading-relaxed shadow-inner">
                    {sel.description}
                  </div>

                  {roleMode === "ENGINEER" && (
                    <div className="mt-6 border-t border-[#333] pt-6 flex flex-col gap-4">
                      <h4 className="text-[0.65rem] uppercase tracking-widest font-bold text-[#8fa0a6] mb-1">Engineer Action</h4>
                      
                      <select id="eng_action_type" className="w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl text-white text-[0.75rem] font-bold tracking-widest uppercase outline-none focus:border-[#00E676] transition-colors appearance-none" onChange={(e) => { document.getElementById('clear_div')!.style.display = e.target.value === 'Clear Defect' ? 'block' : 'none'; document.getElementById('defer_div')!.style.display = e.target.value === 'Defer Defect' ? 'block' : 'none'; }}>
                        <option value="">-- Select Disposition --</option>
                        <option value="Clear Defect">Clear Defect (Rectify)</option>
                        <option value="Defer Defect">Defer Defect (MEL Deferral)</option>
                      </select>
                      
                      <div id="clear_div" style={{display:'none'}} className="animate-fade-in">
                        <textarea id="val_clear_desc" placeholder="Enter Rectification Action..." className="w-full h-28 bg-[#0a0a0a] border border-[#444] p-4 rounded-xl text-white font-mono text-[0.75rem] outline-none focus:border-[#00E676] transition-colors mb-4 resize-none" />
                        <button onClick={() => handleClearDefect(sel.id, (document.getElementById('val_clear_desc') as HTMLTextAreaElement).value)} className="w-full py-4 bg-[#00E676] text-black text-[0.75rem] uppercase tracking-widest font-black rounded-xl hover:bg-[#00c263] transition-colors shadow-lg">
                          CLEAR DEFECT
                        </button>
                      </div>
                      
                      <div id="defer_div" style={{display:'none'}} className="animate-fade-in">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <select id="val_def_type" className="w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl text-white text-[0.75rem] font-bold tracking-widest uppercase outline-none focus:border-[#FF9100] transition-colors appearance-none">
                            <option>ADD</option><option>SADD</option><option>PADD</option>
                          </select>
                          <input id="val_def_mel" type="text" placeholder="MEL Ref (e.g. 32-10-01)" className="w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl text-white text-[0.75rem] font-mono outline-none focus:border-[#FF9100] transition-colors uppercase" />
                        </div>
                        <textarea id="val_def_reason" placeholder="Deferral Reason..." className="w-full h-24 bg-[#0a0a0a] border border-[#444] p-4 rounded-xl text-white font-mono text-[0.75rem] outline-none focus:border-[#FF9100] transition-colors mb-4 resize-none" />
                        <button onClick={() => handleDeferDefect(sel.id, (document.getElementById('val_def_type') as HTMLSelectElement).value, (document.getElementById('val_def_mel') as HTMLInputElement).value, (document.getElementById('val_def_reason') as HTMLTextAreaElement).value)} className="w-full py-4 bg-[#FF9100] text-black text-[0.75rem] uppercase tracking-widest font-black rounded-xl hover:bg-[#e68a00] transition-colors shadow-lg">
                          DEFER DEFECT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

        </div>
      )}
    </div>
  );
}
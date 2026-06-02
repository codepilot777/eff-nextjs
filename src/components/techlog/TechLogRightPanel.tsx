"use client";

import { TaskPrepareFlight, TaskFuelRecord, TaskAcceptance, TaskNormalClose, TaskGroundReturn, TaskAirReturn, TaskDiversion, TaskDidNotDepart } from "./TechLogForms";

export default function TechLogRightPanel({ tlData, flightData, roleMode, activeTask, setActiveTask, selectedEntry, showInFlightMenu, setShowInFlightMenu, updateTechLogData, defects }: any) {
  
  const { tl_flight_started: isStarted, tl_total_departure_fuel: totalDepFuel } = tlData;

  const handleClearDefect = (id: string, actionDesc: string) => {
    updateTechLogData({ defects: defects.map((d: any) => d.id === id ? { ...d, status: "CLEARED", action_desc: actionDesc } : d) });
    setActiveTask(null);
  };

  const handleDeferDefect = (id: string, type: string, mel: string, reason: string) => {
    updateTechLogData({ defects: defects.map((d: any) => d.id === id ? { ...d, status: "DEFERRED", deferral_type: type, mel_ref: mel, deferral_reason: reason } : d) });
    setActiveTask(null);
  };

  return (
    <div className="flex-[6] bg-[#2a2a2a] border border-[#333333] rounded-xl p-6 shadow-lg overflow-y-auto relative">
      {/* 右上角 In-Flight Dropdown */}
      {isStarted && roleMode === "FLIGHT CREW" && (
        <div className="absolute top-6 right-6 z-50">
          <button onClick={() => setShowInFlightMenu(!showInFlightMenu)} className="bg-[#00E676]/15 border border-[#00E676] text-[#00E676] text-[0.65rem] font-black px-4 py-2.5 rounded hover:bg-[#00E676] hover:text-black transition-all shadow-lg tracking-widest uppercase flex items-center gap-2">
            <span>✈️ In-Flight Controls</span><span className="text-[0.5rem]">{showInFlightMenu ? "▲" : "▼"}</span>
          </button>
          {showInFlightMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
              <button onClick={() => {setActiveTask("op_normal_close"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#00E676] text-xs font-bold hover:bg-[#2a2a2a]">🏁 Normal Close Flight</button>
              <button onClick={() => {setActiveTask("op_diversion"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#FF9100] text-xs font-bold hover:bg-[#2a2a2a]">🔀 Diversion</button>
              <button onClick={() => {setActiveTask("op_ground_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#FF1744] text-xs font-bold hover:bg-[#2a2a2a]">🔙 Ground Return</button>
              <button onClick={() => {setActiveTask("op_air_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 border-b border-[#333333] text-[#FF1744] text-xs font-bold hover:bg-[#2a2a2a]">🔄 Air Return</button>
              <button onClick={() => {setActiveTask("op_cancel_gate"); setShowInFlightMenu(false);}} className="text-left px-4 py-3 text-white text-xs font-bold hover:bg-[#2a2a2a]">🚪 Did Not Depart Gate</button>
            </div>
          )}
        </div>
      )}

      {/* 無選擇任何 Task 的空狀態 */}
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
          
          {/* 🌟 抽離出來的大型模組化表單 */}
          {activeTask === "prepare" && <TaskPrepareFlight flightData={flightData} tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "fuel_record" && <TaskFuelRecord flightData={flightData} tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "acceptance" && <TaskAcceptance tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_normal_close" && <TaskNormalClose tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}

          {/* 小型 Operations 表單 (因為短，直接保留) */}
          {activeTask === "op_diversion" && <TaskDiversion tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_ground_return" && <TaskGroundReturn tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_air_return" && <TaskAirReturn tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_cancel_gate" && <TaskDidNotDepart tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}

          {/* Engineer 表單 */}
          {activeTask === "maint_check" && (
            <div className="flex flex-col gap-4"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3 mb-6">Maintenance Check</h3><button onClick={() => {updateTechLogData({tl_checks: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">CONFIRM SIGN-OFF</button></div>
          )}
          {activeTask === "fluids_uplift" && (
            <div className="flex flex-col h-full"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3">Fluids Uplift</h3><button onClick={() => {updateTechLogData({tl_fluids: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">CONFIRM FLUIDS RECORD</button></div>
          )}
          {activeTask === "release_aircraft" && (
            <div className="flex flex-col gap-4 h-full"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3">Release Aircraft</h3><button onClick={() => {updateTechLogData({tl_release: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-auto">SIGN RELEASING STATEMENT</button></div>
          )}

          {/* 查看/處理 Defects 詳情 */}
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
                        <button onClick={() => handleDeferDefect(sel.id, (document.getElementById('val_def_type') as HTMLSelectElement).value, (document.getElementById('val_def_mel') as HTMLInputElement).value, (document.getElementById('val_def_reason') as HTMLTextAreaElement).value)} className="w-full py-3 bg-[#FF9100] text-black font-bold rounded">DEFER DEFECT</button>
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
              <div><strong className="text-[#8fa0a6]">Flight Number:</strong> {flightData?.flight_no || 'CPA 564'}</div>
              <div><strong className="text-[#8fa0a6]">Route:</strong> {tlData?.tl_prep_dep || flightData?.dep_icao} ➔ {tlData?.tl_prep_arr || flightData?.arr_icao}</div>
              <div><strong className="text-[#8fa0a6]">Total Fuel Loaded:</strong> {totalDepFuel || 0} T</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
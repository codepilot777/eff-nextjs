"use client";

import { useState } from "react";

export default function TechLog({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  // ==========================================
  // 1. 本地 UI 導航與模式狀態
  // ==========================================
  const [roleMode, setRoleMode] = useState<"FLIGHT CREW" | "ENGINEER">("FLIGHT CREW");
  const [activeNav, setActiveNav] = useState<"dashboard" | "history" | "reporting">("dashboard");
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [selectedHist, setSelectedHist] = useState<number | null>(1);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // 表單暫存狀態
  const [repCat, setRepCat] = useState("General / Unknown");
  const [repSummary, setRepSummary] = useState("");
  const [repDesc, setRepDesc] = useState("");
  
  // ==========================================
  // 2. 飛機狀態與資料庫提取
  // ==========================================
  const reg = flightData?.aircraft_reg || "B-HNQ";
  const isPrepared = flightData?.tl_prepared || false;
  const isFuelDone = flightData?.tl_fuel_record_completed || false;
  const isAccepted = flightData?.tl_accept || false;
  const isStarted = flightData?.tl_flight_started || false;
  
  const isReleased = flightData?.tl_release || false;
  const isFluids = flightData?.tl_fluids || false;
  const isChecks = flightData?.tl_checks || false;
  const isDefects = flightData?.tl_defects || false;

  const prevDep = flightData?.prev_dep_icao || "SIN";
  const dep = flightData?.dep_icao || "VHHH";
  const arr = flightData?.arr_icao || "RJBB";
  const prevFlt = flightData?.prev_flight_no || "CPA 563";
  const currFlt = flightData?.flight_no || "CPA 564";
  const prevFob = flightData?.prev_fob || "5.0";

  const defects = flightData?.defects || [];
  const openEntries = defects.filter((d: any) => d.status === "OPEN");
  const paddEntries = defects.filter((d: any) => d.deferral_type === "PADD");
  const saddEntries = defects.filter((d: any) => d.deferral_type === "SADD");
  const addEntries = defects.filter((d: any) => d.deferral_type === "ADD");

  // 模擬歷史紀錄 (對應 database.py 的 dummy data)
  const historyRecords = [
    { id: 1, date: "20-MAY-2026", flt: "CX881", route: "LAX ➔ HKG", cmdr: "HO W S", fuelArr: "10.5", fuelUp: "85.0", checks: ["Transit Check"], serv: ["Toilet serviced"], def: [{sys: "CABIN", desc: "Toilet F INOP.", status: "OPEN"}] },
    { id: 2, date: "21-MAY-2026", flt: "CX880", route: "HKG ➔ LAX", cmdr: "HO W S", fuelArr: "13.0", fuelUp: "95.0", checks: ["Weekly Check"], serv: ["Hydraulic C +0.5 Qts"], def: [] },
    { id: 3, date: "22-MAY-2026", flt: "CX714", route: "SIN ➔ HKG", cmdr: "LEE C K", fuelArr: "6.8", fuelUp: "25.0", checks: ["Transit Check"], serv: [], def: [] },
  ];

  // ==========================================
  // 3. Helper Functions
  // ==========================================
  const StatusPill = ({ label, isOk }: { label: string, isOk: boolean }) => (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-bold ${isOk ? 'text-[#00E676]' : 'text-[#FF9100]'}`}>
        {isOk ? '✅ ' : ''}{label}
      </span>
    </div>
  );

  const handleClearDefect = (id: string, actionDesc: string) => {
    const updated = defects.map((d: any) => d.id === id ? { ...d, status: "CLEARED", action_desc: actionDesc } : d);
    updateFlightData({ defects: updated });
    setActiveTask(null);
  };

  const handleDeferDefect = (id: string, type: string, mel: string, reason: string) => {
    const updated = defects.map((d: any) => d.id === id ? { ...d, status: "DEFERRED", deferral_type: type, mel_ref: mel, deferral_reason: reason } : d);
    updateFlightData({ defects: updated });
    setActiveTask(null);
  };

  const handleSubmitReport = () => {
    if (!repSummary || !repDesc) return alert("Summary and Description required.");
    const newDefect = {
      id: `TL-${Math.floor(1000 + Math.random() * 9000)}`,
      ata: repCat.split(" ")[1] || "00",
      description: `[${repCat}] ${repSummary} - ${repDesc}`,
      status: "OPEN",
      time: new Date().toISOString().substring(11, 16) + "Z",
      reported_by: roleMode
    };
    updateFlightData({ defects: [...defects, newDefect], tl_defects: false });
    setRepSummary(""); setRepDesc(""); setActiveNav("dashboard");
    alert("Defect reported successfully.");
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#080a0d] animate-fade-in">
      
      {/* ========================================== */}
      {/* 🚀 TOP BAR (專屬 eTechLog Header)          */}
      {/* ========================================== */}
      <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-4 mb-4 border-t-4 border-t-[#00E676] shrink-0 shadow-lg relative">
        {/* 角色切換開關 (浮動在右上角) */}
        <div className="absolute top-4 right-4">
          <select 
            value={roleMode} 
            onChange={(e) => { setRoleMode(e.target.value as any); setActiveTask(null); }}
            className="bg-[#1a222a] border border-[#34495e] text-[#00bfa5] text-xs font-bold rounded px-2 py-1 outline-none cursor-pointer"
          >
            <option value="FLIGHT CREW">👨‍✈️ FLIGHT CREW MODE</option>
            <option value="ENGINEER">🔧 ENGINEER MODE</option>
          </select>
        </div>

        <div className="flex justify-between items-center mb-4 pr-40">
          <div className="flex-1">
            <div className="text-3xl font-black text-[#00bfa5] tracking-widest">{reg}</div>
            <div className="text-xs text-[#8fa0a6] font-bold tracking-widest mt-1">{roleMode} MODE</div>
          </div>
          
          <div className="flex-[2] text-center flex flex-col items-center">
            <div className="text-2xl font-black text-white">{isPrepared ? currFlt : prevFlt}</div>
            <div className="text-sm font-bold text-[#e2e8f0] mt-1 bg-[#1a222a] px-4 py-1 rounded border border-[#34495e]">
              {isPrepared ? `${dep} ➔ ${arr}` : `${prevDep} ➔ ${dep}`}
            </div>
            <div className="text-xs text-[#FF9100] font-bold mt-2">PREV FOB: {prevFob} T</div>
          </div>
          
          <div className="flex-1"></div>
        </div>

        {isStarted && roleMode === "FLIGHT CREW" ? (
          <div className="text-center pt-3 border-t border-dashed border-[#242f3d] text-[#00E676] font-black tracking-widest">
            ✈️ FLIGHT STARTED ➔ ENABLE AIRPLANE MODE
          </div>
        ) : (
          <div className="flex justify-around border-t border-dashed border-[#242f3d] pt-3">
            <StatusPill label="Fluids" isOk={isFluids} />
            <StatusPill label="Checks" isOk={isChecks} />
            <StatusPill label="Defects" isOk={isDefects} />
            <StatusPill label="Release" isOk={isReleased} />
            {roleMode === "FLIGHT CREW" && <StatusPill label="Acceptance" isOk={isAccepted} />}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🚀 MAIN CONTENT AREA (根據 Bottom Bar 切換)*/}
      {/* ========================================== */}
      <div className="flex-1 overflow-hidden flex gap-4 pb-2">
        
        {/* ------------------------------------- */}
        {/* 📊 DASHBOARD NAV                      */}
        {/* ------------------------------------- */}
        {activeNav === "dashboard" && (
          <>
            {/* 左欄：Tasks & Lists */}
            <div className="flex-[4] flex flex-col gap-4 overflow-y-auto pr-2">
              <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-4 shadow">
                <h4 className="text-[#00bfa5] font-bold mb-3 border-b border-[#242f3d] pb-2">Servicing Summary</h4>
                <div className="text-sm mb-2"><span className="text-[#8fa0a6] font-bold">EDTO transit:</span> <span className={`font-bold ${isChecks ? 'text-[#00E676]' : 'text-[#FF9100]'}`}>{isChecks ? 'Completed' : 'Required'}</span></div>
                <div className="text-sm mb-2"><span className="text-[#8fa0a6] font-bold">Daily Check:</span> <span className="text-white font-bold">{isChecks ? '24h 00m remaining' : '0h 45m remaining'}</span></div>
                <div className="text-sm mb-4"><span className="text-[#8fa0a6] font-bold">Weekly Check:</span> <span className="text-white font-bold">{isChecks ? '7d 00m remaining' : '4d 12h remaining'}</span></div>
                
                {roleMode === "ENGINEER" && !isChecks && (
                  <button onClick={() => setActiveTask("maint_check")} className="w-full py-2 bg-[#17202a] border border-[#34495e] text-white rounded font-bold hover:bg-[#34495e] text-sm">🔧 Maintenance Check</button>
                )}

                <div className="mt-4 bg-[#1a222a] border border-[#FF9100] rounded p-2 text-xs text-[#e2e8f0]">
                  <strong className="text-[#FF9100]">Notices to Crew:</strong><br/>
                  ⚠️ [MSG 01] EXTRA POTABLE WATER UPLIFT REQUIRED.
                </div>
              </div>

              <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-4 shadow">
                <h4 className="text-[#00bfa5] font-bold mb-3 border-b border-[#242f3d] pb-2">Tasks</h4>
                
                {roleMode === "FLIGHT CREW" ? (
                  isStarted ? (
                    <button onClick={() => setActiveTask("info")} className="w-full py-3 bg-[#00bfa5] text-black font-black rounded shadow-[0_4px_10px_rgba(0,191,165,0.3)]">{currFlt} {dep} ➔ {arr}</button>
                  ) : !isPrepared ? (
                    <button onClick={() => setActiveTask("prepare")} className="w-full py-3 bg-[#17202a] border border-[#34495e] text-white font-bold rounded hover:bg-[#34495e]">Prepare flight</button>
                  ) : !isFuelDone ? (
                    <button onClick={() => setActiveTask("fuel_record")} className="w-full py-3 bg-[#17202a] border border-[#34495e] text-white font-bold rounded hover:bg-[#34495e]">Fuel Record</button>
                  ) : (
                    <>
                      <button onClick={() => setActiveTask("acceptance")} className="w-full py-3 bg-[#17202a] border border-[#34495e] text-white font-bold rounded hover:bg-[#34495e] mb-2">Commander's Acceptance</button>
                      <button onClick={() => { updateFlightData({tl_prepared: false, tl_fuel_record_completed: false, tl_accept: false}); setActiveTask(null); }} className="w-full py-2 bg-[#FF1744]/10 border border-[#FF1744] text-[#FF1744] text-xs font-bold rounded">Cancel Prepared Flight</button>
                    </>
                  )
                ) : (
                  <>
                    {!isFluids && <button onClick={() => setActiveTask("fluids_uplift")} className="w-full py-2 bg-[#17202a] border border-[#34495e] text-white font-bold rounded hover:bg-[#34495e] mb-2">💧 Fluids Uplift</button>}
                    {openEntries.length === 0 && !isDefects && <button onClick={() => updateFlightData({tl_defects: true})} className="w-full py-2 bg-[#17202a] border border-[#34495e] text-white font-bold rounded hover:bg-[#34495e] mb-2">✅ Sign Off Defects Log</button>}
                    {isFluids && isChecks && isDefects && !isReleased && (
                      <button onClick={() => setActiveTask("release_aircraft")} className="w-full py-3 bg-[#00E676] text-black font-black rounded shadow-[0_4px_10px_rgba(0,230,118,0.4)]">✈️ Release Aircraft</button>
                    )}
                  </>
                )}
              </div>

              {/* Defects Lists */}
              <div className="flex flex-col gap-2">
                <details className="bg-[#11161d] border border-[#242f3d] rounded-lg p-3 group cursor-pointer" open>
                  <summary className="font-bold text-[#00bfa5] outline-none">Open TL Entries ({openEntries.length})</summary>
                  <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#242f3d]">
                    {openEntries.length === 0 ? <div className="text-xs text-[#8fa0a6]">No open entries.</div> : openEntries.map((e:any) => (
                      <button key={e.id} onClick={() => {setSelectedEntry(e.id); setActiveTask("view_entry");}} className="text-left text-xs bg-[#0a0a0a] border border-[#34495e] p-2 rounded text-white hover:border-[#00bfa5] truncate">{`[${e.id}] ${e.description}`}</button>
                    ))}
                  </div>
                </details>
                <details className="bg-[#11161d] border border-[#242f3d] rounded-lg p-3 group cursor-pointer">
                  <summary className="font-bold text-[#00bfa5] outline-none">PADD ({paddEntries.length})</summary>
                </details>
                <details className="bg-[#11161d] border border-[#242f3d] rounded-lg p-3 group cursor-pointer">
                  <summary className="font-bold text-[#00bfa5] outline-none">SADD ({saddEntries.length})</summary>
                </details>
                <details className="bg-[#11161d] border border-[#242f3d] rounded-lg p-3 group cursor-pointer">
                  <summary className="font-bold text-[#00bfa5] outline-none">ADD - MEL/CDL ({addEntries.length})</summary>
                </details>
              </div>
            </div>

            {/* 右欄：動態 Task 面板 */}
            <div className="flex-[6] bg-[#11161d] border border-[#242f3d] rounded-xl p-6 shadow-lg overflow-y-auto">
              {!activeTask ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8fa0a6] italic">
                  <span className="text-4xl mb-3">👈</span>
                  Select a task or entry from the left menu.
                </div>
              ) : (
                <div className="animate-fade-in h-full flex flex-col">
                  
                  {activeTask === "prepare" && (
                    <>
                      <h3 className="text-2xl font-black text-[#00E676] border-b border-[#242f3d] pb-3 mb-6">Prepare flight</h3>
                      <div className="flex flex-col gap-4">
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Flight Number</label><input type="text" disabled value={currFlt} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-[#8fa0a6]" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Origin Station</label><input type="text" disabled value={dep} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-[#8fa0a6]" /></div>
                          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Destination</label><input type="text" disabled value={arr} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-[#8fa0a6]" /></div>
                        </div>
                        <div>
                          <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Flight Type</label>
                          <select className="w-full bg-[#080a0d] border border-[#34495e] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]"><option>Revenue</option><option>Non-Revenue</option><option>Ferry</option></select>
                        </div>
                        <hr className="border-[#242f3d] my-2"/>
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander</label><input type="text" disabled value={flightData?.captain || 'PILOT'} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-[#8fa0a6] uppercase" /></div>
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" placeholder="Enter your ID" className="w-full bg-[#080a0d] border border-[#34495e] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
                        <div className="mt-auto pt-4"><button onClick={() => {updateFlightData({tl_prepared: true}); setActiveTask("fuel_record");}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg hover:bg-[#00c853]">CONFIRM</button></div>
                      </div>
                    </>
                  )}

                  {activeTask === "fuel_record" && (
                    <>
                      <h3 className="text-2xl font-black text-[#00E676] border-b border-[#242f3d] pb-3 mb-6">Fuel Record</h3>
                      <div className="flex flex-col gap-4">
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">TOTAL DEPARTURE FUEL T</label><input id="fr_tot" type="number" step="0.1" defaultValue={flightData?.final_fuel_request || 42.0} className="w-full bg-[#080a0d] border border-[#00bfa5] p-3 rounded font-bold text-[#00bfa5] text-lg outline-none" /></div>
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Fuel on board before uplift</label><input type="text" disabled value={prevFob} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-[#8fa0a6]" /></div>
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Expected uplift</label><input type="text" disabled value={Math.max(0, (flightData?.final_fuel_request || 42.0) - parseFloat(prevFob)).toFixed(1)} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-[#8fa0a6]" /></div>
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Actual uplift T</label><input id="fr_act" type="number" step="0.1" defaultValue={flightData?.actual_uplift || 0} className="w-full bg-[#080a0d] border border-[#FF9100] p-3 rounded font-bold text-white outline-none" /></div>
                        <label className="flex items-center gap-3 bg-[#1a222a] p-3 rounded border border-[#34495e] mt-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-[#00bfa5]" /><span className="text-sm font-bold text-white">Confirm "Refueling Station Door Cycling Procedure" performed</span></label>
                        <div className="mt-auto pt-4"><button onClick={() => {updateFlightData({tl_fuel_record_completed: true, tl_total_departure_fuel: (document.getElementById('fr_tot') as HTMLInputElement).value, tl_actual_uplift: (document.getElementById('fr_act') as HTMLInputElement).value}); setActiveTask("acceptance");}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg hover:bg-[#00c853]">CONFIRM</button></div>
                      </div>
                    </>
                  )}

                  {activeTask === "acceptance" && (
                    <>
                      <h3 className="text-2xl font-black text-[#00E676] border-b border-[#242f3d] pb-3 mb-6">Commander's Acceptance</h3>
                      <h5 className="text-[#8fa0a6] text-sm font-bold mb-2">Servicing History (Since Last Sector Closed)</h5>
                      <div className="bg-[#0a0a0a] border border-[#34495e] rounded p-4 text-sm text-[#e2e8f0] mb-6 leading-relaxed">
                        ✅ Routine Transit Check completed.<br/>✅ Flight Deck prepared.
                      </div>
                      
                      <h5 className="text-[#8fa0a6] text-sm font-bold mb-2">Latest Fuel Record</h5>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div><label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1">Total Departure Fuel</label><input type="text" disabled value={`${flightData?.tl_total_departure_fuel || 0} T`} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-white" /></div>
                        <div><label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1">Actual Uplift</label><input type="text" disabled value={`${flightData?.tl_actual_uplift || 0} T`} className="w-full bg-[#0a0a0a] border border-[#34495e] p-3 rounded font-bold text-white" /></div>
                      </div>
                      
                      <hr className="border-[#242f3d] mb-6"/>
                      
                      {!isReleased ? (
                         <div className="bg-[#FF1744]/15 border border-[#FF1744] p-4 rounded text-center text-[#FF1744] font-bold">🛑 Aircraft has not been released by Engineering yet. Acceptance is disabled.</div>
                      ) : (
                         <div className="flex flex-col gap-4 mt-auto">
                           <label className="flex items-center justify-between bg-[#1a222a] p-4 rounded-lg border border-[#00bfa5] cursor-pointer">
                             <span className="font-bold text-white text-lg">Accept aircraft</span>
                             <input type="checkbox" id="chk_accept" className="w-6 h-6 accent-[#00bfa5]" />
                           </label>
                           <button onClick={() => {
                             if((document.getElementById('chk_accept') as HTMLInputElement).checked) {
                               updateFlightData({tl_accept: true, tl_flight_started: true}); setActiveTask("info");
                             } else alert("Please check 'Accept aircraft' to proceed.");
                           }} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg hover:bg-[#00c853]">CONFIRM</button>
                         </div>
                      )}
                    </>
                  )}

                  {/* 工程師 Tasks */}
                  {activeTask === "maint_check" && (
                    <>
                      <h3 className="text-2xl font-black text-[#00E676] border-b border-[#242f3d] pb-3 mb-6">Maintenance Check</h3>
                      <p className="text-[#8fa0a6] mb-4">Select the applicable maintenance check performed for this transit.</p>
                      <label className="flex items-center gap-3 bg-[#1a222a] p-4 rounded border border-[#34495e] cursor-pointer mb-auto">
                        <input type="radio" checked readOnly className="w-5 h-5 accent-[#00bfa5]" /><span className="font-bold text-white">All checks complete</span>
                      </label>
                      <button onClick={() => {updateFlightData({tl_checks: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg hover:bg-[#00c853]">CONFIRM</button>
                    </>
                  )}

                  {activeTask === "fluids_uplift" && (
                    <>
                      <div className="flex justify-between items-center border-b border-[#242f3d] pb-3 mb-4">
                        <h3 className="text-2xl font-black text-[#00E676] m-0">Fluids Uplift</h3>
                        <button className="bg-[#17202a] border border-[#34495e] text-xs font-bold px-3 py-1 rounded hover:bg-[#34495e]">All Default</button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">APU Oil (Quarts)</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">BUG Oil (Quarts)</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                        </div>
                        <h5 className="text-white font-bold text-sm border-b border-[#333] pb-1 m-0">Engine Oil (Quarts)</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">Engine 1 Uplift</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                          <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">Engine 2 Uplift</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                          <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">Engine 1 Departure Qty</label><input type="number" defaultValue="23.0" step="0.5" className="w-full bg-[#0a0a0a] border border-[#34495e] p-2 rounded text-[#8fa0a6] outline-none" disabled/></div>
                          <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">Engine 2 Departure Qty</label><input type="number" defaultValue="22.0" step="0.5" className="w-full bg-[#0a0a0a] border border-[#34495e] p-2 rounded text-[#8fa0a6] outline-none" disabled/></div>
                        </div>
                        <h5 className="text-white font-bold text-sm border-b border-[#333] pb-1 m-0 mt-2">Hydraulic & IDG (Quarts)</h5>
                        <div className="grid grid-cols-3 gap-3">
                          <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">Hyd L</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                          <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">Hyd C</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                          <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">Hyd R</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                           <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">IDG 1</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                           <div><label className="block text-[0.65rem] text-[#8fa0a6] mb-1">IDG 2</label><input type="number" defaultValue="0.0" step="0.5" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                        </div>
                        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1 mt-2">Potable Water Qty (%) (xx/16)</label><input type="number" defaultValue="16" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" /></div>
                      </div>
                      <div className="pt-4 shrink-0"><button onClick={() => {updateFlightData({tl_fluids: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg hover:bg-[#00c853]">CONFIRM</button></div>
                    </>
                  )}

                  {activeTask === "release_aircraft" && (
                    <>
                      <h3 className="text-2xl font-black text-[#00E676] border-b border-[#242f3d] pb-3 mb-6">Release Aircraft</h3>
                      <div className="bg-[#1c2630] border-l-4 border-[#FF9100] p-4 rounded text-[#e2e8f0] italic mb-6">
                        "I certify that the maintenance specified has been carried out in accordance with the requirements of the Air Navigation Order."
                      </div>
                      <div className="mb-auto">
                        <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Engineer Name</label>
                        <input type="text" placeholder="e.g. CHAN, TAI MAN" className="w-full bg-[#080a0d] border border-[#34495e] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase" />
                      </div>
                      <button onClick={() => {updateFlightData({tl_release: true}); setActiveTask(null);}} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg hover:bg-[#00c853]">CONFIRM RELEASE</button>
                    </>
                  )}

                  {/* 檢視特定 Defect (View Entry) */}
                  {activeTask === "view_entry" && selectedEntry && (
                    <>
                      {defects.filter((d:any)=>d.id === selectedEntry).map((sel:any) => (
                        <div key={sel.id} className="flex flex-col h-full">
                          <div className="flex justify-between items-start border-b border-[#242f3d] pb-3 mb-4">
                            <h3 className="text-2xl font-black text-[#00E676] m-0">Defect: {sel.id}</h3>
                            <button onClick={() => setActiveTask(null)} className="text-[#8fa0a6] hover:text-white font-bold text-xl">✕</button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto pr-2 text-sm text-[#e2e8f0] leading-relaxed flex flex-col gap-3">
                            <div><strong className="text-[#8fa0a6]">Reported By:</strong> {sel.reported_by}</div>
                            <div><strong className="text-[#8fa0a6]">Report Time:</strong> {sel.time}</div>
                            <div><strong className="text-[#8fa0a6]">Status:</strong> <span className="text-[#FF1744] font-bold">{sel.status}</span></div>
                            
                            <div className="bg-[#0a0a0a] p-4 rounded border border-[#34495e] font-mono mt-2">
                              {sel.description}
                            </div>

                            {roleMode === "ENGINEER" && (
                              <div className="mt-6 border-t border-dashed border-[#34495e] pt-4">
                                <h4 className="text-[#00bfa5] font-bold mb-3">Action Disposition</h4>
                                <select id="eng_action_type" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none focus:border-[#00bfa5] mb-3" onChange={(e) => {
                                  document.getElementById('clear_div')!.style.display = e.target.value === 'Clear Defect' ? 'block' : 'none';
                                  document.getElementById('defer_div')!.style.display = e.target.value === 'Defer Defect' ? 'block' : 'none';
                                }}>
                                  <option value="">-- Select Disposition --</option>
                                  <option value="Clear Defect">Clear Defect</option>
                                  <option value="Defer Defect">Defer Defect</option>
                                </select>
                                
                                <div id="clear_div" style={{display:'none'}}>
                                  <textarea id="val_clear_desc" placeholder="Action Description (Rectification)..." className="w-full h-24 bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none mb-2 resize-none"></textarea>
                                  <button onClick={() => handleClearDefect(sel.id, (document.getElementById('val_clear_desc') as HTMLTextAreaElement).value)} className="w-full py-3 bg-[#00E676] text-black font-bold rounded hover:bg-[#00c853]">CONFIRM CLEARANCE</button>
                                </div>
                                
                                <div id="defer_div" style={{display:'none'}}>
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    <select id="val_def_type" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none"><option>ADD</option><option>SADD</option><option>PADD</option></select>
                                    <input id="val_def_mel" type="text" placeholder="MEL Reference" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none" />
                                  </div>
                                  <textarea id="val_def_reason" placeholder="Deferral Reason..." className="w-full h-16 bg-[#080a0d] border border-[#34495e] p-2 rounded text-white outline-none mb-2 resize-none"></textarea>
                                  <button onClick={() => handleDeferDefect(sel.id, (document.getElementById('val_def_type') as HTMLSelectElement).value, (document.getElementById('val_def_mel') as HTMLInputElement).value, (document.getElementById('val_def_reason') as HTMLTextAreaElement).value)} className="w-full py-3 bg-[#FF9100] text-black font-bold rounded hover:bg-[#ffA000]">CONFIRM DEFERRAL</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {activeTask === "info" && (
                    <>
                      <h3 className="text-2xl font-black text-[#00bfa5] border-b border-[#242f3d] pb-3 mb-6">Flight Info</h3>
                      <div className="text-[#e2e8f0] text-sm leading-loose">
                        <div><strong className="text-[#8fa0a6]">Flight Number:</strong> {currFlt}</div>
                        <div><strong className="text-[#8fa0a6]">Route:</strong> {dep} ➔ {arr}</div>
                        <div><strong className="text-[#8fa0a6]">Date of flight:</strong> {new Date().toISOString().substring(0,10)}</div>
                        <hr className="border-[#242f3d] my-4"/>
                        <div className="text-[#00bfa5] font-bold mb-2">Outbound commander</div>
                        <div><strong className="text-[#8fa0a6]">Name:</strong> {flightData?.captain || 'PILOT'}</div>
                        <div><strong className="text-[#8fa0a6]">GalaCXy ID:</strong> N/A</div>
                      </div>
                    </>
                  )}

                </div>
              )}
            </div>
          </>
        )}

        {/* ------------------------------------- */}
        {/* 🕒 HISTORY NAV                        */}
        {/* ------------------------------------- */}
        {activeNav === "history" && (
          <div className="w-full h-full flex flex-col gap-4">
            <div className="shrink-0">
              <h3 className="text-2xl font-black text-[#00bfa5] m-0">eTechLog Sector History</h3>
              <p className="text-[#8fa0a6] text-sm mt-1">Review previous flight sectors and their technical logs.</p>
            </div>
            
            <div className="flex-1 flex gap-4 overflow-hidden">
              <div className="flex-[3] bg-[#11161d] border border-[#242f3d] rounded-xl p-4 shadow-lg overflow-y-auto flex flex-col gap-2">
                <h4 className="text-white font-bold text-sm mb-2 border-b border-[#242f3d] pb-2">Past Flights</h4>
                {historyRecords.map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => setSelectedHist(r.id)}
                    className={`text-left p-3 rounded-lg border transition-colors ${selectedHist === r.id ? 'bg-[#1e2a38] border-[#00bfa5] shadow-md' : 'bg-[#0a0a0a] border-[#242f3d] hover:border-[#8fa0a6]'}`}
                  >
                    <div className="text-xs text-[#8fa0a6] font-bold">{r.date}</div>
                    <div className="text-[#00E676] font-black">{r.flt}</div>
                    <div className="text-xs text-[#e2e8f0]">{r.route}</div>
                  </button>
                ))}
              </div>
              
              <div className="flex-[7] bg-[#11161d] border border-[#242f3d] rounded-xl p-6 shadow-lg overflow-y-auto">
                {selectedHist ? historyRecords.filter(r => r.id === selectedHist).map(detail => (
                  <div key={detail.id} className="animate-fade-in">
                    <h3 className="text-3xl font-black text-[#00bfa5] m-0 border-b border-[#242f3d] pb-4 mb-6">Flight {detail.flt} Details</h3>
                    <div className="text-sm text-[#e2e8f0] mb-6"><strong className="text-[#8fa0a6]">Route:</strong> {detail.route} &nbsp;&nbsp;|&nbsp;&nbsp; <strong className="text-[#8fa0a6]">Date:</strong> {detail.date}</div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="bg-[#0a0a0a] border border-[#34495e] p-4 rounded-lg">
                        <h4 className="text-[#00bfa5] font-bold mb-3">👨‍✈️ Commander</h4>
                        <div className="text-[#e2e8f0] font-bold">{detail.cmdr}</div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#34495e] p-4 rounded-lg">
                        <h4 className="text-[#00bfa5] font-bold mb-3">⛽ Fuel Records</h4>
                        <div className="text-[#00E676] font-bold text-sm">Arrival Fuel: {detail.fuelArr} T<br/><br/>Uplifted: {detail.fuelUp} T</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="bg-[#0a0a0a] border border-[#34495e] p-4 rounded-lg">
                        <h4 className="text-[#00bfa5] font-bold mb-3">🔧 Checks</h4>
                        {detail.checks.length > 0 ? detail.checks.map(c => <div key={c} className="text-sm text-[#e2e8f0] mb-1">✅ {c}</div>) : <div className="text-sm text-[#8fa0a6]">Nil</div>}
                      </div>
                      <div className="bg-[#0a0a0a] border border-[#34495e] p-4 rounded-lg">
                        <h4 className="text-[#00bfa5] font-bold mb-3">💧 Servicing</h4>
                        {detail.serv.length > 0 ? detail.serv.map(s => <div key={s} className="text-sm text-[#e2e8f0] mb-1">- {s}</div>) : <div className="text-sm text-[#8fa0a6]">Nil routine servicing recorded.</div>}
                      </div>
                    </div>
                    
                    <h4 className="text-[#00bfa5] font-bold mb-3 border-b border-[#242f3d] pb-2">🚨 Defects Recorded</h4>
                    {detail.def.length > 0 ? detail.def.map((d, i) => (
                      <div key={i} className="bg-[#11161d] border-l-4 border-[#FF1744] p-4 rounded-lg mb-3">
                        <strong className="text-[#FF1744] text-lg">[{d.sys}]</strong><br/>
                        <span className="text-[#e2e8f0] text-sm">{d.desc}</span><br/>
                        <span className="text-xs font-bold text-[#8fa0a6] mt-2 inline-block">STATUS: {d.status}</span>
                      </div>
                    )) : <div className="text-[#00E676] font-bold">✅ Nil defects recorded on this sector.</div>}
                  </div>
                )) : <div className="text-[#8fa0a6] italic text-center pt-20">👈 Select a flight from the left list.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------- */}
        {/* 📝 REPORTING NAV                      */}
        {/* ------------------------------------- */}
        {activeNav === "reporting" && (
          <div className="w-full h-full flex flex-col gap-4 animate-fade-in">
            <div className="shrink-0">
              <h3 className="text-2xl font-black text-[#00bfa5] m-0">Defect Reporting</h3>
              <p className="text-[#8fa0a6] text-sm mt-1">Log a new technical observation or defect.</p>
            </div>
            
            <div className="flex-1 bg-[#11161d] border border-[#242f3d] rounded-xl p-8 shadow-lg max-w-3xl mx-auto w-full">
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-2">Category / ATA Chapter</label>
                  <select value={repCat} onChange={(e) => setRepCat(e.target.value)} className="w-full bg-[#080a0d] border border-[#34495e] text-white p-3 rounded outline-none focus:border-[#00bfa5]">
                    <option>General / Unknown</option>
                    <option>ATA 21 - Air Conditioning</option>
                    <option>ATA 24 - Electrical Power</option>
                    <option>ATA 27 - Flight Controls</option>
                    <option>ATA 32 - Landing Gear</option>
                    <option>ATA 36 - Pneumatic</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-2">Defect Summary</label>
                  <input type="text" value={repSummary} onChange={(e) => setRepSummary(e.target.value)} placeholder="e.g. APU Bleed Fault" className="w-full bg-[#080a0d] border border-[#34495e] text-white p-3 rounded outline-none focus:border-[#00bfa5]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-2">Detailed Description</label>
                  <textarea value={repDesc} onChange={(e) => setRepDesc(e.target.value)} placeholder="Enter full details of the observation..." className="w-full h-32 bg-[#080a0d] border border-[#34495e] text-white p-3 rounded outline-none focus:border-[#00bfa5] resize-none"></textarea>
                </div>
                <button onClick={handleSubmitReport} className="w-full py-4 mt-4 bg-[#00bfa5] text-black font-black text-lg rounded-lg shadow-[0_4px_15px_rgba(0,191,165,0.4)] hover:bg-[#00E676] transition-colors">
                  SUBMIT REPORT
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>

      {/* ========================================== */}
      {/* 🚀 BOTTOM BAR (專屬 eTechLog Navigation)     */}
      {/* ========================================== */}
      <div className="flex items-center justify-around gap-2 bg-[#11151a] border-t border-[#34495e] px-2 py-3 mt-auto shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] relative z-20">
        {[
          { id: "dashboard", label: "Dashboard", icon: "📊" },
          { id: "history", label: "History", icon: "🕒" },
          { id: "reporting", label: "Reporting", icon: "📝" }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => { setActiveNav(btn.id as any); setActiveTask(null); }}
            className={`flex-1 py-3 rounded-lg font-black tracking-widest text-sm transition-colors border ${
              activeNav === btn.id 
                ? "bg-[#00bfa5]/20 text-[#00bfa5] border-[#00bfa5]" 
                : "bg-transparent text-[#8fa0a6] border-transparent hover:bg-[#17202a]"
            }`}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

    </div>
  );
}
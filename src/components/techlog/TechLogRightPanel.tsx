"use client";
import { useState } from "react";

export default function TechLogRightPanel({ tlData, flightData, roleMode, activeTask, setActiveTask, selectedEntry, showInFlightMenu, setShowInFlightMenu, updateTechLogData, defects }: any) {
  const currFlt = flightData?.flight_no || "CPA 564";
  const dep = flightData?.dep_icao || "VHHH";
  const arr = flightData?.arr_icao || "RJBB";

  const { tl_flight_started: isStarted, tl_release: isReleased, tl_total_departure_fuel: totalDepFuel, tl_actual_uplift: actualUplift } = tlData;

  const handleClearDefect = (id: string, actionDesc: string) => {
    updateTechLogData({ defects: defects.map((d: any) => d.id === id ? { ...d, status: "CLEARED", action_desc: actionDesc } : d) });
    setActiveTask(null);
  };

  const handleDeferDefect = (id: string, type: string, mel: string, reason: string) => {
    updateTechLogData({ defects: defects.map((d: any) => d.id === id ? { ...d, status: "DEFERRED", deferral_type: type, mel_ref: mel, deferral_reason: reason } : d) });
    setActiveTask(null);
  };

  // Prepare Flight States
  const [prepFlightNo, setPrepFlightNo] = useState(currFlt);
  const [prepOrigin, setPrepOrigin] = useState("HKG");
  const [prepDest, setPrepDest] = useState(flightData?.raw_simbrief?.destination?.iata_code || "KIX");
  const [prepType, setPrepType] = useState("Revenue");
  const [prepCmdr, setPrepCmdr] = useState(flightData?.captain || "");
  const [prepGalaxyId, setPrepGalaxyId] = useState("");
  const [prepDeicing, setPrepDeicing] = useState(false);
  const isPrepareValid = prepFlightNo.trim() !== "" && prepOrigin.trim() !== "" && prepDest.trim() !== "" && prepCmdr.trim() !== "" && prepGalaxyId.trim() !== "";

  // Fuel Record States
  const [fuelTotDep, setFuelTotDep] = useState("");
  const [fuelActual, setFuelActual] = useState("");
  const [fuelCycling, setFuelCycling] = useState(false);
  const fobBefore = parseFloat(flightData?.prev_fob || "5.0");
  const parsedTotDep = parseFloat(fuelTotDep) || 0;
  const parsedActual = parseFloat(fuelActual) || 0;
  const expectedUplift = Math.max(0, parsedTotDep - fobBefore);
  const discrepancy = (fuelTotDep !== "" && fuelActual !== "") ? parsedActual - expectedUplift : 0;
  const isFuelRecordValid = fuelTotDep !== "" && fuelActual !== "" && fuelCycling;

  return (
    <div className="flex-[6] bg-[#2a2a2a] border border-[#333333] rounded-xl p-6 shadow-lg overflow-y-auto relative">
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
          {/* ... Operations ... */}
          {activeTask === "op_normal_close" && (
            <div className="flex flex-col gap-4"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3 pr-48">Normal Close Flight</h3><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-[#8fa0a6] mb-1">Landing Time (UTC)</label><input id="arr_time" type="text" className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded text-white" /></div><div><label className="block text-xs text-[#8fa0a6] mb-1">Arrival FOB (Tons)</label><input id="arr_fuel" type="number" step="0.1" className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded text-white" /></div></div><button onClick={() => { updateTechLogData({ tl_flight_started: false, tl_flight_status: "ARRIVED", tl_accept: false, tl_prepared: false }); setActiveTask(null); }} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg mt-4">SUBMIT SECTOR CLOSE</button></div>
          )}
          {activeTask === "op_diversion" && (
            <div className="flex flex-col gap-4"><h3 className="text-2xl font-black text-[#FF9100] border-b border-[#333333] pb-3 pr-48">In-Flight Diversion</h3><div><label className="block text-xs text-[#8fa0a6] mb-1">Alternate ICAO</label><input id="div_icao" type="text" className="w-full bg-[#1a1a1a] border border-[#00bfa5] p-3 rounded text-white font-bold uppercase" /></div><button onClick={() => { updateTechLogData({ tl_flight_status: "DIVERTED", tl_flight_started: false }); setActiveTask(null); }} className="w-full py-4 bg-[#FF9100] text-black font-black rounded-lg mt-4">DECLARE DIVERSION</button></div>
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

          {/* ... Prepare & Fuel ... */}
          {activeTask === "prepare" && (
            <div className="flex flex-col h-full relative">
              <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-6 shrink-0">
                <h3 className="text-2xl font-black text-[#00E676]">Enter Flight Details:</h3>
                {isPrepareValid && (
                  <button onClick={() => { updateTechLogData({ tl_prepared: true, tl_flight_status: "PREPARED" }); setActiveTask("fuel_record"); }} className="bg-[#00E676] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(0,230,118,0.3)] animate-fade-in tracking-widest">CONFIRM</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5">
                <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Flight Number</label><input type="text" value={prepFlightNo} onChange={e => setPrepFlightNo(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] transition-colors" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Origin Station</label><input type="text" value={prepOrigin} onChange={e => setPrepOrigin(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase transition-colors" /></div>
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Destination Station</label><input type="text" value={prepDest} onChange={e => setPrepDest(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase transition-colors" /></div>
                </div>
                <div>
                  <label className="block text-xs text-[#8fa0a6] font-bold mb-3">Flight Type</label>
                  <div className="flex gap-6">{['Revenue', 'Non-Revenue', 'Ferry'].map(type => (<label key={type} className="flex items-center gap-2 cursor-pointer group"><input type="radio" name="flightType" value={type} checked={prepType === type} onChange={() => setPrepType(type)} className="accent-[#00bfa5] w-4 h-4" /><span className={`text-sm font-bold ${prepType === type ? 'text-[#00bfa5]' : 'text-white group-hover:text-[#8fa0a6]'}`}>{type}</span></label>))}</div>
                </div>
                <hr className="border-[#333333] my-2" />
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander</label><input type="text" value={prepCmdr} onChange={e => setPrepCmdr(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase transition-colors" placeholder="e.g. CHAN T M" /></div>
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={prepGalaxyId} onChange={e => setPrepGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase transition-colors" placeholder="e.g. 123456" /></div>
                </div>
                <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg mt-2">
                  <div><div className="text-white font-bold">Require De-icing</div><div className="text-[#8fa0a6] text-xs mt-0.5">Select if winter operations de-icing is needed before departure</div></div>
                  <div onClick={() => setPrepDeicing(!prepDeicing)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner ${prepDeicing ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${prepDeicing ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                </div>
              </div>
            </div>
          )}

          {activeTask === "fuel_record" && (
            <div className="flex flex-col h-full relative">
              <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-6 shrink-0">
                <h3 className="text-2xl font-black text-[#00E676]">Fuel Record</h3>
                {isFuelRecordValid && (
                  <button onClick={() => { updateTechLogData({ tl_fuel_record_completed: true, tl_total_departure_fuel: parsedTotDep, tl_actual_uplift: parsedActual }); setActiveTask("acceptance"); }} className="bg-[#00E676] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(0,230,118,0.3)] animate-fade-in tracking-widest">CONFIRM</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5">
                <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Total Departure Fuel T(KGSX1000)</label><input type="number" step="0.1" value={fuelTotDep} onChange={e => setFuelTotDep(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#00bfa5] p-3 rounded font-bold text-[#00bfa5] outline-none focus:border-white transition-colors text-lg" placeholder="e.g. 42.0"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Fuel on board before uplift T(KGSX1000)</label><input type="text" disabled value={fobBefore.toFixed(1)} className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none" /></div>
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Expected Uplift T(KGSX1000)</label><input type="text" disabled value={expectedUplift.toFixed(1)} className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Actual Uplift T(KGSX1000)</label><input type="number" step="0.1" value={fuelActual} onChange={e => setFuelActual(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#FF9100] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100] transition-colors" placeholder="e.g. 37.0"/></div>
                  <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Discrepancy T(KGSX1000)</label><input type="text" disabled value={discrepancy > 0 ? `+${discrepancy.toFixed(1)}` : discrepancy.toFixed(1)} className={`w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold outline-none ${Math.abs(discrepancy) > 1.0 ? 'text-[#FF1744]' : 'text-[#e2e8f0]'}`} /></div>
                </div>
                <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg mt-2">
                  <div><div className="text-white font-bold text-sm">Confirm "Refuelling Station Door Cycling Procedure" performed</div><div className="text-[#8fa0a6] text-xs mt-0.5">(Ref AD 2020-11-11)</div></div>
                  <div onClick={() => setFuelCycling(!fuelCycling)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner shrink-0 ${fuelCycling ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${fuelCycling ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                </div>
              </div>
            </div>
          )}

          {/* ... Other Simple Tasks ... */}
          {activeTask === "acceptance" && (
            <div className="flex flex-col h-full"><h3 className="text-2xl font-black text-[#00E676] border-b border-[#333333] pb-3 mb-6">Commander's Acceptance</h3>{!isReleased ? (<div className="bg-[#FF1744]/15 border border-[#FF1744] p-4 rounded text-[#FF1744] font-bold">🛑 Aircraft not released.</div>) : (<div className="flex flex-col gap-4 mt-auto"><label className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg border border-[#00bfa5] cursor-pointer"><span className="font-bold text-white">Accept & Sign TechLog</span><input type="checkbox" id="chk_accept" className="w-6 h-6 accent-[#00bfa5]" /></label><button onClick={() => { if((document.getElementById('chk_accept') as HTMLInputElement).checked) { updateTechLogData({tl_accept: true, tl_flight_started: true, tl_flight_status: "IN_FLIGHT"}); setActiveTask("info"); } }} className="w-full py-4 bg-[#00E676] text-black font-black rounded-lg">SIGN ACCEPTMENT</button></div>)}</div>
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
              <div><strong className="text-[#8fa0a6]">Flight Number:</strong> {currFlt}</div>
              <div><strong className="text-[#8fa0a6]">Route:</strong> {dep} ➔ {arr}</div>
              <div><strong className="text-[#8fa0a6]">Total Fuel Loaded:</strong> {totalDepFuel} T</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
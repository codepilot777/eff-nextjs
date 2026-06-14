"use client";
import { useState } from "react";

// 🛫 1. Prepare Flight Form
export function TaskPrepareFlight({ flightData, tlData, updateTechLogData, setActiveTask }: any) {
  const [prepFlightNo, setPrepFlightNo] = useState(tlData?.tl_prep_flt || flightData?.flight_no || "");
  const [prepOrigin, setPrepOrigin] = useState(tlData?.tl_prep_dep || "HKG");
  const [prepDest, setPrepDest] = useState(tlData?.tl_prep_arr || flightData?.raw_simbrief?.destination?.iata_code || "KIX");
  const [prepType, setPrepType] = useState("Revenue");
  const [prepCmdr, setPrepCmdr] = useState(tlData?.tl_cmdr || flightData?.captain || "");
  const [prepGalaxyId, setPrepGalaxyId] = useState(tlData?.tl_galaxy_id || "");
  const [prepDeicing, setPrepDeicing] = useState(false);

  const isValid = prepFlightNo.trim() !== "" && prepOrigin.trim() !== "" && prepDest.trim() !== "" && prepCmdr.trim() !== "" && prepGalaxyId.trim() !== "";

  const handleConfirm = () => {
    updateTechLogData({ 
      tl_prepared: true, tl_flight_status: "PREPARED",
      tl_prep_flt: prepFlightNo, tl_prep_dep: prepOrigin, tl_prep_arr: prepDest,
      tl_cmdr: prepCmdr, tl_galaxy_id: prepGalaxyId
    });
    setActiveTask("fuel_record");
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-6 shrink-0">
        <h3 className="text-2xl font-black text-[#00E676]">Enter Flight Details:</h3>
        {isValid && <button onClick={handleConfirm} className="bg-[#C6FF00] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(198,255,0,0.3)] animate-fade-in tracking-widest">CONFIRM</button>}
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5">
        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Flight Number</label><input type="text" value={prepFlightNo} onChange={e => setPrepFlightNo(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Origin Station</label><input type="text" value={prepOrigin} onChange={e => setPrepOrigin(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Destination Station</label><input type="text" value={prepDest} onChange={e => setPrepDest(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase" /></div>
        </div>
        <div>
          <label className="block text-xs text-[#8fa0a6] font-bold mb-3">Flight Type</label>
          <div className="flex gap-6">{['Revenue', 'Non-Revenue', 'Ferry'].map(type => (<label key={type} className="flex items-center gap-2 cursor-pointer group"><input type="radio" name="flightType" value={type} checked={prepType === type} onChange={() => setPrepType(type)} className="accent-[#00bfa5] w-4 h-4" /><span className={`text-sm font-bold ${prepType === type ? 'text-[#00bfa5]' : 'text-white group-hover:text-[#8fa0a6]'}`}>{type}</span></label>))}</div>
        </div>
        <hr className="border-[#333333] my-2" />
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander</label><input type="text" value={prepCmdr} onChange={e => setPrepCmdr(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase" placeholder="e.g. CHAN T M" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={prepGalaxyId} onChange={e => setPrepGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5] uppercase" placeholder="e.g. 123456" /></div>
        </div>
        <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg mt-2">
          <div><div className="text-white font-bold">Require De-icing</div><div className="text-[#8fa0a6] text-xs mt-0.5">Select if winter operations de-icing is needed</div></div>
          <div onClick={() => setPrepDeicing(!prepDeicing)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner ${prepDeicing ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${prepDeicing ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
        </div>
      </div>
    </div>
  );
}

// ⛽ 2. Fuel Record Form
export function TaskFuelRecord({ flightData, tlData, updateTechLogData, setActiveTask }: any) {
  const [fuelTotDep, setFuelTotDep] = useState("");
  const [fuelActual, setFuelActual] = useState("");
  const [fuelCycling, setFuelCycling] = useState(false);

  const fobBefore = parseFloat(tlData?.tl_prev_fob || flightData?.prev_fob || "5.0");
  const parsedTotDep = parseFloat(fuelTotDep) || 0;
  const parsedActual = parseFloat(fuelActual) || 0;
  const expectedUplift = Math.max(0, parsedTotDep - fobBefore);
  const discrepancy = (fuelTotDep !== "" && fuelActual !== "") ? parsedActual - expectedUplift : 0;
  const isValid = fuelTotDep !== "" && fuelActual !== "" && fuelCycling;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-6 shrink-0">
        <h3 className="text-2xl font-black text-[#00E676]">Fuel Record</h3>
        {isValid && <button onClick={() => { updateTechLogData({ tl_fuel_record_completed: true, tl_total_departure_fuel: parsedTotDep, tl_actual_uplift: parsedActual }); setActiveTask("acceptance"); }} className="bg-[#C6FF00] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(198,255,0,0.3)] animate-fade-in tracking-widest">CONFIRM</button>}
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5">
        <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Total Departure Fuel T(KGSX1000)</label><input type="number" step="0.1" value={fuelTotDep} onChange={e => setFuelTotDep(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#00bfa5] p-3 rounded font-bold text-[#00bfa5] outline-none focus:border-white text-lg" placeholder="e.g. 42.0"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">FOB before uplift T(KGSX1000)</label><input type="text" disabled value={fobBefore.toFixed(1)} className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Expected Uplift T(KGSX1000)</label><input type="text" disabled value={expectedUplift.toFixed(1)} className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Actual Uplift T(KGSX1000)</label><input type="number" step="0.1" value={fuelActual} onChange={e => setFuelActual(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#FF9100] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" placeholder="e.g. 37.0"/></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Discrepancy T(KGSX1000)</label><input type="text" disabled value={discrepancy > 0 ? `+${discrepancy.toFixed(1)}` : discrepancy.toFixed(1)} className={`w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold outline-none ${Math.abs(discrepancy) > 1.0 ? 'text-[#FF1744]' : 'text-[#e2e8f0]'}`} /></div>
        </div>
        <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg mt-2">
          <div><div className="text-white font-bold text-sm">Confirm "Refuelling Station Door Cycling Procedure" performed</div><div className="text-[#8fa0a6] text-xs mt-0.5">(Ref AD 2020-11-11)</div></div>
          <div onClick={() => setFuelCycling(!fuelCycling)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer shadow-inner shrink-0 ${fuelCycling ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${fuelCycling ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
        </div>
      </div>
    </div>
  );
}

// ✅ 3. Commander Acceptance Form
export function TaskAcceptance({ tlData, updateTechLogData, setActiveTask }: any) {
  const [acceptToggle, setAcceptToggle] = useState(false);
  const { tl_release: isReleased, tl_total_departure_fuel: totalDepFuel, tl_actual_uplift: actualUplift, tl_prep_flt, tl_prep_dep, tl_prep_arr, tl_cmdr, tl_galaxy_id } = tlData;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-4 shrink-0">
        <h3 className="text-2xl font-black text-[#00E676]">Commander's Acceptance</h3>
        {acceptToggle && isReleased && (
          <button onClick={() => { updateTechLogData({tl_accept: true, tl_flight_started: true, tl_flight_status: "IN_FLIGHT"}); setActiveTask("info"); }} className="bg-[#C6FF00] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(198,255,0,0.3)] animate-fade-in tracking-widest">CONFIRM</button>
        )}
      </div>
      {!isReleased ? (
        <div className="bg-[#FF1744]/15 border border-[#FF1744] p-4 rounded text-[#FF1744] font-bold">🛑 Aircraft has not been released by Engineering yet. Acceptance is disabled.</div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a1a] border border-[#404040] p-3 rounded-lg">
              <h4 className="text-[#00bfa5] font-bold text-xs uppercase tracking-widest mb-2 border-b border-[#333333] pb-1">Maintenance Work</h4>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>EDTO Transit Check</span><span className="text-[#00E676] font-bold">COMPLETED</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>Daily Check</span><span className="text-[#00E676] font-bold">COMPLETED</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between"><span>Weekly Check</span><span className="text-[#00E676] font-bold">COMPLETED</span></div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#404040] p-3 rounded-lg">
              <h4 className="text-[#00bfa5] font-bold text-xs uppercase tracking-widest mb-2 border-b border-[#333333] pb-1">Servicing Uplift</h4>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>APU Oil</span><span className="font-mono">0.0 Qts</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between mb-1"><span>Engine Oil</span><span className="font-mono">0.0 Qts</span></div>
              <div className="text-xs text-[#e2e8f0] flex justify-between"><span>Hydraulic Fluid</span><span className="font-mono">0.0 Qts</span></div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#404040] p-3 rounded-lg flex justify-between items-center">
            <div className="flex-1"><h4 className="text-[#00bfa5] font-bold text-xs uppercase tracking-widest mb-1">Fuel Record</h4><div className="text-xs text-[#8fa0a6]">Total Departure Fuel: <span className="text-white font-mono">{totalDepFuel || 'N/A'} T</span></div></div>
            <div className="flex-1 border-l border-[#333333] pl-4"><div className="text-xs text-[#8fa0a6]">Actual Uplift: <span className="text-white font-mono">{actualUplift || 'N/A'} T</span></div></div>
          </div>
          <hr className="border-dashed border-[#404040]" />
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Flight Number</label><input type="text" value={tl_prep_flt} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-[#8fa0a6]" /></div>
              <div className="flex-[2] flex items-end gap-2">
                <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Origin</label><input type="text" value={tl_prep_dep} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-center text-[#8fa0a6]" /></div>
                <div className="text-[#00bfa5] pb-2">✈️</div>
                <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Destination</label><input type="text" value={tl_prep_arr} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-center text-[#8fa0a6]" /></div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander</label><input type="text" value={tl_cmdr} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-[#8fa0a6]" /></div>
              <div className="flex-1"><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={tl_galaxy_id} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-[#8fa0a6]" /></div>
            </div>
          </div>
          <hr className="border-dashed border-[#404040]" />
          <div className="bg-[#00E676]/10 border border-[#00E676]/30 p-4 rounded-xl flex flex-col items-center gap-4 mt-2">
            <p className="text-sm text-center text-[#e2e8f0] font-bold px-4">"I accept the aircraft's declared airworthiness and certify that the fuel grade, distribution and quantity is sufficient for the intended flight."</p>
            <div className="flex flex-col items-center gap-2">
              <div onClick={() => setAcceptToggle(!acceptToggle)} className={`w-16 h-8 flex items-center rounded-full p-1 cursor-pointer shadow-inner ${acceptToggle ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${acceptToggle ? 'translate-x-8' : 'translate-x-0'}`}>{acceptToggle && <span className="text-[#00E676] text-xs font-black">✓</span>}</div></div>
              <span className={`text-xs font-black tracking-widest uppercase transition-colors ${acceptToggle ? 'text-[#00E676]' : 'text-[#8fa0a6]'}`}>Accept Aircraft</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🌟 共用的完成航段、封存歷史與狀態重置函數
// ==========================================
function finalizeSector(actionName: string, arrivalStation: string, arrivalFuel: string, extraDetails: any, tlData: any, updateTechLogData: any, setActiveTask: any) {
  const historyEntry = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-'),
    flt: tlData?.tl_prep_flt || "UNKNOWN",
    route: `${tlData?.tl_prep_dep || "ORG"} ➔ ${arrivalStation}`,
    cmdr: extraDetails?.cmdr || tlData?.tl_cmdr,
    fuelArr: arrivalFuel,
    fuelUp: tlData?.tl_actual_uplift || "0",
    checks: ["EDTO Transit Check", "Daily Check", "Weekly Check"],
    serv: ["APU Oil", "Engine Oil", "Hydraulic Fluid"],
    def: [], // 簡化處理
    action: actionName
  };

  updateTechLogData({
    // 1. 寫入歷史
    history: [historyEntry, ...(tlData?.history || [])],
    // 2. 更新供下一班機用的預設資料
    tl_prev_flt: tlData.tl_prep_flt,
    tl_prev_dep: tlData.tl_prep_dep,
    tl_prev_arr: arrivalStation,
    tl_prev_fob: arrivalFuel,
    // 3. 抹除所有狀態，回到一張白紙
    tl_prepared: false,
    tl_fuel_record_completed: false,
    tl_accept: false,
    tl_flight_started: false,
    tl_fluids: false,
    tl_checks: false,
    tl_defects: false,
    tl_release: false,
    tl_flight_status: "ARRIVED"
  });

  setActiveTask(null);
}

// 🏁 4. Normal Close Form
export function TaskNormalClose({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const hasOpenDefects = defects.some((d: any) => d.status === "OPEN");
  const [ncNilDefects, setNcNilDefects] = useState(false);
  const [ncBlocksOff, setNcBlocksOff] = useState("");
  const [ncTakeOff, setNcTakeOff] = useState("");
  const [ncLanding, setNcLanding] = useState("");
  const [ncBlocksOn, setNcBlocksOn] = useState("");
  const [ncLandingsCount, setNcLandingsCount] = useState("1");
  const [ncOvershoots, setNcOvershoots] = useState("0");
  const [ncTouchGo, setNcTouchGo] = useState("0");
  const [ncEdto, setNcEdto] = useState("No");
  const [ncAutoland, setNcAutoland] = useState("Not Attempted");
  const [ncArrivalFuel, setNcArrivalFuel] = useState("");
  const [ncCmdr, setNcCmdr] = useState(tlData?.tl_cmdr || "");
  const [ncGalaxyId, setNcGalaxyId] = useState(tlData?.tl_galaxy_id || "");

  const isValid = (!hasOpenDefects ? ncNilDefects : true) && ncBlocksOff !== "" && ncTakeOff !== "" && ncLanding !== "" && ncBlocksOn !== "" && ncArrivalFuel !== "" && ncCmdr !== "" && ncGalaxyId !== "";

  return (
    <div className="flex flex-col h-full relative">
      <div className="border-b border-[#333333] pb-3 mb-6 shrink-0 pr-48">
        <h3 className="text-2xl font-black text-[#00E676]">Normal Close Flight</h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-4">
        {!hasOpenDefects && (
          <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg">
            <div><div className="text-white font-bold">Confirm Nil Defects</div><div className="text-[#8fa0a6] text-xs mt-0.5">No defects were reported during this sector.</div></div>
            <div onClick={() => setNcNilDefects(!ncNilDefects)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer shadow-inner ${ncNilDefects ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${ncNilDefects ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks Off (Z)</label><input type="text" value={ncBlocksOff} onChange={e=>setNcBlocksOff(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Take Off (Z)</label><input type="text" value={ncTakeOff} onChange={e=>setNcTakeOff(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Landing (Z)</label><input type="text" value={ncLanding} onChange={e=>setNcLanding(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks On (Z)</label><input type="text" value={ncBlocksOn} onChange={e=>setNcBlocksOn(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Landings</label><input type="number" min="0" value={ncLandingsCount} onChange={e=>setNcLandingsCount(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Overshoots</label><input type="number" min="0" value={ncOvershoots} onChange={e=>setNcOvershoots(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Touch-and-gos</label><input type="number" min="0" value={ncTouchGo} onChange={e=>setNcTouchGo(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">EDTO</label>
            <select value={ncEdto} onChange={e=>setNcEdto(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]"><option>No</option><option>60 mins</option><option>120 mins</option><option>180 mins</option><option>207 mins</option><option>240 mins</option></select>
          </div>
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Autoland</label>
            <select value={ncAutoland} onChange={e=>setNcAutoland(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]"><option>Not Attempted</option><option>Successful</option><option>Unsuccessful</option></select>
          </div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Fuel T(KGSX1000)</label><input type="number" step="0.1" value={ncArrivalFuel} onChange={e=>setNcArrivalFuel(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#00bfa5] p-3 rounded font-bold text-[#00bfa5] outline-none" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Station</label><input type="text" value={tlData?.tl_prep_arr || "KIX"} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6]" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander's Name</label><input type="text" value={ncCmdr} onChange={e=>setNcCmdr(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={ncGalaxyId} onChange={e=>setNcGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#00bfa5]" /></div>
        </div>
      </div>
      {isValid && (
        <button onClick={() => finalizeSector("Normal Close", tlData?.tl_prep_arr || "KIX", ncArrivalFuel, { cmdr: ncCmdr }, tlData, updateTechLogData, setActiveTask)} className="w-full mt-4 py-4 bg-[#C6FF00] text-black font-black rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(198,255,0,0.3)] animate-fade-in tracking-widest shrink-0">
          CONFIRM NORMAL CLOSE
        </button>
      )}
    </div>
  );
}

// 🔙 5. Ground Return Form
export function TaskGroundReturn({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const hasOpenDefects = defects.some((d: any) => d.status === "OPEN");
  const [ncNilDefects, setNcNilDefects] = useState(false);
  const [ncBlocksOff, setNcBlocksOff] = useState("");
  const [ncBlocksOn, setNcBlocksOn] = useState("");
  const [ncArrivalFuel, setNcArrivalFuel] = useState("");
  const [ncCmdr, setNcCmdr] = useState(tlData?.tl_cmdr || "");
  const [ncGalaxyId, setNcGalaxyId] = useState(tlData?.tl_galaxy_id || "");

  const isValid = (!hasOpenDefects ? ncNilDefects : true) && ncBlocksOff.trim() !== "" && ncBlocksOn.trim() !== "" && ncArrivalFuel.trim() !== "" && ncCmdr.trim() !== "" && ncGalaxyId.trim() !== "";

  return (
    <div className="flex flex-col h-full relative">
      <div className="border-b border-[#333333] pb-3 mb-6 shrink-0 pr-48">
        <h3 className="text-2xl font-black text-[#FF1744]">Ground Return</h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-4">
        {!hasOpenDefects && (
          <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg">
            <div><div className="text-white font-bold">Confirm Nil Defects</div><div className="text-[#8fa0a6] text-xs mt-0.5">No defects were reported during this taxi segment.</div></div>
            <div onClick={() => setNcNilDefects(!ncNilDefects)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer shadow-inner ${ncNilDefects ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${ncNilDefects ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks Off (Z)</label><input type="text" value={ncBlocksOff} onChange={e=>setNcBlocksOff(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" placeholder="e.g. 0215"/></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks On (Z)</label><input type="text" value={ncBlocksOn} onChange={e=>setNcBlocksOn(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" placeholder="e.g. 0245"/></div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Fuel T(KGSX1000)</label>
            <input type="number" step="0.1" value={ncArrivalFuel} onChange={e=>setNcArrivalFuel(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#FF1744] p-3 rounded font-bold text-[#FF1744] outline-none focus:border-white transition-colors" placeholder="e.g. 40.5" />
          </div>
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Station (Ground Return)</label>
            <input type="text" value={tlData?.tl_prep_dep || "HKG"} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] outline-none uppercase" />
          </div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander's Name</label><input type="text" value={ncCmdr} onChange={e=>setNcCmdr(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={ncGalaxyId} onChange={e=>setNcGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
        </div>
      </div>
      {isValid && (
        <button onClick={() => finalizeSector("Ground Return", tlData?.tl_prep_dep || "HKG", ncArrivalFuel, { cmdr: ncCmdr }, tlData, updateTechLogData, setActiveTask)} className="w-full mt-4 py-4 bg-[#FF1744] text-white font-black rounded-lg hover:bg-[#D50000] shadow-[0_0_15px_rgba(255,23,68,0.3)] animate-fade-in tracking-widest shrink-0">
          CONFIRM GROUND RETURN
        </button>
      )}
    </div>
  );
}

// 🔄 6. Air Return Form
export function TaskAirReturn({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const hasOpenDefects = defects.some((d: any) => d.status === "OPEN");
  const [ncNilDefects, setNcNilDefects] = useState(false);
  const [ncBlocksOff, setNcBlocksOff] = useState("");
  const [ncTakeOff, setNcTakeOff] = useState("");
  const [ncLanding, setNcLanding] = useState("");
  const [ncBlocksOn, setNcBlocksOn] = useState("");
  const [ncLandingsCount, setNcLandingsCount] = useState("1");
  const [ncOvershoots, setNcOvershoots] = useState("0");
  const [ncTouchGo, setNcTouchGo] = useState("0");
  const [ncEdto, setNcEdto] = useState("No");
  const [ncAutoland, setNcAutoland] = useState("Not Attempted");
  const [ncArrivalFuel, setNcArrivalFuel] = useState("");
  const [ncCmdr, setNcCmdr] = useState(tlData?.tl_cmdr || "");
  const [ncGalaxyId, setNcGalaxyId] = useState(tlData?.tl_galaxy_id || "");

  const isValid = (!hasOpenDefects ? ncNilDefects : true) && ncBlocksOff.trim() !== "" && ncTakeOff.trim() !== "" && ncLanding.trim() !== "" && ncBlocksOn.trim() !== "" && ncLandingsCount !== "" && ncOvershoots !== "" && ncTouchGo !== "" && ncArrivalFuel.trim() !== "" && ncCmdr.trim() !== "" && ncGalaxyId.trim() !== "";

  return (
    <div className="flex flex-col h-full relative">
      <div className="border-b border-[#333333] pb-3 mb-6 shrink-0 pr-48">
        <h3 className="text-2xl font-black text-[#FF1744]">Air Return (In-flight Return)</h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-4">
        {!hasOpenDefects && (
          <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg">
            <div><div className="text-white font-bold">Confirm Nil Defects</div><div className="text-[#8fa0a6] text-xs mt-0.5">No defects were reported during this sector.</div></div>
            <div onClick={() => setNcNilDefects(!ncNilDefects)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer shadow-inner ${ncNilDefects ? 'bg-[#00E676]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${ncNilDefects ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks Off (Z)</label><input type="text" value={ncBlocksOff} onChange={e=>setNcBlocksOff(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Take Off (Z)</label><input type="text" value={ncTakeOff} onChange={e=>setNcTakeOff(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Landing (Z)</label><input type="text" value={ncLanding} onChange={e=>setNcLanding(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks On (Z)</label><input type="text" value={ncBlocksOn} onChange={e=>setNcBlocksOn(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Landings</label><input type="number" min="0" value={ncLandingsCount} onChange={e=>setNcLandingsCount(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Overshoots</label><input type="number" min="0" value={ncOvershoots} onChange={e=>setNcOvershoots(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Touch-and-gos</label><input type="number" min="0" value={ncTouchGo} onChange={e=>setNcTouchGo(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">EDTO</label>
            <select value={ncEdto} onChange={e=>setNcEdto(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]"><option>No</option><option>60 mins</option><option>120 mins</option><option>180 mins</option><option>207 mins</option><option>240 mins</option></select>
          </div>
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Autoland</label>
            <select value={ncAutoland} onChange={e=>setNcAutoland(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]"><option>Not Attempted</option><option>Successful</option><option>Unsuccessful</option></select>
          </div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Fuel T(KGSX1000)</label><input type="number" step="0.1" value={ncArrivalFuel} onChange={e=>setNcArrivalFuel(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#FF1744] p-3 rounded font-bold text-[#FF1744] outline-none focus:border-white transition-colors" /></div>
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Station (Air Return)</label>
            <input type="text" value={tlData?.tl_prep_dep || "HKG"} disabled className="w-full bg-[#0a0a0a] border border-[#404040] p-3 rounded font-bold text-[#8fa0a6] uppercase" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander's Name</label><input type="text" value={ncCmdr} onChange={e=>setNcCmdr(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={ncGalaxyId} onChange={e=>setNcGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF1744]" /></div>
        </div>
      </div>
      {isValid && (
        <button onClick={() => finalizeSector("Air Return", tlData?.tl_prep_dep || "HKG", ncArrivalFuel, { cmdr: ncCmdr }, tlData, updateTechLogData, setActiveTask)} className="w-full mt-4 py-4 bg-[#FF1744] text-white font-black rounded-lg hover:bg-[#D50000] shadow-[0_0_15px_rgba(255,23,68,0.3)] animate-fade-in tracking-widest shrink-0">
          CONFIRM AIR RETURN
        </button>
      )}
    </div>
  );
}

// 🔀 7. Diversion Form
export function TaskDiversion({ tlData, defects, updateTechLogData, setActiveTask }: any) {
  const hasOpenDefects = defects.some((d: any) => d.status === "OPEN");
  const [ncNilDefects, setNcNilDefects] = useState(false);
  const [ncBlocksOff, setNcBlocksOff] = useState("");
  const [ncTakeOff, setNcTakeOff] = useState("");
  const [ncLanding, setNcLanding] = useState("");
  const [ncBlocksOn, setNcBlocksOn] = useState("");
  const [ncLandingsCount, setNcLandingsCount] = useState("1");
  const [ncOvershoots, setNcOvershoots] = useState("0");
  const [ncTouchGo, setNcTouchGo] = useState("0");
  const [ncEdto, setNcEdto] = useState("No");
  const [ncAutoland, setNcAutoland] = useState("Not Attempted");
  const [ncArrivalFuel, setNcArrivalFuel] = useState("");
  const [ncCmdr, setNcCmdr] = useState(tlData?.tl_cmdr || "");
  const [ncGalaxyId, setNcGalaxyId] = useState(tlData?.tl_galaxy_id || "");
  const [divArrival, setDivArrival] = useState("");

  const isValid = (!hasOpenDefects ? ncNilDefects : true) && ncBlocksOff.trim() !== "" && ncTakeOff.trim() !== "" && ncLanding.trim() !== "" && ncBlocksOn.trim() !== "" && ncLandingsCount !== "" && ncOvershoots !== "" && ncTouchGo !== "" && ncArrivalFuel.trim() !== "" && divArrival.trim() !== "" && ncCmdr.trim() !== "" && ncGalaxyId.trim() !== "";

  return (
    <div className="flex flex-col h-full relative">
      <div className="border-b border-[#333333] pb-3 mb-6 shrink-0 pr-48">
        <h3 className="text-2xl font-black text-[#FF9100]">In-Flight Diversion</h3>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-4">
        {!hasOpenDefects && (
          <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg">
            <div><div className="text-white font-bold">Confirm Nil Defects</div><div className="text-[#8fa0a6] text-xs mt-0.5">No defects were reported during this sector.</div></div>
            <div onClick={() => setNcNilDefects(!ncNilDefects)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer shadow-inner ${ncNilDefects ? 'bg-[#FF9100]' : 'bg-[#404040]'}`}><div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${ncNilDefects ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks Off (Z)</label><input type="text" value={ncBlocksOff} onChange={e=>setNcBlocksOff(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Take Off (Z)</label><input type="text" value={ncTakeOff} onChange={e=>setNcTakeOff(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Landing (Z)</label><input type="text" value={ncLanding} onChange={e=>setNcLanding(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Blocks On (Z)</label><input type="text" value={ncBlocksOn} onChange={e=>setNcBlocksOn(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Landings</label><input type="number" min="0" value={ncLandingsCount} onChange={e=>setNcLandingsCount(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Overshoots</label><input type="number" min="0" value={ncOvershoots} onChange={e=>setNcOvershoots(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Touch-and-gos</label><input type="number" min="0" value={ncTouchGo} onChange={e=>setNcTouchGo(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">EDTO</label>
            <select value={ncEdto} onChange={e=>setNcEdto(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]"><option>No</option><option>60 mins</option><option>120 mins</option><option>180 mins</option><option>207 mins</option><option>240 mins</option></select>
          </div>
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Autoland</label>
            <select value={ncAutoland} onChange={e=>setNcAutoland(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]"><option>Not Attempted</option><option>Successful</option><option>Unsuccessful</option></select>
          </div>
        </div>
        <hr className="border-dashed border-[#404040]" />
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Fuel T(KGSX1000)</label><input type="number" step="0.1" value={ncArrivalFuel} onChange={e=>setNcArrivalFuel(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#FF9100] p-3 rounded font-bold text-[#FF9100] outline-none focus:border-white transition-colors" /></div>
          <div>
            <label className="block text-xs text-[#8fa0a6] font-bold mb-1">Arrival Station (Diversion)</label>
            <input type="text" value={divArrival} onChange={e=>setDivArrival(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100] uppercase" placeholder="e.g. RCTP" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">Commander's Name</label><input type="text" value={ncCmdr} onChange={e=>setNcCmdr(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
          <div><label className="block text-xs text-[#8fa0a6] font-bold mb-1">GalaCXy ID</label><input type="text" value={ncGalaxyId} onChange={e=>setNcGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#1a1a1a] border border-[#404040] p-3 rounded font-bold text-white outline-none focus:border-[#FF9100]" /></div>
        </div>
      </div>
      {isValid && (
        <button onClick={() => finalizeSector("Diversion", divArrival, ncArrivalFuel, { cmdr: ncCmdr }, tlData, updateTechLogData, setActiveTask)} className="w-full mt-4 py-4 bg-[#FF9100] text-black font-black rounded-lg hover:bg-[#FFA000] shadow-[0_0_15px_rgba(255,145,0,0.3)] animate-fade-in tracking-widest shrink-0">
          CONFIRM DIVERSION
        </button>
      )}
    </div>
  );
}

// 🚪 8. Did Not Depart Gate Form (保持不變，因 DND 不結算 sector)
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
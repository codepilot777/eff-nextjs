"use client";
import { useState } from "react";

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
        {isValid && <button onClick={handleConfirm} className="bg-[#00E676] text-black font-black px-6 py-2.5 rounded-lg hover:bg-[#00c853] shadow-[0_0_15px_rgba(0,230,118,0.3)] animate-fade-in tracking-widest">CONFIRM</button>}
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
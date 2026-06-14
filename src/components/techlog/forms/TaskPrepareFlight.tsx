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
    if (!isValid) return;
    updateTechLogData({ 
      tl_prepared: true, tl_flight_status: "PREPARED",
      tl_prep_flt: prepFlightNo, tl_prep_dep: prepOrigin, tl_prep_arr: prepDest,
      tl_cmdr: prepCmdr, tl_galaxy_id: prepGalaxyId
    });
    setActiveTask("fuel_record");
  };

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* 🌟 Header */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3 shrink-0">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.499 4.499 0 00-1.757 4.306 4.499 4.499 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
        Prepare Flight
      </h3>

      {/* 🌟 表單內容區 */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">
        
        {/* Flight Number */}
        <div>
          <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Flight Number</label>
          <input type="text" value={prepFlightNo} onChange={e => setPrepFlightNo(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#00E676] transition-colors uppercase shadow-inner placeholder:text-[#333]" placeholder="e.g. CX581" />
        </div>
        
        {/* Origin / Dest */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Origin Station</label>
            <input type="text" value={prepOrigin} onChange={e => setPrepOrigin(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#00E676] transition-colors uppercase shadow-inner text-center" maxLength={4} />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Destination Station</label>
            <input type="text" value={prepDest} onChange={e => setPrepDest(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#00E676] transition-colors uppercase shadow-inner text-center" maxLength={4} />
          </div>
        </div>
        
        {/* Flight Type (Segmented Control) */}
        <div>
          <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Flight Type</label>
          <div className="flex gap-3">
            {['Revenue', 'Non-Revenue', 'Ferry'].map(type => (
              <button 
                key={type} 
                onClick={() => setPrepType(type)}
                className={`flex-1 py-3.5 rounded-xl border text-[0.65rem] font-bold tracking-widest uppercase transition-all outline-none ${
                  prepType === type 
                    ? 'bg-[#00E676]/10 border-[#00E676] text-[#00E676] shadow-inner' 
                    : 'bg-[#0a0a0a] border-[#444] text-[#8fa0a6] hover:border-[#8fa0a6] hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>
        
        {/* Commander / Galaxy ID */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Commander</label>
            <input type="text" value={prepCmdr} onChange={e => setPrepCmdr(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#00E676] transition-colors uppercase shadow-inner placeholder:text-[#444] placeholder:font-sans" placeholder="e.g. CHAN T M" />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">GalaCXy ID</label>
            <input type="text" value={prepGalaxyId} onChange={e => setPrepGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#00E676] transition-colors uppercase shadow-inner placeholder:text-[#444] placeholder:font-sans" placeholder="e.g. 123456" />
          </div>
        </div>
        
        {/* De-icing Toggle */}
        <div 
          onClick={() => setPrepDeicing(!prepDeicing)} 
          className="flex items-center justify-between bg-[#0a0a0a] border border-[#444] p-5 rounded-xl mt-2 cursor-pointer hover:border-[#666] transition-colors select-none shadow-inner"
        >
          <div className="flex flex-col">
            <div className="text-white font-bold uppercase tracking-widest text-[0.75rem]">Require De-icing</div>
            <div className="text-[#555] text-[0.65rem] mt-1 font-bold uppercase tracking-widest">Select if winter operations de-icing is needed</div>
          </div>
          <div className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner ${prepDeicing ? 'bg-[#00E676]' : 'bg-[#333]'}`}>
            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${prepDeicing ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>
        
      </div>

      {/* 🌟 底部 Confirm 按鈕 */}
      <button 
        onClick={handleConfirm} 
        disabled={!isValid}
        className={`w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 ${
          isValid 
            ? 'bg-[#C6FF00] text-black hover:bg-[#a8db00] shadow-[0_4px_15px_rgba(198,255,0,0.3)]' 
            : 'bg-[#1a1a1a] text-[#444] border border-[#333] cursor-not-allowed'
        }`}
      >
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Confirm & Proceed
      </button>

    </div>
  );
}
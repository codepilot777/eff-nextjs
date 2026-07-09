"use client";
import { useState } from "react";
import { finalizeSector } from "./sharedUtils";
import { BlockTimesGrid } from "./shared/BlockTimesGrid";
import { OperationsCountersGrid } from "./shared/OperationsCountersGrid";
import { EdtoAutolandSelects } from "./shared/EdtoAutolandSelects";

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
    <div className="flex flex-col h-full relative font-sans">
      
      {/* 🌟 Header */}
      <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3 shrink-0">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Normal Close Flight
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">
        
        {/* Confirm Nil Defects Toggle */}
        {!hasOpenDefects && (
          <div 
            onClick={() => setNcNilDefects(!ncNilDefects)} 
            className={`flex items-center justify-between bg-[#0a0a0a] border p-5 rounded-xl cursor-pointer transition-colors select-none shadow-inner ${ncNilDefects ? 'border-[#00E676]/50' : 'border-[#444] hover:border-[#666]'}`}
          >
            <div className="flex flex-col">
              <div className={`font-bold uppercase tracking-widest text-[0.75rem] transition-colors ${ncNilDefects ? 'text-[#00E676]' : 'text-white'}`}>Confirm Nil Defects</div>
              <div className="text-[#555] text-[0.65rem] mt-1.5 font-bold uppercase tracking-widest">No defects were reported during this sector.</div>
            </div>
            <div className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner shrink-0 ${ncNilDefects ? 'bg-[#00E676]' : 'bg-[#333]'}`}>
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${ncNilDefects ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        )}

        {/* 🌟 Block Times */}
        <BlockTimesGrid
          theme="green"
          blocksOff={ncBlocksOff} setBlocksOff={setNcBlocksOff}
          takeOff={ncTakeOff} setTakeOff={setNcTakeOff}
          landing={ncLanding} setLanding={setNcLanding}
          blocksOn={ncBlocksOn} setBlocksOn={setNcBlocksOn}
        />

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 Operations Counters */}
        <OperationsCountersGrid
          theme="green"
          landingsCount={ncLandingsCount} setLandingsCount={setNcLandingsCount}
          overshoots={ncOvershoots} setOvershoots={setNcOvershoots}
          touchGo={ncTouchGo} setTouchGo={setNcTouchGo}
        />

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 EDTO & Autoland */}
        <EdtoAutolandSelects
          theme="green"
          edto={ncEdto} setEdto={setNcEdto}
          autoland={ncAutoland} setAutoland={setNcAutoland}
        />

        {/* Divider */}
        <div className="h-px bg-[#333] w-full my-1"></div>

        {/* 🌟 Fuel & Station */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-[0.65rem] text-[#00E676] font-bold uppercase tracking-widest mb-2 flex justify-between">
              <span>Arrival Fuel</span>
              <span className="text-[#555]">T (KGS x 1000)</span>
            </label>
            <input type="number" step="0.1" value={ncArrivalFuel} onChange={e=>setNcArrivalFuel(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#00E676]/50 p-4 rounded-xl font-mono font-bold text-[#00E676] text-lg outline-none focus:border-[#00E676] shadow-inner" placeholder="e.g. 10.5" />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Arrival Station</label>
            <input type="text" value={tlData?.tl_prep_arr || "KIX"} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] outline-none cursor-not-allowed text-center text-lg shadow-inner" />
          </div>
        </div>

        {/* 🌟 Commander Details */}
        <div className="grid grid-cols-2 gap-5 mt-2">
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Commander's Name</label>
            <input type="text" value={ncCmdr} onChange={e=>setNcCmdr(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#00E676] uppercase shadow-inner" />
          </div>
          <div>
            <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">GalaCXy ID</label>
            <input type="text" value={ncGalaxyId} onChange={e=>setNcGalaxyId(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#444] p-4 rounded-xl font-mono font-bold text-white outline-none focus:border-[#00E676] uppercase shadow-inner" />
          </div>
        </div>

      </div>

      {/* 🌟 底部 Confirm 按鈕 */}
      {isValid ? (
        <button 
          onClick={() => finalizeSector("Normal Close", tlData?.tl_prep_arr || "KIX", ncArrivalFuel, { cmdr: ncCmdr, blocksOff: ncBlocksOff, takeOff: ncTakeOff, landing: ncLanding, blocksOn: ncBlocksOn, edto: ncEdto, autoland: ncAutoland, landingsCount: ncLandingsCount, overshoots: ncOvershoots, touchGo: ncTouchGo }, tlData, updateTechLogData, setActiveTask)} 
          className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shrink-0 bg-[#C6FF00] text-black hover:bg-[#a8db00] shadow-[0_4px_15px_rgba(198,255,0,0.3)]"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Confirm Normal Close
        </button>
      ) : (
        <div className="w-full py-4.5 mt-4 rounded-xl font-black text-[0.8rem] uppercase tracking-widest flex items-center justify-center gap-3 shrink-0 bg-[#1a1a1a] text-[#444] border border-[#333] cursor-not-allowed">
          Please fill in all required fields
        </div>
      )}
    </div>
  );
}
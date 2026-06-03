"use client";
import { useState } from "react";
import { finalizeSector } from "./sharedUtils";

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
        <button onClick={() => finalizeSector("Ground Return", tlData?.tl_prep_dep || "HKG", ncArrivalFuel, { cmdr: ncCmdr, blocksOff: ncBlocksOff, blocksOn: ncBlocksOn }, tlData, updateTechLogData, setActiveTask)} className="w-full mt-4 py-4 bg-[#FF1744] text-white font-black rounded-lg hover:bg-[#D50000] shadow-[0_0_15px_rgba(255,23,68,0.3)] animate-fade-in tracking-widest shrink-0">
          CONFIRM GROUND RETURN
        </button>
      )}
    </div>
  );
}
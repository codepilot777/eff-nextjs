"use client";
import { useState } from "react";
import { finalizeSector } from "./sharedUtils";

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
        <button onClick={() => finalizeSector("Diversion", divArrival, ncArrivalFuel, { cmdr: ncCmdr, blocksOff: ncBlocksOff, takeOff: ncTakeOff, landing: ncLanding, blocksOn: ncBlocksOn, edto: ncEdto, autoland: ncAutoland, landingsCount: ncLandingsCount, overshoots: ncOvershoots, touchGo: ncTouchGo }, tlData, updateTechLogData, setActiveTask)} className="w-full mt-4 py-4 bg-[#FF9100] text-black font-black rounded-lg hover:bg-[#FFA000] shadow-[0_0_15px_rgba(255,145,0,0.3)] animate-fade-in tracking-widest shrink-0">
          CONFIRM DIVERSION
        </button>
      )}
    </div>
  );
}
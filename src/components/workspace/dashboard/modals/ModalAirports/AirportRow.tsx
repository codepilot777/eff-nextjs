"use client";
import { useState } from "react";

export function AirportRow({ data }: { data: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAltn = data.type === "ALTN";
  
  let bgClass = "bg-[#1A1A1A] hover:bg-[#222222]";
  let tagClass = "bg-[#333] text-white";
  let borderClass = "border-b border-[#333]";
  
  if (data.type === "DEP") {
    bgClass = "bg-[#1E1E1E] hover:bg-[#252525]";
    tagClass = "bg-[#444] text-[#e2e8f0]";
  } else if (data.type === "ARR") {
    bgClass = "bg-[#18181A] hover:bg-[#202022]";
    tagClass = "bg-[#555] text-white";
    borderClass = "border-b-2 border-black"; 
  } else if (data.isSelected) {
    bgClass = "bg-[#252525]";
    tagClass = "bg-[#666] text-white";
  }

  const handleToggle = () => {
    if (isAltn && data.route) setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div 
        onClick={handleToggle}
        className={`grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-3 ${borderClass} ${bgClass} text-[#a1a1aa] text-sm items-center transition-colors ${isAltn ? 'cursor-pointer' : ''} ${data.isSelected ? 'border-l-4 border-l-[#888]' : 'border-l-4 border-l-transparent'}`}
      >
        <div className="font-bold text-lg flex items-center pl-1 tracking-wide text-[#f4f4f5]">
          {isAltn && <span className="mr-2 text-sm text-[#71717a] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>{'>'}</span>}
          {!isAltn && <span className="w-4 mr-2"></span>}
          {data.icao} 
          <span className={`${tagClass} text-[0.6rem] px-1.5 py-0.5 rounded ml-2.5 font-bold tracking-widest leading-none shadow-sm`}>{data.type}</span>
        </div>
        
        <div className="text-[0.7rem] leading-tight text-[#71717a]">--<br/>--</div>
        
        <div className="text-[0.7rem] leading-tight text-[#e4e4e7] font-mono">{data.mdf ? `${data.mdf} T` : '--'}<br/><span className="text-[#71717a]">--</span></div>
        <div className="text-[0.7rem] leading-tight text-[#e4e4e7] font-mono">{data.mtr ? `${data.mtr}°` : '--'}<br/><span className="text-[#71717a]">--</span></div>
        <div className="text-[0.7rem] leading-tight text-[#e4e4e7] font-mono">{data.dist ? `${data.dist} NM` : '--'}<br/><span className="text-[#71717a]">--</span></div>
        
        <div className="text-[0.7rem] leading-tight font-mono text-[#e4e4e7]">FL {data.fl}<br/><span className="text-[#71717a] font-sans font-bold">{data.mora || '--'}</span></div>
        <div className="text-[0.7rem] leading-tight text-[#e4e4e7] font-mono">{data.tas ? `${data.tas} kt` : '--'}<br/><span className="text-[#a1a1aa]">{data.windComp || '--'}</span></div>
        <div className="text-[0.7rem] leading-tight font-mono text-[#e4e4e7]">{data.time || '--'}<br/><span className="text-white font-bold">{data.eta}</span></div>
        <div className="text-[0.7rem] leading-tight text-[#e4e4e7]">APP<br/><span className="text-white font-bold font-mono text-[0.8rem]">RWY {data.rwy}</span></div>
        <div className="flex justify-center"><div className="border border-[#444] px-2 py-1 text-center rounded text-[0.65rem] tracking-widest font-mono font-bold bg-[#111] text-[#a1a1aa]">{data.window}</div></div>
        
        {/* 🌟 顯示 TAF 解析出嚟嘅 Forecast 天氣 (Ceil / Vis) */}
        <div className="text-[0.7rem] leading-tight text-white font-mono">--<br/>{data.wx?.ceil}</div>
        <div className="text-[0.7rem] leading-tight text-white font-mono">--<br/>{data.wx?.vis}</div>
        
        {/* 🌟 顯示 H/T WC (單行) 與 XWC (純數字無 X) */}
        <div className="text-[0.7rem] leading-tight font-mono font-bold text-white">{data.wx?.ht || '--'}</div>
        <div className="text-[0.7rem] leading-tight font-mono font-bold text-white">{data.wx?.xwc || '--'}</div>
      </div>

      {isExpanded && isAltn && (
        <div className="col-span-full bg-[#111111] border-b border-[#333] px-10 py-3 text-[0.7rem] font-mono text-[#a1a1aa] shadow-inner animate-fade-in flex flex-col gap-1">
          <div className="flex">
            <span className="text-[#71717a] font-bold uppercase tracking-widest w-20 shrink-0 select-none">Routing:</span>
            <span className="text-[#d4d4d8] leading-relaxed break-words">{data.route}</span>
          </div>
          <div className="flex mt-1 pt-1 border-t border-[#222]">
            <span className="text-[#71717a] font-bold uppercase tracking-widest w-20 shrink-0 select-none">TAF Extr:</span>
            <span className="text-[#a1a1aa] leading-relaxed">Ceiling: <strong className="text-white">{data.wx?.ceil}</strong> ft | Vis: <strong className="text-white">{data.wx?.vis}</strong> m | Wind: <strong className="text-white">{data.wx?.wind}</strong></span>
          </div>
        </div>
      )}
    </>
  );
}
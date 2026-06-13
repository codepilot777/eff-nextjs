"use client";
import { useState, useEffect } from "react";

export default function TechLogHistory({ tlData }: any) {
  const realHistory = tlData?.history || [];
  
  const [selectedHist, setSelectedHist] = useState<number | null>(null);

  useEffect(() => {
    if (realHistory.length > 0 && !selectedHist) {
      setSelectedHist(realHistory[0].id);
    }
  }, [realHistory]);

  if (realHistory.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#555] bg-[#1E1E1E] rounded-2xl border border-[#333] shadow-lg">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mb-6 text-[#333]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-[0.8rem] font-bold tracking-widest uppercase">No history records found for this aircraft.</span>
      </div>
    );
  }

  const selectedDetail = realHistory.find((r: any) => r.id === selectedHist);

  return (
    <div className="w-full h-full flex gap-4 overflow-hidden font-sans">
      
      {/* 👈 左側：歷史列表 */}
      <div className="flex-[3] bg-[#1E1E1E] border border-[#333] rounded-2xl p-5 shadow-lg overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        <h4 className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest mb-2 border-b border-[#333] pb-3 shrink-0 flex items-center gap-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v11.25a1.875 1.875 0 01-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V6.375c0-1.036.84-1.875 1.875-1.875z" /></svg>
          Sector Logs
        </h4>
        
        {realHistory.map((r: any) => {
          const isSelected = selectedHist === r.id;
          return (
            <button 
              key={r.id} 
              onClick={() => setSelectedHist(r.id)} 
              className={`text-left p-4 rounded-xl border outline-none transition-all flex flex-col gap-2 ${
                isSelected 
                  ? 'bg-[#0a0a0a] border-[#00E676]/50 shadow-md border-l-4 border-l-[#00E676]' 
                  : 'bg-transparent border-[#333] hover:bg-[#252525] border-l-4 border-l-transparent'
              }`}
            >
              <div className="w-full flex justify-between items-center leading-none">
                <span className={`text-[0.65rem] font-bold tracking-widest uppercase ${isSelected ? 'text-white' : 'text-[#8fa0a6]'}`}>
                  {r.date}
                </span>
                <span className={`px-2 py-0.5 rounded text-[0.6rem] uppercase tracking-widest font-black ${
                  r.action === 'Normal Close' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30' : 
                  r.action === 'Diversion' ? 'bg-[#FF9100]/10 text-[#FF9100] border border-[#FF9100]/30' : 
                  'bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/30'
                }`}>
                  {r.action}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-black text-xl leading-none ${isSelected ? 'text-[#00E676]' : 'text-white'}`}>
                  {r.flt}
                </span>
                <span className={`text-[0.75rem] font-bold leading-none ${isSelected ? 'text-[#e2e8f0]' : 'text-[#8fa0a6]'}`}>
                  {r.route}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 👉 右側：歷史詳情 */}
      <div className="flex-[7] bg-[#1E1E1E] border border-[#333] rounded-2xl p-7 shadow-lg overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        {selectedDetail && (
          <div className="animate-fade-in flex flex-col h-full">
            
            {/* 🌟 Header 區域：左邊航段資訊，右邊 Action Pill */}
            <div className="flex justify-between items-start border-b border-[#333] pb-5 mb-6 shrink-0">
              <div>
                <h3 className="text-4xl font-black font-mono text-white leading-none mb-3 flex items-center gap-4">
                  {selectedDetail.flt}
                  <span className={`px-3 py-1 rounded-lg text-[0.65rem] font-black uppercase tracking-widest font-sans leading-none ${
                    selectedDetail.action === 'Normal Close' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/50' : 
                    selectedDetail.action === 'Diversion' ? 'bg-[#FF9100]/10 text-[#FF9100] border border-[#FF9100]/50' : 
                    'bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/50'
                  }`}>
                    {selectedDetail.action}
                  </span>
                </h3>
                <div className="text-[#8fa0a6] text-[0.75rem] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="text-white">{selectedDetail.route}</span>
                  <span className="opacity-50">|</span>
                  <span>{selectedDetail.date}</span>
                </div>
              </div>
            </div>

            {/* ⏱️ Operations Times (專屬黑底長條卡片) */}
            <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-4 flex justify-between items-center mb-6 shrink-0 shadow-inner">
              <div className="flex items-center gap-2 text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Sector Times
              </div>
              <div className="flex gap-8 text-right">
                {selectedDetail.blocksOff && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#555] font-bold">Blocks Off</span><span className="text-[#00E676] font-mono text-sm font-bold">{selectedDetail.blocksOff} z</span></div>
                )}
                {selectedDetail.takeOff && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#555] font-bold">Take Off</span><span className="text-white font-mono text-sm font-bold">{selectedDetail.takeOff} z</span></div>
                )}
                {selectedDetail.landing && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#555] font-bold">Landing</span><span className="text-white font-mono text-sm font-bold">{selectedDetail.landing} z</span></div>
                )}
                {selectedDetail.blocksOn && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#555] font-bold">Blocks On</span><span className="text-[#00E676] font-mono text-sm font-bold">{selectedDetail.blocksOn} z</span></div>
                )}
              </div>
            </div>

            {/* 🌟 第 1 行：Defects + Maintenance */}
            <div className="grid grid-cols-2 gap-5 mb-5 shrink-0">
              <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-inner">
                <h4 className="text-[#FF9100] font-bold mb-4 uppercase text-[0.65rem] tracking-widest border-b border-[#333] pb-3 flex items-center gap-2">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Defects Logged
                </h4>
                {selectedDetail.def?.length > 0 ? (
                  <div className="text-[0.75rem] text-[#e2e8f0] flex flex-col gap-3 font-mono">
                    {selectedDetail.def.map((d: any, i: number) => (
                      <div key={i} className="leading-relaxed flex gap-2">
                        <span className={`font-bold shrink-0 ${d.status === "OPEN" ? "text-[#FF1744]" : "text-[#FF9100]"}`}>[{d.id}]</span> 
                        <span className="opacity-90">{d.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[#555] text-[0.75rem] font-bold uppercase tracking-widest italic text-center py-4">Nil defects reported.</div>
                )}
              </div>

              <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-inner">
                <h4 className="text-[#00E676] font-bold mb-4 uppercase text-[0.65rem] tracking-widest border-b border-[#333] pb-3 flex items-center gap-2">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M15.17 11.42a4.5 4.5 0 11-6.34-6.34 4.5 4.5 0 016.34 6.34zM10 14H6l-3 3v3h3l3-3v-4z" /></svg>
                  Maintenance & Servicing
                </h4>
                {(!selectedDetail.checks?.length && !selectedDetail.serv?.length) ? (
                   <div className="text-[#555] text-[0.75rem] font-bold uppercase tracking-widest italic text-center py-4">Nil records.</div>
                ) : (
                  <ul className="text-[0.75rem] text-[#e2e8f0] flex flex-col gap-2 list-none pl-1">
                    {selectedDetail.checks?.map((c: string, i: number) => <li key={`c-${i}`} className="flex items-center gap-2"><span className="text-[#00E676] text-xs">✓</span> {c}</li>)}
                    {selectedDetail.serv?.map((s: string, i: number) => <li key={`s-${i}`} className="flex items-center gap-2"><span className="text-[#00E676] text-xs">✓</span> {s}</li>)}
                  </ul>
                )}
              </div>
            </div>

            {/* 🌟 第 2 行：Fuel + Flight Information */}
            <div className="grid grid-cols-[1fr_1.5fr] gap-5 shrink-0">
              
              <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-inner">
                <h4 className="text-white font-bold mb-4 uppercase text-[0.65rem] tracking-widest border-b border-[#333] pb-3 flex items-center gap-2">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" /></svg>
                  Fuel Records
                </h4>
                <div className="text-[0.75rem] text-[#e2e8f0] mb-3 flex justify-between items-center bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#333]">
                  <span className="text-[#8fa0a6] uppercase tracking-widest font-bold">Actual Uplift</span> 
                  <strong className="text-white font-mono text-sm">{selectedDetail.fuelUp || "0.0"} T</strong>
                </div>
                <div className="text-[0.75rem] text-[#e2e8f0] flex justify-between items-center bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#333]">
                  <span className="text-[#8fa0a6] uppercase tracking-widest font-bold">Arrival FOB</span> 
                  <strong className="text-[#00E676] font-mono text-sm">{selectedDetail.fuelArr || "0.0"} T</strong>
                </div>
              </div>

              <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-inner">
                <h4 className="text-white font-bold mb-4 uppercase text-[0.65rem] tracking-widest border-b border-[#333] pb-3 flex items-center gap-2">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  Flight Information
                </h4>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[0.75rem] text-[#e2e8f0]">
                  <div className="col-span-2 bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#333] flex justify-between items-center">
                    <span className="text-[#8fa0a6] uppercase tracking-widest font-bold">Commander</span> 
                    <strong className="text-white">{selectedDetail.cmdr || "N/A"}</strong>
                  </div>
                  
                  {selectedDetail.landingsCount && (
                    <div className="flex justify-between items-center"><span className="text-[#8fa0a6] uppercase tracking-widest font-bold text-[0.65rem]">Landings</span> <strong className="text-white font-mono">{selectedDetail.landingsCount}</strong></div>
                  )}
                  {selectedDetail.overshoots && (
                    <div className="flex justify-between items-center"><span className="text-[#8fa0a6] uppercase tracking-widest font-bold text-[0.65rem]">Overshoots</span> <strong className="text-white font-mono">{selectedDetail.overshoots}</strong></div>
                  )}
                  {selectedDetail.touchGo && (
                    <div className="flex justify-between items-center"><span className="text-[#8fa0a6] uppercase tracking-widest font-bold text-[0.65rem]">Touch & Go</span> <strong className="text-white font-mono">{selectedDetail.touchGo}</strong></div>
                  )}
                  {selectedDetail.edto && selectedDetail.edto !== "No" && (
                    <div className="flex justify-between items-center"><span className="text-[#8fa0a6] uppercase tracking-widest font-bold text-[0.65rem]">EDTO</span> <strong className="text-[#00E676]">{selectedDetail.edto}</strong></div>
                  )}
                  {selectedDetail.autoland && selectedDetail.autoland !== "Not Attempted" && (
                    <div className="col-span-2 flex justify-between items-center mt-1 border-t border-dashed border-[#333] pt-2">
                      <span className="text-[#8fa0a6] uppercase tracking-widest font-bold text-[0.65rem]">Autoland</span> 
                      <strong className="text-[#00E676]">{selectedDetail.autoland}</strong>
                    </div>
                  )}
                </div>
              </div>
              
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
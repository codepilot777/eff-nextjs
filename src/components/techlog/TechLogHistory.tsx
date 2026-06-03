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
      <div className="w-full h-full flex flex-col items-center justify-center text-[#8fa0a6] italic bg-[#1a1a1a] rounded-xl border border-[#333333]">
        <span className="text-4xl mb-3">📭</span>
        No history records found for this aircraft.
      </div>
    );
  }

  const selectedDetail = realHistory.find((r: any) => r.id === selectedHist);

  return (
    <div className="w-full h-full flex gap-4 overflow-hidden">
      
      {/* 👈 左側：歷史列表 */}
      <div className="flex-[3] bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 shadow-lg overflow-y-auto flex flex-col gap-2">
        <h4 className="text-[#00bfa5] font-bold mb-2 uppercase tracking-widest text-sm">Sector Logs</h4>
        {realHistory.map((r: any) => (
          <button 
            key={r.id} 
            onClick={() => setSelectedHist(r.id)} 
            className={`text-left p-4 rounded-lg border transition-colors ${selectedHist === r.id ? 'bg-[#1a1a1a] border-[#00bfa5] shadow-md' : 'bg-[#0a0a0a] border-[#333333] hover:border-[#8fa0a6]'}`}
          >
            <div className="text-xs text-[#8fa0a6] font-bold flex justify-between">
              <span>{r.date}</span>
              <span className={`px-1.5 rounded text-[0.6rem] uppercase font-black ${r.action === 'Normal Close' ? 'bg-[#00E676]/20 text-[#00E676]' : r.action === 'Diversion' ? 'bg-[#FF9100]/20 text-[#FF9100]' : 'bg-[#FF1744]/20 text-[#FF1744]'}`}>
                {r.action}
              </span>
            </div>
            <div className="text-[#00bfa5] font-black text-xl mt-1">{r.flt}</div>
            <div className="text-sm font-bold text-white mt-1">{r.route}</div>
          </button>
        ))}
      </div>

      {/* 👉 右側：歷史詳情 */}
      <div className="flex-[7] bg-[#2a2a2a] border border-[#333333] rounded-xl p-6 shadow-lg overflow-y-auto">
        {selectedDetail && (
          <div className="animate-fade-in">
            
            {/* 🌟 Header 區域：左邊航段資訊，右邊 Operations Times */}
            <div className="flex justify-between items-start border-b border-[#333333] pb-4 mb-6">
              <div>
                <h3 className="text-3xl font-black text-[#00E676]">Sector: {selectedDetail.flt}</h3>
                <div className="text-[#8fa0a6] font-bold mt-1 tracking-widest">
                  {selectedDetail.route} &nbsp;|&nbsp; {selectedDetail.date}
                </div>
              </div>
              
              {/* ⏱️ Operations Times 直接攝入 Header 右邊空位 */}
              <div className="flex flex-col items-end gap-3">
                <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-widest ${selectedDetail.action === 'Normal Close' ? 'bg-[#00E676] text-black' : selectedDetail.action === 'Diversion' ? 'bg-[#FF9100] text-black' : 'bg-[#FF1744] text-white'}`}>
                  {selectedDetail.action}
                </span>
                
                {/* Data-Driven Logic: 有咩 Render 咩 */}
                <div className="flex gap-4 text-right">
                  {selectedDetail.blocksOff && (
                    <div><div className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6]">Blocks Off</div><div className="text-white font-mono text-sm">{selectedDetail.blocksOff} Z</div></div>
                  )}
                  {selectedDetail.takeOff && (
                    <div><div className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6]">Take Off</div><div className="text-white font-mono text-sm">{selectedDetail.takeOff} Z</div></div>
                  )}
                  {selectedDetail.landing && (
                    <div><div className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6]">Landing</div><div className="text-white font-mono text-sm">{selectedDetail.landing} Z</div></div>
                  )}
                  {selectedDetail.blocksOn && (
                    <div><div className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6]">Blocks On</div><div className="text-white font-mono text-sm">{selectedDetail.blocksOn} Z</div></div>
                  )}
                </div>
              </div>
            </div>

            {/* 🌟 第 1 行：Defects (最重要) + Maintenance */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#FF9100] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">⚠️ Defects Logged</h4>
                {selectedDetail.def?.length > 0 ? (
                  <ul className="text-sm text-white flex flex-col gap-2 list-disc list-inside pl-2">
                    {selectedDetail.def.map((d: any, i: number) => (
                      <li key={i} className="leading-snug">
                        <span className={`font-bold ${d.status === "OPEN" ? "text-[#FF1744]" : "text-[#FF9100]"}`}>[{d.id}]</span> {d.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[#8fa0a6] text-sm italic">Nil defects reported.</div>
                )}
              </div>

              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#00bfa5] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">🔧 Maintenance & Servicing</h4>
                <ul className="text-sm text-[#e2e8f0] flex flex-col gap-1 list-disc list-inside pl-2">
                  {selectedDetail.checks?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  {selectedDetail.serv?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>

            {/* 🌟 第 2 行：Fuel + Flight Information (動態顯示) */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#00bfa5] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">⛽ Fuel Records</h4>
                <div className="text-sm text-[#e2e8f0] mb-2"><span className="text-[#8fa0a6] inline-block w-24">Actual Uplift:</span> <strong className="text-white font-mono">{selectedDetail.fuelUp} T</strong></div>
                <div className="text-sm text-[#e2e8f0]"><span className="text-[#8fa0a6] inline-block w-24">Arrival FOB:</span> <strong className="text-[#00E676] font-mono">{selectedDetail.fuelArr} T</strong></div>
              </div>

              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#00bfa5] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">👨‍✈️ Flight Information</h4>
                
                {/* Data-Driven Logic: Commander 必定有，其他數據有先 Render */}
                <div className="grid grid-cols-2 gap-y-2 text-sm text-[#e2e8f0]">
                  <div className="col-span-2">
                    <span className="text-[#8fa0a6] inline-block w-24">Commander:</span> <strong className="text-white">{selectedDetail.cmdr}</strong>
                  </div>
                  
                  {selectedDetail.landingsCount && (
                    <div><span className="text-[#8fa0a6] inline-block w-20">Landings:</span> <strong className="text-white">{selectedDetail.landingsCount}</strong></div>
                  )}
                  {selectedDetail.overshoots && (
                    <div><span className="text-[#8fa0a6] inline-block w-20">Overshoots:</span> <strong className="text-white">{selectedDetail.overshoots}</strong></div>
                  )}
                  {selectedDetail.touchGo && (
                    <div><span className="text-[#8fa0a6] inline-block w-20">Touch & Go:</span> <strong className="text-white">{selectedDetail.touchGo}</strong></div>
                  )}
                  {selectedDetail.edto && selectedDetail.edto !== "No" && (
                    <div><span className="text-[#8fa0a6] inline-block w-20">EDTO:</span> <strong className="text-[#00bfa5]">{selectedDetail.edto}</strong></div>
                  )}
                  {selectedDetail.autoland && selectedDetail.autoland !== "Not Attempted" && (
                    <div className="col-span-2"><span className="text-[#8fa0a6] inline-block w-20">Autoland:</span> <strong className="text-[#00bfa5]">{selectedDetail.autoland}</strong></div>
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
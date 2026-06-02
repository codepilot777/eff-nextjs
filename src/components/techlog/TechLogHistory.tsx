"use client";
import { useState, useEffect } from "react";

export default function TechLogHistory({ tlData }: any) {
  const realHistory = tlData?.history || [];
  
  // 預設選中最新的一筆歷史記錄
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
              <span className={`px-1.5 rounded text-[0.6rem] uppercase ${r.action === 'Normal Close' ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-[#FF1744]/20 text-[#FF1744]'}`}>
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
            <div className="flex justify-between items-end border-b border-[#333333] pb-4 mb-6">
              <div>
                <h3 className="text-3xl font-black text-[#00E676]">Sector: {selectedDetail.flt}</h3>
                <div className="text-[#8fa0a6] font-bold mt-1 tracking-widest">{selectedDetail.route} &nbsp;|&nbsp; {selectedDetail.date}</div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded text-xs font-black uppercase tracking-widest ${selectedDetail.action === 'Normal Close' ? 'bg-[#00E676] text-black' : 'bg-[#FF1744] text-white'}`}>
                  {selectedDetail.action}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#00bfa5] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">👨‍✈️ Flight Information</h4>
                <div className="text-sm text-[#e2e8f0] mb-2"><span className="text-[#8fa0a6] inline-block w-24">Commander:</span> <strong className="text-white">{selectedDetail.cmdr}</strong></div>
              </div>
              
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#00bfa5] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">⛽ Fuel Records</h4>
                <div className="text-sm text-[#e2e8f0] mb-2"><span className="text-[#8fa0a6] inline-block w-24">Actual Uplift:</span> <strong className="text-white">{selectedDetail.fuelUp} T</strong></div>
                <div className="text-sm text-[#e2e8f0]"><span className="text-[#8fa0a6] inline-block w-24">Arrival FOB:</span> <strong className="text-[#00E676]">{selectedDetail.fuelArr} T</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#00bfa5] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">🔧 Maintenance & Servicing</h4>
                <ul className="text-sm text-white flex flex-col gap-2 list-disc list-inside pl-4">
                  {selectedDetail.checks?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  {selectedDetail.serv?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                <h4 className="text-[#00bfa5] font-bold mb-3 uppercase text-xs tracking-widest border-b border-[#333333] pb-2">⚠️ Defects Logged</h4>
                {selectedDetail.def?.length > 0 ? (
                  <ul className="text-sm text-[#FF1744] flex flex-col gap-2 list-disc list-inside pl-4">
                    {selectedDetail.def.map((d: any, i: number) => <li key={i}>{d.description}</li>)}
                  </ul>
                ) : (
                  <div className="text-[#8fa0a6] text-sm italic">Nil defects reported.</div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
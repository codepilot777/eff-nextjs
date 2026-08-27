"use client";
import { useState, useEffect } from "react";
import { deriveHistoricalFuelRecord } from "@/lib/techlog/fuelRecord";
import { MaintenanceWorkCard } from "@/components/techlog/shared/MaintenanceWorkCard";
import { ServicingSummaryCard } from "@/components/techlog/shared/ServicingSummaryCard";
import { FuelRecordCard } from "@/components/techlog/shared/FuelRecordCard";

// 🌟 同 Commander's Acceptance 果句共用，純粹裝飾，冇對應嘅 data model 欄位
const MAINTENANCE_NOTICE = "PITOT / STATIC PROBE COVERS — NIL FITTED, ACCOUNTED FOR";

export default function TechLogHistory({ tlData }: any) {
  const realHistory = tlData?.flights || [];

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

  const selectedIndex = realHistory.findIndex((r: any) => r.id === selectedHist);
  const selectedDetail = selectedIndex >= 0 ? realHistory[selectedIndex] : undefined;
  // 🌟 flights array 係新至舊排（index 0 最新），所以「呢程之前」嘅嗰程
  // 喺 index+1——用嚟推返「呢程起飛前嘅 FOB」（睇 fuelRecord.ts）
  const priorEntry = selectedIndex >= 0 ? realHistory[selectedIndex + 1] : undefined;
  const fuelRecord = selectedDetail ? deriveHistoricalFuelRecord(selectedDetail.fuelUp, priorEntry?.fuelArr) : null;

  return (
    // 🌟 Mobile：列表/詳情兩個 panel 以前並排 + overflow-hidden，右邊詳情內容
    // 會俾裁走，而家 mobile 上下疊
    <div className="w-full h-full flex flex-col md:flex-row gap-4 md:overflow-hidden font-sans overflow-y-auto">

      {/* 👈 左側：歷史列表 */}
      <div className="md:flex-[3] bg-[#1E1E1E] border border-[#333] rounded-2xl p-5 shadow-lg md:overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent shrink-0 max-h-[40vh] md:max-h-none">
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

      {/* 👉 右側：歷史詳情——同 Commander's Acceptance 用返一樣嘅卡片式 format，
          等 trainee 睇歷史 sector 都同即場果套一致 */}
      <div className="md:flex-[7] bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 md:p-7 shadow-lg md:overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        {selectedDetail && fuelRecord && (
          <div className="animate-fade-in flex flex-col gap-6 pb-2">

            {/* 🌟 頂部：Sector 摘要橫幅（flight/route/date + 起降時間 + EDTO/Autoland） */}
            <div className="bg-[#00E676]/10 border border-[#00E676]/30 p-5 rounded-xl shadow-inner shrink-0">
              <div className="flex justify-between items-start flex-wrap gap-3 mb-4 pb-4 border-b border-[#00E676]/20">
                <div>
                  <h3 className="text-3xl font-black font-mono text-white leading-none mb-2 flex items-center gap-3 flex-wrap">
                    {selectedDetail.flt}
                    <span className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest font-sans leading-none ${
                      selectedDetail.action === 'Normal Close' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/50' :
                      selectedDetail.action === 'Diversion' ? 'bg-[#FF9100]/10 text-[#FF9100] border border-[#FF9100]/50' :
                      'bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/50'
                    }`}>
                      {selectedDetail.action}
                    </span>
                  </h3>
                  <div className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="text-white">{selectedDetail.route}</span>
                    <span className="opacity-50">|</span>
                    <span>{selectedDetail.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {selectedDetail.blocksOff && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Blocks Off</span><span className="text-white font-mono text-sm font-bold mt-0.5">{selectedDetail.blocksOff} z</span></div>
                )}
                {selectedDetail.takeOff && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Take Off</span><span className="text-white font-mono text-sm font-bold mt-0.5">{selectedDetail.takeOff} z</span></div>
                )}
                {selectedDetail.landing && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Landing</span><span className="text-white font-mono text-sm font-bold mt-0.5">{selectedDetail.landing} z</span></div>
                )}
                {selectedDetail.blocksOn && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Blocks On</span><span className="text-white font-mono text-sm font-bold mt-0.5">{selectedDetail.blocksOn} z</span></div>
                )}
                {selectedDetail.edto && selectedDetail.edto !== "No" && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">EDTO</span><span className="text-[#00E676] font-mono text-sm font-bold mt-0.5">{selectedDetail.edto}</span></div>
                )}
                {selectedDetail.autoland && selectedDetail.autoland !== "Not Attempted" && (
                  <div className="flex flex-col"><span className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Autoland</span><span className="text-[#00E676] font-mono text-sm font-bold mt-0.5">{selectedDetail.autoland}</span></div>
                )}
              </div>
            </div>

            <MaintenanceWorkCard entries={selectedDetail.tl_entries} noticeLine={MAINTENANCE_NOTICE} />

            {/* 🌟 Defects Logged——真數據，唔可以因為套 format 靜靜雞唔見咗 */}
            <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] shadow-inner shrink-0">
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

            <ServicingSummaryCard checksCompleted seed={String(selectedDetail.id)} />

            <FuelRecordCard title="Fuel Record" data={{ ...fuelRecord, doorCyclingConfirmed: true }} />

            {/* 🌟 Commander's Acceptance——呢個 sector 已經簽署接受咗，加埋 Landings/
                Overshoots/Touch & Go 呢類唔屬於摘要橫幅嘅飛行細節 */}
            <div className="bg-[#00E676]/10 border border-[#00E676]/30 p-5 rounded-xl shadow-inner shrink-0">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#00E676]/20">
                <div className="w-10 h-10 bg-[#00E676]/20 rounded-full flex items-center justify-center text-[#00E676] shrink-0">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9 9-4.03 9-9z" /></svg>
                </div>
                <div>
                  <div className="text-[#00E676] font-black text-[0.7rem] uppercase tracking-widest">Commander's Acceptance</div>
                  <div className="text-white font-mono font-bold text-sm mt-0.5">{selectedDetail.cmdr || "N/A"}</div>
                </div>
              </div>
              {(selectedDetail.landingsCount || selectedDetail.overshoots || selectedDetail.touchGo) && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  {selectedDetail.landingsCount && (
                    <div><div className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Landings</div><div className="text-white font-mono font-bold text-sm mt-0.5">{selectedDetail.landingsCount}</div></div>
                  )}
                  {selectedDetail.overshoots && (
                    <div><div className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Overshoots</div><div className="text-white font-mono font-bold text-sm mt-0.5">{selectedDetail.overshoots}</div></div>
                  )}
                  {selectedDetail.touchGo && (
                    <div><div className="text-[0.6rem] uppercase tracking-widest text-[#8fa0a6] font-bold">Touch &amp; Go</div><div className="text-white font-mono font-bold text-sm mt-0.5">{selectedDetail.touchGo}</div></div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

"use client";

// 🌟 抽出嚟畀 Commander's Acceptance（即場，讀 tlData.tl_entries）同 History
// 個 sector 詳情（讀返嗰個 sector finalize 嗰刻嘅 tl_entries snapshot）共用，
// 兩邊唔會走樣

export interface MaintenanceWorkEntry {
  id: string;
  time?: string;
  action: string;
  ref?: string;
  original_desc?: string;
  desc: string;
  sign?: string;
}

export function MaintenanceWorkCard({ entries, noticeLine }: { entries: MaintenanceWorkEntry[] | undefined; noticeLine?: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#333] p-5 rounded-xl shadow-inner">
      <h4 className="text-white font-bold text-[0.65rem] uppercase tracking-widest mb-4 border-b border-[#333] pb-2 flex items-center gap-2">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#00E676]"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M15.17 11.42a4.5 4.5 0 11-6.34-6.34 4.5 4.5 0 016.34 6.34zM10 14H6l-3 3v3h3l3-3v-4z" /></svg>
        Maintenance Work
      </h4>

      <div className="flex flex-col gap-3">
        {entries && entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="flex gap-4 p-3 bg-[#1a1a1a] border border-[#333] rounded-lg items-start">
              <div className="text-[0.65rem] text-[#8fa0a6] font-mono font-bold mt-0.5">{entry.time}</div>
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[0.55rem] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                    entry.action.includes("RECTIFIED") ? "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30" :
                    entry.action.includes("SERVICING") ? "bg-[#FF9100]/10 text-[#FF9100] border-[#FF9100]/30" :
                    entry.action.includes("RAISED") ? "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/30" :
                    "bg-[#2979FF]/10 text-[#2979FF] border-[#2979FF]/30"
                  }`}>
                    {entry.action}
                  </span>
                  <span className="text-white font-mono font-bold text-[0.7rem]">
                    {entry.ref && entry.ref !== "N/A" ? `REF: ${entry.ref}` : entry.id}
                  </span>
                </div>

                {entry.original_desc && (
                  <div className="mb-2 bg-[#0a0a0a] border-l-2 border-[#FF9100] p-2 rounded-r-md">
                    <div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-0.5">Reported Issue:</div>
                    <div className="text-[0.7rem] text-[#ccc] font-mono leading-snug">{entry.original_desc}</div>
                  </div>
                )}

                <div className="text-[0.75rem] text-[#e2e8f0] leading-relaxed">
                  <span className="text-[#8fa0a6] font-bold mr-1">{entry.original_desc ? "Action Taken:" : ""}</span>
                  {entry.desc}
                </div>

                {entry.sign && <div className="text-[0.6rem] text-[#555] font-mono font-bold mt-2 text-right">{entry.sign}</div>}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-[#555] text-[0.75rem] font-bold py-4 uppercase tracking-widest">
            No engineering actions recorded for this sector.
          </div>
        )}

        {noticeLine && (
          <div className="flex items-center gap-2.5 pt-3 mt-1 border-t border-[#333] text-[0.68rem] font-bold tracking-wide text-[#e2e8f0]">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#FF9100] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {noticeLine}
          </div>
        )}
      </div>
    </div>
  );
}

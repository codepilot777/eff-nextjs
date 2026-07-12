"use client";

const CATEGORIES = [
  { prefix: "P", label: "PADD" },
  { prefix: "S", label: "SADD" },
  { prefix: "A", label: "ADD" },
];

function getStatusBadge(status: string) {
  if (status === "OPEN") return "bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40";
  if (status === "DEFERRED") return "bg-[#FF9100]/20 text-[#FF9100] border-[#FF9100]/40";
  return "bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40";
}

export function ModalDefects({ techlogData }: any) {
  const defects = techlogData?.defects || [];

  return (
    <div className="w-full h-full font-sans flex flex-col gap-5">
      {CATEGORIES.map(({ prefix, label }) => {
        const items = defects.filter((d: any) => (d.id || "").startsWith(prefix));
        return (
          <div key={prefix} className="bg-[#1E1E1E] border border-[#333333] rounded-xl p-5 shadow-lg">
            <h3 className="text-white font-bold tracking-widest uppercase text-[0.9rem] mb-3 flex items-center gap-2">
              {label}
              <span className="text-[#8fa0a6] text-xs font-mono font-normal">({items.length})</span>
            </h3>
            {items.length === 0 ? (
              <div className="text-[#8fa0a6] italic text-sm">No {label} entries.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((d: any) => (
                  <div key={d.id} className="bg-[#111] border border-[#2a2a2a] rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-white font-bold text-sm">{d.id}{d.ata ? ` — ATA ${d.ata}` : ""}</span>
                      <span className={`text-[0.65rem] px-2 py-0.5 rounded-md border font-bold tracking-widest shrink-0 ${getStatusBadge(d.status)}`}>{d.status}</span>
                    </div>
                    <div className="text-[#e2e8f0] text-sm leading-relaxed font-mono">{d.description}</div>
                    {d.mel_ref && (
                      <div className="text-[0.7rem] text-[#FF9100] mt-1.5 font-mono">MEL REF: {d.mel_ref}</div>
                    )}
                    {d.deferral_reason && (
                      <div className="text-[0.7rem] text-[#8fa0a6] mt-1 font-mono">{d.deferral_reason}</div>
                    )}
                    {(d.time || d.reported_by) && (
                      <div className="text-[0.65rem] text-[#555] mt-1.5 font-mono">{d.time} {d.reported_by ? `· ${d.reported_by}` : ""}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

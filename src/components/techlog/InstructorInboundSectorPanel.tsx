"use client";

import { useState } from "react";
import type { TechLogPatch } from "@/lib/techlog/directives";

type DefectDraft = { status: "OPEN" | "DEFERRED" | "CLEARED"; description: string };

const EMPTY_DEFECT: DefectDraft = { status: "OPEN", description: "" };

// 🌟 教官專屬:喺 trainee 未開始用呢班機之前,用一條教官自己打嘅「inbound
// sector」(例如 SIN➔HKG,帶住想要嘅 defect)取代起機嗰陣自動生成嗰條假
// 「最新」sector——同 trainee 自己 Normal Close/Air Return 嗰條路徑完全獨立,
// 撳呢個掣先會觸發背後嘅假歷史重新生成(睇 lib/techlog/techlogContinuity.ts
// 嘅 insertInstructorInboundSector())
export default function InstructorInboundSectorPanel({ updateTechLogData }: { updateTechLogData: (patch: TechLogPatch) => void }) {
  const [open, setOpen] = useState(false);
  const [departureStation, setDepartureStation] = useState("");
  const [flightNo, setFlightNo] = useState("");
  const [cmdr, setCmdr] = useState("");
  const [defects, setDefects] = useState<DefectDraft[]>([{ ...EMPTY_DEFECT }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const updateDefect = (idx: number, patch: Partial<DefectDraft>) => {
    setDefects((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };
  const addDefectRow = () => setDefects((prev) => [...prev, { ...EMPTY_DEFECT }]);
  const removeDefectRow = (idx: number) => setDefects((prev) => prev.filter((_, i) => i !== idx));

  // 🌟 updateTechLogData 自己內部已經會 catch 失敗、彈 alert、重新 fetch
  // 校正返本地狀態（睇 TechLog.tsx）——呢度唔使再自己 try/catch 一次個
  // network call，純粹做本地必填欄位驗證
  const handleSubmit = () => {
    setError("");
    const dep = departureStation.trim();
    if (!dep) { setError("Departure station is required"); return; }
    const cleanDefects = defects.filter((d) => d.description.trim().length > 0);
    if (cleanDefects.length === 0) { setError("At least one defect with a description is required"); return; }

    setBusy(true);
    updateTechLogData({
      instructorInsertInboundSector: {
        departureStation: dep,
        defects: cleanDefects,
        flightNo: flightNo.trim() || undefined,
        cmdr: cmdr.trim() || undefined,
      },
    });
    setBusy(false);
    setOpen(false);
    setDepartureStation(""); setFlightNo(""); setCmdr(""); setDefects([{ ...EMPTY_DEFECT }]);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 bg-transparent border border-[#2979FF]/50 text-[#2979FF] font-bold rounded-xl hover:bg-[#2979FF]/10 transition-colors text-[0.7rem] uppercase tracking-widest mb-3 shrink-0"
      >
        🛫 Instructor: Set Inbound Sector
      </button>
    );
  }

  return (
    <div className="bg-[#1E1E1E] border border-[#2979FF]/40 rounded-2xl p-5 shadow-lg shrink-0 mb-3 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#333] pb-3">
        <h4 className="text-[#2979FF] text-[0.7rem] font-bold uppercase tracking-widest">Instructor: Set Inbound Sector</h4>
        <button onClick={() => setOpen(false)} className="text-[#8fa0a6] hover:text-white text-[0.65rem]">Close</button>
      </div>

      <p className="text-[#8fa0a6] text-[0.65rem] leading-relaxed">
        Replaces the most recent (auto-generated) sector with a real one you define, and regenerates the filler
        history behind it so it connects to this departure station. Does not affect how trainee Normal Close / Air
        Return works.
      </p>

      {error && <div className="bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] text-[0.65rem] font-bold rounded-lg px-3 py-2">⚠️ {error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[#8fa0a6] text-[0.6rem] font-bold uppercase tracking-widest">Departure Station *</span>
          <input value={departureStation} onChange={(e) => setDepartureStation(e.target.value.toUpperCase())} placeholder="SIN" maxLength={10}
            className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-[0.75rem] font-mono text-white outline-none focus:border-[#2979FF]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[#8fa0a6] text-[0.6rem] font-bold uppercase tracking-widest">Flight No (optional)</span>
          <input value={flightNo} onChange={(e) => setFlightNo(e.target.value)} placeholder="auto"
            className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-[0.75rem] font-mono text-white outline-none focus:border-[#2979FF]" />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[#8fa0a6] text-[0.6rem] font-bold uppercase tracking-widest">Commander (optional)</span>
        <input value={cmdr} onChange={(e) => setCmdr(e.target.value)} placeholder="auto"
          className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-[0.75rem] font-mono text-white outline-none focus:border-[#2979FF]" />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[#8fa0a6] text-[0.6rem] font-bold uppercase tracking-widest">Defects</span>
        {defects.map((d, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select
              value={d.status}
              onChange={(e) => updateDefect(i, { status: e.target.value as DefectDraft["status"] })}
              className="bg-[#0a0a0a] border border-[#333] rounded-lg px-2 py-2 text-[0.7rem] font-bold text-white outline-none focus:border-[#2979FF] shrink-0"
            >
              <option value="OPEN">OPEN</option>
              <option value="DEFERRED">DEFERRED</option>
              <option value="CLEARED">CLEARED</option>
            </select>
            <input
              value={d.description}
              onChange={(e) => updateDefect(i, { description: e.target.value })}
              placeholder="Pack 1 flow control valve intermittent fault"
              className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-[0.75rem] text-white outline-none focus:border-[#2979FF]"
            />
            {defects.length > 1 && (
              <button onClick={() => removeDefectRow(i)} className="text-[#FF1744] hover:text-white text-[0.65rem] font-bold shrink-0 px-2">✕</button>
            )}
          </div>
        ))}
        <button onClick={addDefectRow} className="self-start text-[#2979FF] hover:text-white text-[0.6rem] font-bold uppercase tracking-widest">+ Add defect</button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={busy}
        className="w-full py-3 bg-[#2979FF] text-black font-black rounded-xl hover:bg-[#5393ff] transition-colors text-[0.75rem] uppercase tracking-widest disabled:opacity-50 mt-1"
      >
        {busy ? "Applying…" : "Apply Inbound Sector"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import { useProcedures } from "@/hooks/useProcedures";
import { parseFixLines } from "@/lib/nav/procedures";
import type { RouteOverrideSelection } from "@/lib/nav/routeOverride";

// 🌟 抽出做 module-level component（唔係 render 入面再 declare 一次 function）
// ——否則 React 每次 render 都當佢係新 component type，成個 subtree 會不斷
// unmount/remount，仲會觸發 eslint react-hooks/static-components
function ProcedureSelect({
  label,
  icao,
  options,
  value,
  onChange,
  onAddFixes,
}: {
  label: string;
  icao: string | undefined;
  options: { name: string; runways?: string }[];
  value: string | null | undefined;
  onChange: (v: string) => void;
  onAddFixes: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest w-20 shrink-0">{label}</span>
      {!icao ? (
        <span className="text-[#555] text-[0.65rem]">No airport yet</span>
      ) : options.length === 0 ? (
        <span className="text-[#555] text-[0.65rem]">No procedures on file for {icao}</span>
      ) : (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-[0.72rem] font-mono text-white outline-none focus:border-[#00bfa5]"
        >
          <option value="">— OFP default —</option>
          {options.map((o) => (
            <option key={o.name} value={o.name}>
              {o.name} {o.runways ? `(RW ${o.runways})` : ""}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={onAddFixes}
        disabled={!icao}
        className="text-[#8fa0a6] hover:text-white text-[0.6rem] font-bold border border-[#444] rounded px-2 py-1 disabled:opacity-30 shrink-0"
      >
        + Add fixes
      </button>
    </div>
  );
}

// 🌟 教官揀返個真實 SID/STAR 做「而家實際發生緊」嘅 active route(覆寫走
// Observer ND 預設讀嘅 OFP navlog route),同埋貼文字入新 fix 落呢個機場嘅
// procedure 庫(同 SIGMET 嗰邊一樣嘅「貼文字唔打數字」諗頭，避免手抄 AIP
// 座標打錯)。Dep/Arr 兩頭特登易改,enroute 中段永遠跟返 OFP(睇
// lib/nav/routeOverride.ts 嘅 computeOverriddenRoute)
export default function RouteOverridePanel() {
  const { flightData, updateFlightDataAsync } = useFlightData();
  const depIcao = flightData?.dep_icao;
  const arrIcao = flightData?.arr_icao;
  const depProcQuery = useProcedures(depIcao);
  const arrProcQuery = useProcedures(arrIcao);

  const override: RouteOverrideSelection = flightData?.scenario_route_override || {};
  const [pasteTarget, setPasteTarget] = useState<"dep" | "arr" | null>(null);
  const [pasteDraft, setPasteDraft] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);

  if (!flightData) return null;

  const setSid = (sidName: string) => {
    updateFlightDataAsync({ scenario_route_override: { ...override, sidName: sidName || null } });
  };
  const setStar = (starName: string) => {
    updateFlightDataAsync({ scenario_route_override: { ...override, starName: starName || null } });
  };
  const clearOverride = () => {
    updateFlightDataAsync({ scenario_route_override: null });
  };

  const savePastedFixes = async () => {
    const icao = pasteTarget === "dep" ? depIcao : arrIcao;
    if (!icao) return;
    const added = parseFixLines(pasteDraft);
    if (added.length === 0) {
      setPasteError("No recognisable fix lines found");
      return;
    }
    setPasteBusy(true);
    setPasteError("");
    try {
      const existing = (pasteTarget === "dep" ? depProcQuery.data : arrProcQuery.data) || {
        airport: icao,
        fixes: [],
        stars: [],
        sids: [],
        holds: [],
      };
      const byName = new Map(existing.fixes.map((f) => [f.name, f]));
      for (const f of added) byName.set(f.name, f);
      const next = { ...existing, fixes: Array.from(byName.values()) };

      const res = await fetch(`/api/procedures/${encodeURIComponent(icao)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Save failed");
      }
      (pasteTarget === "dep" ? depProcQuery : arrProcQuery).refetch();
      setPasteDraft("");
      setPasteTarget(null);
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPasteBusy(false);
    }
  };

  const openPasteFor = (target: "dep" | "arr") => {
    setPasteTarget(target);
    setPasteDraft("");
    setPasteError("");
  };

  const hasOverride = !!(override.sidName || override.starName || override.customFixes?.length);

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[#00bfa5] font-black text-xs tracking-widest uppercase">🛫 Active Route</span>
        {hasOverride && (
          <button onClick={clearOverride} className="text-[#FF1744] hover:text-white text-[0.6rem] font-bold border border-[#FF1744]/50 rounded px-2 py-1">
            Clear override
          </button>
        )}
      </div>

      <ProcedureSelect
        label="Departure"
        icao={depIcao}
        options={depProcQuery.data?.sids || []}
        value={override.sidName}
        onChange={setSid}
        onAddFixes={() => openPasteFor("dep")}
      />
      <ProcedureSelect
        label="Arrival"
        icao={arrIcao}
        options={arrProcQuery.data?.stars || []}
        value={override.starName}
        onChange={setStar}
        onAddFixes={() => openPasteFor("arr")}
      />
      <p className="text-[#555] text-[0.6rem] leading-relaxed">
        Picking a SID/STAR here replaces that end of the route the Observer ND shows — the enroute middle still follows the OFP. Leave as OFP default to use the filed route as-is.
      </p>

      {pasteTarget && (
        <div className="border-t border-[#333] pt-2 mt-1 flex flex-col gap-2">
          <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest">
            Paste fix lines for {pasteTarget === "dep" ? depIcao : arrIcao}
          </span>
          {pasteError && <div className="text-[#FF1744] text-[0.65rem] font-bold">⚠️ {pasteError}</div>}
          <textarea
            value={pasteDraft}
            onChange={(e) => setPasteDraft(e.target.value)}
            placeholder={"ABBEY 22 16 11.00N 114 55 25.92E\nMUSEL 22.264997 114.781147"}
            className="min-h-[90px] bg-[#0a0a0a] border border-[#333] rounded-lg p-2 text-[0.68rem] font-mono text-white resize-none outline-none focus:border-[#00bfa5]"
          />
          <div className="text-[#8fa0a6] text-[0.6rem] font-mono">{parseFixLines(pasteDraft).length} fix(es) recognised</div>
          <div className="flex gap-2">
            <button onClick={() => setPasteTarget(null)} className="flex-1 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest border border-[#444] rounded-lg text-[#8fa0a6] hover:text-white">
              Cancel
            </button>
            <button onClick={savePastedFixes} disabled={pasteBusy} className="flex-1 py-1.5 text-[0.6rem] font-black uppercase tracking-widest rounded-lg bg-[#00bfa5] text-black hover:bg-[#00a892] disabled:opacity-50">
              {pasteBusy ? "Saving…" : "Save to procedure library"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🌟 單一嘅 TechLog patch 合併邏輯，client (樂觀更新) 同 server (真正寫入) 都用返同一個
// function，唔會有兩份各自維護嘅合併邏輯而慢慢走樣。純 function，冇 db/next/server 依賴，
// 喺 "use client" component 入面 import 都安全。

export interface TechLogPatch {
  data?: Record<string, unknown>; // 扁平 scalar 覆寫（保留返原有行為）
  defectUpdate?: { id: string; changes: Record<string, unknown> };
  defectAppend?: Record<string, unknown>;
  tlEntryAppend?: Record<string, unknown>;
  tlEntriesReset?: true;
  flightsPrepend?: Record<string, unknown>;
  signOffDefects?: true; // 教官專屬「Sign Off Defects Log」，睇 validation.ts 嘅 requiresInstructorAuth
}

type TechLogRow = Record<string, unknown>;
type RowArray = Array<Record<string, unknown>>;

export function applyTechLogDirectives(current: TechLogRow, patch: TechLogPatch): TechLogRow {
  const merged: TechLogRow = { ...current, ...(patch.data || {}) };

  if (patch.defectUpdate) {
    const { id, changes } = patch.defectUpdate;
    const defects = ((current.defects as RowArray | undefined) || []);
    merged.defects = defects.map((d) => (d.id === id ? { ...d, ...changes } : d));
  }

  if (patch.defectAppend) {
    const defects = (merged.defects as RowArray | undefined) || (current.defects as RowArray | undefined) || [];
    merged.defects = [...defects, patch.defectAppend];
  }

  if (patch.tlEntryAppend) {
    const entries = (current.tl_entries as RowArray | undefined) || [];
    merged.tl_entries = [...entries, patch.tlEntryAppend];
  }

  if (patch.tlEntriesReset) {
    merged.tl_entries = [];
  }

  if (patch.flightsPrepend) {
    const flights = (current.flights as RowArray | undefined) || [];
    merged.flights = [patch.flightsPrepend, ...flights];
  }

  if (patch.signOffDefects) {
    merged.tl_defects = true;
  }

  return merged;
}

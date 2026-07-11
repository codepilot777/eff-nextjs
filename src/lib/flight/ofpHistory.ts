// 🌟 OFP 版本歷史嘅共用形狀 + helper，畀 ConfigTab.tsx（教官 dispatch）、
// flight-select/page.tsx（trainee 瀏覽/比較/activate）、/api/simbrief/route.ts
// （起機嗰刻寫 V1）三邊共用，避免三處各自砌一份唔同形狀嘅 snapshot object。

export interface OfpSnapshot {
  route_id?: string;
  std_z?: string;
  sta_z?: string;
  cruise_alt?: string | number;
  fuel_trip_ofp?: number;
  weight_zfw_ofp?: number;
  weight_tow_ofp?: number;
  ofp_telex_text?: string;
  raw_simbrief?: unknown;
  navlog?: unknown[];
  alternates?: unknown[];
}

export interface OfpHistoryEntry {
  version: number;
  dispatched_at: string;
  snapshot: OfpSnapshot;
}

const SNAPSHOT_FIELDS = [
  'route_id', 'std_z', 'sta_z', 'cruise_alt',
  'fuel_trip_ofp', 'weight_zfw_ofp', 'weight_tow_ofp',
  'ofp_telex_text', 'raw_simbrief', 'navlog', 'alternates',
] as const;

export function buildOfpSnapshot(source: Record<string, unknown>): OfpSnapshot {
  const snapshot: Record<string, unknown> = {};
  for (const key of SNAPSHOT_FIELDS) snapshot[key] = source[key];
  return snapshot as OfpSnapshot;
}

// 🌟 呢個功能上線之前建立嘅 flight 冇 ofp_history，補返一個用返 top-level 欄位
// 砌嘅假 V1 entry，等 UI 唔使成處都寫 fallback（列表、Compare、SNN 全部照用）
export function getOfpHistory(flight: Record<string, unknown> | null | undefined): OfpHistoryEntry[] {
  if (!flight) return [];
  const history = flight.ofp_history as OfpHistoryEntry[] | undefined;
  if (Array.isArray(history) && history.length > 0) return history;
  return [{
    version: Number(flight.ofp_version) || 1,
    dispatched_at: '',
    snapshot: buildOfpSnapshot(flight),
  }];
}

// 🌟 畀 flight-select 個 Compare 面板用：逐個關鍵欄位對比緊睇緊嘅舊版本
// 同最新版本嘅分別，等 trainee 唔使自己肉眼喺兩份 SNN 文字度捉唔同
export interface OfpDiffRow {
  label: string;
  oldVal: string;
  newVal: string;
  changed: boolean;
}

function fmtFuel(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toFixed(1)}T` : '--';
}

function fmtAltn(alternates: unknown): string {
  if (!Array.isArray(alternates) || alternates.length === 0) return 'NIL';
  return alternates.map((a) => {
    const entry = a as { icao?: string; icao_code?: string } | null | undefined;
    return entry?.icao || entry?.icao_code || '?';
  }).join(', ');
}

function fmtNavlog(navlog: unknown): string {
  return `${Array.isArray(navlog) ? navlog.length : 0} waypoints`;
}

export function diffOfpSnapshots(oldSnap: OfpSnapshot, newSnap: OfpSnapshot): OfpDiffRow[] {
  const rows: Array<{ label: string; oldVal: string; newVal: string }> = [
    { label: 'Route', oldVal: String(oldSnap.route_id ?? '--'), newVal: String(newSnap.route_id ?? '--') },
    { label: 'STD', oldVal: String(oldSnap.std_z ?? '--'), newVal: String(newSnap.std_z ?? '--') },
    { label: 'STA', oldVal: String(oldSnap.sta_z ?? '--'), newVal: String(newSnap.sta_z ?? '--') },
    { label: 'Cruise ALT', oldVal: String(oldSnap.cruise_alt ?? '--'), newVal: String(newSnap.cruise_alt ?? '--') },
    { label: 'Trip Fuel', oldVal: fmtFuel(oldSnap.fuel_trip_ofp), newVal: fmtFuel(newSnap.fuel_trip_ofp) },
    { label: 'ZFW', oldVal: fmtFuel(oldSnap.weight_zfw_ofp), newVal: fmtFuel(newSnap.weight_zfw_ofp) },
    { label: 'TOW', oldVal: fmtFuel(oldSnap.weight_tow_ofp), newVal: fmtFuel(newSnap.weight_tow_ofp) },
    { label: 'Alternates', oldVal: fmtAltn(oldSnap.alternates), newVal: fmtAltn(newSnap.alternates) },
    { label: 'Navlog', oldVal: fmtNavlog(oldSnap.navlog), newVal: fmtNavlog(newSnap.navlog) },
  ];
  return rows.map((r) => ({ ...r, changed: r.oldVal !== r.newVal }));
}

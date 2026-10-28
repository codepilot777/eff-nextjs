// 🌟 由 SimBrief raw 嘅機場 object（origin/destination/alternate/takeoff_altn/
// enroute_altn/enroute_station……）攞返 lat/lon——同 routeFixes.ts 用緊一樣嘅
// pos_lat/pos_long 慣例（SimBrief 成個 OFP JSON 嘅機場/fix object 都用呢組
// 欄位名），畀 RouteWeatherMap 畫有 TAF 嘅機場 marker 用。

export function extractLatLon(raw: unknown): { lat: number; lon: number } | null {
  const o = raw as Record<string, unknown> | null | undefined;
  const lat = typeof o?.pos_lat === "string" ? parseFloat(o.pos_lat) : typeof o?.pos_lat === "number" ? o.pos_lat : NaN;
  const lon = typeof o?.pos_long === "string" ? parseFloat(o.pos_long) : typeof o?.pos_long === "number" ? o.pos_long : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

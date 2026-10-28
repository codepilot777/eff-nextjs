// 🌟 由 SimBrief 嘅完整原始回應（flightData.raw_simbrief）攞返真實 OFP
// navlog 嘅 fix 座標，俾 weather-nd 個 ND 工具用嚟畫真正嘅航路（唔再係
// public/weather-nd/index.html 自己 hard-code 嗰套虛構 RCTP-VHHH 直線）。
// navlog 可以有成幾十個 fix，塞晒落 radar 畫面會好擠；揀夠 MAX_FIXES 個
// （一定留住頭尾即係 dep/arr），約莫保留返航路轉向嘅形狀就夠。

export interface RouteFix {
  name: string;
  lat: number;
  lon: number;
}

const MAX_FIXES = 8;

function toFinite(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

export function extractRouteFixes(rawSimbrief: unknown): RouteFix[] {
  const nav = (rawSimbrief as { navlog?: { fix?: unknown } } | null | undefined)?.navlog?.fix;
  const rawList = Array.isArray(nav) ? nav : nav ? [nav] : [];

  const fixes: RouteFix[] = [];
  for (const f of rawList) {
    const lat = toFinite((f as Record<string, unknown>)?.pos_lat);
    const lon = toFinite((f as Record<string, unknown>)?.pos_long);
    if (lat === null || lon === null) continue;
    const ident = (f as Record<string, unknown>)?.ident;
    fixes.push({ name: String(ident || "FIX").toUpperCase(), lat, lon });
  }

  if (fixes.length < 2) return [];
  if (fixes.length <= MAX_FIXES) return fixes;

  // 🌟 保留頭尾（dep/arr），中間平均揀夠 MAX_FIXES-2 個，等個 route 唔會
  // 太多字擠喺雷達畫面，但仍然大致跟返真實航路嘅轉向形狀
  const kept: RouteFix[] = [fixes[0]];
  const innerCount = MAX_FIXES - 2;
  for (let i = 1; i <= innerCount; i++) {
    const idx = Math.round((i * (fixes.length - 1)) / (innerCount + 1));
    kept.push(fixes[idx]);
  }
  kept.push(fixes[fixes.length - 1]);
  return kept;
}

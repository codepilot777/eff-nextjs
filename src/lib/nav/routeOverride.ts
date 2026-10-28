// 🌟 將「教官揀咗邊條 SID/STAR + 手動加嘅 custom fix」呢個輕量 selection
// (存落 flightData.scenario_route_override)，喺 render 嗰刻先同 procedure
// 庫/OFP navlog 一齊解析做成條有座標嘅 active route——唔喺度就直接存一份
// 已經 resolve 好嘅扁平座標，等教官之後改咗個 procedure 庫入面嘅 fix 座標
// (例如發現打錯)，所有引用緊佢嘅 scenario 都自動跟住啱返，唔使逐個
// scenario 重新揀一次
import type { RouteFix } from "@/lib/weather/routeFixes";
import { resolveProcedureLegs, type AirportProcedures } from "./procedures";

export interface RouteOverrideSelection {
  sidName?: string | null;
  starName?: string | null;
  customFixes?: RouteFix[];
}

export function computeOverriddenRoute(
  override: RouteOverrideSelection | null | undefined,
  ofpFixes: RouteFix[],
  depProc: AirportProcedures | null | undefined,
  arrProc: AirportProcedures | null | undefined
): RouteFix[] {
  if (!override || (!override.sidName && !override.starName && !override.customFixes?.length)) {
    return ofpFixes;
  }

  const depFallback = ofpFixes.length > 0 ? [ofpFixes[0]] : [];
  const arrFallback = ofpFixes.length > 1 ? [ofpFixes[ofpFixes.length - 1]] : [];
  // 🌟 OFP 自己嘅 enroute 中段（去頭去尾），唔理教官有冇換 SID/STAR 都保留——
  // 呼應「dep/arr 要改得到，enroute 盡量跟 OFP」嘅要求
  const midFixes = ofpFixes.length > 2 ? ofpFixes.slice(1, -1) : [];

  // 🌟 揀咗嘅 SID/STAR 名喺 procedure 庫度搵唔到（例如教官之後執走咗個名、
  // 或者仲未 seed 咁個機場）——當冇揀過處理，fallback 返 OFP 嗰個端點，
  // 唔好靜雞雞送一條斷頭(冇 arrival/departure)嘅 route 出去
  const sid = override.sidName && depProc ? depProc.sids.find((s) => s.name === override.sidName) : undefined;
  const star = override.starName && arrProc ? arrProc.stars.find((s) => s.name === override.starName) : undefined;

  if (!sid && !star && !override.customFixes?.length) return ofpFixes;

  const headFixes = sid ? resolveProcedureLegs(depProc!, sid.legs) : depFallback;
  const tailFixes = star ? resolveProcedureLegs(arrProc!, star.legs) : arrFallback;

  const combined = [...headFixes, ...midFixes, ...tailFixes, ...(override.customFixes || [])];
  return combined.length >= 2 ? combined : ofpFixes;
}

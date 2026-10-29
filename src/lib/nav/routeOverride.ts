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

  // 🌟 揀咗嘅 SID/STAR 名喺 procedure 庫度搵唔到（例如教官之後執走咗個名、
  // 或者仲未 seed 咁個機場）——當冇揀過處理，fallback 返 OFP 嗰個端點，
  // 唔好靜雞雞送一條斷頭(冇 arrival/departure)嘅 route 出去
  const sid = override.sidName && depProc ? depProc.sids.find((s) => s.name === override.sidName) : undefined;
  const star = override.starName && arrProc ? arrProc.stars.find((s) => s.name === override.starName) : undefined;

  if (!sid && !star && !override.customFixes?.length) return ofpFixes;

  // 🌟 修復：真實 SimBrief OFP 原本已經派定咗 STAR/SID，佢自己嘅 enroute 中段
  // （去頭去尾、再裁剩代表性幾個）好可能本身已經包埋教官而家揀嗰條 SID/STAR
  // 入面某幾個 fix（例如 HH512 本身都喺 OFP 航路入面）。以前冇濾走呢啲，會令
  // 個 fix 出現兩次（一次喺 OFP mid 段、一次喺 SID/STAR 自己段），仲會喺真正
  // SID/STAR 順序之前就飛多次——trainee 見到嘅次序變咗「HH512→ABBEY→MUSEL」
  // 噉樣亂跳，唔係 STAR 本身嘅「ABBEY→MUSEL→HH512」。而家將同揀咗嘅 SID/STAR
  // 撞名嘅 OFP fix 篩走，淨係用返 SID/STAR 自己嗰份（座標、順序都用佢嘅）
  const overriddenNames = new Set<string>([
    ...(sid?.legs.map((l) => l.fix).filter((f): f is string => !!f) ?? []),
    ...(star?.legs.map((l) => l.fix).filter((f): f is string => !!f) ?? []),
  ]);
  // 🌟 OFP 自己嘅 enroute 中段（去頭去尾），唔理教官有冇換 SID/STAR 都保留——
  // 呼應「dep/arr 要改得到，enroute 盡量跟 OFP」嘅要求
  const midFixes = ofpFixes.length > 2
    ? ofpFixes.slice(1, -1).filter((f) => !overriddenNames.has(f.name))
    : [];

  // 🌟 修復：以前揀咗 SID/STAR 就成個 route 頭/尾直接變成 SID/STAR 自己第一個/
  // 最後一個 fix（例如 STAR 最後一個 IAF，唔係機場本身）——但 weather-nd 個
  // ND 工具一直假設 ROUTE[0]/ROUTE[最後] 就係起飛/到達機場本身（起飛位置、
  // HOLD 插入位、"On the ground" 顯示都係靠呢個假設），搞到個 HOLD/地面邏輯
  // 跟住錯晒。而家 SID/STAR 嘅 fix 擺喺機場同 OFP enroute 中間，機場本身
  // （OFP 嗰個端點）繼續企喺頭/尾
  const headFixes = sid ? [...depFallback, ...resolveProcedureLegs(depProc!, sid.legs)] : depFallback;
  const tailFixes = star ? [...resolveProcedureLegs(arrProc!, star.legs), ...arrFallback] : arrFallback;

  const combined = [...headFixes, ...midFixes, ...tailFixes, ...(override.customFixes || [])];
  return combined.length >= 2 ? combined : ofpFixes;
}

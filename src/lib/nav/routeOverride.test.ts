import { describe, expect, it } from "vitest";
import { computeOverriddenRoute } from "./routeOverride";
import { parseAirportProcedures } from "./procedures";
import vhhh from "@/data/procedures/VHHH.json";
import type { RouteFix } from "@/lib/weather/routeFixes";

const proc = parseAirportProcedures(vhhh)!;
const ofpFixes: RouteFix[] = [
  { name: "RCTP", lat: 25.08, lon: 121.23 },
  { name: "ENVAR", lat: 23.5, lon: 119.0 },
  { name: "VHHH", lat: 22.3089, lon: 113.9185 },
];

describe("computeOverriddenRoute", () => {
  it("falls back to the OFP route when there is no override", () => {
    expect(computeOverriddenRoute(null, ofpFixes, null, null)).toBe(ofpFixes);
    expect(computeOverriddenRoute({}, ofpFixes, proc, proc)).toBe(ofpFixes);
  });

  it("inserts the chosen STAR between the OFP enroute fixes and the real arrival airport, not instead of it", () => {
    const result = computeOverriddenRoute({ starName: "ABBEY4A" }, ofpFixes, null, proc);
    // 🌟 STAR 最後一個 fix（LIMES）係 IAF，唔係機場本身——VHHH（OFP 嘅真正
    // 到達機場端點）要留喺最後，等 ND 嘅 ROUTE[last]/HOLD/落地邏輯繼續啱
    expect(result.map((f) => f.name)).toEqual(["RCTP", "ENVAR", "ABBEY", "MUSEL", "HH512", "HH511", "LIMES", "VHHH"]);
  });

  it("inserts the chosen SID between the real departure airport and the OFP enroute fixes, not instead of it", () => {
    const result = computeOverriddenRoute({ sidName: "BEKOL1C" }, ofpFixes, proc, null);
    // 🌟 RCTP（OFP 嘅真正出發機場）要留喺最頭——ND 嘅 newAircraft() 用
    // ROUTE[0] 做起飛位置/地面顯示，唔可以換咗做 SID 自己第一個 fix
    expect(result[0].name).toBe("RCTP");
    expect(result[1].name).toBe("HH302");
    expect(result[result.length - 1]).toEqual(ofpFixes[ofpFixes.length - 1]);
    expect(result.some((f) => f.name === "ENVAR")).toBe(true);
  });

  it("regression: drops an OFP mid-route fix that collides by name with the chosen STAR, so it isn't visited twice out of STAR order", () => {
    // 🌟 真實 SimBrief OFP 本身已經派定咗 STAR，trimmed 落嚟嘅代表性 enroute
    // fix 好可能本身已經包埋 STAR 自己嘅 fix（例如 HH512）。以前唔濾走會令
    // 個 route 變成 [...,HH512(嚟自OFP),ABBEY,MUSEL,HH512(再嚟一次,嚟自STAR),...]
    // ——trainee 見到嘅飛行次序「跳」咗去 HH512 先、先返去 ABBEY、先至去
    // MUSEL，唔係 STAR 本身嘅 ABBEY→MUSEL→HH512 順序
    const ofpWithStarFixAlready: RouteFix[] = [
      { name: "RCTP", lat: 25.08, lon: 121.23 },
      { name: "ENVAR", lat: 23.5, lon: 119.0 },
      { name: "HH512", lat: 22.022722, lon: 114.532417 },
      { name: "VHHH", lat: 22.3089, lon: 113.9185 },
    ];
    const result = computeOverriddenRoute({ starName: "ABBEY4A" }, ofpWithStarFixAlready, null, proc);
    expect(result.map((f) => f.name)).toEqual(["RCTP", "ENVAR", "ABBEY", "MUSEL", "HH512", "HH511", "LIMES", "VHHH"]);
    // HH512 一定要淨係出現一次，而且要跟住 STAR 嘅順序（MUSEL 之後），
    // 唔可以喺 ABBEY 之前就已經飛咗一次
    expect(result.filter((f) => f.name === "HH512")).toHaveLength(1);
  });

  it("appends manually-added custom fixes at the end", () => {
    const result = computeOverriddenRoute(
      { starName: "ABBEY4A", customFixes: [{ name: "CUSTOM1", lat: 1, lon: 2 }] },
      ofpFixes,
      null,
      proc
    );
    expect(result[result.length - 1]).toEqual({ name: "CUSTOM1", lat: 1, lon: 2 });
  });

  it("falls back to the OFP route if the chosen STAR name can't be found", () => {
    const result = computeOverriddenRoute({ starName: "NOT_A_REAL_STAR" }, ofpFixes, null, proc);
    expect(result).toBe(ofpFixes);
  });
});

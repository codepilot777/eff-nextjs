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

  it("replaces only the arrival tail with the chosen STAR, keeping OFP enroute fixes", () => {
    const result = computeOverriddenRoute({ starName: "ABBEY4A" }, ofpFixes, null, proc);
    expect(result.map((f) => f.name)).toEqual(["RCTP", "ENVAR", "ABBEY", "MUSEL", "HH512", "HH511", "LIMES"]);
  });

  it("replaces only the departure head with the chosen SID, keeping OFP enroute fixes", () => {
    const result = computeOverriddenRoute({ sidName: "BEKOL1C" }, ofpFixes, proc, null);
    expect(result[0].name).toBe("HH302");
    expect(result[result.length - 1]).toEqual(ofpFixes[ofpFixes.length - 1]);
    expect(result.some((f) => f.name === "ENVAR")).toBe(true);
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

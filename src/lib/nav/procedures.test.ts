import { describe, expect, it } from "vitest";
import { parseAirportProcedures, parseFixLines, resolveProcedureLegs } from "./procedures";
import vhhh from "@/data/procedures/VHHH.json";

describe("parseAirportProcedures", () => {
  it("accepts the real VHHH procedure JSON", () => {
    const parsed = parseAirportProcedures(vhhh);
    expect(parsed).not.toBeNull();
    expect(parsed!.fixes.length).toBe(47);
    expect(parsed!.stars.length).toBe(10);
    expect(parsed!.sids.length).toBe(8);
    expect(parsed!.holds.length).toBe(7);
  });

  it("rejects something that isn't shaped like a procedure set", () => {
    expect(parseAirportProcedures({ foo: "bar" })).toBeNull();
    expect(parseAirportProcedures(null)).toBeNull();
  });
});

describe("resolveProcedureLegs", () => {
  it("resolves a real STAR's legs to lat/lon using the fixes table", () => {
    const parsed = parseAirportProcedures(vhhh)!;
    const star = parsed.stars.find((s) => s.name === "ABBEY4A")!;
    const resolved = resolveProcedureLegs(parsed, star.legs);
    expect(resolved).toEqual([
      { name: "ABBEY", lat: 22.269722, lon: 114.923867 },
      { name: "MUSEL", lat: 22.264997, lon: 114.781147 },
      { name: "HH512", lat: 22.022722, lon: 114.532417 },
      { name: "HH511", lat: 21.892289, lon: 114.192219 },
      { name: "LIMES", lat: 22.107111, lon: 113.775722 },
    ]);
  });

  it("skips legs whose fix name isn't in the fixes table instead of throwing", () => {
    const parsed = parseAirportProcedures(vhhh)!;
    const resolved = resolveProcedureLegs(parsed, [{ fix: "ABBEY" }, { fix: "NOPE_NOT_A_FIX" }]);
    expect(resolved).toEqual([{ name: "ABBEY", lat: 22.269722, lon: 114.923867 }]);
  });
});

describe("parseFixLines", () => {
  it("parses a real DMS line copied from the AIP exactly as published", () => {
    const out = parseFixLines("ABBEY 22 16 11.00N 114 55 25.92E");
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("ABBEY");
    expect(out[0].latDeg).toBeCloseTo(22.269722, 5);
    expect(out[0].lonDeg).toBeCloseTo(114.923867, 5);
  });

  it("parses decimal-degree lines", () => {
    const out = parseFixLines("MUSEL 22.264997 114.781147");
    expect(out).toEqual([{ name: "MUSEL", latDeg: 22.264997, lonDeg: 114.781147 }]);
  });

  it("parses multiple lines and skips blank/unparseable ones", () => {
    const text = [
      "ABBEY 22 16 11.00N 114 55 25.92E",
      "",
      "not a fix line at all",
      "MUSEL 22.264997 114.781147",
    ].join("\n");
    const out = parseFixLines(text);
    expect(out.map((f) => f.name)).toEqual(["ABBEY", "MUSEL"]);
  });
});

import { describe, it, expect } from "vitest";
import { extractRouteFixes } from "./routeFixes";

function fix(ident: string, lat: number, lon: number) {
  return { ident, pos_lat: String(lat), pos_long: String(lon) };
}

describe("extractRouteFixes", () => {
  it("returns [] when there is no navlog", () => {
    expect(extractRouteFixes(null)).toEqual([]);
    expect(extractRouteFixes({})).toEqual([]);
    expect(extractRouteFixes({ navlog: {} })).toEqual([]);
  });

  it("returns [] when fewer than 2 fixes have valid coordinates", () => {
    const raw = { navlog: { fix: [fix("VHHH", 22.31, 113.92)] } };
    expect(extractRouteFixes(raw)).toEqual([]);
  });

  it("parses a single fix object (SimBrief flattens a 1-item navlog to an object, not an array)", () => {
    const raw = { navlog: { fix: fix("VHHH", 22.31, 113.92) } };
    // 淨係一個 fix 都係少過 2 個——冇得連埋另一個端點，應該當冇用
    expect(extractRouteFixes(raw)).toEqual([]);
  });

  it("keeps every fix (in order) when the navlog is short", () => {
    const raw = {
      navlog: {
        fix: [fix("VHHH", 22.31, 113.92), fix("ENVAR", 22.5, 114.5), fix("RJBB", 34.43, 135.24)],
      },
    };
    expect(extractRouteFixes(raw)).toEqual([
      { name: "VHHH", lat: 22.31, lon: 113.92 },
      { name: "ENVAR", lat: 22.5, lon: 114.5 },
      { name: "RJBB", lat: 34.43, lon: 135.24 },
    ]);
  });

  it("skips fixes with missing/non-numeric coordinates", () => {
    const raw = {
      navlog: {
        fix: [
          fix("VHHH", 22.31, 113.92),
          { ident: "BADFIX", pos_lat: "", pos_long: "" },
          fix("RJBB", 34.43, 135.24),
        ],
      },
    };
    expect(extractRouteFixes(raw)).toEqual([
      { name: "VHHH", lat: 22.31, lon: 113.92 },
      { name: "RJBB", lat: 34.43, lon: 135.24 },
    ]);
  });

  it("downsamples a long navlog to 8 points, always keeping dep and arr", () => {
    const fixes = [];
    for (let i = 0; i < 20; i++) fixes.push(fix(`FIX${i}`, 20 + i * 0.1, 110 + i * 0.1));
    const raw = { navlog: { fix: fixes } };

    const result = extractRouteFixes(raw);
    expect(result.length).toBe(8);
    expect(result[0]).toEqual({ name: "FIX0", lat: 20, lon: 110 });
    expect(result[result.length - 1]).toEqual({ name: "FIX19", lat: 21.9, lon: 111.9 });
    // 中間嗰 6 個應該按原本次序嚟（單調遞增嘅 index），唔應該重複或者亂序
    const idents = result.map((f) => f.name);
    expect(new Set(idents).size).toBe(8);
  });
});

import { describe, expect, it } from "vitest";
import { parseSigmetBulletin } from "./sigmetParser";

// 🌟 直接用 ND radar handoff 入面嗰份真實 fictional training SIGMET 電報做 fixture——
// 呢份就係教官/Claude 傾劇本之後會 paste 落 EFF 嗰種文字，唔係夾硬砌嘅假例子
const ORCHID_BULLETIN = `*** FICTIONAL TRAINING SIGMETs - NOT REAL, NOT FOR OPERATIONAL USE ***
(Valid 270300/270900Z. FIR outlines on chart are schematic. Consistent with TC bulletin 270300Z.)

VHHK SIGMET 3 VALID 270300/270900 VHHK-
VHHK HONG KONG FIR TC ORCHID OBS AT 0000Z N1830 E11536 CB TOP FL500
WI 140NM OF TC CENTRE MOV WNW 18KT NC
FCST AT 0900Z TC CENTRE N1945 E11306=

VHHK SIGMET 4 VALID 270300/270900 VHHK-
VHHK HONG KONG FIR EMBD TS OBS AT 0230Z
WI N2054 E11230 - N2212 E11548 - N2112 E11748 - N1936 E11612 - N1954 E11348
TOP FL450 MOV WNW 15KT INTSF=

VHHK SIGMET 5 VALID 270300/270900 VHHK-
VHHK HONG KONG FIR SEV TURB OBS AT 0230Z
WI N2200 E11418 - N2324 E11536 - N2306 E11724 - N2154 E11712 - N2124 E11600
FL300/420 MOV WNW 15KT NC=

RPHI SIGMET 2 VALID 270300/270900 RPLL-
RPHI MANILA FIR EMBD TS OBS AT 0240Z
WI N1524 E11900 - N1524 E12212 - N1300 E12236 - N1236 E11912
TOP FL420 MOV NE 10KT INTSF=
`;

describe("parseSigmetBulletin", () => {
  it("parses all 4 SIGMETs from the ORCHID training bulletin", () => {
    const parsed = parseSigmetBulletin(ORCHID_BULLETIN);
    expect(parsed).toHaveLength(4);
  });

  it("parses the TC centre+radius SIGMET (VHHK 3)", () => {
    const [s3] = parseSigmetBulletin(ORCHID_BULLETIN);
    expect(s3.type).toBe("centre");
    expect(s3.firCode).toBe("VHHK");
    expect(s3.sigmetNumber).toBe("3");
    expect(s3.hazard).toBe("TC ORCHID");
    expect(s3.validFrom).toBe("270300");
    expect(s3.validTo).toBe("270900");
    expect(s3.obsOrFcst).toBe("OBS");
    expect(s3.refTime).toBe("0000");
    expect(s3.topFl).toBe(500);
    expect(s3.movDir).toBe("WNW");
    expect(s3.movSpdKt).toBe(18);
    expect(s3.trend).toBe("NC");

    if (s3.type === "centre") {
      // N1830 = 18 + 30/60 = 18.5, E11536 = 115 + 36/60 = 115.6
      expect(s3.centre[0]).toBeCloseTo(18.5, 5);
      expect(s3.centre[1]).toBeCloseTo(115.6, 5);
      expect(s3.radiusNm).toBe(140);
      expect(s3.forecastCentre?.time).toBe("0900");
      // N1945 = 19 + 45/60 = 19.75, E11306 = 113 + 6/60 = 113.1
      expect(s3.forecastCentre?.centre[0]).toBeCloseTo(19.75, 5);
      expect(s3.forecastCentre?.centre[1]).toBeCloseTo(113.1, 5);
    }
  });

  it("parses the EMBD TS polygon SIGMET (VHHK 4)", () => {
    const [, s4] = parseSigmetBulletin(ORCHID_BULLETIN);
    expect(s4.type).toBe("polygon");
    expect(s4.hazard).toBe("EMBD TS");
    expect(s4.refTime).toBe("0230");
    expect(s4.topFl).toBe(450);
    expect(s4.movDir).toBe("WNW");
    expect(s4.movSpdKt).toBe(15);
    expect(s4.trend).toBe("INTSF");

    if (s4.type === "polygon") {
      expect(s4.poly).toHaveLength(5);
      // N2054 = 20.9, E11230 = 112.5
      expect(s4.poly[0][0]).toBeCloseTo(20.9, 5);
      expect(s4.poly[0][1]).toBeCloseTo(112.5, 5);
      // last vertex N1954 = 19.9, E11348 = 113.8
      expect(s4.poly[4][0]).toBeCloseTo(19.9, 5);
      expect(s4.poly[4][1]).toBeCloseTo(113.8, 5);
    }
  });

  it("parses the SEV TURB polygon SIGMET with an FL range instead of TOP FL (VHHK 5)", () => {
    const [, , s5] = parseSigmetBulletin(ORCHID_BULLETIN);
    expect(s5.type).toBe("polygon");
    expect(s5.hazard).toBe("SEV TURB");
    expect(s5.topFl).toBeUndefined();
    expect(s5.flFrom).toBe(300);
    expect(s5.flTo).toBe(420);
    expect(s5.trend).toBe("NC");
  });

  it("parses a SIGMET from a different FIR (RPHI 2) independently", () => {
    const [, , , s2] = parseSigmetBulletin(ORCHID_BULLETIN);
    expect(s2.type).toBe("polygon");
    expect(s2.firCode).toBe("RPHI");
    expect(s2.sigmetNumber).toBe("2");
    expect(s2.hazard).toBe("EMBD TS");
    expect(s2.movDir).toBe("NE");
    expect(s2.movSpdKt).toBe(10);
    if (s2.type === "polygon") expect(s2.poly).toHaveLength(4);
  });

  it("keeps the original block text verbatim in rawText for display", () => {
    const [s3] = parseSigmetBulletin(ORCHID_BULLETIN);
    expect(s3.rawText).toContain("VHHK SIGMET 3 VALID 270300/270900 VHHK-");
    expect(s3.rawText).toContain("FCST AT 0900Z TC CENTRE N1945 E11306");
  });

  it("ignores the free-text header lines before the first SIGMET block", () => {
    const parsed = parseSigmetBulletin(ORCHID_BULLETIN);
    expect(parsed.every((s) => s.firCode)).toBe(true);
  });

  it("returns an empty array for text with no SIGMET blocks", () => {
    expect(parseSigmetBulletin("just some random notes, nothing here")).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseSigmetBulletin("")).toEqual([]);
  });

  it("skips a malformed block but still parses the valid ones around it", () => {
    const withGarbage = `garbage line\n\n${ORCHID_BULLETIN}`;
    expect(parseSigmetBulletin(withGarbage)).toHaveLength(4);
  });
});

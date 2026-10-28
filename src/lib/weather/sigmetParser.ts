// 🌟 解析 ICAO SIGMET 文字電報，變做結構化資料（polygon 座標/生效時間/移動向量…）。
// 教官/Claude 喺傾劇本嗰陣寫出嚟嘅電報，係可以直接 paste 落嚟用嘅——WI 行本身就已經
// 係 machine-parseable 嘅多邊形頂點，唔使再手打一次座標去 drive weather radar 同畫
// schematic chart。

export type SigmetTrend = "INTSF" | "WKN" | "NC";

interface SigmetCommon {
  firCode: string;
  sigmetNumber: string;
  hazard: string; // e.g. "EMBD TS", "SEV TURB", "TC ORCHID"
  validFrom: string; // DDHHMM
  validTo: string; // DDHHMM
  obsOrFcst: "OBS" | "FCST";
  refTime: string; // HHMM（OBS/FCST 果刻嘅時間）
  topFl?: number; // 來自 "TOP FLxxx"
  flFrom?: number; // 來自 "FLxxx/yyy" 嘅範圍（例如 turbulence layer）
  flTo?: number;
  movDir?: string; // 例如 "WNW"
  movSpdKt?: number;
  trend?: SigmetTrend;
  rawText: string;
}

export interface SigmetPolygon extends SigmetCommon {
  type: "polygon";
  poly: [lat: number, lon: number][];
}

export interface SigmetCentre extends SigmetCommon {
  type: "centre";
  centre: [lat: number, lon: number];
  radiusNm?: number;
  forecastCentre?: { time: string; centre: [lat: number, lon: number] };
}

export type ParsedSigmet = SigmetPolygon | SigmetCentre;

const COORD_PAIR_RE = /([NS])(\d{2})(\d{2})\s+([EW])(\d{3})(\d{2})/;

// 🌟 "N2054" = N20°54' = 20 + 54/60；"E11230" = E112°30' = 112 + 30/60
function parseLat(hemi: string, deg: string, min: string): number {
  const v = Number(deg) + Number(min) / 60;
  return hemi === "S" ? -v : v;
}
function parseLon(hemi: string, deg: string, min: string): number {
  const v = Number(deg) + Number(min) / 60;
  return hemi === "W" ? -v : v;
}

function parseCoordPair(text: string): [lat: number, lon: number] | null {
  const m = text.match(COORD_PAIR_RE);
  if (!m) return null;
  return [parseLat(m[1], m[2], m[3]), parseLon(m[4], m[5], m[6])];
}

// 🌟 "WI N2054 E11230 - N2212 E11548 - ..." —— 逐段 " - " split，每段揾返一組 N/E pair
function parsePolygonLine(line: string): [number, number][] {
  const afterWi = line.replace(/^WI\s+/, "");
  return afterWi
    .split("-")
    .map((seg) => parseCoordPair(seg))
    .filter((p): p is [number, number] => p !== null);
}

function parseTopFl(block: string): number | undefined {
  const m = block.match(/TOP\s+FL(\d+)/);
  return m ? Number(m[1]) : undefined;
}

function parseFlRange(block: string): { flFrom?: number; flTo?: number } {
  const m = block.match(/(?<!TOP\s)FL(\d+)\/(\d+)/);
  if (!m) return {};
  return { flFrom: Number(m[1]), flTo: Number(m[2]) };
}

function parseMovement(block: string): { movDir?: string; movSpdKt?: number } {
  const m = block.match(/MOV\s+([NSEW]{1,3})\s+(\d+)KT/);
  if (!m) return {};
  return { movDir: m[1], movSpdKt: Number(m[2]) };
}

function parseTrend(block: string): SigmetTrend | undefined {
  // 🌟 trend 字（NC/INTSF/WKN）跟喺 "MOV <dir> <spd>KT" 後面，但未必係成個
  // block 最尾一個字——TC 格式嘅 SIGMET 喺 trend 之後仲有一行 "FCST AT..."。
  // 淨係要搵返緊貼住 MOV...KT 嗰句嘅 trend，唔好錨死喺成個 block 嘅結尾
  const m = block.match(/MOV\s+[NSEW]{1,3}\s+\d+KT\s+(INTSF|WKN|NC)\b/);
  return (m?.[1] as SigmetTrend | undefined) ?? undefined;
}

function parseRadiusNm(block: string): number | undefined {
  const m = block.match(/WI\s+(\d+)NM\s+OF\s+TC\s+CENTRE/);
  return m ? Number(m[1]) : undefined;
}

// 🌟 一個 SIGMET block（由 header 行到 "=" 為止）解析做一個 ParsedSigmet。
// 先試 polygon 格式（"WI <coord> - <coord> - ..."），冇就試 TC centre+radius 格式
// （"WI <radius>NM OF TC CENTRE"），兩種都冇就當呢個 block 解析唔到，skip 走
function parseOneBlock(block: string): ParsedSigmet | null {
  const trimmed = block.trim();

  // 🌟 唔可以用 `^` 錨住行首——第一個 block 前面成日仲帶住電報嘅 disclaimer/
  // header 文字（例如 fixture 嗰句 "*** FICTIONAL TRAINING SIGMETs..."），
  // 錨死喺行首會令呢個 block 成個 match 唔到，連帶將佢入面真正嗰個 SIGMET
  // 一齊篩走，拖累後面所有 block 嘅 index 一齊錯位。搵到個 header 之後就由
  // 嗰度切起，等埋 rawText 唔會帶多舊 disclaimer 文字落每一個 SIGMET 度
  const headerMatch = trimmed.match(/(\w+)\s+SIGMET\s+(\d+)\s+VALID\s+(\d{6})\/(\d{6})/);
  if (!headerMatch) return null;
  const [, firCode, sigmetNumber, validFrom, validTo] = headerMatch;
  const rawText = trimmed.slice(headerMatch.index ?? 0);

  const obsFcstMatch = rawText.match(/\b(OBS|FCST)\s+AT\s+(\d{4})Z/);
  const obsOrFcst = (obsFcstMatch?.[1] as "OBS" | "FCST" | undefined) ?? "OBS";
  const refTime = obsFcstMatch?.[2] ?? "0000";

  // 🌟 hazard 字眼夾喺 "<FIR NAME> FIR" 同 "OBS/FCST AT" 之間，例如
  // "HONG KONG FIR TC ORCHID OBS AT" -> "TC ORCHID"，"HONG KONG FIR EMBD TS OBS AT" -> "EMBD TS"
  const hazardMatch = rawText.match(/FIR\s+(.+?)\s+(?:OBS|FCST)\s+AT/);
  const hazard = hazardMatch?.[1]?.trim() ?? "UNKNOWN";

  const common = {
    firCode,
    sigmetNumber,
    hazard,
    validFrom,
    validTo,
    obsOrFcst,
    refTime,
    topFl: parseTopFl(rawText),
    ...parseFlRange(rawText),
    ...parseMovement(rawText),
    trend: parseTrend(rawText),
    rawText,
  };

  const polyLine = rawText.split("\n").find((l) => /^WI\s+[NS]\d{4}/.test(l.trim()));
  if (polyLine) {
    const poly = parsePolygonLine(polyLine.trim());
    if (poly.length >= 3) {
      return { type: "polygon", ...common, poly };
    }
  }

  const radiusNm = parseRadiusNm(rawText);
  if (radiusNm !== undefined) {
    // 🌟 centre 座標通常跟喺 "OBS AT <time>Z" 後面：例如
    // "TC ORCHID OBS AT 0000Z N1830 E11536 CB TOP FL500"
    const afterObs = rawText.slice((obsFcstMatch?.index ?? 0) + (obsFcstMatch?.[0]?.length ?? 0));
    const centre = parseCoordPair(afterObs);
    if (!centre) return null;

    const fcstMatch = rawText.match(/FCST\s+AT\s+(\d{4})Z\s+TC\s+CENTRE\s+([NS]\d{4}\s+[EW]\d{5})/);
    const forecastCentre = fcstMatch
      ? (() => {
          const c = parseCoordPair(fcstMatch[2]);
          return c ? { time: fcstMatch[1], centre: c } : undefined;
        })()
      : undefined;

    return { type: "centre", ...common, centre, radiusNm, forecastCentre };
  }

  return null;
}

// 🌟 一份電報可以包含幾個 SIGMET（好似 refs 入面嗰份甘，VHHK 3/4/5 + RPHI 2），
// 用空行分隔，每個 block 以 "=" 結尾。空行唔啱好夾喺某個 block 中間都唔緊要，
// 淨係靠 "=" 嚟判斷一個 block 完咗未，再逐個 trim/parse
export function parseSigmetBulletin(raw: string): ParsedSigmet[] {
  const blocks = raw
    .split("=")
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && /SIGMET/.test(b));

  return blocks.map(parseOneBlock).filter((s): s is ParsedSigmet => s !== null);
}

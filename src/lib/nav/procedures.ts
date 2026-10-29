// 🌟 機場 SID/STAR/fix/hold 程序庫——教官自己(由 AIP/公司 chart)打一次落嚟,
// 之後任何 scenario 都可以直接揀個 STAR/SID 名,唔使逐個 fix 打座標。解決咗
// 「冇一個免費嘅全球 fix database」嘅問題：唔靠外部數據源，淨係靠呢個 app
// 自己越用越齊嘅庫（睇同 instructor 傾嘅「人手打一次、之後永久重用」方案）。
import { z } from "zod";

export interface ProcedureFix {
  name: string;
  kind?: string;
  role?: string;
  lat?: string;
  lon?: string;
  latDeg: number;
  lonDeg: number;
}

export interface ProcedureLeg {
  // 冇 fix 嘅 leg(例如 ARINC 424 VA/CA path terminator,heading/course-to
  // -altitude,冇固定座標)——resolveProcedureLegs() 會跳過呢啲 leg
  fix?: string;
  min?: number;
  max?: number;
  speed?: number;
}

export interface Procedure {
  name: string;
  runways?: string;
  legs: ProcedureLeg[];
}

export interface ProcedureHold {
  fix: string;
  inboundMag: number;
  turn?: "L" | "R";
}

export interface AirportProcedures {
  airport: string;
  source?: unknown;
  units?: unknown;
  notes?: string[];
  fixes: ProcedureFix[];
  stars: Procedure[];
  sids: Procedure[];
  holds: ProcedureHold[];
}

// 🌟 鬆身驗證——淨係要求個形狀啱(有 fixes/stars/sids/holds array),唔逐個
// optional 欄位鎖死,等教官貼落嚟嘅 JSON(好似 VHHH 嗰份咁)唔使完全跟一個
// 死板 schema 先接受
const fixSchema = z.object({
  name: z.string().trim().min(1),
  kind: z.string().optional(),
  role: z.string().optional(),
  lat: z.string().optional(),
  lon: z.string().optional(),
  latDeg: z.number(),
  lonDeg: z.number(),
}).passthrough();

const legSchema = z.object({
  fix: z.string().trim().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  speed: z.number().optional(),
}).passthrough();

const procedureSchema = z.object({
  name: z.string().trim().min(1),
  runways: z.string().optional(),
  legs: z.array(legSchema),
}).passthrough();

const holdSchema = z.object({
  fix: z.string().trim().min(1),
  inboundMag: z.number(),
  turn: z.enum(["L", "R"]).optional(),
}).passthrough();

export const airportProceduresSchema = z.object({
  airport: z.string().trim().min(1),
  source: z.unknown().optional(),
  units: z.unknown().optional(),
  notes: z.array(z.string()).optional(),
  fixes: z.array(fixSchema).default([]),
  stars: z.array(procedureSchema).default([]),
  sids: z.array(procedureSchema).default([]),
  holds: z.array(holdSchema).default([]),
}).passthrough();

export function parseAirportProcedures(raw: unknown): AirportProcedures | null {
  const result = airportProceduresSchema.safeParse(raw);
  return result.success ? (result.data as AirportProcedures) : null;
}

// 🌟 將一個 STAR/SID 嘅 legs（淨係 fix 名）解返做有座標嘅 waypoint list，
// 等個 ND iframe 可以直接畫——揾唔到座標嘅 leg 就跳過(例如教官個 procedure
// JSON 打漏咗個 fix 都唔會成個 route override 爆晒)
export function resolveProcedureLegs(
  proc: AirportProcedures,
  legs: ProcedureLeg[]
): { name: string; lat: number; lon: number }[] {
  const byName = new Map(proc.fixes.map((f) => [f.name, f]));
  const out: { name: string; lat: number; lon: number }[] = [];
  for (const leg of legs) {
    if (!leg.fix) continue;
    const f = byName.get(leg.fix);
    if (!f) continue;
    out.push({ name: f.name, lat: f.latDeg, lon: f.lonDeg });
  }
  return out;
}

const DMS_RE = /([NS])?\s*(\d{1,3})\s+(\d{1,2})\s+(\d{1,2}(?:\.\d+)?)\s*([NS])?/;
const DMS_LON_RE = /([EW])?\s*(\d{1,3})\s+(\d{1,2})\s+(\d{1,2}(?:\.\d+)?)\s*([EW])?/;

function dmsToDeg(deg: number, min: number, sec: number, hemi: string): number {
  const v = deg + min / 60 + sec / 3600;
  return hemi === "S" || hemi === "W" ? -v : v;
}

// 🌟 貼文字加 fix——同 sigmetParser.ts 一樣嘅諗頭：教官喺官方 AIP/chart 度
// select 咗段文字 copy 過嚟，唔使手打數字(避免 transcription error)。支援
// 兩種格式,一行一個 fix：
//   ABBEY 22 16 11.00N 114 55 25.92E   （DMS，同 VHHH.json 入面嗰種一樣）
//   ABBEY 22.269722 114.923867          （decimal degrees）
export function parseFixLines(text: string): ProcedureFix[] {
  const out: ProcedureFix[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^([A-Z0-9]{2,8})\s+(.+)$/i);
    if (!m) continue;
    const name = m[1].toUpperCase();
    const rest = m[2].trim();

    // decimal: "22.269722 114.923867" (optionally comma-separated)
    const decMatch = rest.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
    if (decMatch) {
      out.push({ name, latDeg: Number(decMatch[1]), lonDeg: Number(decMatch[2]) });
      continue;
    }

    // DMS: "22 16 11.00N 114 55 25.92E"
    const latM = rest.match(DMS_RE);
    const lonM = latM ? rest.slice(latM.index! + latM[0].length).match(DMS_LON_RE) : null;
    if (latM && lonM) {
      const latHemi = latM[1] || latM[5];
      const lonHemi = lonM[1] || lonM[5];
      if (latHemi && lonHemi) {
        const latDeg = dmsToDeg(Number(latM[2]), Number(latM[3]), Number(latM[4]), latHemi.toUpperCase());
        const lonDeg = dmsToDeg(Number(lonM[2]), Number(lonM[3]), Number(lonM[4]), lonHemi.toUpperCase());
        out.push({ name, latDeg, lonDeg, lat: `${latM[2]} ${latM[3]} ${latM[4]}${latHemi.toUpperCase()}`, lon: `${lonM[2]} ${lonM[3]} ${lonM[4]}${lonHemi.toUpperCase()}` });
        continue;
      }
    }
  }
  return out;
}

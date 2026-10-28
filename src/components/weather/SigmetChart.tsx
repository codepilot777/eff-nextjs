"use client";

import type { ParsedSigmet } from "@/lib/weather/sigmetParser";

// 🌟 由 parseSigmetBulletin() 解析出嚟嘅結構化資料，直接畫一張 schematic chart，
// 唔使教官另外上傳圖——咁張圖同份 SIGMET 文字永遠對得上（同一份資料嚟源），
// 唔會出現「chart 同 text 唔一致」嘅情況。同埋唔使起 file upload/儲存呢類新
// infra，純粹喺 browser 度用現成資料畫一次 SVG
//
// 呢張圖同 refs 入面嗰啲 "FIR outlines are schematic only" 一樣，淨係示意用，
// 唔係精確地圖

const HAZARD_COLORS: { match: RegExp; color: string }[] = [
  { match: /TC\b/, color: "#e4572e" }, // 颱風中心 - 紅橙
  { match: /TURB/, color: "#3b82f6" }, // 顛簸 - 藍
  { match: /TS\b/, color: "#d97706" }, // 雷雨 - 琥珀
];

function colorForHazard(hazard: string): string {
  return HAZARD_COLORS.find((h) => h.match.test(hazard))?.color ?? "#8fa0a6";
}

// 🌟 畫圖用嘅粗略換算：1 海里 ≈ 1/60 緯度。純粹示意用嘅 schematic chart，
// 唔需要大圓航法級數嘅精確度
const NM_PER_DEG_LAT = 60;

type LatLon = [lat: number, lon: number];

function collectBoundsPoints(sigmets: ParsedSigmet[]): LatLon[] {
  const pts: LatLon[] = [];
  for (const s of sigmets) {
    if (s.type === "polygon") {
      pts.push(...s.poly);
    } else {
      const [lat, lon] = s.centre;
      const padDeg = (s.radiusNm ?? 60) / NM_PER_DEG_LAT;
      pts.push([lat + padDeg, lon], [lat - padDeg, lon], [lat, lon + padDeg], [lat, lon - padDeg]);
      if (s.forecastCentre) pts.push(s.forecastCentre.centre);
    }
  }
  return pts;
}

export default function SigmetChart({ sigmets, width = 640, height = 480 }: { sigmets: ParsedSigmet[]; width?: number; height?: number }) {
  if (sigmets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#555] text-xs font-bold uppercase tracking-widest">
        No SIGMETs to chart
      </div>
    );
  }

  const pts = collectBoundsPoints(sigmets);
  const lats = pts.map((p) => p[0]);
  const lons = pts.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const centerLat = (minLat + maxLat) / 2;
  const kx = Math.cos((centerLat * Math.PI) / 180); // 🌟 經度喺高緯度要壓返扁啲，同 core.js toXY() 一樣道理

  const padDeg = Math.max(maxLat - minLat, (maxLon - minLon) * kx, 2) * 0.15;
  const vLatMin = minLat - padDeg, vLatMax = maxLat + padDeg;
  const vLonMin = minLon - padDeg / kx, vLonMax = maxLon + padDeg / kx;

  const project = ([lat, lon]: LatLon): [number, number] => {
    const x = ((lon - vLonMin) / (vLonMax - vLonMin)) * width;
    const y = height - ((lat - vLatMin) / (vLatMax - vLatMin)) * height; // 🌟 緯度愈大愈北，SVG y 愈細
    return [x, y];
  };

  // 🌟 隔幾多度畫一條經緯網格線，取決於張圖涵蓋幾大範圍
  const gridStepDeg = (() => {
    const span = Math.max(vLatMax - vLatMin, vLonMax - vLonMin);
    if (span > 15) return 5;
    if (span > 6) return 2;
    return 1;
  })();
  const gridLats: number[] = [];
  for (let g = Math.ceil(vLatMin / gridStepDeg) * gridStepDeg; g <= vLatMax; g += gridStepDeg) gridLats.push(g);
  const gridLons: number[] = [];
  for (let g = Math.ceil(vLonMin / gridStepDeg) * gridStepDeg; g <= vLonMax; g += gridStepDeg) gridLons.push(g);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="bg-[#0a1218]">
      {/* 經緯網格 */}
      {gridLats.map((g) => {
        const [, y] = project([g, vLonMin]);
        return (
          <g key={`lat-${g}`}>
            <line x1={0} y1={y} x2={width} y2={y} stroke="#1f2d36" strokeWidth={1} />
            <text x={4} y={y - 3} fill="#51626c" fontSize={9} fontFamily="monospace">{g.toFixed(0)}N</text>
          </g>
        );
      })}
      {gridLons.map((g) => {
        const [x] = project([vLatMin, g]);
        return (
          <g key={`lon-${g}`}>
            <line x1={x} y1={0} x2={x} y2={height} stroke="#1f2d36" strokeWidth={1} />
            <text x={x + 3} y={height - 4} fill="#51626c" fontSize={9} fontFamily="monospace">{g.toFixed(0)}E</text>
          </g>
        );
      })}

      {sigmets.map((s) => {
        const color = colorForHazard(s.hazard);
        const key = `${s.firCode}-${s.sigmetNumber}`;

        if (s.type === "polygon") {
          const screenPts = s.poly.map(project);
          const pathD = `M ${screenPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")} Z`;
          const [lx, ly] = screenPts[0];
          return (
            <g key={key}>
              <path d={pathD} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={1.5} strokeDasharray="4 2" />
              <text x={lx + 4} y={ly - 4} fill={color} fontSize={11} fontWeight={700} fontFamily="monospace">
                {s.sigmetNumber} {s.hazard}
              </text>
            </g>
          );
        }

        const [cx, cy] = project(s.centre);
        const radiusDeg = (s.radiusNm ?? 60) / NM_PER_DEG_LAT;
        const [, edgeY] = project([s.centre[0] - radiusDeg, s.centre[1]]);
        const rPx = Math.abs(edgeY - cy);
        const fc = s.forecastCentre ? project(s.forecastCentre.centre) : null;

        return (
          <g key={key}>
            <circle cx={cx} cy={cy} r={rPx} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} strokeDasharray="4 2" />
            <circle cx={cx} cy={cy} r={3} fill={color} />
            {fc && (
              <>
                <line x1={cx} y1={cy} x2={fc[0]} y2={fc[1]} stroke={color} strokeWidth={1} strokeDasharray="2 3" />
                <circle cx={fc[0]} cy={fc[1]} r={2.5} fill="none" stroke={color} strokeWidth={1.5} />
                <text x={fc[0] + 4} y={fc[1] - 4} fill={color} fontSize={9} fontFamily="monospace">
                  FCST {s.forecastCentre?.time}Z
                </text>
              </>
            )}
            <text x={cx + 6} y={cy - 6} fill={color} fontSize={11} fontWeight={700} fontFamily="monospace">
              {s.sigmetNumber} {s.hazard}
            </text>
          </g>
        );
      })}

      <text x={width - 6} y={height - 6} fill="#51626c" fontSize={9} fontFamily="monospace" textAnchor="end">
        SCHEMATIC ONLY — NOT FOR OPERATIONAL USE
      </text>
    </svg>
  );
}

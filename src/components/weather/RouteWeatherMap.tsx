"use client";

import { useState } from "react";
import type { ParsedSigmet } from "@/lib/weather/sigmetParser";
import type { RouteFix } from "@/lib/weather/routeFixes";

// 🌟 Demo：trainee Weather tab 嘅 map view——同 SigmetChart.tsx 用緊一樣嘅
// lat/lon→SVG 投影數學（包括高緯度嘅經度壓扁修正），淨係加多咗 route layer
// 同層選擇 UI。SIGMET 嘅 hazard 分類（/TURB/ vs 其他）已經喺 sigmetParser.ts
// 解析嗰陣有埋，唔使另外再 parse 一次——Turbulence/SIGMET Weather 兩個
// layer 純粹係用呢個分類濾返 sigmets 數組，之後想加嘅 layer（TC track、
// enroute stations……）都係跟呢個模式加多個 filter + 多個 toggle
const NM_PER_DEG_LAT = 60;

type LatLon = [lat: number, lon: number];

const LAYER_DEFS = [
  { id: "turb", label: "Turbulence", color: "#3b82f6", match: (s: ParsedSigmet) => /TURB/.test(s.hazard) },
  { id: "sigmet", label: "SIGMET Weather", color: "#d97706", match: (s: ParsedSigmet) => !/TURB/.test(s.hazard) },
] as const;

function collectSigmetPoints(sigmets: ParsedSigmet[]): LatLon[] {
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

export default function RouteWeatherMap({
  sigmets,
  routeFixes,
  width = 720,
  height = 480,
}: {
  sigmets: ParsedSigmet[];
  routeFixes: RouteFix[];
  width?: number;
  height?: number;
}) {
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({ turb: true, sigmet: true });

  const hasRoute = routeFixes.length >= 2;
  const hasSigmets = sigmets.length > 0;

  if (!hasRoute && !hasSigmets) {
    return (
      <div className="flex items-center justify-center h-full text-[#555] text-xs font-bold uppercase tracking-widest">
        No route or SIGMET data to map yet
      </div>
    );
  }

  const routePts: LatLon[] = routeFixes.map((f) => [f.lat, f.lon]);
  const sigPts = collectSigmetPoints(sigmets);
  const pts = [...routePts, ...sigPts];

  const lats = pts.map((p) => p[0]);
  const lons = pts.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const centerLat = (minLat + maxLat) / 2;
  const kx = Math.cos((centerLat * Math.PI) / 180);

  const padDeg = Math.max(maxLat - minLat, (maxLon - minLon) * kx, 2) * 0.15;
  const vLatMin = minLat - padDeg, vLatMax = maxLat + padDeg;
  const vLonMin = minLon - padDeg / kx, vLonMax = maxLon + padDeg / kx;

  const project = ([lat, lon]: LatLon): [number, number] => {
    const x = ((lon - vLonMin) / (vLonMax - vLonMin)) * width;
    const y = height - ((lat - vLatMin) / (vLatMax - vLatMin)) * height;
    return [x, y];
  };

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

  const toggleLayer = (id: string) => setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col h-full">
      {/* 🌟 Layer toggle — 而家得 2 個（turbulence/SIGMET weather），
          之後加新 layer（TC track、enroute stations……）淨係加多粒掣 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333] shrink-0 flex-wrap">
        <span className="text-[#8fa0a6] text-[0.6rem] font-bold uppercase tracking-widest mr-1">Layers</span>
        {LAYER_DEFS.map((l) => (
          <button
            key={l.id}
            onClick={() => toggleLayer(l.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[0.65rem] font-bold uppercase tracking-wide transition-colors ${
              activeLayers[l.id] ? "border-current bg-white/5" : "border-[#333] text-[#555] opacity-60"
            }`}
            style={activeLayers[l.id] ? { color: l.color } : undefined}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: activeLayers[l.id] ? l.color : "#444" }} />
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
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

          {/* Route layer — 恆常顯示，係成張圖嘅骨幹，唔使 toggle */}
          {hasRoute && (
            <g>
              <polyline
                points={routePts.map((p) => project(p).join(",")).join(" ")}
                fill="none"
                stroke="#ff4fff"
                strokeWidth={1.8}
                strokeDasharray="6 4"
              />
              {routeFixes.map((f, i) => {
                const [x, y] = project([f.lat, f.lon]);
                const isEndpoint = i === 0 || i === routeFixes.length - 1;
                return (
                  <g key={`${f.name}-${i}`}>
                    <circle cx={x} cy={y} r={isEndpoint ? 4 : 2.5} fill={isEndpoint ? "#38d9ff" : "#ff4fff"} stroke="#0a1218" strokeWidth={1} />
                    <text x={x + 6} y={y - 6} fill={isEndpoint ? "#38d9ff" : "#ff9eff"} fontSize={10} fontWeight={isEndpoint ? 700 : 500} fontFamily="monospace">
                      {f.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* SIGMET layers — 按 LAYER_DEFS 嘅 match() 分流，toggle 控制顯唔顯示 */}
          {LAYER_DEFS.map((layer) => {
            if (!activeLayers[layer.id]) return null;
            const layerSigmets = sigmets.filter(layer.match);
            return (
              <g key={layer.id}>
                {layerSigmets.map((s) => {
                  const key = `${s.firCode}-${s.sigmetNumber}`;
                  if (s.type === "polygon") {
                    const screenPts = s.poly.map(project);
                    const pathD = `M ${screenPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")} Z`;
                    const [lx, ly] = screenPts[0];
                    return (
                      <g key={key}>
                        <path d={pathD} fill={layer.color} fillOpacity={0.18} stroke={layer.color} strokeWidth={1.5} strokeDasharray="4 2" />
                        <text x={lx + 4} y={ly - 4} fill={layer.color} fontSize={11} fontWeight={700} fontFamily="monospace">
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
                      <circle cx={cx} cy={cy} r={rPx} fill={layer.color} fillOpacity={0.12} stroke={layer.color} strokeWidth={1.5} strokeDasharray="4 2" />
                      <circle cx={cx} cy={cy} r={3} fill={layer.color} />
                      {fc && (
                        <>
                          <line x1={cx} y1={cy} x2={fc[0]} y2={fc[1]} stroke={layer.color} strokeWidth={1} strokeDasharray="2 3" />
                          <circle cx={fc[0]} cy={fc[1]} r={2.5} fill="none" stroke={layer.color} strokeWidth={1.5} />
                          <text x={fc[0] + 4} y={fc[1] - 4} fill={layer.color} fontSize={9} fontFamily="monospace">
                            FCST {s.forecastCentre?.time}Z
                          </text>
                        </>
                      )}
                      <text x={cx + 6} y={cy - 6} fill={layer.color} fontSize={11} fontWeight={700} fontFamily="monospace">
                        {s.sigmetNumber} {s.hazard}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <text x={width - 6} y={height - 6} fill="#51626c" fontSize={9} fontFamily="monospace" textAnchor="end">
            SCHEMATIC ONLY — NOT FOR OPERATIONAL USE
          </text>
        </svg>
      </div>
    </div>
  );
}

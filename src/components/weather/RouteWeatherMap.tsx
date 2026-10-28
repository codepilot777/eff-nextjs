"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ParsedSigmet } from "@/lib/weather/sigmetParser";
import type { RouteFix } from "@/lib/weather/routeFixes";
import { getCoastlineRingsInView } from "@/lib/weather/coastline";

// 🌟 Demo：trainee Weather tab 嘅 map view——同 SigmetChart.tsx 用緊一樣嘅
// lat/lon→SVG 投影數學（包括高緯度嘅經度壓扁修正），加埋 route layer、
// 地面海岸線（world-atlas land-110m，一次過攞成個世界，再按視窗 bbox 篩走
// 睇唔到嘅部分）、zoom/pan、同一個時間動畫（根據 SIGMET 嘅 MOV 向量模擬
// weather 隨時間漂移）。SIGMET 嘅 hazard 分類（/TURB/ vs 其他）已經喺
// sigmetParser.ts 解析嗰陣有埋，之後想加嘅 layer（TC track、enroute
// stations……）都係跟呢個模式加多個 filter + 多個 toggle
const NM_PER_DEG_LAT = 60;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const PLAY_MAX_MIN = 180;
const PLAY_STEP_MIN = 5;
const PLAY_TICK_MS = 350;

type LatLon = [lat: number, lon: number];

const LAYER_DEFS = [
  { id: "turb", label: "Turbulence", color: "#3b82f6", match: (s: ParsedSigmet) => /TURB/.test(s.hazard) },
  { id: "sigmet", label: "SIGMET Weather", color: "#d97706", match: (s: ParsedSigmet) => !/TURB/.test(s.hazard) },
] as const;

// 🌟 "WNW" 之類嘅羅盤方向轉做方位角（度），用嚟配合 movSpdKt 做 play 動畫
const COMPASS_BEARING: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
};

function shiftPoint([lat, lon]: LatLon, bearingDeg: number, distNm: number): LatLon {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = (distNm * Math.cos(rad)) / NM_PER_DEG_LAT;
  const dLon = (distNm * Math.sin(rad)) / (NM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lon + dLon];
}

// 🌟 按 playMinutes 將帶 MOV 向量嘅 SIGMET 推移——冇 movDir/movSpdKt 嘅（例如
// 冇寫移動方向嘅電報）就當佢靜止唔動，唯一影響嘅係 play slider 拖到幾時都
// 留在原位,唔會爛
function shiftSigmet(s: ParsedSigmet, minutes: number): ParsedSigmet {
  if (minutes <= 0 || !s.movDir || !s.movSpdKt) return s;
  const bearing = COMPASS_BEARING[s.movDir];
  if (bearing === undefined) return s;
  const distNm = (s.movSpdKt * minutes) / 60;
  if (s.type === "polygon") return { ...s, poly: s.poly.map((p) => shiftPoint(p, bearing, distNm)) };
  return { ...s, centre: shiftPoint(s.centre, bearing, distNm) };
}

export interface MapAirport {
  id: string;
  icao: string;
  lat: number;
  lon: number;
}

function touchDistance(touches: React.TouchList): number {
  const a = touches[0], b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

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
  airports = [],
  onAirportSelect,
  width = 720,
  height = 480,
}: {
  sigmets: ParsedSigmet[];
  routeFixes: RouteFix[];
  airports?: MapAirport[];
  onAirportSelect?: (id: string) => void;
  width?: number;
  height?: number;
}) {
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({ turb: true, sigmet: true });
  const [showCoast, setShowCoast] = useState(true);

  // 🌟 Zoom/pan 狀態——transform 寫做 translate(pan) scale(zoom)，咁拖拽嗰陣
  // 螢幕 delta 可以直接加落 pan 度，唔使理 zoom 幾多(SVG 先 scale 再 translate
  // 套用喺個點上，所以外層個 translate 同 zoom 冇關係)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  // 🌟 手指 pinch-to-zoom——記低開始 pinch 嗰刻嘅距離同 zoom，之後純粹睇
  // 兩隻手指距離嘅比例嚟縮放,唔使掣/數字顯示
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  // 🌟 Play：模擬 SIGMET 隨時間漂移——淨係靠 SIGMET 本身嘅 MOV 向量,
  // 唔使加新數據源
  const [playMinutes, setPlayMinutes] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPlayMinutes((t) => (t + PLAY_STEP_MIN > PLAY_MAX_MIN ? 0 : t + PLAY_STEP_MIN));
    }, PLAY_TICK_MS);
    return () => clearInterval(id);
  }, [playing]);

  const displaySigmets = useMemo(
    () => sigmets.map((s) => shiftSigmet(s, playMinutes)),
    [sigmets, playMinutes]
  );

  const hasRoute = routeFixes.length >= 2;
  const hasSigmets = sigmets.length > 0;
  const hasAirports = airports.length > 0;

  if (!hasRoute && !hasSigmets && !hasAirports) {
    return (
      <div className="flex items-center justify-center h-full text-[#555] text-xs font-bold uppercase tracking-widest">
        No route or SIGMET data to map yet
      </div>
    );
  }

  const routePts: LatLon[] = routeFixes.map((f) => [f.lat, f.lon]);
  const sigPts = collectSigmetPoints(sigmets);
  const airportPts: LatLon[] = airports.map((a) => [a.lat, a.lon]);
  const pts = [...routePts, ...sigPts, ...airportPts];

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

  // 🌟 地面海岸線——淨係攞返同視窗 bbox 有重疊嗰啲 ring，唔使畫成個世界
  const coastRings = showCoast ? getCoastlineRingsInView(vLatMin, vLatMax, vLonMin, vLonMax) : [];

  const toggleLayer = (id: string) => setActiveLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault();
    setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
  };
  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (pinchRef.current) return; // 🌟 pinch 緊嗰陣唔好當單指拖拽
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!dragRef.current || pinchRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    // 🌟 螢幕 px 要轉做 SVG user-unit（viewBox 同實際渲染尺寸可能唔一樣大）
    const svgEl = e.currentTarget;
    const scaleX = width / svgEl.clientWidth;
    const scaleY = height / svgEl.clientHeight;
    setPan((p) => ({ x: p.x + dx * scaleX, y: p.y + dy * scaleY }));
  };
  const endDrag = () => { dragRef.current = null; };

  // 🌟 兩隻手指 pinch 開/合嚟 zoom in/out——唔使 +/- 掣。單指拖拽(onPointerMove)
  // 喺 pinchRef 有嘢嗰陣會自動 bail out，兩者唔會打架
  const onTouchStart: React.TouchEventHandler<SVGSVGElement> = (e) => {
    if (e.touches.length === 2) {
      dragRef.current = null;
      pinchRef.current = { dist: touchDistance(e.touches), zoom };
    }
  };
  const onTouchMove: React.TouchEventHandler<SVGSVGElement> = (e) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const ratio = touchDistance(e.touches) / pinchRef.current.dist;
      setZoom(clampZoom(pinchRef.current.zoom * ratio));
    }
  };
  const onTouchEnd: React.TouchEventHandler<SVGSVGElement> = (e) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Layer/zoom/play 工具列 */}
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
        <button
          onClick={() => setShowCoast((v) => !v)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[0.65rem] font-bold uppercase tracking-wide transition-colors ${
            showCoast ? "border-current bg-white/5 text-[#7fd68a]" : "border-[#333] text-[#555] opacity-60"
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: showCoast ? "#7fd68a" : "#444" }} />
          Coastline
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline text-[#555] text-[0.6rem] font-bold uppercase tracking-widest">Pinch / scroll to zoom</span>
          <button onClick={resetView} title="Reset view"
            className="px-2 h-6 flex items-center justify-center rounded border border-[#333] text-[#8fa0a6] hover:text-white hover:border-[#555] text-[0.6rem] font-bold uppercase">
            Reset
          </button>
        </div>
      </div>

      {/* Play 時間動畫列 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#333] shrink-0">
        <button
          onClick={() => setPlaying((v) => !v)}
          className={`w-6 h-6 flex items-center justify-center rounded border text-[0.65rem] font-bold ${
            playing ? "border-[#ff4fff] text-[#ff4fff] bg-white/5" : "border-[#333] text-[#8fa0a6] hover:text-white"
          }`}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? "❙❙" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={PLAY_MAX_MIN}
          step={PLAY_STEP_MIN}
          value={playMinutes}
          onChange={(e) => { setPlaying(false); setPlayMinutes(Number(e.target.value)); }}
          className="flex-1 accent-[#ff4fff]"
        />
        <span className="text-[#8fa0a6] text-[0.65rem] font-bold font-mono w-16 text-right">T+{playMinutes}m</span>
      </div>

      <div className="flex-1 min-h-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          className="bg-[#0a1218] cursor-grab active:cursor-grabbing touch-none"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {/* 經緯網格 */}
            {gridLats.map((g) => {
              const [, y] = project([g, vLonMin]);
              return (
                <g key={`lat-${g}`}>
                  <line x1={0} y1={y} x2={width} y2={y} stroke="#1f2d36" strokeWidth={1 / zoom} />
                  <text x={4} y={y - 3} fill="#51626c" fontSize={9 / zoom} fontFamily="monospace">{g.toFixed(0)}N</text>
                </g>
              );
            })}
            {gridLons.map((g) => {
              const [x] = project([vLatMin, g]);
              return (
                <g key={`lon-${g}`}>
                  <line x1={x} y1={0} x2={x} y2={height} stroke="#1f2d36" strokeWidth={1 / zoom} />
                  <text x={x + 3} y={height - 4} fill="#51626c" fontSize={9 / zoom} fontFamily="monospace">{g.toFixed(0)}E</text>
                </g>
              );
            })}

            {/* 地面海岸線——淡淡嘅陸地參考，唔搶 route/weather 嘅視覺焦點 */}
            {coastRings.map((ring, i) => (
              <path
                key={`coast-${i}`}
                d={`M ${ring.map((p) => project(p).join(",")).join(" L ")} Z`}
                fill="#16261b"
                fillOpacity={0.9}
                stroke="#2c4a36"
                strokeWidth={1 / zoom}
              />
            ))}

            {/* Route layer — 恆常顯示，係成張圖嘅骨幹，唔使 toggle */}
            {hasRoute && (
              <g>
                <polyline
                  points={routePts.map((p) => project(p).join(",")).join(" ")}
                  fill="none"
                  stroke="#ff4fff"
                  strokeWidth={1.8 / zoom}
                  strokeDasharray={`${6 / zoom} ${4 / zoom}`}
                />
                {routeFixes.map((f, i) => {
                  const [x, y] = project([f.lat, f.lon]);
                  const isEndpoint = i === 0 || i === routeFixes.length - 1;
                  return (
                    <g key={`${f.name}-${i}`}>
                      <circle cx={x} cy={y} r={(isEndpoint ? 4 : 2.5) / zoom} fill={isEndpoint ? "#38d9ff" : "#ff4fff"} stroke="#0a1218" strokeWidth={1 / zoom} />
                      <text x={x + 6 / zoom} y={y - 6 / zoom} fill={isEndpoint ? "#38d9ff" : "#ff9eff"} fontSize={10 / zoom} fontWeight={isEndpoint ? 700 : 500} fontFamily="monospace">
                        {f.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* SIGMET layers — 按 LAYER_DEFS 嘅 match() 分流，toggle 控制顯唔顯示；
                displaySigmets 已經按 playMinutes 推移咗位置 */}
            {LAYER_DEFS.map((layer) => {
              if (!activeLayers[layer.id]) return null;
              const layerSigmets = displaySigmets.filter(layer.match);
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
                          <path d={pathD} fill={layer.color} fillOpacity={0.18} stroke={layer.color} strokeWidth={1.5 / zoom} strokeDasharray={`${4 / zoom} ${2 / zoom}`} />
                          <text x={lx + 4 / zoom} y={ly - 4 / zoom} fill={layer.color} fontSize={11 / zoom} fontWeight={700} fontFamily="monospace">
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
                        <circle cx={cx} cy={cy} r={rPx} fill={layer.color} fillOpacity={0.12} stroke={layer.color} strokeWidth={1.5 / zoom} strokeDasharray={`${4 / zoom} ${2 / zoom}`} />
                        <circle cx={cx} cy={cy} r={3 / zoom} fill={layer.color} />
                        {fc && (
                          <>
                            <line x1={cx} y1={cy} x2={fc[0]} y2={fc[1]} stroke={layer.color} strokeWidth={1 / zoom} strokeDasharray={`${2 / zoom} ${3 / zoom}`} />
                            <circle cx={fc[0]} cy={fc[1]} r={2.5 / zoom} fill="none" stroke={layer.color} strokeWidth={1.5 / zoom} />
                            <text x={fc[0] + 4 / zoom} y={fc[1] - 4 / zoom} fill={layer.color} fontSize={9 / zoom} fontFamily="monospace">
                              FCST {s.forecastCentre?.time}Z
                            </text>
                          </>
                        )}
                        <text x={cx + 6 / zoom} y={cy - 6 / zoom} fill={layer.color} fontSize={11 / zoom} fontWeight={700} fontFamily="monospace">
                          {s.sigmetNumber} {s.hazard}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* 🌟 有 TAF 嘅機場 marker——撳落去/tap 一下就叫 onAirportSelect，
                等右邊 METAR/TAF 欄跳去/highlight 返嗰張卡。stopPropagation
                等單指拖拽個 pointerdown 唔會當佢做拖地圖 */}
            {airports.map((a) => {
              const [x, y] = project([a.lat, a.lon]);
              return (
                <g
                  key={a.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onAirportSelect?.(a.id); }}
                  className="cursor-pointer"
                >
                  <rect
                    x={x - 4 / zoom} y={y - 4 / zoom} width={8 / zoom} height={8 / zoom}
                    fill="#ffd23f" stroke="#0a1218" strokeWidth={1 / zoom}
                    transform={`rotate(45 ${x} ${y})`}
                  />
                  <text x={x + 7 / zoom} y={y + 3 / zoom} fill="#ffd23f" fontSize={10 / zoom} fontWeight={700} fontFamily="monospace">
                    {a.icao}
                  </text>
                </g>
              );
            })}

            <text x={width - 6} y={height - 6} fill="#51626c" fontSize={9 / zoom} fontFamily="monospace" textAnchor="end">
              SCHEMATIC ONLY — NOT FOR OPERATIONAL USE
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

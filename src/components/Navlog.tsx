"use client";

import React, { useState } from "react";

export default function Navlog({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const navInputs = flightData?.navlog_inputs || {};
  const depTimes = navInputs.dep_times || { doors: "", ready: "", out: "", off: "", fuel: "" };
  
  // 直接讀取 SimBrief 嘅完整 Waypoints (Fixes)
  const rawNavlog = flightData?.raw_simbrief?.navlog?.fix || flightData?.navlog || [];
  const rawOrigin = flightData?.raw_simbrief?.origin || {};
  
  // 🌟 確保 FIRs 係一個 Array
  const rawFirsObj = flightData?.raw_simbrief?.firs?.fir;
  const rawFirs = Array.isArray(rawFirsObj) ? rawFirsObj : (rawFirsObj ? [rawFirsObj] : []);

  const reqdOfp = (flightData?.fuel_trip_ofp || 0) + (flightData?.fuel_cont_ofp || 0) + (flightData?.fuel_altn_ofp || 0) + (flightData?.fuel_reserve_ofp || 0);

  // 動態獲取起飛機場名稱與跑道
  const depAirportName = rawOrigin.name || flightData?.dep_icao || 'HONG KONG INTL';
  const depRunway = flightData?.dep_rwy || rawOrigin.plan_rwy || '07R';

  // 🌟 完美讀取第一個 FIR (Mapping 邏輯)
  const initialFirIcao = rawNavlog[0]?.fir || rawOrigin.fir || "VHHK";
  const matchedFir = rawFirs.find((f: any) => f.icao === initialFirIcao);
  const initialFirName = matchedFir?.name || ""; 
  
  let initialFirText = `${initialFirIcao} ${initialFirName}`.trim();
  if (!initialFirText.includes("FIR")) initialFirText += " FIR";

  const handleDepInputChange = (field: string, val: string) => {
    const updatedInputs = { ...navInputs, dep_times: { ...depTimes, [field]: val } };
    updateFlightData({ navlog_inputs: updatedInputs });
  };

  const handleWpInputChange = (idx: number, field: string, val: string) => {
    const wpData = navInputs[idx] || {};
    const updatedInputs = { ...navInputs, [idx]: { ...wpData, [field]: val } };
    updateFlightData({ navlog_inputs: updatedInputs });
  };

  const getFlightLevel = (alt: string | number) => {
    let num = parseInt(String(alt || '35000'), 10);
    if (num >= 1000) num = Math.floor(num / 100);
    return `FL${num.toString().padStart(3, '0')}`;
  };

  const getDeterministicMockData = (ident: string) => {
    let hash = 0;
    for (let i = 0; i < ident.length; i++) hash = ident.charCodeAt(i) + ((hash << 5) - hash);
    const getRand = (min: number, max: number, offset: number) => {
       const x = Math.sin(hash + offset) * 10000;
       return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };
    return {
       mora: getRand(30, 80, 1), track: getRand(1, 360, 2).toString().padStart(3, '0') + "°",
       dist: getRand(5, 120, 3) + "NM", gs: getRand(450, 520, 4) + "KTS",
       lat: `N 22 ${getRand(10, 50, 5)}.${getRand(0, 9, 6)}`, lon: `E114 ${getRand(10, 50, 7)}.${getRand(0, 9, 8)}`,
       wind: `${getRand(1, 360, 9).toString().padStart(3, '0')}/${getRand(5, 120, 10).toString().padStart(3, '0')}KTS`
    };
  };

  const formatEta = (stdStr: string, accumMins: number) => {
    if (!stdStr || stdStr.length < 4) return `${accumMins.toString().padStart(4, '0')}z`;
    const hours = parseInt(stdStr.substring(0, 2));
    const mins = parseInt(stdStr.substring(2, 4));
    if (isNaN(hours) || isNaN(mins)) return `${accumMins.toString().padStart(4, '0')}z`;
    
    const totalMins = hours * 60 + mins + accumMins;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${newH.toString().padStart(2, '0')}${newM.toString().padStart(2, '0')}z`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] overflow-hidden rounded-lg border border-[#333333] relative">
      
      {/* 1. 標題列 */}
      <div className="flex bg-[#1e1e1e] text-[#a0a0a0] font-mono text-[0.65rem] px-3 py-1 uppercase border-b border-[#333] shrink-0 z-50">
        <div className="flex-[1.6]">Waypoint</div>
        <div className="flex-[2.4]">FL / MORA &nbsp;&nbsp;&nbsp; MTR / DIS / GS</div>
        <div className="flex-[2.6]">LAT/LONG &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; WIND / WEIGHT</div>
        <div className="flex-[1.0] text-right">REQ FUEL / ACTUAL</div>
        <div className="flex-[1.0] text-right">TIME / ATA</div>
      </div>
      
      {/* 滾動區域 (包含 Sticky Headers) */}
      <div className="flex-1 overflow-y-auto pb-10 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent relative">
        
        {/* 2. 初始 FIR Header (第一個 Sticky Element) */}
        <div className="sticky top-0 z-40 bg-[#d1bfae] text-[#111] font-black font-mono text-[0.75rem] px-3 py-0.5 flex justify-between shrink-0 shadow-sm border-b border-[#111]">
          <span>FIR &nbsp;&nbsp;&nbsp; {initialFirText}</span>
          <span>{initialFirText} &nbsp;&nbsp;&nbsp; FIR</span>
        </div>

        {/* 3. 出發機場 */}
        <div className="flex px-3 py-2 border-b border-[#1e2630] items-center">
          <div className="flex-[1.6]">
            <div className="text-2xl font-black text-white tracking-wider leading-none mb-1">{flightData?.dep_icao || 'VHHH'}</div>
            <div className="text-xs text-text-muted font-mono leading-tight">{depAirportName}<br/>{depRunway}</div>
          </div>
          <div className="flex-[4.6] text-xs text-text-muted font-mono pt-3">RWY</div>
          <div className="flex-[1.0] flex flex-col items-end gap-1">
            <div className="text-[0.95rem] font-bold font-mono text-text-main">{reqdOfp.toFixed(1)}T <span className="text-[#00E676] text-[0.7rem]">3.6</span></div>
            <input 
              type="number" step="0.1" placeholder="T" defaultValue={depTimes.fuel || ""}
              onBlur={(e) => handleDepInputChange("fuel", e.target.value)}
              className="w-[80px] bg-[#007979] text-white font-mono font-black text-right border-none rounded-sm px-1 py-0.5 outline-none placeholder:text-white/50 focus:bg-[#009999] transition-colors"
            />
          </div>
          <div className="flex-[1.0] flex justify-end gap-2 text-xs">
            <div className="flex flex-col text-right text-text-muted font-mono leading-[1.6rem] pt-1">
              <span>DOORS</span><span>READY</span><span>OUT</span><span>OFF</span>
            </div>
            <div className="flex flex-col gap-1 w-[60px]">
              {['doors', 'ready', 'out', 'off'].map((field) => (
                <input 
                  key={field} type="text" placeholder="z" defaultValue={depTimes[field] || ""}
                  onBlur={(e) => handleDepInputChange(field, e.target.value)}
                  className="w-full bg-[#007979] text-white font-mono font-black text-right border-none rounded-sm px-1 py-0.5 outline-none placeholder:text-white/50 focus:bg-[#009999] transition-colors"
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4. 航點列表 (Navlog Waypoints) */}
        {rawNavlog.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No detailed NavLog available from this flight plan.</div>
        ) : (
          rawNavlog.map((fix: any, i: number) => {
            const ident = fix.ident;
            const efob = parseFloat(fix.fuel_plan_onboard || "0") / 1000;
            
            const timeAccumMins = Math.round(parseInt(fix.time_total || "0", 10) / 60);
            const timeAccumHoursStr = Math.floor(timeAccumMins / 60).toString().padStart(2, '0');
            const timeAccumMinsStr = (timeAccumMins % 60).toString().padStart(2, '0');
            const eetStr = `Δ+${timeAccumHoursStr}${timeAccumMinsStr}`;
            
            const etaTime = formatEta(flightData?.std_z, timeAccumMins);
            
            const mock = getDeterministicMockData(ident);
            const zfw = flightData?.weight_zfw_ofp || 200;
            const wt = `${(zfw + efob).toFixed(1)}T`;
            
            const wpData = navInputs[i] || {};
            let devHtml = null;
            if (wpData.afob && !isNaN(parseFloat(wpData.afob))) {
              const dev = parseFloat(wpData.afob) - efob;
              const color = dev <= -1.0 ? "text-[#FF1744]" : (dev <= -0.5 ? "text-[#FF9100]" : "text-[#00E676]");
              devHtml = <div className={`text-[0.75rem] font-bold text-right ${color}`}>{dev > 0 ? '+' : ''}{dev.toFixed(1)}</div>;
            }

            const crossing = fix.fir_crossing?.fir;
            let crossingText = "";
            if (crossing) {
              crossingText = `${crossing.fir_icao || ''} ${crossing.fir_name || ''}`.trim();
              if (!crossingText.includes("FIR")) crossingText += " FIR";
            }

            const isExpanded = expandedRow === i;

            return (
              <React.Fragment key={i}>
                {/* 🌟 內嵌的 Sticky FIR Boundary Header */}
                {crossingText && (
                  <div className="sticky top-0 z-40 bg-[#d1bfae] text-[#111] font-black font-mono text-[0.75rem] px-3 py-0.5 flex justify-between shrink-0 shadow-sm border-t border-[#111]">
                    <span>FIR &nbsp;&nbsp;&nbsp; {crossingText}</span>
                    <span>{crossingText} &nbsp;&nbsp;&nbsp; FIR</span>
                  </div>
                )}

                {/* 🔴 正常/展開 Row */}
                {!isExpanded ? (
                  <div 
                    onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                    className="flex px-3 py-2 border-b border-[#1e2630] items-center hover:bg-[#111] transition-colors cursor-pointer group"
                  >
                    <div className="flex-[1.6]">
                      <div className="text-2xl font-black text-white tracking-wider leading-none mb-1 text-left w-full group-hover:text-[#00E676] transition-colors flex items-center gap-2">
                        {ident} <span className="text-[0.7rem] text-[#34495e] group-hover:text-[#00E676]">▼</span>
                      </div>
                      <div className="text-xs text-text-muted font-mono leading-tight">
                        {ident}<br/>{fix.via_airway || 'AWY'}
                      </div>
                    </div>
                    <div className="flex-[2.4] flex flex-col font-mono text-[0.85rem] text-text-main font-bold">
                      <div className="flex justify-between mb-0.5">
                        <span className="bg-[#e2e8f0] text-[#111] px-1 rounded-sm text-[0.75rem]">{getFlightLevel(fix.altitude_feet || flightData?.cruise_alt)}</span>
                        <span>{mock.track}</span><span>{mock.dist}</span>
                      </div>
                      <div className="flex justify-between text-text-muted text-xs">
                        <span>{mock.mora}</span><span></span><span>{mock.gs}</span>
                      </div>
                    </div>
                    <div className="flex-[2.6] flex flex-col font-mono text-[0.85rem] text-text-main font-bold px-4">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-text-muted text-xs">{mock.lat}</span>
                        <span>{mock.wind}</span>
                      </div>
                      <div className="flex justify-between text-text-muted text-xs">
                        <span>{mock.lon}<br/>--</span>
                        <span>{wt}</span>
                      </div>
                    </div>
                    <div className="flex-[1.0] flex flex-col items-end gap-1 pr-2">
                      <div className="text-[0.95rem] font-bold font-mono text-[#00E676] pt-1">{efob.toFixed(1)}T</div>
                      {devHtml}
                      <input 
                        type="number" step="0.1" placeholder="T" defaultValue={wpData.afob || ""}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => handleWpInputChange(i, "afob", e.target.value)}
                        className="w-[80px] bg-[#007979] text-white font-mono font-black text-right border-none rounded-sm px-1 py-0.5 outline-none placeholder:text-white/50 focus:bg-[#009999]"
                      />
                    </div>
                    <div className="flex-[1.0] flex flex-col items-end gap-1">
                      <div className="text-text-muted text-xs font-mono">{eetStr}</div>
                      <div className="text-[#00E676] text-[0.95rem] font-bold font-mono">{etaTime}</div>
                      <input 
                        type="text" placeholder="z" defaultValue={wpData.ata || ""}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => handleWpInputChange(i, "ata", e.target.value)}
                        className="w-[60px] bg-[#007979] text-white font-mono font-black text-right border-none rounded-sm px-1 py-0.5 outline-none placeholder:text-white/50 focus:bg-[#009999]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#2b2b2b] border-y border-[#444] p-4 my-1 rounded-md shadow-inner animate-fade-in flex gap-4">
                    <div className="flex-[1.2]">
                      <div className="text-[1.8rem] font-black text-white leading-none mt-1">{ident}</div>
                      <div className="text-text-muted text-xs font-mono mt-2">{ident}<br/>{fix.via_airway || 'AWY'}</div>
                    </div>
                    
                    <div className="flex-[2.5] flex gap-2">
                      <div className="flex-1">
                        <div className="text-text-muted text-xs mb-1">FL</div>
                        <input type="text" defaultValue={wpData.ex_fl || ""} onBlur={(e) => handleWpInputChange(i, "ex_fl", e.target.value)} className="w-full p-2 bg-white text-black font-black text-right rounded outline-none" />
                      </div>
                      <div className="flex-[2.5] font-mono text-xs text-text-main border-l border-[#555] pl-3 leading-snug flex flex-col justify-center">
                        <div><span className="text-text-muted">{getFlightLevel(fix.altitude_feet || flightData?.cruise_alt)}</span> 213/014-M040</div>
                        <div><span className="text-text-muted">FL310</span> 186/009-M031</div>
                        <div><span className="text-text-muted">FL200</span> 035/006-M007</div>
                        <div><span className="text-text-muted">FL150</span> 129/004-P003</div>
                      </div>
                    </div>

                    <div className="flex-[2.0]">
                      <div className="flex justify-between text-text-muted text-xs mb-1"><span>Use TOT</span><span>Extra --</span></div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-text-muted text-[0.65rem]">TOT</div>
                          <input type="text" defaultValue={wpData.ex_tot || ""} onBlur={(e) => handleWpInputChange(i, "ex_tot", e.target.value)} className="w-full p-2 bg-white text-black font-black text-right rounded outline-none focus:ring-2 focus:ring-[#00E676]" />
                        </div>
                        <div className="flex-1">
                          <div className="text-text-muted text-[0.65rem]">CALC</div>
                          <input type="text" defaultValue={wpData.ex_calc || ""} onBlur={(e) => handleWpInputChange(i, "ex_calc", e.target.value)} className="w-full p-2 bg-white text-black font-black text-right rounded outline-none focus:ring-2 focus:ring-[#00E676]" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-[1.8]">
                      <div className="text-text-muted text-xs mb-1">Crew notes</div>
                      <textarea defaultValue={wpData.ex_notes || ""} onBlur={(e) => handleWpInputChange(i, "ex_notes", e.target.value)} className="w-full h-[60px] p-2 bg-white text-black rounded outline-none resize-none focus:ring-2 focus:ring-[#00E676]" placeholder="Add notes"></textarea>
                    </div>

                    <div className="flex-[2.2]">
                      <div className="flex justify-between border-b border-[#444] pb-1 mb-2">
                        <div className="text-center"><div className="text-text-muted text-[0.65rem]">Use CETA</div><div className="text-white font-bold">--</div></div>
                        <div className="text-center"><div className="text-text-muted text-[0.65rem]">Use ETA</div><div className="text-white font-bold">--</div></div>
                        <div className="text-center"><div className="text-text-muted text-[0.65rem]">Use NOW</div><div className="text-[#00E676] font-bold">--</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-text-muted text-xs flex-1 text-right">ATA</div>
                        <input type="text" defaultValue={wpData.ata || ""} onBlur={(e) => handleWpInputChange(i, "ata", e.target.value)} className="w-[80px] p-2 bg-white text-black font-black text-right rounded outline-none focus:ring-2 focus:ring-[#00E676]" placeholder="z" />
                      </div>
                    </div>

                    <div className="flex-[0.8] flex items-end">
                      <button onClick={() => setExpandedRow(null)} className="w-full py-3 border border-[#8fa0a6] text-white rounded font-bold hover:bg-white hover:text-black transition-colors">
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
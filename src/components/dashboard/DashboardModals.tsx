"use client";

import { useState } from "react";

export default function DashboardModals({ flightData, updateFlightData, activeModal, setActiveModal, calc }: { flightData: any, updateFlightData: any, activeModal: string | null, setActiveModal: any, calc: any }) {
  const [rejectReason, setRejectReason] = useState("");

  if (!activeModal) return null;

  // 🌟 DOCS HTML 解碼器 (與 Instructor Panel 相同)
  const unescapeHTML = (str: string) => {
    if (!str) return "<p>No briefing HTML available.</p>";
    return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  };

  // 確保使用航班真實的時間 (而非當下時間)
  const stdUnix = flightData?.std_unix || 0;
  const fpDateObj = stdUnix > 0 ? new Date(stdUnix * 1000) : new Date();
  const date_str_ls = fpDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '').toUpperCase();
  const date_str_ezfw = fpDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '').toUpperCase();

  // 生成 Loadsheet 內容的推導邏輯
  const zfw_act = Math.round((calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) * 1000);
  const tow_act = Math.round(calc.currTow * 1000);
  const law_act = Math.round(calc.currLw * 1000);
  const trip_act = Math.round(calc.currTrip * 1000);
  const takeoff_fuel_kg = tow_act - zfw_act; // Block - Taxi 的精準推演
  
  const pax_wt_total = calc.paxTot * (flightData?.pax_weight_std || 84);
  const underload = 224528 - zfw_act;
  const dow_kg = flightData?.dow || 161968;
  const dispatcher = flightData?.dispatcher || 'SYSTEM';
  const flight_num_clean = flightData?.flight_no?.replace(" ", "") || 'CPA564';
  const reg_clean = calc.reg.replace("-", "");
  
  const pax_j = flightData?.pax_j || 0;
  const pax_y = flightData?.pax_y || 0;
  const pax_f = flightData?.pax_f || 0;
  const pax_w = flightData?.pax_w || 0;
  const crew_fd = flightData?.crew_fd || 2;
  const crew_cc = flightData?.crew_cc || 14;
  
  const cgo_h1 = flightData?.cargo_hold_1 || 0;
  const cgo_h2 = flightData?.cargo_hold_2 || 0;
  const cgo_h3 = flightData?.cargo_hold_3 || 0;
  const cgo_h4 = flightData?.cargo_hold_4 || 0;
  const cgo_bulk = flightData?.cargo_bulk || 0;

  // 🌟 電報全部改用 calc.depIata 和 calc.arrIata
  const getLsText = (isFinal: boolean) => {
    const lsType = isFinal ? "FINAL" : "PRELIM";
    const lsVer = isFinal ? (flightData?.final_ls_version || 1) : (flightData?.prelim_ls_version || 1);
    const lsVerStr = lsVer.toString().padStart(2, '0');
    
    return `LDS/${reg_clean}/${flight_num_clean}
LOADSHEET                   ${lsType}  ${lsVerStr}
${flight_num_clean}/${date_str_ls}
${calc.depIata}  ${calc.arrIata}  ${flight_num_clean}/20                ${reg_clean}
J${pax_j.toString().padEnd(2)}Y${pax_y.toString().padEnd(3)}      ${crew_fd}/${crew_cc}                ${date_str_ls}

ZFW ACT ${zfw_act.toString().padEnd(8)}  MAX 224528  L   ${underload}
TAKEOFF FUEL ${takeoff_fuel_kg.toString().padEnd(8)}
TOW ACT ${tow_act.toString().padEnd(8)}  MAX 263083      ${263083 - tow_act}
TRIP FUEL ${trip_act.toString().padEnd(8)}
LAW ACT ${law_act.toString().padEnd(8)}  MAX 237682      ${237682 - law_act}

BALANCE AND SEATING
BW  155582      DOW ${dow_kg}
BI  715.00      DOI 741.09
LIZFW   678.16  MACZFW  22.75
LITOW   683.36  MATOW   23.77
LILAW   675.30  MACLAW  23.33

STAB TO 5.5
0A/${pax_f.toString().padEnd(3)} 0B/${pax_j.toString().padEnd(3)} 0C/${pax_w.toString().padEnd(3)} 0D/${pax_y.toString().padEnd(3)}
T${calc.cgo_total.toString().padEnd(5)} .1/${cgo_h1.toString().padEnd(4)} .2/${cgo_h2.toString().padEnd(4)} .3/${cgo_h3.toString().padEnd(4)} .4/${cgo_h4.toString().padEnd(4)} .5/${cgo_bulk.toString().padEnd(4)}

${calc.arrIata}  J${pax_j.toString().padStart(3, '0')}    Y${pax_y.toString().padStart(3, '0')}
TTL PAX ${calc.paxTot.toString().padEnd(5)}   UNDERLOAD   ${underload}

CMDR NAME
SIGN

SI
NOTOC:
PANTRY CODE:        77P-A
PANTRY EFFECT       4285/11-
SERVICE WEIGHT ADJUSTMENT/INDEX ADD
${calc.arrIata}    POTABLE WATER       15/16   94  PCT
805 53

NORMAL MACTOW LIMITS:
FWD MACTOW LIMIT        14.1
AFT MACTOW LIMIT        38.6
LOADSHEETER/${dispatcher}/HKG1576`;
  };

  const getAzfText = () => {
    const tow_reqd = Math.round(zfw_act + (calc.ofpReqdBase * 1000));
    return `AZF/${reg_clean}/${flight_num_clean}
- PAX/ ${calc.paxTot}
- CGO/ ${calc.cgo_total}
- ZFW/ ${zfw_act}
- CRW/ ${crew_fd}/${crew_cc}
- TOW/ ${tow_reqd}
- DEP/ ${(flightData?.std_z || '0000').replace('Z', '')}
- SEC/ ${calc.depIata}-${calc.arrIata}

FLT STATUS: closed
LCO: ${dispatcher}

SI`;
  };

  const getEzfwText = () => {
    const ttlLoad = pax_wt_total + calc.cgo_total;
    const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);
    return `EZFW ${flight_num_clean}/${date_str_ezfw} ${reg_clean} J${pax_j}Y${pax_y}
${crew_fd}/${crew_cc} ${calc.depIata}${calc.arrIata}

PASSENGER           ${pax_wt_total.toString().padEnd(6)} KG
CARGO               ${calc.cgo_total.toString().padEnd(6)} KG
TTL TRAFFIC LOAD    ${ttlLoad.toString().padEnd(6)} KG

J${pax_j}  Y${pax_y}
DOW                 ${dow_kg.toString().padEnd(6)} KG
EST ZFW             ${estZfwKg.toString().padEnd(6)} KG

LCO: ${dispatcher}
SI
LATEST EZFW`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-md animate-fade-in">
      <div className={`bg-lido-800 border border-[#00bfa5] rounded-xl w-full ${activeModal === 'Airports' ? 'max-w-7xl' : 'max-w-6xl'} shadow-[0_0_40px_rgba(0,191,165,0.2)] flex flex-col overflow-hidden max-h-[90vh]`}>
        
        <div className="flex justify-between items-center p-4 bg-lido-800 border-b border-[#333333] shrink-0">
          <h2 className="text-lg font-black text-status-teal tracking-widest uppercase">
            {activeModal === 'FMS' && 'FMS & ATS Data Preview'}
            {activeModal === 'Loadsheet' && 'Loadsheet & Payload Detail'}
            {activeModal === 'RejectPrelim' && 'Reject PRELIM Loadsheet'}
            {activeModal === 'RejectFinal' && 'Reject FINAL Loadsheet'}
            {activeModal === 'Airports' && 'Airports'}
            {activeModal === 'Refuelling' && 'Refuelling Order & Receipt'}
            {activeModal === 'SNN' && 'Special Navigation Note'}
            {activeModal === 'DOCS' && 'Operational Flight Plan'}
          </h2>
          <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-white font-black text-xl px-2">✕</button>
        </div>
        
        <div className={`p-6 overflow-y-auto text-text-main flex-1 ${activeModal !== 'Airports' ? 'font-mono' : 'font-sans'} text-sm leading-relaxed bg-[#0a0a0a]`}>
          
          {activeModal === 'FMS' && (
            <div className="flex flex-col md:flex-row gap-8 h-full overflow-hidden">
              <div className="flex-1 flex flex-col shrink-0">
                <div className="text-status-teal font-bold mb-4 border-b border-[#333333] pb-2 text-lg">FMS OPERATION SUMMARY</div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-[0.9rem]">
                  <div><span className="text-text-muted text-xs uppercase block">Aircraft Type</span><span className="font-bold">{calc.acType}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Reg</span><span className="font-bold">{calc.reg}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Drag/F-F Factor</span><span className="font-bold">{calc.dragFf}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">MEL/CDL Pen</span><span className="font-bold">{calc.melCdl}</span></div>
                  <div className="col-span-2"><span className="text-text-muted text-xs uppercase block">FMS Route</span><span className="font-bold text-[#00E676] break-words">{calc.routeStr}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Total Distance</span><span className="font-bold">{calc.totalDist} NM</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">TOC</span><span className="font-bold">{calc.cruiseAlt}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">TOC Temp</span><span className="font-bold">{calc.tocTemp}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Cost Index</span><span className="font-bold">{calc.costIndex}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">EDTO Flight</span><span className="font-bold">{calc.edtoFlight}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Reserve</span><span className="font-bold">{calc.ofpRes.toFixed(1)} T</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Min Divert Fuel</span><span className="font-bold">{calc.minDivert}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Avg Wind</span><span className="font-bold">{calc.avgWind}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Avg Trip (kg/gnm)</span><span className="font-bold">{calc.avgTrip}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Highest Trip MRA</span><span className="font-bold">{calc.mraHigh}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">EDG MRA</span><span className="font-bold">{calc.mraEdg}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Dep Rwy</span><span className="font-bold">{calc.depRwy}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Arr Rwy</span><span className="font-bold">{calc.arrRwy}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">SID</span><span className="font-bold text-[#FF9100]">{calc.sid}</span></div>
                  <div className="col-span-2"><span className="text-text-muted text-xs uppercase block">STAR</span><span className="font-bold text-[#FF9100]">{calc.star}</span></div>
                </div>
              </div>
              <div className="flex-1 flex flex-col h-full min-h-0">
                <div className="text-status-teal font-bold mb-4 border-b border-[#333333] pb-2 text-lg">ICAO ATS FLIGHT PLAN</div>
                <div className="bg-[#0a0a0a] p-5 rounded-lg border border-[#404040] font-mono text-[0.95rem] text-text-main whitespace-pre-wrap leading-[1.6] flex-1 overflow-y-auto">
{flightData?.raw_simbrief?.atc?.flightplan_text || `(FPL-${flightData?.flight_no?.replace(" ", "") || 'CPA564'}-IS
-B773/H-SDE3GHIJ2J3J5M1RWXY/LB1
-${calc.depIcao}${flightData?.std_z?.substring(0,4) || '0000'}
-N0480F${calc.cruiseAlt.replace('FL', '')} ${calc.routeStr} ${flightData?.sid_route || ''} DCT OCEAN DCT MKG DCT ${flightData?.star_route || ''}
-${calc.arrIcao}0315 ${calc.depIcao}
-REG/${calc.reg.replace("-", "")} CAPT/${flightData?.captain?.replace(" ", "") || 'PILOT'})`}
                </div>
              </div>
            </div>
          )}
          
          {activeModal === 'Loadsheet' && (
            <div className="flex flex-row h-full w-full overflow-hidden">
              <div className="w-[340px] shrink-0 flex flex-col h-full border-r border-[#333333] pr-6">
                <div className="text-xl font-bold text-status-teal border-b border-[#333333] pb-2 mb-4 uppercase shrink-0">
                  Weights & Fuel ({calc.isManual ? 'MANUAL' : (calc.actualZfw > 0 ? 'REVISED' : 'OFP')})
                </div>
                <div className="overflow-y-auto pr-2 flex-1 min-h-0">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="text-text-muted py-1">Trip Fuel</td><td className="text-right font-bold" style={{color: calc.isManual ? '#FF9100' : (calc.actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{calc.currTrip.toFixed(1)} T</td></tr>
                      <tr><td className="text-text-muted py-1">Contingency</td><td className="text-right font-bold" style={{color: calc.isManual ? '#FF9100' : (calc.actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{calc.currCont.toFixed(1)} T</td></tr>
                      <tr><td className="text-text-muted py-1">Alternate</td><td className="text-right font-bold" style={{color: calc.isManual ? '#FF9100' : (calc.actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{calc.currAltnOfp.toFixed(1)} T</td></tr>
                      <tr><td className="text-text-muted py-1">Reserve</td><td className="text-right font-bold" style={{color: calc.isManual ? '#FF9100' : (calc.actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{calc.ofpRes.toFixed(1)} T</td></tr>
                      <tr className="border-b border-[#333]"><td className="text-[#00E676] py-1 font-bold">Fuel Reqd</td><td className="text-right font-bold text-[#00E676]">{calc.currReqdBase.toFixed(1)} T</td></tr>
                      <tr><td className="text-text-muted py-1 pt-3">Zero Fuel Wt</td><td className="text-right font-bold pt-3" style={{color: calc.isManual ? '#FF9100' : (calc.actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{(calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw).toFixed(1)} T</td></tr>
                      <tr><td className="text-text-muted py-1">Takeoff Wt</td><td className="text-right font-bold" style={{color: calc.isManual ? '#FF9100' : (calc.actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{calc.currTow.toFixed(1)} T</td></tr>
                      <tr><td className="text-text-muted py-1">Landing Wt</td><td className="text-right font-bold" style={{color: calc.isManual ? '#FF9100' : (calc.actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{calc.currLw.toFixed(1)} T</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-hidden h-full pl-6 pb-2">
                <div className="flex gap-4 w-max h-full min-h-0">
                  {(!flightData?.final_ls_sent && !flightData?.prelim_ls_sent && !flightData?.azf_sent && !flightData?.ezfw_sent) && (
                    <div className="text-text-muted p-8 text-center italic w-full flex items-center justify-center">No load documents dispatched yet.</div>
                  )}
                  {flightData?.final_ls_sent && (
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                      <h4 className="text-[#2979FF] border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}</h4>
                      <div className="mt-2 mb-2 shrink-0">
                          {flightData?.final_ls_rejected ? (
                              <button disabled className="w-full py-2 bg-[#34495e] text-text-muted rounded font-bold text-xs uppercase cursor-not-allowed">FINAL (V{flightData?.final_ls_version || 1}) REJECTED</button>
                          ) : flightData?.pilots_signed_final ? (
                              <button disabled className="w-full py-2 bg-[#00E676]/20 text-[#00E676] rounded font-bold text-xs uppercase cursor-not-allowed">FINAL (V{flightData?.final_ls_version || 1}) ACCEPTED</button>
                          ) : (
                              <button onClick={() => { setRejectReason(''); setActiveModal('RejectFinal'); }} className="w-full py-2 bg-[#FF1744]/20 border border-[#FF1744] text-[#FF1744] rounded font-bold text-xs hover:bg-[#FF1744] hover:text-white uppercase transition-colors">Reject FINAL (V{flightData?.final_ls_version || 1})</button>
                          )}
                      </div>
                      <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                        <pre className="text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getLsText(true)}</pre>
                      </div>
                    </div>
                  )}
                  {flightData?.prelim_ls_sent && (
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                      <h4 className="text-[#FF9100] border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">PRELIM {(flightData?.prelim_ls_version || 1).toString().padStart(2, '0')}</h4>
                      <div className="mt-2 mb-2 shrink-0">
                          {flightData?.prelim_ls_rejected ? (
                              <button disabled className="w-full py-2 bg-[#34495e] text-text-muted rounded font-bold text-xs uppercase cursor-not-allowed">PRELIM (V{flightData?.prelim_ls_version || 1}) REJECTED</button>
                          ) : (
                              <button onClick={() => { setRejectReason(''); setActiveModal('RejectPrelim'); }} className="w-full py-2 bg-[#FF1744]/20 border border-[#FF1744] text-[#FF1744] rounded font-bold text-xs hover:bg-[#FF1744] hover:text-white uppercase transition-colors">Reject PRELIM (V{flightData?.prelim_ls_version || 1})</button>
                          )}
                      </div>
                      <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                        <pre className="text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getLsText(false)}</pre>
                      </div>
                    </div>
                  )}
                  {flightData?.azf_sent && (
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                      <h4 className="text-[#00E676] border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">AZF DATASHEET</h4>
                      <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                        <pre className="text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getAzfText()}</pre>
                      </div>
                    </div>
                  )}
                  {flightData?.ezfw_sent && (
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                      <h4 className="text-status-teal border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">EZFW DATASHEET</h4>
                      <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                        <pre className="text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getEzfwText()}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeModal === 'RejectPrelim' && (
            <div className="flex flex-col h-full max-w-lg mx-auto w-full justify-center animate-fade-in-up">
              <div className="bg-[#0a0a0a] border border-[#404040] rounded-xl p-6 shadow-2xl">
                  <h3 className="text-[#FF1744] font-black text-2xl mb-2">Reject PRELIM Loadsheet</h3>
                  <p className="text-text-muted text-sm mb-4">Please provide a reason for rejecting PRELIM V{flightData?.prelim_ls_version || 1}. This will notify the Instructor IOS.</p>
                  <textarea className="w-full h-32 bg-lido-800 border border-[#404040] rounded p-3 text-white outline-none focus:border-[#FF1744] mb-6 resize-none" placeholder="Enter rejection reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <div className="flex gap-4">
                    <button onClick={() => setActiveModal('Loadsheet')} className="flex-1 py-3 bg-lido-800 border border-[#404040] text-text-muted font-bold rounded hover:text-white transition-colors">Cancel</button>
                    <button onClick={() => { if(!rejectReason.trim()) { alert("Please enter a reason."); return; } updateFlightData({ prelim_ls_rejected: true, prelim_ls_reject_reason: rejectReason.trim() }); setActiveModal('Loadsheet'); }} className="flex-1 py-3 bg-[#FF1744] text-white font-bold rounded hover:bg-red-600 transition-colors shadow-[0_4px_15px_rgba(255,23,68,0.3)]">Submit Rejection</button>
                  </div>
              </div>
            </div>
          )}

          {activeModal === 'RejectFinal' && (
            <div className="flex flex-col h-full max-w-lg mx-auto w-full justify-center animate-fade-in-up">
              <div className="bg-[#0a0a0a] border border-[#404040] rounded-xl p-6 shadow-2xl">
                  <h3 className="text-[#FF1744] font-black text-2xl mb-2">Reject FINAL Loadsheet</h3>
                  <p className="text-text-muted text-sm mb-4">Please provide a reason for rejecting FINAL V{flightData?.final_ls_version || 1}. This will notify the Instructor IOS.</p>
                  <textarea className="w-full h-32 bg-lido-800 border border-[#404040] rounded p-3 text-white outline-none focus:border-[#FF1744] mb-6 resize-none" placeholder="Enter rejection reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <div className="flex gap-4">
                    <button onClick={() => setActiveModal('Loadsheet')} className="flex-1 py-3 bg-lido-800 border border-[#404040] text-text-muted font-bold rounded hover:text-white transition-colors">Cancel</button>
                    <button onClick={() => { if(!rejectReason.trim()) { alert("Please enter a reason."); return; } updateFlightData({ final_ls_rejected: true, final_ls_reject_reason: rejectReason.trim() }); setActiveModal('Loadsheet'); }} className="flex-1 py-3 bg-[#FF1744] text-white font-bold rounded hover:bg-red-600 transition-colors shadow-[0_4px_15px_rgba(255,23,68,0.3)]">Submit Rejection</button>
                  </div>
              </div>
            </div>
          )}

          {/* 🌟 全新 LIDO 風格 Airports Modal */}
          {activeModal === 'Airports' && (
            <div className="flex flex-col h-full overflow-hidden w-full max-w-full">
              <div className="bg-[#1e1e1e] rounded-lg border border-[#333] flex-1 overflow-x-auto overflow-y-auto shadow-2xl pb-4">
                <div className="min-w-[1100px]">
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 p-3 text-[0.6rem] text-text-muted font-bold tracking-wider border-b-2 border-black uppercase bg-[#1a1a1a]">
                    <div className="pl-2">Airport Chk</div>
                    <div>Type<br/>Con</div>
                    <div>MDF<br/>Delta</div>
                    <div>MTR</div>
                    <div>Dis</div>
                    <div>FL<br/>MORA</div>
                    <div>Speed<br/>WC</div>
                    <div>Time<br/>ETA</div>
                    <div>Appch<br/>Rwy</div>
                    <div className="text-center">From/Till</div>
                    <div>Ceil Reqd<br/>Ceil Fcst</div>
                    <div>Vis Reqd<br/>Vis Fcst</div>
                    <div>H/T<br/>WC</div>
                    <div>XWC</div>
                  </div>

                  {/* Departure Row (T) */}
                  <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b border-[#333] bg-[#505050] text-text-main text-sm items-center hover:bg-[#5a5a5a] transition-colors">
                    <div className="font-bold text-xl flex items-center pl-2 tracking-wide">
                      {calc.depIcao} 
                      <span className="bg-white text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-2 font-black leading-none shadow-sm">T</span>
                    </div>
                    <div className="text-[0.75rem] leading-tight text-gray-300">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- T<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-300">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- NM<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight">FL --<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-300">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">--<br/><span className="text-white">0000z</span></div>
                    <div className="text-[0.75rem] leading-tight">TKOF HIRL+RCLL<br/><span className="text-white">{calc.depRwy}</span></div>
                    <div className="flex justify-center"><div className="border-[1.5px] border-white px-3 py-1.5 text-center rounded text-[0.75rem] tracking-widest font-mono font-bold bg-[#606060]">0244z/0344z</div></div>
                    <div className="text-[0.75rem] leading-tight">--<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">300<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">T9<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight">6<br/><span className="text-gray-300">--</span></div>
                  </div>

                  {/* Arrival Row (L) */}
                  <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b-4 border-black bg-[#404040] text-text-main text-sm items-center hover:bg-[#4a4a4a] transition-colors">
                    <div className="font-bold text-xl flex items-center pl-2 tracking-wide">
                      {calc.arrIcao} 
                      <span className="bg-white text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-2 font-black leading-none shadow-sm">L</span>
                    </div>
                    <div className="text-[0.75rem] leading-tight text-gray-400">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- T<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-400">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- NM<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight">FL --<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-400">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">--<br/><span className="text-white">0648z</span></div>
                    <div className="text-[0.75rem] leading-tight">RNAV CAT1<br/><span className="text-white">{calc.arrRwy}</span></div>
                    <div className="text-center text-[0.75rem] tracking-widest font-mono text-text-muted">0449z/0649z</div>
                    <div className="text-[0.75rem] leading-tight">200<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">550<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">T3<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight">4<br/><span className="text-gray-400">--</span></div>
                  </div>

                  {/* Alternate Rows (A) - Dynamic Mapping */}
                  {calc.altnList.map((alt: any, idx: number) => {
                     // Generating realistic mock numbers based on burn fuel for visual immersion
                     const distMock = Math.floor(alt.burn * 25) + 10;
                     const timeMock = Math.floor(alt.time);
                     return (
                      <div key={idx} className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b border-[#111] bg-[#2a2a2a] text-text-main text-sm items-center hover:bg-[#333] transition-colors">
                        <div className="font-bold text-xl flex items-center pl-2 tracking-wide">
                          <span className="text-[#666] mr-2 text-lg">{'>'}</span>{alt.icao} 
                          <span className="bg-white text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-2 font-black leading-none shadow-sm">A</span>
                        </div>
                        <div className="text-[0.75rem] leading-tight text-gray-500">--<br/>--</div>
                        <div className="text-[0.75rem] leading-tight">{alt.burn.toFixed(1)} T<br/><span className="text-gray-400">{(alt.burn * 0.3).toFixed(1)}</span></div>
                        <div className="text-[0.75rem] leading-tight text-gray-500">--<br/>--</div>
                        <div className="text-[0.75rem] leading-tight">{distMock} NM<br/><span className="text-gray-500">--</span></div>
                        <div className="text-[0.75rem] leading-tight">FL 190<br/><span className="text-gray-400">51</span></div>
                        <div className="text-[0.75rem] leading-tight text-gray-400">--<br/><span className="text-white">20 TWC</span></div>
                        <div className="text-[0.75rem] leading-tight">00{timeMock}<br/><span className="text-white">0727z</span></div>
                        <div className="text-[0.75rem] leading-tight">ILS CAT3B<br/><span className="text-white">36</span></div>
                        <div className="text-center text-[0.75rem] tracking-widest font-mono text-text-muted">0528z/0728z</div>
                        <div className="text-[0.75rem] leading-tight">17<br/>9999</div>
                        <div className="text-[0.75rem] leading-tight">550<br/>9999</div>
                        <div className="text-[0.75rem] leading-tight">H13<br/><span className="text-gray-500">--</span></div>
                        <div className="text-[0.75rem] leading-tight">15<br/><span className="text-gray-500">--</span></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          
          {activeModal === 'Refuelling' && (
            <div className="flex flex-col">
              <div className="text-[1.1rem] font-bold color-[#00bfa5] mb-4 uppercase">Fuel Supplier Receipt</div>
              
              {!flightData?.fuel_receipt_sent ? (
                <div className="bg-lido-800 border border-[#FF9100] text-[#FF9100] p-6 rounded-lg text-center font-bold">
                  ⏳ Waiting for fuel supplier tender.
                </div>
              ) : (
                <div className="bg-lido-800 border border-[#333333] rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-text-muted text-xs font-bold uppercase mb-1">Supplier Code</div>
                      <div className="font-mono text-white text-lg">AFSC (HKIA)</div>
                      <div className="text-text-muted text-xs font-bold uppercase mt-4 mb-1">Date</div>
                      <div className="font-mono text-white text-lg">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-text-muted text-xs font-bold uppercase mb-1">Product</div>
                      <div className="font-mono text-white text-lg">JET A-1</div>
                      <div className="text-text-muted text-xs font-bold uppercase mt-4 mb-1">SG</div>
                      <div className="font-mono text-white text-lg">0.795</div>
                    </div>
                  </div>
                  
                  <hr className="border-[#404040] mb-6"/>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8 text-center">
                    <div className="bg-[#0a0a0a] border border-[#00bfa5] rounded-lg p-4">
                      <div className="text-text-muted text-xs font-bold uppercase mb-2">Uplifted</div>
                      <div className="text-4xl font-black text-white">{(flightData?.actual_uplift || 0).toFixed(1)} <span className="text-xl text-status-teal">T</span></div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#00bfa5] rounded-lg p-4">
                      <div className="text-text-muted text-xs font-bold uppercase mb-2">Total FOB</div>
                      <div className="text-4xl font-black text-[#00E676]">{((flightData?.trainee_log_fuel || 0) + (flightData?.actual_uplift || 0)).toFixed(1)} <span className="text-xl text-[#00E676]">T</span></div>
                    </div>
                  </div>
                  
                  {!flightData?.pilots_signed_fuel ? (
                    <button 
                      onClick={() => {
                        updateFlightData({ pilots_signed_fuel: true });
                        setActiveModal(null);
                      }}
                      className="w-full py-4 bg-[#00E676] text-black font-black text-xl rounded-lg hover:bg-[#00c853] shadow-[0_4px_15px_rgba(0,230,118,0.4)] transition-all"
                    >
                      ACCEPT FUEL RECEIPT
                    </button>
                  ) : (
                    <div className="bg-[#00E676]/20 border border-[#00E676] text-[#00E676] p-4 rounded-lg text-center font-bold text-lg">
                      ✅ FUEL RECEIPT ACCEPTED.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeModal === 'SNN' && (
            <div>
              <div className="text-[#FF9100] mb-4 font-sans font-bold">-- SPECIAL NAVIGATION NOTE (SNN) --</div>
              <div className="bg-[#1c2630] border-l-4 border-[#FF9100] p-4 rounded text-text-main text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {flightData?.snn || "Check NOTAM for TWY closures. Expect radar vectors after departure. Monitor fuel temp closely due to cold airmass."}
              </div>
            </div>
          )}
          
          {/* 🌟 完美修復的 DOCS Modal */}
          {activeModal === 'DOCS' && (
            <div className="h-full flex flex-col font-sans">
              <div className="text-[#00E676] mb-4 font-bold tracking-widest text-lg">-- OPERATIONAL FLIGHT PLAN (OFP) --</div>
              <div 
                className="bg-[#0a0a0a] p-5 rounded-lg border border-[#404040] overflow-y-auto flex-1 text-text-main"
                style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "14px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: unescapeHTML(flightData?.raw_simbrief?.text?.plan_html || flightData?.ofp_telex_text) }}
              />
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
"use client";
import { useState, Fragment } from "react";
import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
import { B773_BHNQ } from "@/lib/loadsheet/MockAHM"; 

export function ModalLoadsheet({ flightData, updateFlightData, calc, setActiveModal }: any) {
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  // 從 OFP 提取 UTC 時間作為文檔日期
  const stdUnix = flightData?.std_unix || 0;
  const fpDateObj = stdUnix > 0 ? new Date(stdUnix * 1000) : new Date();
  
  const day_str = fpDateObj.getUTCDate().toString().padStart(2, '0');
  const month_str = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][fpDateObj.getUTCMonth()];
  const year_str = fpDateObj.getUTCFullYear().toString().slice(-2);
  const date_str_ls = `${day_str}${month_str}${year_str}`;
  const date_str_ezfw = `${day_str}${month_str}`;

  const dispatcher = flightData?.dispatcher || 'SYSTEM';
  const flight_num_clean = flightData?.flight_no?.replace(" ", "") || 'CPA564';
  const reg_clean = calc?.reg?.replace("-", "") || "BHNQ";
  const crew_fd = flightData?.crew_fd || 2;
  const crew_cc = flightData?.crew_cc || 14;

  const buildEnginePayload = (snapshot: any) => {
    if (!snapshot) return null;
    return {
      pax: { zoneOA: Number(snapshot.pax?.OA)||0, zoneOB: Number(snapshot.pax?.OB)||0, zoneOC: Number(snapshot.pax?.OC)||0, zoneOD: Number(snapshot.pax?.OD)||0 },
      paxWeights: { J: 85, Y: 81 }, 
      cargo: { hold1: Number(snapshot.cargo?.h1)||0, hold2: Number(snapshot.cargo?.h2)||0, hold3: Number(snapshot.cargo?.h3)||0, hold4: Number(snapshot.cargo?.h4)||0, bulk: Number(snapshot.cargo?.bulk)||0 },
      waterFraction: Number(flightData?.water_fraction) || 15, 
      fuel: {
        takeoff: (Number(snapshot.fuel?.left)||0) + (Number(snapshot.fuel?.center)||0) + (Number(snapshot.fuel?.right)||0),
        trip: flightData?.fuel_trip_ofp ? Number(flightData.fuel_trip_ofp) * 1000 : 18500,
        isStandard: false,
        tanks: { leftMain: Number(snapshot.fuel?.left)||0, center: Number(snapshot.fuel?.center)||0, rightMain: Number(snapshot.fuel?.right)||0 }
      }
    };
  };

  const generateLSText = (type: string, version: number, snapshot: any, engine: any, payload: any) => {
    if (!engine || !snapshot || !payload) return "";
    const w = engine.calculateWeights();
    const cg = engine.calculateCG();
    
    const marginZFW = B773_BHNQ.limits.MZFW - w.ZFW;
    const marginTOW = B773_BHNQ.limits.MTOW - w.TOW;
    const marginLAW = B773_BHNQ.limits.MLAW - w.LAW;
    const minMargin = Math.min(marginZFW, marginTOW, marginLAW);
    const lZfw = marginZFW === minMargin ? "L" : " ";
    const lTow = marginTOW === minMargin ? "L" : " ";
    const lLaw = marginLAW === minMargin ? "L" : " ";

    return `LDS/${reg_clean}/${flight_num_clean}
LOADSHEET                   ${type}  ${version.toString().padStart(2, '0')}
${flight_num_clean}/${date_str_ls}
${calc?.depIata || 'HKG'}  ${calc?.arrIata || 'KIX'}  ${flight_num_clean}/${day_str}                ${reg_clean}
J42 Y396      ${crew_fd}/${crew_cc}                ${date_str_ls}

ZFW ACT ${w.ZFW.toString().padEnd(8)}  MAX ${B773_BHNQ.limits.MZFW}  ${lZfw}   ${marginZFW}
TO FUEL ${payload.fuel.takeoff.toString().padEnd(8)}
TOW ACT ${w.TOW.toString().padEnd(8)}  MAX ${B773_BHNQ.limits.MTOW}  ${lTow}   ${marginTOW}
TRIP FUEL ${payload.fuel.trip.toString().padEnd(8)}
LAW ACT ${w.LAW.toString().padEnd(8)}  MAX ${B773_BHNQ.limits.MLAW}  ${lLaw}   ${marginLAW}

BALANCE AND SEATING
BW  ${B773_BHNQ.basicData.BW}      DOW ${w.DOW}
BI  ${B773_BHNQ.basicData.BI.toFixed(2)}      DOI 741.09
LIZFW   ${cg.LIZFW.toFixed(2)}  MACZFW  ${cg.MACZFW.toFixed(2)}
LITOW   ${cg.LITOW.toFixed(2)}  MATOW   ${cg.MACTOW.toFixed(2)}
LILAW   ${cg.LILAW.toFixed(2)}  MACLAW  ${cg.MACLAW.toFixed(2)}

STAB TO ${cg.stabTrim}
0A/${snapshot.pax.OA.toString().padEnd(3)} 0B/${snapshot.pax.OB.toString().padEnd(3)} 0C/${snapshot.pax.OC.toString().padEnd(3)} 0D/${snapshot.pax.OD.toString().padEnd(3)}
T${(w.totalCargoWeight).toString().padEnd(5)} .1/${snapshot.cargo.h1.toString().padEnd(4)} .2/${snapshot.cargo.h2.toString().padEnd(4)} .3/${snapshot.cargo.h3.toString().padEnd(4)} .4/${snapshot.cargo.h4.toString().padEnd(4)} .5/${snapshot.cargo.bulk.toString().padEnd(4)}

${calc?.arrIata || 'KIX'}  J${snapshot.pax.OA.toString().padStart(3, '0')}    Y${(snapshot.pax.OB + snapshot.pax.OC + snapshot.pax.OD).toString().padStart(3, '0')}
TTL PAX ${w.paxCount.toString().padEnd(5)}  UNDERLOAD   ${marginZFW}

CMDR NAME
SIGN

SI
NOTOC: NO
PANTRY CODE:        77P-A
SERVICE WEIGHT ADJUSTMENT/INDEX ADD
POTABLE WATER       ${flightData?.water_fraction || 15}/16   ${Math.round(((flightData?.water_fraction || 15)/16)*100)}  PCT

NORMAL MACTOW LIMITS:
FWD MACTOW LIMIT        14.1
AFT MACTOW LIMIT        38.6
LOADSHEETER/${dispatcher}/HKG1576`;
  };

  // Token-based Diff Highlight 演算法
  const renderHighlightedFinal = (newText: string, oldText: string) => {
    if (!oldText || !newText) return newText;
    const newLines = newText.split('\n');
    const oldLines = oldText.split('\n');

    return newLines.map((line, i) => {
      const oLine = oldLines[i] || '';
      if (line === oLine) return <div key={i}>{line || " "}</div>;
      
      const nTokens = line.split(/(\s+)/);
      const oTokens = oLine.split(/(\s+)/);

      return (
        <div key={i}>
          {nTokens.map((token, j) => {
            if (token.trim() !== '' && token !== oTokens[j]) {
              return <span key={j} className="text-[#0a0a0a] bg-[#FF9100] px-0.5 rounded shadow-[0_0_8px_rgba(255,145,0,0.8)] font-black">{token}</span>;
            }
            return <Fragment key={j}>{token}</Fragment>;
          })}
        </div>
      );
    });
  };

  const getAzfText = () => {
    const azfPayload = buildEnginePayload(flightData?.azf_snapshot);
    if (!azfPayload) return "LOADING SNAPSHOT...";
    const azfEngine = new LoadsheetEngine(B773_BHNQ, azfPayload);
    const w = azfEngine.calculateWeights();
    const tow_reqd = Math.round(w.ZFW + (calc?.currReqdBase || 0) * 1000);
    return `AZF/${reg_clean}/${flight_num_clean}\n- PAX/ ${w.paxCount}\n- CGO/ ${w.totalCargoWeight}\n- ZFW/ ${w.ZFW}\n- CRW/ ${crew_fd}/${crew_cc}\n- TOW/ ${tow_reqd}\n- DEP/ ${(flightData?.std_z || '0000').replace('Z', '')}\n- SEC/ ${calc?.depIata || 'HKG'}-${calc?.arrIata || 'KIX'}\n\nFLT STATUS: closed\nLCO: ${dispatcher}\n\nSI`;
  };

  const getEzfwText = () => {
    const ezfwPayload = buildEnginePayload(flightData?.ezfw_snapshot);
    if (!ezfwPayload) return "LOADING SNAPSHOT...";
    const ezfwEngine = new LoadsheetEngine(B773_BHNQ, ezfwPayload);
    const w = ezfwEngine.calculateWeights();
    const snapshot = flightData.ezfw_snapshot;
    const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);
    const pax_j = snapshot.pax.OA;
    const pax_y = snapshot.pax.OB + snapshot.pax.OC + snapshot.pax.OD;
    
    return `EZFW ${flight_num_clean}/${date_str_ezfw} ${reg_clean} J${pax_j}Y${pax_y}\n${crew_fd}/${crew_cc} ${calc?.depIata || 'HKG'}${calc?.arrIata || 'KIX'}\n\nPASSENGER           ${w.totalPaxWeight.toString().padEnd(6)} KG\nCARGO               ${w.totalCargoWeight.toString().padEnd(6)} KG\nTTL TRAFFIC LOAD    ${(w.totalPaxWeight + w.totalCargoWeight).toString().padEnd(6)} KG\n\nJ${pax_j}  Y${pax_y}\nDOW                 ${w.DOW.toString().padEnd(6)} KG\nEST ZFW             ${estZfwKg.toString().padEnd(6)} KG\n\nLCO: ${dispatcher}\nSI\nLATEST EZFW`;
  };

  const activePayload = buildEnginePayload(flightData?.final_snapshot || flightData?.prelim_snapshot || flightData?.ezfw_snapshot);
  const displayEngine = activePayload ? new LoadsheetEngine(B773_BHNQ, activePayload) : null;
  const wDisplay = displayEngine?.calculateWeights();

  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative">
      <div className="w-[340px] shrink-0 flex flex-col h-full border-r border-[#333333] pr-6">
        <div className="text-xl font-bold text-status-teal border-b border-[#333333] pb-2 mb-4 uppercase shrink-0">Weights & Fuel</div>
        <div className="overflow-y-auto pr-2 flex-1 min-h-0">
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="text-text-muted py-1">Trip Fuel</td><td className="text-right font-bold text-[#e2e8f0]">{(flightData?.fuel_trip_ofp || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Contingency</td><td className="text-right font-bold text-[#e2e8f0]">{(calc?.currCont || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Alternate</td><td className="text-right font-bold text-[#e2e8f0]">{(calc?.currAltnOfp || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Reserve</td><td className="text-right font-bold text-[#e2e8f0]">{(calc?.ofpRes || 0).toFixed(1)} T</td></tr>
              <tr className="border-b border-[#333]"><td className="text-[#00E676] py-1 font-bold">Fuel Reqd</td><td className="text-right font-bold text-[#00E676]">{(calc?.currReqdBase || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1 pt-3">Zero Fuel Wt</td><td className="text-right font-bold pt-3 text-[#e2e8f0]">{wDisplay ? (wDisplay.ZFW/1000).toFixed(1) : "0.0"} T</td></tr>
              <tr><td className="text-text-muted py-1">Takeoff Wt</td><td className="text-right font-bold text-[#e2e8f0]">{wDisplay ? (wDisplay.TOW/1000).toFixed(1) : "0.0"} T</td></tr>
              <tr><td className="text-text-muted py-1">Landing Wt</td><td className="text-right font-bold text-[#e2e8f0]">{wDisplay ? (wDisplay.LAW/1000).toFixed(1) : "0.0"} T</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden h-full pl-6 pb-2">
        <div className="flex gap-4 w-max h-full min-h-0">
          
          {(!flightData?.final_ls_sent && !flightData?.prelim_ls_sent && !flightData?.ezfw_sent && !flightData?.azf_sent) && (
            <div className="text-text-muted p-8 text-center italic w-full flex items-center justify-center">No load documents dispatched yet.</div>
          )}

          {/* 🌟 FINAL LOADSHEET 歷史列表 (加入 [...].reverse() 實現最新最左) */}
          {[...(flightData?.final_history || [])].reverse().map((doc: any, reverseIndex: number, reversedArray: any[]) => {
            // 在倒序數組中，第 0 個就是「最新的」
            const isLatest = reverseIndex === 0;
            const isRejected = !isLatest || flightData?.final_ls_rejected;
            
            const payloadObj = buildEnginePayload(doc.snapshot);
            const engine = new LoadsheetEngine(B773_BHNQ, payloadObj!);
            const text = generateLSText("FINAL", doc.version, doc.snapshot, engine, payloadObj);

            // 與最新一份 PRELIM 做 Diff 比較
            const latestPrelim = flightData?.prelim_history?.[flightData.prelim_history.length - 1];
            let pText = "";
            if (latestPrelim && isLatest) {
              const pPayload = buildEnginePayload(latestPrelim.snapshot);
              const pEngine = new LoadsheetEngine(B773_BHNQ, pPayload!);
              pText = generateLSText("PRELIM", latestPrelim.version, latestPrelim.snapshot, pEngine, pPayload);
            }

            return (
              <div key={`final-${doc.version}`} className={`bg-[#0a0a0a] border ${isRejected ? 'border-[#FF1744]' : 'border-[#333333]'} rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors`}>
                {isRejected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-20"><div className="text-[#FF1744] font-black text-6xl transform -rotate-45 border-8 border-[#FF1744] p-4 rounded-xl">REJECTED</div></div>}
                
                <h4 className="text-[#2979FF] border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">FINAL {doc.version.toString().padStart(2, '0')}</h4>
                
                <div className="mt-2 mb-2 shrink-0 relative z-20">
                  {isLatest ? (
                    flightData?.final_ls_rejected ? (
                      <button disabled className="w-full py-3 bg-[#1a1a1a] border border-[#FF1744] text-[#FF1744] rounded font-bold text-xs uppercase cursor-not-allowed">FINAL (V{doc.version}) REJECTED</button>
                    ) : flightData?.pilots_signed_final ? (
                      <div className="w-full py-3 bg-[#00E676]/20 border border-[#00E676] text-[#00E676] rounded font-bold text-xs uppercase flex items-center justify-center gap-2">✅ Acknowledged by {flightData?.captain || 'COMMANDER'}</div>
                    ) : (
                      <button onClick={() => setShowFinalConfirm(true)} className="w-full py-3 bg-[#00bfa5] text-black rounded font-black text-sm hover:bg-[#00E676] shadow-[0_0_15px_rgba(0,191,165,0.4)] uppercase transition-colors">[FINAL {doc.version.toString().padStart(2, '0')}]</button>
                    )
                  ) : (
                    <button disabled className="w-full py-3 bg-[#1a1a1a] border border-[#333] text-[#666] rounded font-bold text-xs uppercase cursor-not-allowed">SUPERSEDED</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto mt-2 min-h-0 relative z-20">
                  <pre className="text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">
                    {pText ? renderHighlightedFinal(text, pText) : text}
                  </pre>
                </div>
              </div>
            );
          })}

          {/* 🌟 PRELIM LOADSHEET 歷史列表 (加入 [...].reverse() 實現最新最左) */}
          {[...(flightData?.prelim_history || [])].reverse().map((doc: any, reverseIndex: number, reversedArray: any[]) => {
            const isLatest = reverseIndex === 0;
            const isRejected = !isLatest || flightData?.prelim_ls_rejected;
            
            const payloadObj = buildEnginePayload(doc.snapshot);
            const engine = new LoadsheetEngine(B773_BHNQ, payloadObj!);
            const text = generateLSText("PRELIM", doc.version, doc.snapshot, engine, payloadObj);

            return (
              <div key={`prelim-${doc.version}`} className={`bg-[#0a0a0a] border ${isRejected ? 'border-[#FF1744]' : 'border-[#333333]'} rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors`}>
                {isRejected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-20"><div className="text-[#FF1744] font-black text-6xl transform -rotate-45 border-8 border-[#FF1744] p-4 rounded-xl">REJECTED</div></div>}

                <h4 className="text-[#FF9100] border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">PRELIM {doc.version.toString().padStart(2, '0')}</h4>
                
                <div className="mt-2 mb-2 shrink-0 relative z-20">
                  {isLatest ? (
                    flightData?.prelim_ls_rejected ? (
                      <button disabled className="w-full py-2 bg-[#1a1a1a] border border-[#FF1744] text-[#FF1744] rounded font-bold text-xs uppercase cursor-not-allowed">WAITING FOR REVISION...</button>
                    ) : (
                      <button onClick={() => setActiveModal('RejectPrelim')} className="w-full py-2 bg-[#FF1744]/20 border border-[#FF1744] text-[#FF1744] rounded font-bold text-xs hover:bg-[#FF1744] hover:text-white uppercase transition-colors">Reject PRELIM (V{doc.version})</button>
                    )
                  ) : (
                    <button disabled className="w-full py-2 bg-[#1a1a1a] border border-[#333] text-[#666] rounded font-bold text-xs uppercase cursor-not-allowed">SUPERSEDED</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto mt-2 min-h-0 relative z-20">
                  <pre className="text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{text}</pre>
                </div>
              </div>
            );
          })}

          {flightData?.azf_sent && (
            <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-5 w-[480px] flex-shrink-0 flex flex-col h-full min-h-0">
              <h4 className="text-[#00E676] border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest">AZF DATASHEET</h4>
              <pre className="flex-1 overflow-y-auto mt-2 text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap">{getAzfText()}</pre>
            </div>
          )}

          {flightData?.ezfw_sent && (
            <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-5 w-[480px] flex-shrink-0 flex flex-col h-full min-h-0">
              <h4 className="text-status-teal border-b-2 border-dashed border-[#404040] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest">EZFW DATASHEET</h4>
              <pre className="flex-1 overflow-y-auto mt-2 text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap">{getEzfwText()}</pre>
            </div>
          )}

        </div>
      </div>
      
      {/* Final Confirm Sub-Modal */}
      {showFinalConfirm && (
        <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in rounded-xl">
          <div className="bg-[#1a1a1a] border border-[#00bfa5] rounded-xl w-[320px] p-6 shadow-[0_0_40px_rgba(0,191,165,0.2)] flex flex-col relative">
            <button onClick={() => setShowFinalConfirm(false)} className="absolute top-3 right-4 text-[#8fa0a6] hover:text-[#FF1744] font-black text-xl transition-colors">✕</button>
            <p className="text-sm font-bold text-white mb-6 mt-4 text-center leading-relaxed">Confirm the data of loadsheet<br/><span className="text-status-teal text-xl font-black">FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}</span></p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setShowFinalConfirm(false); updateFlightData({ pilots_signed_final: true }); }} className="w-full bg-status-teal text-black font-black uppercase tracking-widest text-xs px-4 py-3.5 rounded shadow-[0_0_15px_rgba(0,191,165,0.4)] hover:bg-[#00E676] transition-colors">Accept</button>
              <button onClick={() => { setShowFinalConfirm(false); setActiveModal('RejectFinal'); }} className="w-full text-status-red border border-status-red font-black uppercase tracking-widest text-xs px-4 py-3.5 rounded hover:bg-status-red hover:text-black transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
    <div className="flex flex-row h-full w-full overflow-hidden relative font-sans">
      
      {/* ========================================== */}
      {/* 左邊：固定數據面板 (Weights & Fuel) */}
      {/* ========================================== */}
      <div className="w-[300px] shrink-0 flex flex-col h-full bg-[#1E1E1E] rounded-2xl border border-[#333333] p-5 shadow-lg mr-6">
        <div className="text-[1.05rem] font-bold text-white border-b border-[#333] pb-3 mb-4 uppercase shrink-0">Weights & Fuel</div>
        <div className="overflow-y-auto flex-1 min-h-0">
          <table className="w-full text-[0.85rem] font-mono">
            <tbody>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Trip Fuel</td><td className="text-right font-bold text-white">{(flightData?.fuel_trip_ofp || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Contingency</td><td className="text-right font-bold text-white">{(calc?.currCont || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Alternate</td><td className="text-right font-bold text-white">{(calc?.currAltnOfp || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Reserve</td><td className="text-right font-bold text-white">{(calc?.ofpRes || 0).toFixed(1)} T</td></tr>
              <tr className="border-b border-[#333]"><td className="text-[#00E676] py-2 font-sans font-bold">Fuel Reqd</td><td className="text-right font-bold text-[#00E676]">{(calc?.currReqdBase || 0).toFixed(1)} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 pt-3 font-sans">Zero Fuel Wt</td><td className="text-right font-bold pt-3 text-white">{wDisplay ? (wDisplay.ZFW/1000).toFixed(1) : "0.0"} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Takeoff Wt</td><td className="text-right font-bold text-white">{wDisplay ? (wDisplay.TOW/1000).toFixed(1) : "0.0"} T</td></tr>
              <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Landing Wt</td><td className="text-right font-bold text-white">{wDisplay ? (wDisplay.LAW/1000).toFixed(1) : "0.0"} T</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 右邊：文檔歷史滾動區 (Documents History) */}
      {/* ========================================== */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden h-full pb-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        <div className="flex gap-5 w-max h-full min-h-0">
          
          {(!flightData?.final_ls_sent && !flightData?.prelim_ls_sent && !flightData?.ezfw_sent && !flightData?.azf_sent) && (
            <div className="text-[#8fa0a6] p-8 text-center italic w-full flex items-center justify-center font-sans text-sm">
              No load documents dispatched yet.
            </div>
          )}

          {/* 🌟 FINAL LOADSHEET 歷史列表 */}
          {[...(flightData?.final_history || [])].reverse().map((doc: any, reverseIndex: number) => {
            const isLatest = reverseIndex === 0;
            const isRejected = !isLatest || flightData?.final_ls_rejected;
            
            const payloadObj = buildEnginePayload(doc.snapshot);
            const engine = new LoadsheetEngine(B773_BHNQ, payloadObj!);
            const text = generateLSText("FINAL", doc.version, doc.snapshot, engine, payloadObj);

            const latestPrelim = flightData?.prelim_history?.[flightData.prelim_history.length - 1];
            let pText = "";
            if (latestPrelim && isLatest) {
              const pPayload = buildEnginePayload(latestPrelim.snapshot);
              const pEngine = new LoadsheetEngine(B773_BHNQ, pPayload!);
              pText = generateLSText("PRELIM", latestPrelim.version, latestPrelim.snapshot, pEngine, pPayload);
            }

            return (
              <div key={`final-${doc.version}`} className={`bg-[#1E1E1E] border ${isRejected ? 'border-[#FF1744]/50' : 'border-[#333333]'} rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors shadow-lg`}>
                {isRejected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><div className="text-[#FF1744]/20 font-black text-6xl transform -rotate-45 border-8 border-[#FF1744]/20 p-4 rounded-2xl">REJECTED</div></div>}
                
                <h4 className="text-[#2979FF] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">FINAL {doc.version.toString().padStart(2, '0')}</h4>
                
                <div className="mt-3 mb-3 shrink-0 relative z-20">
                  {isLatest ? (
                    flightData?.final_ls_rejected ? (
                      <button disabled className="w-full py-2.5 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">FINAL (V{doc.version}) REJECTED</button>
                    ) : flightData?.pilots_signed_final ? (
                      <div className="w-full py-2.5 bg-[#C6FF00] text-black rounded-lg font-bold text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">✓ Acknowledged by {flightData?.captain || 'COMMANDER'}</div>
                    ) : (
                      <button onClick={() => setShowFinalConfirm(true)} className="w-full py-2.5 bg-[#2979FF] text-white rounded-lg font-black text-[0.7rem] hover:bg-blue-600 shadow-md uppercase tracking-widest transition-colors">Accept Final V{doc.version.toString().padStart(2, '0')}</button>
                    )
                  ) : (
                    <button disabled className="w-full py-2.5 bg-[#0a0a0a] border border-[#333] text-[#666] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">SUPERSEDED</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto mt-1 min-h-0 relative z-20 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                  <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">
                    {pText ? renderHighlightedFinal(text, pText) : text}
                  </pre>
                </div>
              </div>
            );
          })}

          {/* 🌟 PRELIM LOADSHEET 歷史列表 */}
          {[...(flightData?.prelim_history || [])].reverse().map((doc: any, reverseIndex: number) => {
            const isLatest = reverseIndex === 0;
            const isRejected = !isLatest || flightData?.prelim_ls_rejected;
            
            const payloadObj = buildEnginePayload(doc.snapshot);
            const engine = new LoadsheetEngine(B773_BHNQ, payloadObj!);
            const text = generateLSText("PRELIM", doc.version, doc.snapshot, engine, payloadObj);

            return (
              <div key={`prelim-${doc.version}`} className={`bg-[#1E1E1E] border ${isRejected ? 'border-[#FF1744]/50' : 'border-[#333333]'} rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors shadow-lg`}>
                {isRejected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><div className="text-[#FF1744]/20 font-black text-6xl transform -rotate-45 border-8 border-[#FF1744]/20 p-4 rounded-2xl">REJECTED</div></div>}

                <h4 className="text-[#FF9100] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">PRELIM {doc.version.toString().padStart(2, '0')}</h4>
                
                <div className="mt-3 mb-3 shrink-0 relative z-20">
                  {isLatest ? (
                    flightData?.prelim_ls_rejected ? (
                      <button disabled className="w-full py-2.5 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">WAITING FOR REVISION...</button>
                    ) : (
                      <button onClick={() => setActiveModal('RejectPrelim')} className="w-full py-2.5 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] rounded-lg font-bold text-[0.7rem] hover:bg-[#FF1744] hover:text-white uppercase tracking-widest transition-colors">Reject PRELIM (V{doc.version})</button>
                    )
                  ) : (
                    <button disabled className="w-full py-2.5 bg-[#0a0a0a] border border-[#333] text-[#666] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">SUPERSEDED</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto mt-1 min-h-0 relative z-20 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                  <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{text}</pre>
                </div>
              </div>
            );
          })}

          {flightData?.azf_sent && (
            <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
              <h4 className="text-[#00E676] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">AZF DATASHEET</h4>
              <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getAzfText()}</pre>
              </div>
            </div>
          )}

          {flightData?.ezfw_sent && (
            <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
              <h4 className="text-white border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">EZFW DATASHEET</h4>
              <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
                <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getEzfwText()}</pre>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* ========================================== */}
      {/* 確認彈窗 Sub-Modal (磨砂玻璃風格) */}
      {/* ========================================== */}
      {showFinalConfirm && (
        <div className="absolute inset-[-1.5rem] z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in rounded-2xl">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-[340px] p-6 shadow-2xl flex flex-col relative">
            <button onClick={() => setShowFinalConfirm(false)} className="absolute top-4 right-4 text-[#8fa0a6] hover:text-white font-black text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333]">✕</button>
            <p className="text-sm font-bold text-white mb-6 mt-4 text-center leading-relaxed font-sans">
              Confirm the data of loadsheet<br/>
              <span className="text-[#2979FF] text-xl font-black block mt-2">FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}</span>
            </p>
            <div className="flex flex-col gap-3 font-sans">
              <button onClick={() => { setShowFinalConfirm(false); updateFlightData({ pilots_signed_final: true }); }} className="w-full bg-[#C6FF00] text-black font-black uppercase tracking-widest text-[0.7rem] px-4 py-3.5 rounded-lg shadow-md hover:bg-[#b0e600] transition-colors">Accept</button>
              <button onClick={() => { setShowFinalConfirm(false); setActiveModal('RejectFinal'); }} className="w-full text-[#FF1744] bg-[#FF1744]/10 border border-[#FF1744]/50 font-black uppercase tracking-widest text-[0.7rem] px-4 py-3.5 rounded-lg hover:bg-[#FF1744] hover:text-white transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
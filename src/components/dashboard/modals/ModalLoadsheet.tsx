"use client";
import { useState } from "react";
// 🌟 1. 引入你啱啱寫好嘅物理引擎同飛機數據
import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
import { B773_BHNQ } from "@/lib/loadsheet/MockAHM"; 

export function ModalLoadsheet({ flightData, updateFlightData, calc, setActiveModal }: any) {
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  // 日期與航班基本資料
  const stdUnix = flightData?.std_unix || 0;
  const fpDateObj = stdUnix > 0 ? new Date(stdUnix * 1000) : new Date();
  const date_str_ls = fpDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '').toUpperCase();
  const date_str_ezfw = fpDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '').toUpperCase();

  const dispatcher = flightData?.dispatcher || 'SYSTEM';
  const flight_num_clean = flightData?.flight_no?.replace(" ", "") || 'CPA564';
  const reg_clean = calc.reg.replace("-", "");
  const crew_fd = flightData?.crew_fd || 2;
  const crew_cc = flightData?.crew_cc || 14;

  // ==========================================
  // 🌟 2. 構建 Payload 掟入 Engine
  // ==========================================
  // 假設 flightData 裡面有存呢啲數據，無就用預設值 (或者對應返你現有嘅 calc 邏輯)
  const payload = {
    pax: { 
      zoneOA: flightData?.pax_f || 0, // 假設 F class 對應 Zone OA
      zoneOB: flightData?.pax_j || 0, // 假設 J class 對應 Zone OB
      zoneOC: flightData?.pax_w || 0, // 假設 W class 對應 Zone OC
      zoneOD: flightData?.pax_y || 0  // 假設 Y class 對應 Zone OD
    },
    paxWeights: { J: 85, Y: 81 }, // 跟據 Image 2
    cargo: {
      hold1: flightData?.cargo_hold_1 || 0,
      hold2: flightData?.cargo_hold_2 || 0,
      hold3: flightData?.cargo_hold_3 || 0,
      hold4: flightData?.cargo_hold_4 || 0,
      bulk: flightData?.cargo_bulk || 0
    },
    waterFraction: flightData?.water_fraction ?? 15, // 🚰 動態食水 (預設 15/16)
    fuel: {
      takeoff: Math.round((flightData?.final_fuel_request || calc.currTow - calc.actualZfw) * 1000),
      trip: Math.round(calc.currTrip * 1000),
      isStandard: flightData?.fuel_is_standard ?? true, // ⛽ Non-Standard 燃油邏輯
      tanks: {
        leftMain: flightData?.fuel_left_main || 0,
        rightMain: flightData?.fuel_right_main || 0,
        center: flightData?.fuel_center || 0
      }
    }
  };

  // 🚀 開動引擎！
  const engine = new LoadsheetEngine(B773_BHNQ, payload);
  const w = engine.calculateWeights();
  const cg = engine.calculateCG();

  // ==========================================
  // 🌟 3. 動態 Margin 及 L (Limiting) 計算邏輯 (全面改用 Engine 數據)
  // ==========================================
  const maxZFW = B773_BHNQ.limits.MZFW;
  const maxTOW = B773_BHNQ.limits.MTOW;
  const maxLAW = B773_BHNQ.limits.MLAW;
  
  const marginZFW = maxZFW - w.ZFW;
  const marginTOW = maxTOW - w.TOW;
  const marginLAW = maxLAW - w.LAW;
  
  const minMargin = Math.min(marginZFW, marginTOW, marginLAW);
  const underload = marginZFW; 
  
  const lZfw = marginZFW === minMargin ? "L" : " ";
  const lTow = marginTOW === minMargin ? "L" : " ";
  const lLaw = marginLAW === minMargin ? "L" : " ";

  // 產生 Loadsheet 電報 (全面替換為動態變數)
  const getLsText = (isFinal: boolean) => {
    const lsType = isFinal ? "FINAL" : "PRELIM";
    const lsVer = isFinal ? (flightData?.final_ls_version || 1) : (flightData?.prelim_ls_version || 1);
    const lsVerStr = lsVer.toString().padStart(2, '0');
    
    // 計算總人數
    const pax_j = payload.pax.zoneOA + payload.pax.zoneOB; // 模擬合併
    const pax_y = payload.pax.zoneOC + payload.pax.zoneOD; 
    
    return `LDS/${reg_clean}/${flight_num_clean}
LOADSHEET                   ${lsType}  ${lsVerStr}
${flight_num_clean}/${date_str_ls}
${calc.depIata}  ${calc.arrIata}  ${flight_num_clean}/20                ${reg_clean}
J${pax_j.toString().padEnd(2)}Y${pax_y.toString().padEnd(3)}      ${crew_fd}/${crew_cc}                ${date_str_ls}

ZFW ACT ${w.ZFW.toString().padEnd(8)}  MAX ${maxZFW}  ${lZfw}   ${marginZFW}
TO FUEL ${payload.fuel.takeoff.toString().padEnd(8)}
TOW ACT ${w.TOW.toString().padEnd(8)}  MAX ${maxTOW}  ${lTow}   ${marginTOW}
TRIP FUEL ${payload.fuel.trip.toString().padEnd(8)}
LAW ACT ${w.LAW.toString().padEnd(8)}  MAX ${maxLAW}  ${lLaw}   ${marginLAW}

BALANCE AND SEATING
BW  ${B773_BHNQ.basicData.BW}      DOW ${w.DOW}
BI  ${B773_BHNQ.basicData.BI.toFixed(2)}      DOI 741.09
LIZFW   ${cg.LIZFW.toFixed(2)}  MACZFW  ${cg.MACZFW.toFixed(2)}
LITOW   ${cg.LITOW.toFixed(2)}  MATOW   ${cg.MACTOW.toFixed(2)}
LILAW   ${cg.LILAW.toFixed(2)}  MACLAW  ${cg.MACLAW.toFixed(2)}

STAB TO ${cg.stabTrim}
0A/${payload.pax.zoneOA.toString().padEnd(3)} 0B/${payload.pax.zoneOB.toString().padEnd(3)} 0C/${payload.pax.zoneOC.toString().padEnd(3)} 0D/${payload.pax.zoneOD.toString().padEnd(3)}
T${(w.totalCargoWeight).toString().padEnd(5)} .1/${payload.cargo.hold1.toString().padEnd(4)} .2/${payload.cargo.hold2.toString().padEnd(4)} .3/${payload.cargo.hold3.toString().padEnd(4)} .4/${payload.cargo.hold4.toString().padEnd(4)} .5/${payload.cargo.bulk.toString().padEnd(4)}

${calc.arrIata}  J${pax_j.toString().padStart(3, '0')}    Y${pax_y.toString().padStart(3, '0')}
TTL PAX ${w.paxCount.toString().padEnd(5)}  UNDERLOAD   ${underload}

CMDR NAME
SIGN

SI
NOTOC:
PANTRY CODE:        77P-A
PANTRY EFFECT       4285/11-
SERVICE WEIGHT ADJUSTMENT/INDEX ADD
${calc.arrIata}    POTABLE WATER       ${payload.waterFraction}/16   ${Math.round((payload.waterFraction/16)*100)}  PCT
805 53

NORMAL MACTOW LIMITS:
FWD MACTOW LIMIT        14.1
AFT MACTOW LIMIT        38.6
LOADSHEETER/${dispatcher}/HKG1576`;
  };

  const getAzfText = () => {
    const tow_reqd = Math.round(w.ZFW + (calc.ofpReqdBase * 1000));
    return `AZF/${reg_clean}/${flight_num_clean}\n- PAX/ ${w.paxCount}\n- CGO/ ${w.totalCargoWeight}\n- ZFW/ ${w.ZFW}\n- CRW/ ${crew_fd}/${crew_cc}\n- TOW/ ${tow_reqd}\n- DEP/ ${(flightData?.std_z || '0000').replace('Z', '')}\n- SEC/ ${calc.depIata}-${calc.arrIata}\n\nFLT STATUS: closed\nLCO: ${dispatcher}\n\nSI`;
  };

  const getEzfwText = () => {
    const ttlLoad = w.totalPaxWeight + w.totalCargoWeight;
    const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);
    const pax_j = payload.pax.zoneOA + payload.pax.zoneOB;
    const pax_y = payload.pax.zoneOC + payload.pax.zoneOD;
    
    return `EZFW ${flight_num_clean}/${date_str_ezfw} ${reg_clean} J${pax_j}Y${pax_y}\n${crew_fd}/${crew_cc} ${calc.depIata}${calc.arrIata}\n\nPASSENGER           ${w.totalPaxWeight.toString().padEnd(6)} KG\nCARGO               ${w.totalCargoWeight.toString().padEnd(6)} KG\nTTL TRAFFIC LOAD    ${ttlLoad.toString().padEnd(6)} KG\n\nJ${pax_j}  Y${pax_y}\nDOW                 ${w.DOW.toString().padEnd(6)} KG\nEST ZFW             ${estZfwKg.toString().padEnd(6)} KG\n\nLCO: ${dispatcher}\nSI\nLATEST EZFW`;
  };

  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative">
      {/* 👈 左側 Weights & Fuel 表格：全自動從 Engine 獲取 */}
      <div className="w-[340px] shrink-0 flex flex-col h-full border-r border-[#333333] pr-6">
        <div className="text-xl font-bold text-status-teal border-b border-[#333333] pb-2 mb-4 uppercase shrink-0">Weights & Fuel</div>
        <div className="overflow-y-auto pr-2 flex-1 min-h-0">
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="text-text-muted py-1">Trip Fuel</td><td className="text-right font-bold text-[#e2e8f0]">{(payload.fuel.trip/1000).toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Contingency</td><td className="text-right font-bold text-[#e2e8f0]">{calc.currCont.toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Alternate</td><td className="text-right font-bold text-[#e2e8f0]">{calc.currAltnOfp.toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Reserve</td><td className="text-right font-bold text-[#e2e8f0]">{calc.ofpRes.toFixed(1)} T</td></tr>
              <tr className="border-b border-[#333]"><td className="text-[#00E676] py-1 font-bold">Fuel Reqd</td><td className="text-right font-bold text-[#00E676]">{calc.currReqdBase.toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1 pt-3">Zero Fuel Wt</td><td className="text-right font-bold pt-3 text-[#e2e8f0]">{(w.ZFW/1000).toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Takeoff Wt</td><td className="text-right font-bold text-[#e2e8f0]">{(w.TOW/1000).toFixed(1)} T</td></tr>
              <tr><td className="text-text-muted py-1">Landing Wt</td><td className="text-right font-bold text-[#e2e8f0]">{(w.LAW/1000).toFixed(1)} T</td></tr>
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
                  <button disabled className="w-full py-3 bg-[#34495e] text-text-muted rounded font-bold text-xs uppercase cursor-not-allowed">FINAL (V{flightData?.final_ls_version || 1}) REJECTED</button>
                ) : flightData?.pilots_signed_final ? (
                  <div className="w-full py-3 bg-[#00E676]/20 border border-[#00E676] text-[#00E676] rounded font-bold text-xs uppercase flex items-center justify-center gap-2">
                    ✅ Acknowledged by {flightData?.captain || 'COMMANDER'}
                  </div>
                ) : (
                  <button onClick={() => setShowFinalConfirm(true)} className="w-full py-3 bg-[#00bfa5] text-black rounded font-black text-sm hover:bg-[#00E676] shadow-[0_0_15px_rgba(0,191,165,0.4)] uppercase transition-colors">
                    [FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}]
                  </button>
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
                  <button onClick={() => setActiveModal('RejectPrelim')} className="w-full py-2 bg-[#FF1744]/20 border border-[#FF1744] text-[#FF1744] rounded font-bold text-xs hover:bg-[#FF1744] hover:text-white uppercase transition-colors">Reject PRELIM (V{flightData?.prelim_ls_version || 1})</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                <pre className="text-text-main font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getLsText(false)}</pre>
              </div>
            </div>
          )}

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

      {/* 🌟 FINAL Confirmation Sub-Modal (極簡潔 X 返回) */}
      {showFinalConfirm && (
        <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in rounded-xl">
          <div className="bg-[#1a1a1a] border border-[#00bfa5] rounded-xl w-[320px] p-6 shadow-[0_0_40px_rgba(0,191,165,0.2)] flex flex-col relative">
            
            <button 
              onClick={() => setShowFinalConfirm(false)} 
              className="absolute top-3 right-4 text-[#8fa0a6] hover:text-[#FF1744] font-black text-xl transition-colors"
            >
              ✕
            </button>

            <p className="text-sm font-bold text-white mb-6 mt-4 text-center leading-relaxed">
              Confirm the data of loadsheet<br/> 
              <span className="text-status-teal text-xl font-black">FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}</span>
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowFinalConfirm(false); updateFlightData({ pilots_signed_final: true }); }} 
                className="w-full bg-status-teal text-black font-black uppercase tracking-widest text-xs px-4 py-3.5 rounded shadow-[0_0_15px_rgba(0,191,165,0.4)] hover:bg-[#00E676] transition-colors"
              >
                Accept
              </button>
              
              <button 
                onClick={() => { setShowFinalConfirm(false); setActiveModal('RejectFinal'); }} 
                className="w-full text-status-red border border-status-red font-black uppercase tracking-widest text-xs px-4 py-3.5 rounded hover:bg-status-red hover:text-black transition-colors"
              >
                Reject
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
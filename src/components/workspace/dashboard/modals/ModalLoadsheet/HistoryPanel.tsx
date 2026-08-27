"use client";
import { Fragment, useState } from "react";
import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { buildEnginePayload, generateLSText, getAzfText, getEzfwText } from "@/lib/loadsheet/loadsheetHelpers";
import { diffLoadsheetText } from "@/lib/loadsheet/loadsheetDiff";

export function HistoryPanel({ flightData, calc, updateFlightData, setActiveModal, limits }: any) {

  // 🌟 喺 HistoryPanel 頂部加入這個 State
  const [localConfirmVer, setLocalConfirmVer] = useState<number | null>(null);

  // 🌟 動態定錨：獲取目前執飛的飛機註冊號，查出專屬 AHM 大腦
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 核心定錨：獲取學員 Revised 的 Taxi Fuel + Trip Fuel (轉做 KG)——trip fuel 修復：
  // 以前 buildEnginePayload 內部恆定讀靜態 flightData.fuel_trip_ofp，同呢度 taxi fuel
  // 一早已經用緊嘅 revised 數唔同步，令 FINAL/PRELIM 印出嚟嘅 Landing Weight/LAW margin
  // 喺學員修訂咗 ZFW/alternate/manual fuel/Desired Fuel 之後仲係用緊舊數
  const revisedTaxiKg = calc?.currTaxi
    ? Math.round(calc.currTaxi * 1000)
    : (flightData?.fuel_taxi_ofp ? Math.round(flightData.fuel_taxi_ofp * 1000) : 200);
  const revisedTripKg = calc?.currTrip
    ? Math.round(calc.currTrip * 1000)
    : (flightData?.fuel_trip_ofp ? Math.round(flightData.fuel_trip_ofp * 1000) : 18500);

  // 🌟 修復：以前呢個 revised fuel 一律套用晒所有歷史卡（連已經被取代嘅舊 version 都係），
  // 令一份早已 superseded 嘅文件嘅 TOW/Landing Weight 跟住教官之後仲喺度改嘅 live fuel
  // 「事後改變」。而家淨係最新一份先用 live 數，舊 version 用返 dispatch 嗰刻凍結咗嘅
  // snapshot.taxiKg/tripKg（PayloadTab.tsx 新增），舊資料未有呢兩個欄位就 fallback 返
  // OFP 靜態基準，作為最接近嘅近似值
  const getEntryFuelKg = (doc: any, isLatest: boolean) => {
    if (isLatest) return { taxiKg: revisedTaxiKg, tripKg: revisedTripKg };
    return {
      taxiKg: doc?.snapshot?.taxiKg ?? (flightData?.fuel_taxi_ofp ? Math.round(flightData.fuel_taxi_ofp * 1000) : 200),
      tripKg: doc?.snapshot?.tripKg ?? (flightData?.fuel_trip_ofp ? Math.round(flightData.fuel_trip_ofp * 1000) : 18500),
    };
  };

  // 🌟 Highlight diff：改用 loadsheetDiff.ts 嘅 LCS-based 演算法，唔再淨係
  // 逐行按位置比較——插入咗成段 CHANGE FROM PRELIM 之後，位置之後嘅內容
  // 唔會再因為「錯位」而被誤 highlight（同 old 一字不差就唔標記）
  const renderHighlightedFinal = (newText: string, oldText: string) => {
    if (!oldText || !newText) return newText;
    const diffLines = diffLoadsheetText(newText, oldText);

    return diffLines.map((line, i) => {
      if (!line.tokens) return <div key={i}>{line.text || " "}</div>;

      return (
        <div key={i}>
          {line.tokens.map((token, j) => {
            if (token.highlight) {
              return <span key={j} className="text-[#0a0a0a] bg-[#FF9100] px-0.5 rounded shadow-[0_0_8px_rgba(255,145,0,0.8)] font-black">{token.text}</span>;
            }
            return <Fragment key={j}>{token.text}</Fragment>;
          })}
        </div>
      );
    });
  };

  return (
    // 🌟 Mobile：呢個 row 同入面啲 history card 都靠 h-full 計高度，冇咗 desktop
    // 嗰個 md:h-full 嘅祖先邊界就會冧曬——mobile 自己畀返一個實數高度
    <div className="h-[65vh] md:h-auto md:flex-1 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
      <div className="flex gap-5 w-max h-full min-h-0">
        
        {(!flightData?.final_ls_sent && !flightData?.prelim_ls_sent && !flightData?.ezfw_sent && !flightData?.azf_sent) && (
          <div className="text-[#8fa0a6] p-8 text-center italic w-full flex items-center justify-center font-sans text-sm">
            No load documents dispatched yet.
          </div>
        )}

        {/* 🌟 FINAL LOADSHEET 歷史列表 */}
        {[...(flightData?.final_history || [])].reverse().map((doc: any, reverseIndex: number) => {
          const isLatest = reverseIndex === 0;
          // 🌟 修復：以前 !isLatest 就恆定當做 REJECTED，令任何被取代（SUPERSEDED）嘅
          // 舊 version 都會同真正俾人拒收嘅文件一樣打晒個紅色「REJECTED」大浮水印，
          // 同下面正確顯示緊「SUPERSEDED」嘅掣互相矛盾
          const isRejected = isLatest && flightData?.final_ls_rejected;

          const { taxiKg, tripKg } = getEntryFuelKg(doc, isLatest);
          const payloadObj = buildEnginePayload(doc.snapshot, flightData, taxiKg, tripKg);
          const engine = new LoadsheetEngine(ahm, payloadObj!);

          const latestPrelim = flightData?.prelim_history?.[flightData.prelim_history.length - 1];
          let pText = "";
          // 🌟 CHANGE FROM PRELIM 區塊要用嘅 TOW/MACTOW 對比基準——同下面攞嚟
          // render highlight diff 嗰個 pEngine 共用，唔使計多次
          let compareStage: { version: number; tow: number; macTow: number } | null = null;
          if (latestPrelim && isLatest) {
            const pPayload = buildEnginePayload(latestPrelim.snapshot, flightData, revisedTaxiKg, revisedTripKg);
            const pEngine = new LoadsheetEngine(ahm, pPayload!);
            pText = generateLSText("PRELIM", latestPrelim.version, latestPrelim.snapshot, pEngine, pPayload, flightData, calc, limits);
            const pW = pEngine.calculateWeights();
            const pCg = pEngine.calculateCG();
            compareStage = { version: latestPrelim.version, tow: pW.TOW, macTow: pCg.MACTOW };
          }

          const text = generateLSText("FINAL", doc.version, doc.snapshot, engine, payloadObj, flightData, calc, limits, isLatest ? compareStage : null);

          return (
            <div key={`final-${doc.version}`} className={`bg-[#1E1E1E] border ${isRejected ? 'border-[#FF1744]/50' : 'border-[#333333]'} rounded-2xl p-5 w-[85vw] max-w-[460px] md:w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors shadow-lg`}>
              {isRejected && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><div className="text-[#FF1744]/20 font-black text-6xl transform -rotate-45 border-8 border-[#FF1744]/20 p-4 rounded-2xl">REJECTED</div></div>}
              
              <h4 className="text-[#2979FF] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">FINAL {doc.version.toString().padStart(2, '0')}</h4>
              
              <div className="mt-3 mb-3 shrink-0 relative z-20">
                {isLatest ? (
                  flightData?.final_ls_rejected ? (
                    <button disabled className="w-full py-2.5 bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] rounded-lg font-bold text-[0.7rem] uppercase tracking-widest cursor-not-allowed">FINAL (V{doc.version}) REJECTED</button>
                  ) : flightData?.pilots_signed_final ? (
                    <div className="w-full py-2.5 bg-[#C6FF00] text-black rounded-lg font-bold text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
                      ✓ Acknowledged by {flightData?.captain || 'COMMANDER'}
                      {/* 🌟 舊 flight（呢個功能改版之前已經 acknowledge 咗）冇呢個欄位，
                          就唔顯示 timestamp，唔會印一個唔存在嘅假時間出嚟 */}
                      {flightData?.final_ls_signed_time && ` ${flightData.final_ls_signed_time}`}
                    </div>
                  ) : (
                    // 🌟 用本地 state 記錄緊邊張卡片被點擊，彈窗字樣先至永遠鎖定正確 version
<button 
  onClick={() => setLocalConfirmVer(doc.version)} 
  className="w-full py-2.5 bg-[#2979FF] text-white rounded-lg font-black text-[0.7rem] hover:bg-blue-600 shadow-md uppercase tracking-widest transition-colors"
>
  Accept Final V{doc.version.toString().padStart(2, '0')}
</button>
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
          const isRejected = isLatest && flightData?.prelim_ls_rejected;

          const { taxiKg, tripKg } = getEntryFuelKg(doc, isLatest);
          const payloadObj = buildEnginePayload(doc.snapshot, flightData, taxiKg, tripKg);
          const engine = new LoadsheetEngine(ahm, payloadObj!);
          const text = generateLSText("PRELIM", doc.version, doc.snapshot, engine, payloadObj, flightData, calc, limits);

          return (
            <div key={`prelim-${doc.version}`} className={`bg-[#1E1E1E] border ${isRejected ? 'border-[#FF1744]/50' : 'border-[#333333]'} rounded-2xl p-5 w-[85vw] max-w-[460px] md:w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors shadow-lg`}>
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

        {/* AZF DATASHEET */}
        {flightData?.azf_sent && (
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[85vw] max-w-[460px] md:w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
            <h4 className="text-[#00E676] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">AZF DATASHEET</h4>
            <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
              <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getAzfText(flightData, calc)}</pre>
            </div>
          </div>
        )}

        {/* EZFW DATASHEET */}
        {flightData?.ezfw_sent && (
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[85vw] max-w-[460px] md:w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
            <h4 className="text-white border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">EZFW DATASHEET</h4>
            <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
              <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getEzfwText(flightData, calc)}</pre>
            </div>
          </div>
        )}

      </div>
      {/* ============================================================================ */}
      {/* 🌟 終極大絕：直接喺卡片清單底層攔截彈窗！徹底封殺跨時空讀到 02 嘅 Bug */}
      {/* ============================================================================ */}
      {localConfirmVer !== null && (
        <div className="absolute inset-[-1.5rem] z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in rounded-2xl px-6">
          {/* 🌟 細、單行嘅 modal：字喺左邊，Reject/Accept 兩個掣一齊喺右邊——
              唔再係成個畫面中央嘅大 modal + 掣上下疊 */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-[480px] px-5 py-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sans">
            <p className="text-[0.8rem] font-black text-white uppercase tracking-widest text-center sm:text-left shrink-0">
              {/* 🎯 絕對真理：彈窗字樣直接鎖死當前點擊嘅 localConfirmVer，神仙都改佢唔到！ */}
              Acknowledge Final Loadsheet {localConfirmVer.toString().padStart(2, '0')}
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setLocalConfirmVer(null); setActiveModal('RejectFinal'); }}
                className="text-[#FF1744] bg-[#FF1744]/10 border border-[#FF1744]/50 font-black uppercase tracking-widest text-[0.65rem] px-4 py-2.5 rounded-lg hover:bg-[#FF1744] hover:text-white transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setLocalConfirmVer(null);
                  const now = new Date();
                  const final_ls_signed_time = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
                  updateFlightData({ pilots_signed_final: true, final_ls_signed_time });
                }}
                className="bg-[#C6FF00] text-black font-black uppercase tracking-widest text-[0.65rem] px-4 py-2.5 rounded-lg shadow-md hover:bg-[#b0e600] transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
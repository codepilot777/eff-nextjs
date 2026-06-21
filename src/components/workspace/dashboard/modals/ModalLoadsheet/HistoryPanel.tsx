"use client";
import { Fragment } from "react";
import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { buildEnginePayload, generateLSText, getAzfText, getEzfwText } from "@/lib/loadsheet/loadsheetHelpers";

export function HistoryPanel({ flightData, calc, setActiveModal, limits, setShowFinalConfirm }: any) {

  // 🌟 動態定錨：獲取目前執飛的飛機註冊號，查出專屬 AHM 大腦
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 核心定錨：獲取學員 Revised 的 Taxi Fuel (轉做 KG)
  const revisedTaxiKg = calc?.currTaxi 
    ? Math.round(calc.currTaxi * 1000) 
    : (flightData?.fuel_taxi_ofp ? Math.round(flightData.fuel_taxi_ofp * 1000) : 200);

  // Highlight Token 演算法 (保持原樣)
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

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
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
          
          // 🎯 傳入第 3 個參數：revisedTaxiKg
          const payloadObj = buildEnginePayload(doc.snapshot, flightData, revisedTaxiKg);
          const engine = new LoadsheetEngine(ahm, payloadObj!);
          const text = generateLSText("FINAL", doc.version, doc.snapshot, engine, payloadObj, flightData, calc, limits);

          const latestPrelim = flightData?.prelim_history?.[flightData.prelim_history.length - 1];
          let pText = "";
          if (latestPrelim && isLatest) {
            // 🎯 傳入第 3 個參數：revisedTaxiKg
            const pPayload = buildEnginePayload(latestPrelim.snapshot, flightData, revisedTaxiKg);
            const pEngine = new LoadsheetEngine(ahm, pPayload!);
            pText = generateLSText("PRELIM", latestPrelim.version, latestPrelim.snapshot, pEngine, pPayload, flightData, calc, limits);
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
          
          // 🎯 傳入第 3 個參數：revisedTaxiKg
          const payloadObj = buildEnginePayload(doc.snapshot, flightData, revisedTaxiKg);
          const engine = new LoadsheetEngine(ahm, payloadObj!);
          const text = generateLSText("PRELIM", doc.version, doc.snapshot, engine, payloadObj, flightData, calc, limits);

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

        {/* AZF DATASHEET */}
        {flightData?.azf_sent && (
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
            <h4 className="text-[#00E676] border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">AZF DATASHEET</h4>
            <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
              <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getAzfText(flightData, calc)}</pre>
            </div>
          </div>
        )}

        {/* EZFW DATASHEET */}
        {flightData?.ezfw_sent && (
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 w-[460px] flex-shrink-0 flex flex-col h-full min-h-0 shadow-lg">
            <h4 className="text-white border-b border-[#333] pb-3 mt-0 font-sans text-[1.05rem] font-bold tracking-widest shrink-0 uppercase">EZFW DATASHEET</h4>
            <div className="flex-1 overflow-y-auto mt-3 min-h-0 bg-[#0a0a0a] p-4 rounded-xl border border-[#333] shadow-inner">
              <pre className="text-[#e2e8f0] font-mono text-[0.8rem] font-bold leading-relaxed whitespace-pre-wrap m-0">{getEzfwText(flightData, calc)}</pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
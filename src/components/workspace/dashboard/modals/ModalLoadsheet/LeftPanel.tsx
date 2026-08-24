"use client";
import { getActiveStageWeights } from "@/lib/loadsheet/loadsheetHelpers";
import { getZfwValue } from "@/lib/marginHelpers";

export function LeftPanel({ flightData, calc }: any) {

  // 🌟 修復：以前 stageZfw/stagePax 呢份運算成個 inline 喺呢個 component 度，
  // 同 LoadsheetAirportColumn.tsx 嗰邊另一份幾乎一樣但唔同步嘅邏輯重複咗兩次。
  // 而家兩邊共用返 getActiveStageWeights()，保證邊個階段就顯示緊嗰個階段真正
  // dispatch 咗嘅 snapshot 數，唔會兩張卡各自顯示唔同數
  const active = getActiveStageWeights(flightData, calc);
  const stageZfw = active.zfw;
  const stagePax = active.pax;

  let currentStage = "AWAITING";
  let stageBg = "bg-[#333333]";
  let stageText = "text-[#8fa0a6]";

  if (active.stage === "FINAL") {
    currentStage = `FINAL ${active.version!.toString().padStart(2, '0')}`;
    // 🌟 修復：以前呢個 badge 完全冇理 final_ls_rejected，令俾拒收咗嘅 FINAL
    // 同正常 pending 嘅 FINAL 顯示緊一模一樣嘅藍色標籤，睇唔出已經俾人拒收
    if (active.rejected) { currentStage += " - REJECTED"; stageBg = "bg-[#FF1744]"; stageText = "text-white"; }
    else { stageBg = flightData?.pilots_signed_final ? "bg-[#C6FF00]" : "bg-[#2979FF]"; stageText = flightData?.pilots_signed_final ? "text-black" : "text-white"; }
  } else if (active.stage === "PRELIM") {
    currentStage = `PRELIM ${active.version!.toString().padStart(2, '0')}`;
    if (active.rejected) { currentStage += " - REJECTED"; stageBg = "bg-[#FF1744]"; stageText = "text-white"; }
    else { stageBg = "bg-[#FF9100]"; stageText = "text-black"; }
  } else if (active.stage === "AZF") {
    currentStage = "AZF";
    stageBg = "bg-[#00E676]"; stageText = "text-black";
  } else if (active.stage === "EZFW") {
    currentStage = "EZFW";
    stageBg = "bg-[#00bfa5]"; stageText = "text-black";
  }

  return (
    <div className="w-[300px] shrink-0 flex flex-col h-full bg-[#1E1E1E] rounded-2xl border border-[#333333] p-5 shadow-lg mr-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
      
      {/* Stage Indicator */}
      <div className="mb-6">
        <div className={`text-center font-black text-[1.1rem] py-2.5 rounded-lg ${stageBg} ${stageText} uppercase tracking-widest shadow-md transition-colors`}>
          {currentStage}
        </div>
        <div className="flex justify-between mt-3 text-sm font-mono text-[#8fa0a6]">
          <div className="flex flex-col items-center bg-[#0a0a0a] py-2 px-1 rounded-lg border border-[#333] w-[48%] shadow-inner">
            <span className="text-[0.65rem] uppercase font-bold tracking-widest mb-0.5">PAX</span>
            <span className="text-white text-[1.3rem] font-bold leading-none">{stagePax > 0 ? stagePax : '--'}</span>
          </div>
          <div className="flex flex-col items-center bg-[#0a0a0a] py-2 px-1 rounded-lg border border-[#333] w-[48%] shadow-inner">
            <span className="text-[0.65rem] uppercase font-bold tracking-widest mb-0.5">ZFW (KG)</span>
            <span className="text-white text-[1.3rem] font-bold leading-none">{stageZfw > 0 ? stageZfw : '--'}</span>
          </div>
        </div>
      </div>

      {/* Revised Weights & Fuel 表格 */}
      <div className="text-[1.05rem] font-bold text-white border-b border-[#333] pb-3 mb-4 uppercase shrink-0">Weights & Fuel</div>
      <div className="flex-1 min-h-0 pb-4">
        <table className="w-full text-[0.85rem] font-mono">
          <tbody>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Trip Fuel</td><td className="text-right font-bold text-white">{(calc?.autoTrip || 0).toFixed(1)} T</td></tr>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Contingency</td><td className="text-right font-bold text-white">{(calc?.currCont || 0).toFixed(1)} T</td></tr>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Alternate</td><td className="text-right font-bold text-white">{(calc?.currAltnOfp || 0).toFixed(1)} T</td></tr>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Reserve</td><td className="text-right font-bold text-white">{(calc?.ofpRes || 0).toFixed(1)} T</td></tr>
            <tr className="border-b border-[#333]"><td className="text-[#8fa0a6] py-1.5 font-sans">Min Reqd</td><td className="text-right font-bold text-[#8fa0a6]">{(calc?.currReqdBase || 0).toFixed(1)} T</td></tr>
            
            <tr><td className="text-[#8fa0a6] py-1.5 pt-2 font-sans flex items-center gap-1">Extra Fuel {calc?.currExtra > 0 && <span className="bg-[#FF9100] text-black px-1 rounded text-[0.5rem] leading-tight font-black">AUTO</span>}</td><td className="text-right font-bold text-[#FF9100] pt-2">{(calc?.currExtra || 0).toFixed(1)} T</td></tr>
            <tr className="border-b border-[#333]"><td className="text-[#00E676] py-2 font-sans font-bold">Total Block</td><td className="text-right font-black text-[#00E676] text-[1.1rem]">{(calc?.currTotal || 0).toFixed(1)} T</td></tr>
            
            {/* 🌟 修復：以前呢度自己 inline 重寫咗一次 marginHelpers.ts 嘅 getZfwValue()
                邏輯，漏咗 showRevVal 呢個 gate——而家改用返同一個共用 helper，
                避免將來 formula 改咗喺呢度靜靜雞 drift 走 */}
            <tr><td className="text-[#8fa0a6] py-1.5 pt-4 font-sans">Zero Fuel Wt</td><td className="text-right font-bold pt-4 text-white">{getZfwValue(calc).toFixed(1)} T</td></tr>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Takeoff Wt</td><td className="text-right font-bold text-white">{(calc?.currTow || 0).toFixed(1)} T</td></tr>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Landing Wt</td><td className="text-right font-bold text-white">{(calc?.currLw || 0).toFixed(1)} T</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
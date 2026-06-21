"use client";
import { LoadsheetEngine } from "@/lib/loadsheet/LoadsheetEngine";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { buildEnginePayload } from "@/lib/loadsheet/loadsheetHelpers";

export function LeftPanel({ flightData, calc }: any) {
  
  // 🌟 核心動態定錨：獲取目前執飛的飛機註冊號，查出專屬 AHM
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 準備兩條 Taxi Fuel (單位: KG)
  const ofpTaxiKg = flightData?.fuel_taxi_ofp ? Math.round(Number(flightData.fuel_taxi_ofp) * 1000) : 200;
  const revisedTaxiKg = calc?.currTaxi ? Math.round(Number(calc.currTaxi) * 1000) : ofpTaxiKg;

  let currentStage = "AWAITING";
  let stageZfw = 0;
  let stagePax = 0;
  let stageBg = "bg-[#333333]";
  let stageText = "text-[#8fa0a6]";

  if (flightData?.final_ls_sent) {
    const activeVer = flightData?.final_history?.[flightData.final_history.length - 1]?.version || 1;
    currentStage = `FINAL ${activeVer.toString().padStart(2, '0')}`;
    
    stageBg = flightData?.pilots_signed_final ? "bg-[#C6FF00]" : "bg-[#2979FF]"; 
    stageText = flightData?.pilots_signed_final ? "text-black" : "text-white";
    const p = buildEnginePayload(flightData.final_snapshot, flightData, revisedTaxiKg);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
  
  } else if (flightData?.prelim_ls_sent) {
    // 🎯 核心修正：從歷史陣列中抽取出真正「最後發送」的版本號
    const activeVer = flightData?.prelim_history?.[flightData.prelim_history.length - 1]?.version || 1;
    currentStage = `PRELIM ${activeVer.toString().padStart(2, '0')}`;
    
    stageBg = "bg-[#FF9100]"; stageText = "text-black";
    const p = buildEnginePayload(flightData.prelim_snapshot, flightData, revisedTaxiKg);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
  
  } else if (flightData?.azf_sent) {
    currentStage = "AZF";
    stageBg = "bg-[#00E676]"; stageText = "text-black";
    const p = buildEnginePayload(flightData.azf_snapshot, flightData, ofpTaxiKg);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
  
  } else if (flightData?.ezfw_sent) {
    currentStage = "EZFW";
    stageBg = "bg-[#00bfa5]"; stageText = "text-black";
    const p = buildEnginePayload(flightData.ezfw_snapshot, flightData, ofpTaxiKg);
    if (p) { const e = new LoadsheetEngine(ahm, p); stageZfw = e.calculateWeights().ZFW; stagePax = e.calculateWeights().paxCount; }
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
            
            <tr><td className="text-[#8fa0a6] py-1.5 pt-4 font-sans">Zero Fuel Wt</td><td className="text-right font-bold pt-4 text-white">{(calc?.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw).toFixed(1)} T</td></tr>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Takeoff Wt</td><td className="text-right font-bold text-white">{(calc?.currTow || 0).toFixed(1)} T</td></tr>
            <tr><td className="text-[#8fa0a6] py-1.5 font-sans">Landing Wt</td><td className="text-right font-bold text-white">{(calc?.currLw || 0).toFixed(1)} T</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
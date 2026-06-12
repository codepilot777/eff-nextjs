"use client";

export function ModalFMS({ calc, flightData }: any) {
  return (
    // 🌟 外層容器確保高度可以被內部 Scroll 消化
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden min-h-0 w-full font-sans">
      
      {/* ========================================== */}
      {/* 左邊：FMS OPERATION SUMMARY */}
      {/* ========================================== */}
      <div className="flex-[1.2] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-6 flex flex-col min-h-0 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-5 border-b border-[#333] pb-3 shrink-0 tracking-wide">FMS OPERATION SUMMARY</h2>
        
        {/* Grid 資料區加 overflow-y-auto */}
        <div className="grid grid-cols-2 gap-y-5 gap-x-6 overflow-y-auto pr-2 content-start min-h-0">
          
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Aircraft Type</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.acType}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Reg</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.reg}</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Drag/F-F Factor</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.dragFf}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">MEL/CDL Pen</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.melCdl}</span>
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">FMS Route</span>
            <span className="font-mono text-[0.9rem] text-[#00E676] leading-relaxed break-words mt-0.5">{calc.routeStr}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Total Distance</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.totalDist} NM</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">TOC</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.cruiseAlt}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">TOC Temp</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.tocTemp}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Cost Index</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.costIndex}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">EDTO Flight</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.edtoFlight}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Reserve</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.ofpRes.toFixed(1)} T</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Min Divert Fuel</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.minDivert}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Avg Wind</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.avgWind}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Avg Trip (kg/gnm)</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.avgTrip}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Highest Trip MRA</span>
            <div className="bg-[#FFD600] text-black text-[0.75rem] font-black px-1.5 py-0.5 rounded w-max flex items-center gap-1 shadow-sm leading-tight mt-0.5">
              <span className="text-[0.5rem]">▲</span> {calc.mraHigh}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">EDG MRA</span>
            <div className="bg-[#FFD600] text-black text-[0.75rem] font-black px-1.5 py-0.5 rounded w-max flex items-center gap-1 shadow-sm leading-tight mt-0.5">
              <span className="text-[0.5rem]">▲</span> {calc.mraEdg}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Dep Rwy</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.depRwy}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">Arr Rwy</span>
            <span className="font-mono text-[0.9rem] text-white leading-none mt-0.5">{calc.arrRwy}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">SID</span>
            <span className="font-mono text-[0.9rem] text-[#FF9100] leading-none mt-0.5">{calc.sid}</span>
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest leading-none">STAR</span>
            <span className="font-mono text-[0.9rem] text-[#FF9100] leading-none mt-0.5">{calc.star}</span>
          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* 右邊：ICAO ATS FLIGHT PLAN */}
      {/* ========================================== */}
      <div className="flex-[0.8] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-6 flex flex-col min-h-0 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-5 border-b border-[#333] pb-3 shrink-0 tracking-wide">ICAO ATS FLIGHT PLAN</h2>
        
        {/* ATS 電報模擬區 */}
        <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#333] font-mono text-[0.85rem] text-[#e2e8f0] whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto shadow-inner">
          {flightData?.raw_simbrief?.atc?.flightplan_text || `(FPL-${flightData?.flight_no?.replace(" ", "") || 'CPA564'}-IS
-B773/H-SDE3GHIJ2J3J5M1RWXY/LB1
-${calc.depIcao}${flightData?.std_z?.substring(0,4) || '0000'}
-N0480F${calc.cruiseAlt.replace('FL', '')} ${calc.routeStr} ${flightData?.sid_route || ''} DCT OCEAN DCT MKG DCT ${flightData?.star_route || ''}
-${calc.arrIcao}0315 ${calc.depIcao}
-REG/${calc.reg.replace("-", "")} CAPT/${flightData?.captain?.replace(" ", "") || 'PILOT'})`}
        </div>
      </div>

    </div>
  );
}
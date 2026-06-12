"use client";

export default function FmcCrewColumn({ flightData, calc, setActiveModal }: { flightData: any, calc: any, setActiveModal: any }) {
  
  // 模擬從 SimBrief 提取嘅 MRA (Minimum Route Altitude)
  const tripMra = "147";
  const edgMra = "159";

  return (
    // 用 bg-[#1E1E1E] 襯托 Cathay 嘅卡片底色
    <div className="flex flex-col gap-3 h-full font-sans text-white w-full max-w-[280px]">
      
      {/* 🌟 1. FMC & ATS 卡片 */}
      <div 
        onClick={() => setActiveModal('FMS')}
        className="bg-[#1E1E1E] rounded-xl p-4 cursor-pointer hover:bg-[#252525] transition-colors relative"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[1.1rem] font-bold text-white">FMC & ATS</h2>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Aircraft Type</span>
            <span className="font-mono text-[0.85rem]">{calc.acType}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Reg</span>
            <span className="font-mono text-[0.85rem]">{calc.reg}</span>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Drag/F-F Factor</span>
            <span className="font-mono text-[0.85rem]">{calc.dragFf}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">MEL/CDL Pen</span>
            <span className="font-mono text-[0.85rem]">{calc.melCdl}</span>
          </div>

          <div className="flex flex-col gap-0.5 col-span-1 pr-2">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">FMS Route</span>
            <span className="font-mono text-[0.85rem] text-white truncate w-full block">{calc.shortRoute}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Total Distance</span>
            <span className="font-mono text-[0.85rem]">{calc.totalDist}</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">TOC</span>
            <span className="font-mono text-[0.85rem]">{calc.cruiseAlt.replace('F', '')}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">TOC Temp</span>
            <span className="font-mono text-[0.85rem]">{calc.tocTemp}</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Cruise Schedule</span>
            <span className="font-mono text-[0.85rem]">CI {calc.costIndex}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">EDTO Flight</span>
            <span className="font-mono text-[0.85rem]">--</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Reserve</span>
            <span className="font-mono text-[0.85rem]">{calc.ofpRes.toFixed(1)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Min Divert Fuel</span>
            <span className="font-mono text-[0.85rem]">{flightData?.arr_icao === 'RJBB' ? 'RJGG' : 'ALTN'} 8.5</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Avg Wind</span>
            <span className="font-mono text-[0.85rem]">{calc.avgWind}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Avg Trip (kg/gnm)</span>
            <span className="font-mono text-[0.85rem]">16.9</span>
          </div>

          {/* MRA 黃色牌仔 */}
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Highest Trip MRA</span>
            <div className="bg-[#FFD600] text-black text-[0.7rem] font-black px-1.5 py-0.5 rounded w-max flex items-center gap-1 shadow-sm">
              <span className="text-[0.5rem] leading-none">▲</span> {tripMra}
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">EDG MRA</span>
            <div className="bg-[#FFD600] text-black text-[0.7rem] font-black px-1.5 py-0.5 rounded w-max flex items-center gap-1 shadow-sm">
              <span className="text-[0.5rem] leading-none">▲</span> {edgMra}
            </div>
          </div>

          <div className="flex flex-col gap-0.5 mt-2">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Dep Rwy</span>
            <span className="font-mono text-[0.85rem]">{calc.depRwy}</span>
          </div>
          <div className="flex flex-col gap-0.5 mt-2">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">Arr Rwy</span>
            <span className="font-mono text-[0.85rem]">06L RNAV CA...</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">SID</span>
            <span className="font-mono text-[0.85rem]">{calc.sid}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold tracking-wide">STAR</span>
            <span className="font-mono text-[0.85rem]">NIXOVA</span>
          </div>
        </div>
      </div>
      
      {/* 🌟 2. SNN & DOCS 按鈕 */}
      <div className="flex gap-3">
        <button 
          onClick={() => setActiveModal('SNN')} 
          className="flex-1 bg-transparent text-[#8fa0a6] font-bold text-sm flex items-center justify-between hover:text-white transition-colors"
        >
          <span>SNN</span>
          <span className="bg-white text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">4</span>
        </button>
        <button 
          onClick={() => setActiveModal('DOCS')} 
          className="flex-1 bg-transparent text-[#8fa0a6] font-bold text-sm flex items-center justify-between hover:text-white transition-colors pl-2 border-l border-[#333]"
        >
          <span>DOCS</span>
          <span className="bg-white text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">23</span>
        </button>
      </div>

      {/* 🌟 3. Crew 列表卡片 */}
      <div className="bg-[#1E1E1E] rounded-xl p-4 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-[1.1rem] font-bold text-white">Crew</h2>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[0.85rem]">
          {/* Flight Deck */}
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="text-[#C6FF00] text-xs">✓</span>
              <span>SCOTT HILHORST</span>
            </div>
            <span className="text-[#8fa0a6] text-xs">T-CN</span>
          </div>
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="text-[#C6FF00] text-xs">✓</span>
              <span>JOSEPH LEE</span>
            </div>
            <span className="text-[#8fa0a6] text-xs">T-FO</span>
          </div>

          <div className="w-full border-t border-[#333] my-2"></div>

          {/* Cabin Crew (只 Render 第一個做代表) */}
          <div className="flex justify-between items-center text-[#8fa0a6]">
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem]">⊗</span>
              <span>AI LING LIM</span>
            </div>
            <span className="text-xs">U-IM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
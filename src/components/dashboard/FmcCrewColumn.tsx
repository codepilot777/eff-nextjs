"use client";

export default function FmcCrewColumn({ flightData, calc, setActiveModal }: { flightData: any, calc: any, setActiveModal: any }) {
  
  // 模擬從 SimBrief 提取嘅 MRA (Minimum Route Altitude)
  const tripMra = "147";
  const edgMra = "159";

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden font-sans text-white w-full max-w-[280px]">
      
      {/* 🌟 1. FMC & ATS 卡片 (flex-[2] 霸佔主要空間) */}
      <div 
        onClick={() => setActiveModal('FMS')}
        className="bg-[#1E1E1E] rounded-xl p-3 flex flex-col flex-[2] min-h-0 cursor-pointer hover:bg-[#252525] transition-colors relative"
      >
        <div className="flex justify-between items-center mb-1 shrink-0">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">FMC & ATS</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>

        {/* 🌟 關鍵改動：使用 content-between 代替 content-start，令 10 行 Data 完美散開 */}
        <div className="grid grid-cols-2 gap-x-2 content-between min-h-0 flex-1 pt-1 pb-1">
          
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Aircraft Type</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.acType}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Reg</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.reg}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Drag/F-F Factor</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.dragFf}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">MEL/CDL Pen</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.melCdl}</span>
          </div>

          <div className="flex flex-col col-span-1 pr-2">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">FMS Route</span>
            <span className="font-mono text-[0.8rem] text-white truncate w-full block leading-none">{calc.shortRoute}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Total Distance</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.totalDist}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">TOC</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.cruiseAlt.replace('F', '')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">TOC Temp</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.tocTemp}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Cruise Schedule</span>
            <span className="font-mono text-[0.8rem] leading-none">CI {calc.costIndex}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">EDTO Flight</span>
            <span className="font-mono text-[0.8rem] leading-none">--</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Reserve</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.ofpRes.toFixed(1)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Min Divert Fuel</span>
            <span className="font-mono text-[0.8rem] leading-none">{flightData?.arr_icao === 'RJBB' ? 'RJGG' : 'ALTN'} 8.5</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Avg Wind</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.avgWind}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Avg Trip (kg/gnm)</span>
            <span className="font-mono text-[0.8rem] leading-none">16.9</span>
          </div>

          {/* MRA 黃色牌仔 */}
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Highest Trip MRA</span>
            <div className="bg-[#FFD600] text-black text-[0.7rem] font-black px-1 rounded w-max flex items-center gap-1 shadow-sm leading-tight">
              <span className="text-[0.45rem]">▲</span> {tripMra}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">EDG MRA</span>
            <div className="bg-[#FFD600] text-black text-[0.7rem] font-black px-1 rounded w-max flex items-center gap-1 shadow-sm leading-tight">
              <span className="text-[0.45rem]">▲</span> {edgMra}
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Dep Rwy</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.depRwy}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">Arr Rwy</span>
            <span className="font-mono text-[0.8rem] leading-none truncate w-full block">06L RNAV CA...</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">SID</span>
            <span className="font-mono text-[0.8rem] leading-none">{calc.sid}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-wide leading-tight mb-0.5">STAR</span>
            <span className="font-mono text-[0.8rem] leading-none">NIXOVA</span>
          </div>
        </div>
      </div>
      
      {/* 🌟 2. SNN & DOCS 按鈕 (shrink-0 鎖定高度) */}
      <div className="flex gap-2 shrink-0">
        <button 
          onClick={() => setActiveModal('SNN')} 
          className="flex-1 bg-transparent border border-[#333] rounded-lg py-1.5 px-3 text-[#8fa0a6] font-bold text-[0.8rem] flex items-center justify-between hover:text-white hover:bg-[#1E1E1E] transition-colors"
        >
          <span>SNN</span>
          <span className="bg-white text-black text-[0.65rem] font-black w-5 h-5 rounded-full flex items-center justify-center">4</span>
        </button>
        <button 
          onClick={() => setActiveModal('DOCS')} 
          className="flex-1 bg-transparent border border-[#333] rounded-lg py-1.5 px-3 text-[#8fa0a6] font-bold text-[0.8rem] flex items-center justify-between hover:text-white hover:bg-[#1E1E1E] transition-colors"
        >
          <span>DOCS</span>
          <span className="bg-white text-black text-[0.65rem] font-black w-5 h-5 rounded-full flex items-center justify-center">23</span>
        </button>
      </div>

      {/* 🌟 3. Crew 列表卡片 (flex-[0.8]) */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 flex-[0.8] flex flex-col min-h-0 overflow-hidden">
        <div className="flex justify-between items-center mb-1 shrink-0">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">Crew</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>
        
        {/* 🌟 關鍵改動：用 justify-between 取代 space-y-2 */}
        <div className="flex-1 flex flex-col justify-between font-mono text-[0.8rem] pr-1 py-1">
          <div className="flex justify-between items-center text-white leading-none">
            <div className="flex items-center gap-2">
              <span className="text-[#C6FF00] text-[0.65rem]">✓</span>
              <span>SCOTT HILHORST</span>
            </div>
            <span className="text-[#8fa0a6] text-[0.7rem]">T-CN</span>
          </div>
          <div className="flex justify-between items-center text-white leading-none">
            <div className="flex items-center gap-2">
              <span className="text-[#C6FF00] text-[0.65rem]">✓</span>
              <span>JOSEPH LEE</span>
            </div>
            <span className="text-[#8fa0a6] text-[0.7rem]">T-FO</span>
          </div>

          {/* 橫線亦會平均分佈 */}
          <div className="w-full border-t border-[#333]"></div>

          <div className="flex justify-between items-center text-[#8fa0a6] leading-none">
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem]">⊗</span>
              <span>AI LING LIM</span>
            </div>
            <span className="text-[0.7rem]">U-IM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
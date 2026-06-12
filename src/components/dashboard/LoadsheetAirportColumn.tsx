"use client";

export default function LoadsheetAirportColumn({ flightData, calc, setActiveModal }: { flightData: any, calc: any, setActiveModal: any }) {
  
  // 模擬 Last Updated 時間
  const lastUpdated = flightData?.sta_z?.replace('Z', 'z') || "0323z"; // 僅作模擬
  
  // 決定綠色 Badge 內顯示的 ZFW
  const displayZfw = calc.actualZfw > 0 ? calc.actualZfw.toFixed(1) : calc.ofpZfw.toFixed(1);

  // 飛機浮水印 SVG
  const planeWatermark = (
    <svg className="absolute bottom-2 left-2 w-16 h-16 text-[#333] opacity-50 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="flex-[4] flex flex-col gap-3 h-full overflow-hidden text-white font-sans w-full max-w-[320px]">
      
      {/* 🌟 1. Loadsheet 卡片 */}
      <div 
        onClick={() => setActiveModal('Loadsheet')}
        className="bg-[#1E1E1E] rounded-xl p-4 cursor-pointer hover:bg-[#252525] transition-colors relative"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[1.1rem] font-bold text-white">Loadsheet</h2>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>
        
        <div className="flex justify-between items-end mb-2 border-b border-[#333] pb-1">
           <div className="flex gap-4">
              <span className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-wide">Weight</span>
              <span className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-wide">Total</span>
           </div>
           <span className="text-[0.65rem] text-[#8fa0a6]">Last Updated <span className="text-white font-mono">{lastUpdated}</span></span>
        </div>

        <div className="flex items-center text-sm font-mono mb-2">
          <span className="text-[#8fa0a6] font-sans text-xs w-10">Crew</span>
          <span className="text-[#8fa0a6] w-12 text-right">--</span>
          <span className="ml-4 font-bold">15</span>
          <span className="ml-4 text-xs">FD{flightData?.crew_fd || 2} C{flightData?.crew_cc || 13}</span>
        </div>

        <div className="flex items-center text-sm font-mono mb-4">
          <span className="text-[#8fa0a6] font-sans text-xs w-10">Pax</span>
          <span className="text-[#8fa0a6] w-12 text-right">--</span>
          <span className="ml-4 font-bold">{calc.paxTot}</span>
          <span className="ml-4 text-[0.65rem]">F0 J42 W0 Y{calc.paxTot > 42 ? calc.paxTot - 42 : 0}</span>
        </div>

        {/* 🌟 螢光綠 Banner */}
        <div className="bg-[#C6FF00] rounded-lg px-3 py-1.5 flex justify-between items-center text-black shadow-md mt-2">
          <div className="font-bold flex items-center gap-2">
            <span className="text-xs">ZFW</span>
            <span className="text-base font-black">{displayZfw}<span className="text-[0.6rem] font-bold ml-px">T</span></span>
            <span className="flex items-center gap-1 text-sm ml-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>
              <span className="font-black text-sm">{calc.paxTot}</span>
            </span>
          </div>
          <div className="text-xs font-bold">
            {flightData?.final_ls_sent ? 'Ack. FINAL 01' : 'Pending...'}
          </div>
        </div>
      </div>
      
      {/* 🌟 2. NOTOC 卡片 */}
      <div className="bg-[#1E1E1E] rounded-xl p-4 relative overflow-hidden flex-shrink-0">
        {planeWatermark}
        <div className="flex justify-between items-center mb-3 relative z-10">
          <h2 className="text-[1.1rem] font-bold text-white">NOTOC</h2>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-[0.65rem] relative z-10">
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] uppercase tracking-wide">DG Types</span>
            <span className="text-xl font-bold text-white mt-1">2</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] uppercase tracking-wide">Crew Actions</span>
            <span className="text-lg font-bold text-white mt-1">--</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8fa0a6] uppercase tracking-wide">Crew Notes</span>
            <span className="text-sm font-bold text-white mt-1">ELI</span>
          </div>
        </div>
      </div>
      
      {/* 🌟 3. Airport 卡片 */}
      <div 
        onClick={() => setActiveModal('Airports')}
        className="bg-[#1E1E1E] rounded-xl p-4 flex-1 flex flex-col cursor-pointer hover:bg-[#252525] transition-colors overflow-hidden relative"
      >
        <div className="flex justify-between items-center mb-2 shrink-0">
          <h2 className="text-[1.1rem] font-bold text-white">Airport</h2>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>

        <div className="flex items-center gap-4 mb-2 shrink-0">
          <div className="text-white font-bold text-xl">{calc.arrIcao}</div>
          <div className="flex flex-col">
            <span className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-wide">EFOB</span>
            <span className="font-bold text-sm">11.2<span className="text-[0.6rem] font-bold text-[#8fa0a6]">T</span></span>
          </div>
          <div className="flex flex-col ml-auto">
            <span className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-wide">Hold</span>
            <span className="font-bold text-sm text-right">--</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-wide">Time</span>
            <span className="font-bold text-sm text-right">--</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-wide">ETA</span>
            <span className="font-mono text-xs text-right">--z</span>
          </div>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] text-[0.6rem] text-[#8fa0a6] uppercase tracking-wider border-b border-[#333] pb-1 shrink-0 ml-4">
          <div>ALTN</div>
          <div className="text-right">MDF</div>
          <div className="text-right">Hold</div>
          <div className="text-right">Time</div>
          <div className="text-right">ETA</div>
        </div>
        
        {/* ALTN List with Timeline Nodes */}
        <div className="flex-1 overflow-y-auto mt-2 pr-1 relative">
           {/* Timeline vertical line */}
           <div className="absolute left-[3px] top-2 bottom-4 w-px bg-[#444]"></div>

          {calc.altnList.map((altn: any, index: number) => {
            const isSelected = altn.icao === calc.selectedAltn;
            
            // 模擬一些 Hold / Time 數據
            const holdT = (altn.burn * 0.3).toFixed(1);
            const timeMins = altn.time;
            const etaZ = "07" + (27 + index * 13).toString() + "z";

            return (
              <div key={index} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] items-center text-xs py-1.5 relative">
                {/* Timeline Node */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 ${isSelected ? 'border-white bg-white' : 'border-[#666] bg-[#1E1E1E]'}`}></div>

                <div className={`pl-4 font-bold font-sans ${isSelected ? "text-white" : "text-[#8fa0a6]"}`}>
                  {altn.icao}
                </div>
                <div className={`text-right font-mono ${isSelected ? "text-white font-bold" : "text-[#8fa0a6]"}`}>
                  {altn.burn.toFixed(1)}<span className="text-[0.6rem]">T</span>
                </div>
                <div className="text-right font-mono text-[#8fa0a6]">
                  {holdT}<span className="text-[0.6rem]">T</span>
                </div>
                <div className="text-right font-mono text-[#8fa0a6]">
                  {timeMins}
                </div>
                <div className="text-right font-mono text-white text-[0.7rem]">
                  {etaZ}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex justify-between text-[0.65rem] text-[#8fa0a6] mt-2 pt-2 border-t border-[#333] shrink-0">
          <span>Critical Points</span>
          <span>Margin</span>
        </div>
      </div>
    </div>
  );
}
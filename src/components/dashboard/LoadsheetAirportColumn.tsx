"use client";

export default function LoadsheetAirportColumn({ flightData, calc, setActiveModal }: { flightData: any, calc: any, setActiveModal: any }) {
  return (
    <div className="flex-[4] flex flex-col gap-2 h-full overflow-hidden">
      <div 
        onClick={() => setActiveModal('Loadsheet')}
        className={`bg-[#2a2a2a] border ${calc.isLsActive ? 'border-[#00bfa5]' : 'border-[#333333]'} rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">Loadsheet</h3>
          <span className="text-[#34495e] text-xs">🔍</span>
        </div>
        
        {/* 1. Crew 搬到第一位 */}
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#8fa0a6]">Crew</span>
          <span className="text-white font-bold">FD {flightData?.crew_fd || 2} C {flightData?.crew_cc || 14}</span>
        </div>
        
        {/* 2. Pax 緊隨其後 (Cargo 已移除) */}
        <div className="flex justify-between text-xs mb-1 mt-2">
          <span className="text-[#8fa0a6]">Pax</span>
          <span className="text-white font-bold">{calc.paxTot}</span>
        </div>
        <div className="flex justify-end text-[0.65rem] text-[#00E676] mb-1">
          F{flightData?.pax_f||0} J{flightData?.pax_j||0} W{flightData?.pax_w||0} Y{flightData?.pax_y||0}
        </div>
        
        {calc.lsStageHtml}
      </div>
      
      <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3">
        <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">NOTOC</h3>
        <div className="border border-dashed border-[#00E676] text-[#00E676] text-center font-bold py-1 rounded text-xs">NIL</div>
      </div>
      
      <div 
        onClick={() => setActiveModal('Airports')}
        className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 flex-1 flex flex-col hover:border-[#00bfa5] transition-colors cursor-pointer overflow-hidden"
      >
        <div className="flex justify-between items-center mb-2 shrink-0">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">Airport Info</h3>
          <span className="text-[#34495e] text-xs">🔍</span>
        </div>
        <div className="text-[#00E676] font-bold text-lg mb-2 shrink-0">{calc.arrIcao}</div>
        
        <div className="flex justify-between text-[0.65rem] text-[#8fa0a6] border-b border-[#333] pb-1 shrink-0">
          <span>ALTN</span><span>MDF</span><span>TIME</span>
        </div>
        
        {/* 3. 顯示所有 ALTN (加入 Scroll 預防太多 ALTN 爆版) */}
        <div className="flex-1 overflow-y-auto mt-1 pr-1">
          {calc.altnList.map((altn: any, index: number) => {
            // 判斷是否為目前 Fuel Section 選擇的 ALTN
            const isSelected = altn.icao === calc.selectedAltn;
            
            return (
              <div key={index} className="flex justify-between text-xs py-1 border-b border-[#333333]/50 last:border-0">
                <span className={isSelected ? "text-[#00bfa5] font-bold" : "text-white"}>
                  {isSelected && <span className="mr-1">▶</span>}
                  {altn.icao}
                </span>
                <span className={isSelected ? "text-[#00bfa5] font-bold" : "text-white"}>
                  {altn.burn.toFixed(1)}
                </span>
                <span className="text-[#FF9100]">
                  -{altn.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
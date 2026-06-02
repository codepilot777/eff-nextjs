"use client";

export default function RefuelAircraftColumn({ flightData, updateFlightData, calc, setActiveModal }: { flightData: any, updateFlightData: any, calc: any, setActiveModal: any }) {
  
  // 1. 判斷是否處於 Standby Fuel 階段
  const isStandbyFuel = !flightData?.final_fuel_accepted;

  // 2. 預備讀取 TechLog Database 的 Defects 邏輯
  const defects = flightData?.defects || [];
  const paddCount = defects.filter((d: any) => d.type === 'PADD' || d.category === 'PADD').length;
  const saddCount = defects.filter((d: any) => d.type === 'SADD' || d.category === 'SADD').length;
  const addCount = defects.filter((d: any) => d.type === 'ADD' || d.category === 'ADD').length;
  const defectsStr = `P${paddCount}/S${saddCount}/A${addCount}`;

  return (
    <div className="flex-[3] flex flex-col gap-2 h-full overflow-hidden">
      
      {/* ⛽ Refueling 區塊 */}
      <div 
        onClick={() => { if (!isStandbyFuel) setActiveModal('Refuelling'); }}
        className={`bg-lido-800 border border-[#333333] rounded-lg p-3 transition-colors ${!isStandbyFuel ? 'hover:border-[#00bfa5] cursor-pointer' : 'cursor-default opacity-90'}`}
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-text-muted text-[0.7rem] font-bold uppercase">Refueling</h3>
          {!isStandbyFuel && <span className="text-[#34495e] text-xs">🔍</span>}
        </div>
        {calc.refuelHtml}
      </div>
      
      {/* ✈️ Aircraft 區塊 */}
      <div className="bg-lido-800 border border-[#333333] rounded-lg p-3 flex-1 flex flex-col">
        <h3 className="text-text-muted text-[0.7rem] font-bold uppercase mb-2">Aircraft</h3>
        {calc.acStatus}
        <div className="flex justify-between text-xs mt-2 border-b border-dashed border-[#404040] pb-2">
          <div>
            <span className="text-text-muted block text-[0.65rem]">Bay</span>
            <span className="text-white font-bold">{flightData?.bay_no || '45'}</span>
          </div>
          <div className="text-right">
            <span className="text-text-muted block text-[0.65rem]">Defects</span>
            {/* 顯示動態計算的 P/S/A 數量 */}
            <span className="text-[#00E676] font-bold tracking-wider">{defectsStr}</span>
          </div>
        </div>
        
        {/* Trainee 手動輸入 Log Fuel */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-text-muted text-xs">Log Fuel T</span>
          <input 
            type="number" step="0.1" 
            defaultValue={flightData?.trainee_log_fuel || ''} 
            onBlur={(e) => updateFlightData({ trainee_log_fuel: parseFloat(e.target.value) || 0.0 })}
            key={`logfuel-${flightData?.trainee_log_fuel}`}
            className="bg-[#1a1a1a] border border-[#404040] text-[#FF9100] text-right text-xs font-bold rounded px-1 py-1 outline-none w-16 focus:border-[#00bfa5] transition-colors"
          />
        </div>
      </div>
      
      {/* 🔋 Efficiency & OTP 區塊 (上下分開顯示) */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="bg-lido-800 border border-[#333333] rounded-lg p-2.5 flex justify-between items-center">
          <span className="text-text-muted text-[0.65rem] font-bold uppercase">Efficiency</span>
          <span className="text-[#00E676] text-[0.75rem] font-bold">{calc.costIndex}</span>
        </div>
        <div className="bg-lido-800 border border-[#333333] rounded-lg p-2.5 flex justify-between items-center">
          <span className="text-text-muted text-[0.65rem] font-bold uppercase">OTP</span>
          <span className="bg-[#00E676]/15 text-[#00E676] text-[0.65rem] font-bold px-2 py-0.5 rounded">ON TIME</span>
        </div>
      </div>

    </div>
  );
}
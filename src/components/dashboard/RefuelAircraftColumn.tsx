"use client";

export default function RefuelAircraftColumn({ flightData, updateFlightData, calc, setActiveModal }: { flightData: any, updateFlightData: any, calc: any, setActiveModal: any }) {
  return (
    <div className="flex-[3] flex flex-col gap-2 h-full overflow-hidden">
      
      {/* ⛽ Refueling 區塊 */}
      <div 
        onClick={() => setActiveModal('Refuelling')}
        className="bg-lido-800 border border-[#333333] rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer"
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-text-muted text-[0.7rem] font-bold uppercase">Refueling</h3>
          <span className="text-[#34495e] text-xs">🔍</span>
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
            <span className="text-white font-bold">{(flightData?.defects || []).length > 0 ? 'ADD' : 'NIL'}</span>
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
            className="bg-[#1a222a] border border-[#00bfa5] text-[#FF9100] text-right text-xs font-bold rounded px-1 py-1 outline-none w-16"
          />
        </div>
      </div>
      
      {/* 🔋 Efficiency & OTP 區塊 */}
      <div className="bg-lido-800 border border-[#333333] rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-muted text-[0.7rem] font-bold uppercase">Efficient</span>
          <span className="text-[#00E676] text-xs font-bold">{calc.costIndex}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-muted text-[0.7rem] font-bold uppercase">OTP</span>
          <span className="bg-[#00E676]/15 text-[#00E676] text-[0.65rem] font-bold px-2 py-0.5 rounded">ON TIME</span>
        </div>
      </div>

    </div>
  );
}
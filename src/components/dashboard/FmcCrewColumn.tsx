"use client";

export default function FmcCrewColumn({ flightData, calc, setActiveModal }: { flightData: any, calc: any, setActiveModal: any }) {
  return (
    <div className="flex-[3] flex flex-col gap-2 h-full overflow-hidden">
      <div 
        onClick={() => setActiveModal('FMS')}
        className="bg-lido-800 border border-[#333333] rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-text-muted text-[0.7rem] font-bold uppercase">FMC & ATS</h3>
          <span className="text-[#34495e] text-xs">🔍</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[0.65rem]">
          <div><span className="text-text-muted block">Aircraft Type</span><span className="font-bold text-text-main">{calc.acType}</span></div>
          <div><span className="text-text-muted block">Reg</span><span className="font-bold text-text-main">{calc.reg}</span></div>
          
          <div><span className="text-text-muted block">Drag/F-F Factor</span><span className="font-bold text-text-main">{calc.dragFf}</span></div>
          <div><span className="text-text-muted block">MEL/CDL Pen</span><span className="font-bold text-text-main">{calc.melCdl}</span></div>

          <div className="pr-1"><span className="text-text-muted block">FMS Route</span><span className="font-bold text-[#00E676] truncate block w-full">{calc.shortRoute}</span></div>
          <div><span className="text-text-muted block">Total Distance</span><span className="font-bold text-text-main">{calc.totalDist} NM</span></div>

          <div><span className="text-text-muted block">TOC</span><span className="font-bold text-text-main">{calc.cruiseAlt}</span></div>
          <div><span className="text-text-muted block">TOC Temp</span><span className="font-bold text-text-main">{calc.tocTemp}</span></div>

          <div><span className="text-text-muted block">Cost Index</span><span className="font-bold text-text-main">{calc.costIndex}</span></div>
          <div><span className="text-text-muted block">EDTO Flight</span><span className="font-bold text-text-main">{calc.edtoFlight}</span></div>

          <div><span className="text-text-muted block">Reserve</span><span className="font-bold text-text-main">{calc.ofpRes.toFixed(1)} T</span></div>
          <div><span className="text-text-muted block">Min Divert Fuel</span><span className="font-bold text-text-main">{calc.minDivert}</span></div>

          <div><span className="text-text-muted block">Avg Wind</span><span className="font-bold text-text-main">{calc.avgWind}</span></div>
          <div><span className="text-text-muted block">Avg Trip (kg/gnm)</span><span className="font-bold text-text-main">{calc.avgTrip}</span></div>

          <div><span className="text-text-muted block">Highest Trip MRA</span><span className="font-bold text-text-main">{calc.mraHigh}</span></div>
          <div><span className="text-text-muted block">EDG MRA</span><span className="font-bold text-text-main">{calc.mraEdg}</span></div>

          <div><span className="text-text-muted block">Dep Rwy</span><span className="font-bold text-text-main">{calc.depRwy}</span></div>
          <div><span className="text-text-muted block">Arr Rwy</span><span className="font-bold text-text-main">{calc.arrRwy}</span></div>

          <div><span className="text-text-muted block">SID</span><span className="font-bold text-[#FF9100]">{calc.sid}</span></div>
          <div><span className="text-text-muted block">STAR</span><span className="font-bold text-[#FF9100]">{calc.star}</span></div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveModal('SNN')} 
          className="flex-1 bg-lido-800 border border-[#404040] text-white py-2 rounded-lg hover:border-[#00bfa5] hover:text-status-teal font-bold text-xs transition-all"
        >
          📝 SNN
        </button>
        <button 
          onClick={() => setActiveModal('DOCS')} 
          className="flex-1 bg-lido-800 border border-[#404040] text-white py-2 rounded-lg hover:border-[#00bfa5] hover:text-status-teal font-bold text-xs transition-all"
        >
          📁 DOCS
        </button>
      </div>

      <div className="bg-lido-800 border border-[#333333] rounded-lg p-3 flex-1 flex flex-col justify-center">
        <h3 className="text-text-muted text-[0.7rem] font-bold uppercase mb-2">Crew</h3>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Flight Deck</span><span className="text-[#00E676] font-bold">FD {flightData?.crew_fd || 2}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-text-muted">Cabin Crew</span><span className="text-[#00E676] font-bold">C {flightData?.crew_cc || 14}</span>
        </div>
      </div>
    </div>
  );
}
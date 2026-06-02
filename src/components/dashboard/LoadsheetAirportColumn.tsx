"use client";

export default function LoadsheetAirportColumn({ flightData, calc, setActiveModal }: { flightData: any, calc: any, setActiveModal: any }) {
  return (
    <div className="flex-[4] flex flex-col gap-2 h-full overflow-hidden">
      <div 
        onClick={() => setActiveModal('Loadsheet')}
        className={`bg-lido-800 border ${calc.isLsActive ? 'border-[#00bfa5]' : 'border-[#333333]'} rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-text-muted text-[0.7rem] font-bold uppercase">Loadsheet</h3>
          <span className="text-[#34495e] text-xs">🔍</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-muted">Pax</span><span className="text-white font-bold">{calc.paxTot}</span>
        </div>
        <div className="flex justify-end text-[0.65rem] text-[#00E676] mb-1">
          F{flightData?.pax_f||0} J{flightData?.pax_j||0} W{flightData?.pax_w||0} Y{flightData?.pax_y||0}
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-muted">Crew</span><span className="text-white font-bold">FD {flightData?.crew_fd || 2} C {flightData?.crew_cc || 14}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-muted">Cargo</span><span className="text-white font-bold">
            {(calc.cgo_total) / 1000} T
          </span>
        </div>
        {calc.lsStageHtml}
      </div>
      
      <div className="bg-lido-800 border border-[#333333] rounded-lg p-3">
        <h3 className="text-text-muted text-[0.7rem] font-bold uppercase mb-2">NOTOC</h3>
        <div className="border border-dashed border-[#00E676] text-[#00E676] text-center font-bold py-1 rounded text-xs">NIL</div>
      </div>
      
      <div 
        onClick={() => setActiveModal('Airports')}
        className="bg-lido-800 border border-[#333333] rounded-lg p-3 flex-1 flex flex-col hover:border-[#00bfa5] transition-colors cursor-pointer"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-text-muted text-[0.7rem] font-bold uppercase">Airport Info</h3>
          <span className="text-[#34495e] text-xs">🔍</span>
        </div>
        <div className="text-[#00E676] font-bold text-lg mb-2">{calc.arrIcao}</div>
        <div className="flex justify-between text-[0.65rem] text-text-muted border-b border-[#333] pb-1">
          <span>ALTN</span><span>MDF</span><span>TIME</span>
        </div>
        <div className="flex justify-between text-xs pt-1">
          <span className="text-white">{calc.selectedAltn}</span>
          <span className="text-white">{calc.currAltnOfp.toFixed(1)}</span>
          <span className="text-[#FF9100]">-{flightData?.alternates?.[0]?.time || 30}</span>
        </div>
      </div>
    </div>
  );
}
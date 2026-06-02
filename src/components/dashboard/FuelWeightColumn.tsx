"use client";

export default function FuelWeightColumn({ flightData, updateFlightData, calc, handlers }: { flightData: any, updateFlightData: any, calc: any, handlers: any }) {
  
  const Row = ({ label, ofp, rev, isInput, field, isBold, color = "#e2e8f0" }: any) => (
    <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#333333]">
      <div className={`text-xs ${isBold ? 'font-bold text-[#00E676]' : `text-[${color}]`}`}>{label}</div>
      <div className="text-xs text-right text-text-muted">{ofp.toFixed(1)}</div>
      <div className="text-xs text-right font-bold">{handlers.diffStr(rev, ofp)}</div>
      <div className="text-right">
        {isInput && calc.isManual ? (
          <input 
            type="number" step="0.1" 
            defaultValue={rev || ''} 
            onBlur={(e) => handlers.handleFuelInput(field, e.target.value)}
            key={`${field}-${rev}`}
            className="w-full bg-[#404040] text-white text-right text-xs font-bold rounded px-1 py-0.5 outline-none border border-[#606060] focus:border-status-teal" 
          />
        ) : (
          <span className={`text-xs font-bold ${calc.showRevVal ? (Math.abs(rev - ofp) > 0.05 ? 'text-[#FF9100]' : 'text-white') : 'text-transparent'}`}>{rev.toFixed(1)}</span>
        )}
      </div>
      <div></div>
    </div>
  );

  return (
    <div className="flex-[4] flex flex-col h-full overflow-hidden">
      <div className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 h-full flex flex-col">
        
        <div className="flex justify-between items-center mb-2 shrink-0">
          <h3 className="text-text-muted text-[0.75rem] font-bold uppercase">Fuel & Weight</h3>
          
          {/* 🌟 全新 Toggle Switch 介面 */}
          <div className="flex items-center gap-2">
            <span className={`text-[0.65rem] font-bold ${!calc.isManual ? 'text-status-green' : 'text-[#606060]'}`}>AUTO</span>
            <div 
              onClick={handlers.handleManualToggle}
              className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${calc.isManual ? 'bg-status-orange' : 'bg-[#404040]'}`}
            >
              <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${calc.isManual ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className={`text-[0.65rem] font-bold ${calc.isManual ? 'text-status-orange' : 'text-[#606060]'}`}>MANUAL</span>
          </div>
        </div>

        {calc.showRevVal && !flightData?.final_fuel_accepted ? (
          <button onClick={handlers.handleAcceptFuel} className="bg-[#FF9100] text-black w-full py-1.5 rounded text-sm font-black mb-2 shrink-0 shadow-[0_2px_8px_rgba(255,145,0,0.4)] animate-pulse">
            PENDING FINAL FUEL {calc.currTotal.toFixed(1)}T
          </button>
        ) : calc.showRevVal && flightData?.final_fuel_accepted ? (
          <div className="bg-[#00E676] text-black w-full py-1.5 rounded text-sm font-black mb-2 shrink-0 text-center shadow-[0_2px_8px_rgba(0,230,118,0.4)]">
            FINAL FUEL {calc.currTotal.toFixed(1)}T
          </div>
        ) : null}

        <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 text-[0.65rem] text-text-muted uppercase border-b border-[#404040] pb-1 mb-1 shrink-0">
          <div>Category</div><div className="text-right">OFP</div><div className="text-right">Diff</div><div className="text-right">{calc.showRevVal ? 'Revised' : ''}</div><div></div>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 text-sm mt-1">
          {/* 🌟 Taxi 搬到最上面 */}
          {Row({ label: "Taxi", ofp: calc.ofpTaxi, rev: calc.currTaxi, isInput: true, field: 'taxi' })}
          {Row({ label: "Trip Fuel", ofp: calc.ofpTrip, rev: calc.currTrip, isInput: true, field: 'trip' })}
          {Row({ label: "Cont", ofp: calc.ofpCont, rev: calc.currCont, isInput: true, field: 'cont' })}
          {Row({ label: "Dest Hold", ofp: 0.0, rev: 0.0 })}
          {Row({ label: "Additional", ofp: 0.0, rev: 0.0 })}

          {/* ALTN Dropdown */}
          <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#333333]">
            <div className="text-xs text-status-teal font-bold flex items-center justify-between pr-2">
              <span>ALTN</span>
              <select 
                value={calc.selectedAltn}
                onChange={(e) => updateFlightData({ selected_altn: e.target.value, final_fuel_accepted: false })}
                className="bg-[#1a1a1a] border border-[#404040] text-status-orange rounded text-[0.65rem] outline-none px-1 py-0.5 w-[50px] cursor-pointer"
              >
                {calc.altnOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            {/* 🌟 OFP Column 會直接顯示 Dropdown 所選的油量 */}
            <div className="text-xs text-right text-text-muted">{calc.baseAltnOfp.toFixed(1)}</div>
            <div className="text-xs text-right font-bold">{handlers.diffStr(calc.currAltnOfp, calc.baseAltnOfp)}</div>
            <div className="text-right text-xs font-bold">{calc.showRevVal ? <span className={Math.abs(calc.currAltnOfp - calc.baseAltnOfp) > 0.05 ? 'text-[#FF9100]' : 'text-white'}>{calc.currAltnOfp.toFixed(1)}</span> : ''}</div>
            <div></div>
          </div>

          {Row({ label: "Reserve", ofp: calc.ofpRes, rev: calc.ofpRes })}
          {Row({ label: "Fuel Reqd", ofp: calc.ofpReqdBase, rev: calc.currReqdBase, isBold: true })}
          
          {Row({ label: "Tankering", ofp: 0.0, rev: calc.currTank, isInput: true, field: 'tankering' })}
          {Row({ label: "Extra", ofp: 0.0, rev: calc.currExtra, isInput: true, field: 'extra' })}
          {/* Taxi 已經搬走，直接顯示 Total */}
          {Row({ label: "Total Fuel", ofp: calc.ofpTotal, rev: calc.currTotal, isInput: true, field: 'total', isBold: true })}

          <div className="flex-[0.5] flex items-center justify-center text-[0.6rem] text-text-muted">Margin</div>

          {/* ZFW */}
          <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#333333]">
            <div className="text-xs text-text-main">ZFW</div>
            <div className="text-xs text-right text-text-muted">{calc.ofpZfw.toFixed(1)}</div>
            <div className="text-xs text-right font-bold">{handlers.diffStr(calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw, calc.ofpZfw)}</div>
            <div className="text-right">
              <input 
                type="number" step="0.1" placeholder="Tons"
                defaultValue={calc.actualZfw || ''} 
                onBlur={(e) => handlers.handleZfwInput(e.target.value)}
                key={`zfw-${calc.actualZfw}`}
                className="w-full bg-[#1a1a1a] border border-status-teal text-status-orange text-right text-xs font-bold rounded px-1 py-0.5 outline-none focus:border-white"
              />
            </div>
            <div></div>
          </div>

          {Row({ label: "TOW", ofp: flightData?.weight_tow_ofp || 0, rev: calc.currTow })}
          
          {/* LW */}
          <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center">
            <div className="text-xs text-text-main">LW</div>
            <div className="text-xs text-right text-text-muted">{flightData?.weight_lw_ofp?.toFixed(1) || '0.0'}</div>
            <div className="text-xs text-right font-bold">{handlers.diffStr(calc.currLw, flightData?.weight_lw_ofp || 0)}</div>
            <div className="text-right">
              <span className={`text-xs font-bold ${calc.showRevVal ? (Math.abs(calc.currLw - (flightData?.weight_lw_ofp || 0)) > 0.05 ? 'text-[#FF9100]' : 'text-white') : 'text-transparent'}`}>{calc.currLw.toFixed(1)}</span>
            </div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
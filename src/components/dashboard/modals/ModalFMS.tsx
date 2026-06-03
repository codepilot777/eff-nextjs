"use client";
export function ModalFMS({ calc, flightData }: any) {
  return (
            <div className="flex flex-col md:flex-row gap-8 h-full overflow-hidden">
              <div className="flex-1 flex flex-col shrink-0">
                <div className="text-status-teal font-bold mb-4 border-b border-[#333333] pb-2 text-lg">FMS OPERATION SUMMARY</div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-[0.9rem]">
                  <div><span className="text-text-muted text-xs uppercase block">Aircraft Type</span><span className="font-bold">{calc.acType}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Reg</span><span className="font-bold">{calc.reg}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Drag/F-F Factor</span><span className="font-bold">{calc.dragFf}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">MEL/CDL Pen</span><span className="font-bold">{calc.melCdl}</span></div>
                  <div className="col-span-2"><span className="text-text-muted text-xs uppercase block">FMS Route</span><span className="font-bold text-[#00E676] break-words">{calc.routeStr}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Total Distance</span><span className="font-bold">{calc.totalDist} NM</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">TOC</span><span className="font-bold">{calc.cruiseAlt}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">TOC Temp</span><span className="font-bold">{calc.tocTemp}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Cost Index</span><span className="font-bold">{calc.costIndex}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">EDTO Flight</span><span className="font-bold">{calc.edtoFlight}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Reserve</span><span className="font-bold">{calc.ofpRes.toFixed(1)} T</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Min Divert Fuel</span><span className="font-bold">{calc.minDivert}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Avg Wind</span><span className="font-bold">{calc.avgWind}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Avg Trip (kg/gnm)</span><span className="font-bold">{calc.avgTrip}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Highest Trip MRA</span><span className="font-bold">{calc.mraHigh}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">EDG MRA</span><span className="font-bold">{calc.mraEdg}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Dep Rwy</span><span className="font-bold">{calc.depRwy}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">Arr Rwy</span><span className="font-bold">{calc.arrRwy}</span></div>
                  <div><span className="text-text-muted text-xs uppercase block">SID</span><span className="font-bold text-[#FF9100]">{calc.sid}</span></div>
                  <div className="col-span-2"><span className="text-text-muted text-xs uppercase block">STAR</span><span className="font-bold text-[#FF9100]">{calc.star}</span></div>
                </div>
              </div>
              <div className="flex-1 flex flex-col h-full min-h-0">
                <div className="text-status-teal font-bold mb-4 border-b border-[#333333] pb-2 text-lg">ICAO ATS FLIGHT PLAN</div>
                <div className="bg-[#0a0a0a] p-5 rounded-lg border border-[#404040] font-mono text-[0.95rem] text-text-main whitespace-pre-wrap leading-[1.6] flex-1 overflow-y-auto">
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
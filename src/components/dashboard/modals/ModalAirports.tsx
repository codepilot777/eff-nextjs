"use client";
export function ModalAirports({ calc, flightData }: any) {
  return (
            <div className="flex flex-col h-full overflow-hidden w-full max-w-full">
              <div className="bg-[#1e1e1e] rounded-lg border border-[#333] flex-1 overflow-x-auto overflow-y-auto shadow-2xl pb-4">
                <div className="min-w-[1100px]">
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 p-3 text-[0.6rem] text-text-muted font-bold tracking-wider border-b-2 border-black uppercase bg-[#1a1a1a]">
                    <div className="pl-2">Airport Chk</div>
                    <div>Type<br/>Con</div>
                    <div>MDF<br/>Delta</div>
                    <div>MTR</div>
                    <div>Dis</div>
                    <div>FL<br/>MORA</div>
                    <div>Speed<br/>WC</div>
                    <div>Time<br/>ETA</div>
                    <div>Appch<br/>Rwy</div>
                    <div className="text-center">From/Till</div>
                    <div>Ceil Reqd<br/>Ceil Fcst</div>
                    <div>Vis Reqd<br/>Vis Fcst</div>
                    <div>H/T<br/>WC</div>
                    <div>XWC</div>
                  </div>

                  {/* Departure Row (T) */}
                  <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b border-[#333] bg-[#505050] text-text-main text-sm items-center hover:bg-[#5a5a5a] transition-colors">
                    <div className="font-bold text-xl flex items-center pl-2 tracking-wide">
                      {calc.depIcao} 
                      <span className="bg-white text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-2 font-black leading-none shadow-sm">T</span>
                    </div>
                    <div className="text-[0.75rem] leading-tight text-gray-300">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- T<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-300">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- NM<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight">FL --<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-300">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">--<br/><span className="text-white">0000z</span></div>
                    <div className="text-[0.75rem] leading-tight">TKOF HIRL+RCLL<br/><span className="text-white">{calc.depRwy}</span></div>
                    <div className="flex justify-center"><div className="border-[1.5px] border-white px-3 py-1.5 text-center rounded text-[0.75rem] tracking-widest font-mono font-bold bg-[#606060]">0244z/0344z</div></div>
                    <div className="text-[0.75rem] leading-tight">--<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">300<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">T9<br/><span className="text-gray-300">--</span></div>
                    <div className="text-[0.75rem] leading-tight">6<br/><span className="text-gray-300">--</span></div>
                  </div>

                  {/* Arrival Row (L) */}
                  <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b-4 border-black bg-[#404040] text-text-main text-sm items-center hover:bg-[#4a4a4a] transition-colors">
                    <div className="font-bold text-xl flex items-center pl-2 tracking-wide">
                      {calc.arrIcao} 
                      <span className="bg-white text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-2 font-black leading-none shadow-sm">L</span>
                    </div>
                    <div className="text-[0.75rem] leading-tight text-gray-400">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- T<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-400">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">-- NM<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight">FL --<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight text-gray-400">--<br/>--</div>
                    <div className="text-[0.75rem] leading-tight">--<br/><span className="text-white">0648z</span></div>
                    <div className="text-[0.75rem] leading-tight">RNAV CAT1<br/><span className="text-white">{calc.arrRwy}</span></div>
                    <div className="text-center text-[0.75rem] tracking-widest font-mono text-text-muted">0449z/0649z</div>
                    <div className="text-[0.75rem] leading-tight">200<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">550<br/>9999</div>
                    <div className="text-[0.75rem] leading-tight">T3<br/><span className="text-gray-400">--</span></div>
                    <div className="text-[0.75rem] leading-tight">4<br/><span className="text-gray-400">--</span></div>
                  </div>

                  {/* Alternate Rows (A) - Dynamic Mapping */}
                  {calc.altnList.map((alt: any, idx: number) => {
                     // Generating realistic mock numbers based on burn fuel for visual immersion
                     const distMock = Math.floor(alt.burn * 25) + 10;
                     const timeMock = Math.floor(alt.time);
                     return (
                      <div key={idx} className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b border-[#111] bg-[#2a2a2a] text-text-main text-sm items-center hover:bg-[#333] transition-colors">
                        <div className="font-bold text-xl flex items-center pl-2 tracking-wide">
                          <span className="text-[#666] mr-2 text-lg">{'>'}</span>{alt.icao} 
                          <span className="bg-white text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-2 font-black leading-none shadow-sm">A</span>
                        </div>
                        <div className="text-[0.75rem] leading-tight text-gray-500">--<br/>--</div>
                        <div className="text-[0.75rem] leading-tight">{alt.burn.toFixed(1)} T<br/><span className="text-gray-400">{(alt.burn * 0.3).toFixed(1)}</span></div>
                        <div className="text-[0.75rem] leading-tight text-gray-500">--<br/>--</div>
                        <div className="text-[0.75rem] leading-tight">{distMock} NM<br/><span className="text-gray-500">--</span></div>
                        <div className="text-[0.75rem] leading-tight">FL 190<br/><span className="text-gray-400">51</span></div>
                        <div className="text-[0.75rem] leading-tight text-gray-400">--<br/><span className="text-white">20 TWC</span></div>
                        <div className="text-[0.75rem] leading-tight">00{timeMock}<br/><span className="text-white">0727z</span></div>
                        <div className="text-[0.75rem] leading-tight">ILS CAT3B<br/><span className="text-white">36</span></div>
                        <div className="text-center text-[0.75rem] tracking-widest font-mono text-text-muted">0528z/0728z</div>
                        <div className="text-[0.75rem] leading-tight">17<br/>9999</div>
                        <div className="text-[0.75rem] leading-tight">550<br/>9999</div>
                        <div className="text-[0.75rem] leading-tight">H13<br/><span className="text-gray-500">--</span></div>
                        <div className="text-[0.75rem] leading-tight">15<br/><span className="text-gray-500">--</span></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          );
}
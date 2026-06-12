"use client";

export function ModalAirports({ calc, flightData }: any) {
  // 從 SimBrief JSON 中提取原始數據
  const sb = flightData?.raw_simbrief || {};
  const origin = sb.origin || {};
  const dest = sb.destination || {};
  
  // 處理 Alternate 陣列 (防呆設計：確保只有 1 個 ALTN 時都係 Array)
  const alternates = Array.isArray(sb.alternate) ? sb.alternate : (sb.alternate ? [sb.alternate] : []);

  // 時間格式化 (例如：0320Z -> 0320z)
  const stdZ = flightData?.std_z?.replace('Z', 'z') || "--z";
  const staZ = flightData?.sta_z?.replace('Z', 'z') || "--z";

  return (
    <div className="flex flex-col h-full overflow-hidden w-full max-w-full font-sans">
      <div className="bg-[#1E1E1E] rounded-2xl border border-[#333] flex-1 overflow-x-auto overflow-y-auto shadow-2xl pb-4">
        <div className="min-w-[1100px]">
          
          {/* 🌟 Table Header (深色高對比設計) */}
          <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 p-3 text-[0.6rem] text-[#8fa0a6] font-bold tracking-wider border-b border-[#333] uppercase bg-[#0a0a0a] rounded-t-2xl">
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

          {/* 🛫 Departure Row */}
          <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b border-[#333] bg-[#2A2A2A] text-[#e2e8f0] text-sm items-center hover:bg-[#333] transition-colors">
            <div className="font-bold text-xl flex items-center pl-2 tracking-wide text-white">
              {origin.icao_code || calc.depIcao} 
              <span className="bg-[#2979FF] text-white text-[0.65rem] px-1.5 py-0.5 rounded ml-3 font-black leading-none shadow-sm">DEP</span>
            </div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
            <div className="text-[0.75rem] leading-tight text-white">-- T<br/><span className="text-[#8fa0a6]">--</span></div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
            <div className="text-[0.75rem] leading-tight text-white">-- NM<br/><span className="text-[#8fa0a6]">--</span></div>
            <div className="text-[0.75rem] leading-tight font-mono text-white">FL {(sb.general?.initial_altitude / 100)?.toFixed(0) || '--'}<br/><span className="text-[#8fa0a6] font-sans">--</span></div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/><span className="text-white font-mono">{stdZ}</span></div>
            <div className="text-[0.75rem] leading-tight text-white">TKOF<br/><span className="text-[#2979FF] font-bold font-mono text-[0.85rem]">RWY {origin.plan_rwy || calc.depRwy}</span></div>
            <div className="flex justify-center"><div className="border border-[#444] px-3 py-1.5 text-center rounded text-[0.7rem] tracking-widest font-mono font-bold bg-[#1a1a1a] text-[#8fa0a6]">0244z/0344z</div></div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>9999</div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">300<br/>9999</div>
            <div className="text-[0.75rem] leading-tight text-white">T9<br/><span className="text-[#8fa0a6]">--</span></div>
            <div className="text-[0.75rem] leading-tight text-white">6<br/><span className="text-[#8fa0a6]">--</span></div>
          </div>

          {/* 🛬 Arrival Row */}
          <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b-2 border-black bg-[#15201A] text-[#e2e8f0] text-sm items-center hover:bg-[#1A2620] transition-colors">
            <div className="font-bold text-xl flex items-center pl-2 tracking-wide text-white">
              {dest.icao_code || calc.arrIcao} 
              <span className="bg-[#00E676] text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-3 font-black leading-none shadow-sm">ARR</span>
            </div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
            <div className="text-[0.75rem] leading-tight text-[#00E676] font-bold">-- T<br/><span className="text-[#8fa0a6] font-normal">--</span></div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
            <div className="text-[0.75rem] leading-tight text-white font-mono">{sb.general?.route_distance || '--'} NM<br/><span className="text-[#8fa0a6] font-sans">--</span></div>
            <div className="text-[0.75rem] leading-tight text-white font-mono">FL {(sb.general?.initial_altitude / 100)?.toFixed(0) || '--'}<br/><span className="text-[#8fa0a6] font-sans">--</span></div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
            <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/><span className="text-[#00E676] font-bold font-mono">{staZ}</span></div>
            <div className="text-[0.75rem] leading-tight text-white">LDG<br/><span className="text-[#00E676] font-bold font-mono text-[0.85rem]">RWY {dest.plan_rwy || calc.arrRwy}</span></div>
            <div className="flex justify-center"><div className="border border-[#00E676]/30 px-3 py-1.5 text-center rounded text-[0.7rem] tracking-widest font-mono font-bold bg-[#00E676]/10 text-[#00E676]">0449z/0649z</div></div>
            <div className="text-[0.75rem] leading-tight text-white">200<br/>9999</div>
            <div className="text-[0.75rem] leading-tight text-white">550<br/>9999</div>
            <div className="text-[0.75rem] leading-tight text-white">T3<br/><span className="text-[#8fa0a6]">--</span></div>
            <div className="text-[0.75rem] leading-tight text-white">4<br/><span className="text-[#8fa0a6]">--</span></div>
          </div>

          {/* 🔄 Alternate Rows (A) - Dynamic Mapping */}
          {alternates.map((alt: any, idx: number) => {
             // 處理燃料 (將 Kgs 轉為 Tons)
             const burnT = ((parseInt(alt.burn) || 0) / 1000).toFixed(1);
             const dist = alt.distance || "--";
             const fl = alt.cruise_altitude ? (parseInt(alt.cruise_altitude) / 100).toFixed(0) : "--";
             const tas = alt.tas || "--";
             const mtr = alt.track_mag || "--";
             
             // 處理風向 (P = Tailwind, M = Headwind)
             let windStr = "--";
             if (alt.avg_wind_comp) {
                const isTail = alt.avg_wind_comp.startsWith('P');
                const val = parseInt(alt.avg_wind_comp.substring(1));
                windStr = `${val} ${isTail ? 'TWC' : 'HWC'}`;
             }

             // 處理飛行時間 (將 ETE 秒數轉為 00XX 分鐘格式)
             const eteMins = alt.ete ? Math.floor(parseInt(alt.ete) / 60) : 0;
             const timeStr = `00${eteMins}`.slice(-4); 

             const isSelected = alt.icao_code === calc.selectedAltn;

             return (
              <div key={idx} className={`grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 px-3 py-4 border-b border-[#333] text-sm items-center transition-colors ${isSelected ? 'bg-[#FF9100]/10 border-l-4 border-[#FF9100]' : 'bg-[#1E1E1E] border-l-4 border-transparent hover:bg-[#252525]'}`}>
                <div className="font-bold text-xl flex items-center pl-2 tracking-wide text-white">
                  <span className={`${isSelected ? 'text-[#FF9100]' : 'text-[#555]'} mr-2 text-lg leading-none`}>{'>'}</span>
                  {alt.icao_code || alt.icao} 
                  <span className="bg-[#FF9100] text-black text-[0.65rem] px-1.5 py-0.5 rounded ml-3 font-black leading-none shadow-sm">ALTN</span>
                </div>
                <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
                <div className="text-[0.75rem] leading-tight text-white font-mono font-bold">{burnT} T<br/><span className="text-[#8fa0a6] font-normal font-sans">--</span></div>
                <div className="text-[0.75rem] leading-tight text-white font-mono">{mtr}°<br/><span className="text-[#8fa0a6] font-sans">--</span></div>
                <div className="text-[0.75rem] leading-tight text-white font-mono">{dist} NM<br/><span className="text-[#8fa0a6] font-sans">--</span></div>
                <div className="text-[0.75rem] leading-tight font-mono text-[#FF9100] font-bold">FL {fl}<br/><span className="text-[#8fa0a6] font-sans font-normal">--</span></div>
                <div className="text-[0.75rem] leading-tight text-[#8fa0a6] font-mono">{tas} kt<br/><span className="text-white">{windStr}</span></div>
                <div className="text-[0.75rem] leading-tight font-mono text-white">{timeStr}<br/><span className="text-[#FF9100] font-bold">--z</span></div>
                <div className="text-[0.75rem] leading-tight text-white">APP<br/><span className="text-[#FF9100] font-bold font-mono text-[0.85rem]">RWY {alt.plan_rwy || '--'}</span></div>
                <div className="flex justify-center"><div className="border border-[#444] px-3 py-1.5 text-center rounded text-[0.7rem] tracking-widest font-mono font-bold bg-[#1a1a1a] text-[#8fa0a6]">0528z/0728z</div></div>
                <div className="text-[0.75rem] leading-tight text-white">17<br/>9999</div>
                <div className="text-[0.75rem] leading-tight text-white">550<br/>9999</div>
                <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
                <div className="text-[0.75rem] leading-tight text-[#8fa0a6]">--<br/>--</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
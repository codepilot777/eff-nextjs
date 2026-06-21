"use client";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
// 🌟 Props 大清洗：只保留 setActiveModal
export default function LoadsheetAirportColumn({ setActiveModal }: { setActiveModal: any }) {
  
  // 🌟 1. 從天上直接抽取 Data
  const { flightData, calc } = useFlightData();

  // 🌟 防呆保護：如果未有 data 就唔 render，防止下面計算爆炸
  if (!flightData || !calc) return null;

  // =====================================================================
  // 🌟 2. 喺 Component 內部安全解構所需的 UI Metadata
  // =====================================================================
  const rawSb = flightData?.raw_simbrief || {};
  const gen = rawSb.general || {};
  const dest = rawSb.destination || {};

  const arrIcao = flightData?.arr_icao || dest.icao_code || 'RJBB';
  const paxTot = (flightData?.pax_f || 0) + (flightData?.pax_j || 0) + (flightData?.pax_w || 0) + (flightData?.pax_y || 0);

  // 🌟 1. 確保拿到當前飛機大腦
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 2. 獲取最新的 Payload Snapshot
  const activeSnapshot = flightData?.final_snapshot || flightData?.prelim_snapshot || flightData?.ezfw_snapshot;

  // 🌟 3. 動態計算當前航班的實際艙等分布 (J / W / Y)
  const classCounts: Record<string, number> = { J: 0, W: 0, Y: 0 };
  
  if (activeSnapshot) {
    // 如果有 Snapshot，跟從物理引擎分區計算
    Object.entries(ahm.stations.pax).forEach(([zoneKey, zoneInfo]: [string, any]) => {
      const short = zoneKey.replace("zone", "");
      const count = Number(activeSnapshot.pax?.[short] || activeSnapshot.pax?.[zoneKey] || 0);
      const primaryClass = zoneInfo.primaryClass || "Y";
      classCounts[primaryClass] += count;
    });
  } else {
    // 補底防呆：如果未有任何 Loadsheet Snapshot，直接讀 SimBrief 嘅生肉數據
    classCounts.J = flightData?.pax_j || 0;
    classCounts.W = flightData?.pax_w || 0;
    classCounts.Y = flightData?.pax_y || 0;
  }

  // 🌟 4. 拼裝出完美的商業艙等字串 (e.g. "J35 W40 Y140")
  const dynamicClassStr = Object.keys(classCounts)
    .filter(cls => ahm.config.includes(cls)) // 只保留飛機 Config 有嘅艙等
    .map(cls => `${cls}${classCounts[cls]}`)
    .join(" ");

  // =====================================================================
  // 🌟 3. 原本嘅計算邏輯 (修正為使用本地變數)
  // =====================================================================
  const lastUpdated = flightData?.sta_z?.replace('Z', 'z') || "0323z"; 
  const displayZfw = calc.actualZfw > 0 ? calc.actualZfw.toFixed(1) : (calc.ofpZfw?.toFixed(1) || '0.0');

  let dynamicPaxTot = 0;
  if (activeSnapshot?.pax) {
    // 讀取 Snapshot 裡面所有分區的實際人數加總
    Object.values(activeSnapshot.pax).forEach((count: any) => {
      dynamicPaxTot += Number(count) || 0;
    });
  } else {
    // 防呆補底：讀取 SimBrief 生肉
    dynamicPaxTot = (flightData?.pax_f || 0) + (flightData?.pax_j || 0) + (flightData?.pax_w || 0) + (flightData?.pax_y || 0);
  }

  const crewFd = flightData?.crew_fd || 2;
  const crewCc = flightData?.crew_cc || 13;
  const totalCrew = crewFd + crewCc;
  
  // 🎯 真實 POB 誕生！
  const totalPob = dynamicPaxTot + totalCrew;
  // 👈 換上本地 paxTot

  const planeWatermark = (
    <svg className="absolute bottom-1 left-2 w-16 h-16 text-[#333] opacity-50 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const activeFinalVer = flightData?.final_history?.[flightData.final_history.length - 1]?.version || 1;
  const finalVer = activeFinalVer.toString().padStart(2, '0');

  const activePrelimVer = flightData?.prelim_history?.[flightData.prelim_history.length - 1]?.version || 1;
  const prelimVer = activePrelimVer.toString().padStart(2, '0');

  let stageName = "AWAITING";
  let percent = 0;
  let bgClass = "bg-[#2A2A2A] text-white"; 
  let ringColor = "text-[#FF9100]"; 
  let ringBgColor = "text-white/10"; 

  if (flightData?.pilots_signed_final) {
    stageName = `FINAL ${finalVer} ACK`;
    percent = 100;
    bgClass = "bg-[#C6FF00] text-black"; 
    ringColor = "text-black";
    ringBgColor = "text-black/20";
  } else if (flightData?.final_ls_sent) {
    stageName = `FINAL ${finalVer}`;
    percent = 100;
    bgClass = "bg-[#FF9100] text-black animate-pulse"; 
    ringColor = "text-black";
    ringBgColor = "text-black/20";
  } else if (flightData?.prelim_ls_sent) {
    stageName = `PRELIM ${prelimVer}`;
    percent = 75;
  } else if (flightData?.azf_sent) {
    stageName = `AZF`;
    percent = 50;
  } else if (flightData?.ezfw_sent) {
    stageName = `EZFW`;
    percent = 25;
  }

  const efobAtDest = calc?.efobAtDest || 0.0;
  const displayAlternates = calc?.processedAlternates || [];

  const activeAltnData = displayAlternates.find((a: any) => a.icao === calc.selectedAltn) || displayAlternates[0];
  const destHoldFuel = activeAltnData ? Math.max(0, activeAltnData.holdFuel) : 0.0;
  const destHoldTime = activeAltnData ? activeAltnData.holdTime : "0m";
  const destEta = flightData?.sta_z?.replace('Z', 'z') || "--z";

  const MIN_ALTN_ROWS = 4;
  const emptyAltnRows = Math.max(0, MIN_ALTN_ROWS - displayAlternates.length);

  return (
    <div className="flex-[4] flex flex-col gap-2 h-full overflow-hidden min-h-0 text-white font-sans w-full max-w-[320px]">
      
      {/* 1. Loadsheet 卡片 */}
      <div onClick={() => setActiveModal('Loadsheet')} className="bg-[#1E1E1E] rounded-xl p-3 shrink-0 flex flex-col cursor-pointer hover:bg-[#252525] transition-colors relative">
        <div className="flex justify-between items-center mb-1 border-b border-[#333] pb-1.5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[1.05rem] font-bold text-white leading-none">Loadsheet</h2>
            <span className="text-[0.6rem] text-[#8fa0a6] leading-none font-mono tracking-widest">{lastUpdated}</span>
          </div>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>

        <div className="flex flex-col justify-center gap-1.5 py-2">
          <div className="flex items-center leading-none">
            <span className="text-[#8fa0a6] font-sans text-[0.6rem] uppercase tracking-widest w-9">Crew</span>
            <span className="ml-1 font-mono font-bold text-[1rem] text-white w-6 text-right">{totalCrew}</span>
            <span className="ml-3 text-[0.65rem] text-[#8fa0a6] font-mono">FD{crewFd} C{crewCc}</span>
          </div>
          <div className="flex items-center leading-none">
            <span className="text-[#8fa0a6] font-sans text-[0.6rem] uppercase tracking-widest w-9">Pax</span>
            <span className="ml-1 font-mono font-bold text-[1rem] text-white w-6 text-right">{dynamicPaxTot}</span>
            <span className="ml-3 text-[0.65rem] text-[#8fa0a6] font-mono">
              {dynamicClassStr || "NO PAX DATA"}
            </span>
          </div>
        </div>

        <div className={`rounded-lg px-2.5 py-1.5 flex justify-between items-center shadow-md transition-colors ${bgClass}`}>
          <div className="font-bold flex items-center gap-2.5 leading-none tracking-wide">
            <span className="text-[0.8rem]">ZFW {displayZfw}<span className="text-[0.55rem] ml-[1px]">T</span></span>
            <span className="opacity-50 text-[0.6rem]">|</span>
            <span className="text-[0.75rem] font-bold opacity-90 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>
              {totalPob}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[0.65rem] uppercase tracking-widest leading-none">
            {percent > 0 && (
              <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                 <svg className="w-3.5 h-3.5 transform -rotate-90">
                   <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" fill="transparent" className={ringBgColor} />
                   <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={2 * Math.PI * 5} strokeDashoffset={(2 * Math.PI * 5) - (percent / 100) * (2 * Math.PI * 5)} className={`${ringColor} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                 </svg>
              </div>
            )}
            <span className="mt-px">{stageName}</span>
          </div>
        </div>
      </div>
      
      {/* 2. NOTOC 卡片 */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 shrink-0 flex flex-col relative overflow-hidden">
        {planeWatermark}
        <div className="flex justify-between items-center relative z-10">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">NOTOC</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[0.65rem] relative z-10 py-1.5">
          <div className="flex flex-col items-center">
            <span className="text-[#8fa0a6] uppercase tracking-wide leading-none mb-1">DG Types</span>
            <span className="text-xl font-bold text-white leading-none">2</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#8fa0a6] uppercase tracking-wide leading-none mb-1">Crew Actions</span>
            <span className="text-lg font-bold text-white leading-none">--</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#8fa0a6] uppercase tracking-wide leading-none mb-1">Crew Notes</span>
            <span className="text-sm font-bold text-white leading-none">ELI</span>
          </div>
        </div>
      </div>
      
      {/* 3. Airport 卡片 */}
      <div onClick={() => setActiveModal('Airports')} className="bg-[#1E1E1E] rounded-xl p-3 flex-1 flex flex-col min-h-0 cursor-pointer hover:bg-[#252525] transition-colors relative overflow-hidden">
        
        {/* 頂部 50%：Airport & ALTN List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-1 shrink-0">
            <h2 className="text-[1.05rem] font-bold text-white leading-none">Airport</h2>
            <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
          </div>

          <div className="flex items-center gap-4 shrink-0 mt-1">
            {/* 🌟 換上本地 arrIcao */}
            <div className="text-white font-bold text-lg leading-none">{arrIcao}</div> 
            <div className="flex flex-col">
              <span className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-wide leading-tight">EFOB</span>
              <span className="font-bold text-[0.8rem] text-[#00E676] leading-none">{efobAtDest.toFixed(1)}<span className="text-[0.55rem] font-bold text-[#8fa0a6]">T</span></span>
            </div>
            <div className="flex flex-col ml-auto">
              <span className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-wide leading-tight">Hold</span>
              <span className="font-bold text-[0.8rem] text-right leading-none">{destHoldFuel.toFixed(1)}<span className="text-[0.55rem] font-bold text-[#8fa0a6]">T</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-wide leading-tight">Time</span>
              <span className="font-bold text-[0.8rem] text-right leading-none">{destHoldTime}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-wide leading-tight">ETA</span>
              <span className="font-mono text-[0.7rem] text-right text-[#00E676] leading-none">{destEta}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider border-b border-[#333] pb-1 shrink-0 ml-4 mt-2">
            <div>ALTN</div><div className="text-right">MDF</div><div className="text-right">Hold</div><div className="text-right">Time</div><div className="text-right">ETA</div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto mt-2 pr-1 relative min-h-0 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
             <div className="absolute left-[3px] top-2 bottom-2 w-px bg-[#444] z-0"></div>

            {/* 真實 Alternate 數據 */}
            {displayAlternates.map((altn: any, index: number) => {
              const isSelected = altn.icao === calc.selectedAltn;
              const isNegative = altn.holdFuel < 0;
              const holdColor = isNegative ? "text-[#FF1744] font-black animate-pulse" : (isSelected ? "text-white" : "text-[#8fa0a6]");
              const holdDisplayFuel = altn.holdFuel > 0 ? altn.holdFuel.toFixed(1) : "0.0";
              const holdDisplayTime = isNegative ? "0m" : altn.holdTime;

              return (
                <div key={index} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] items-center text-[0.7rem] relative leading-none z-10 bg-[#1E1E1E] py-1">
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border-2 ${isSelected ? 'border-white bg-white' : 'border-[#666] bg-[#1E1E1E]'}`}></div>
                  <div className={`pl-4 font-bold font-sans ${isSelected ? "text-white" : "text-[#8fa0a6]"}`}>{altn.icao}</div>
                  <div className={`text-right font-mono ${isSelected ? "text-white font-bold" : "text-[#8fa0a6]"}`}>{altn.mdf?.toFixed(1)}<span className="text-[0.55rem]">T</span></div>
                  <div className={`text-right font-mono ${holdColor}`}>{holdDisplayFuel}<span className="text-[0.55rem]">T</span></div>
                  <div className={`text-right font-mono ${holdColor}`}>{holdDisplayTime}</div>
                  <div className="text-right font-mono text-white text-[0.65rem]">{altn.eta}</div>
                </div>
              );
            })}

            {/* 填補空位的 Placeholder Rows */}
            {[...Array(emptyAltnRows)].map((_, i) => (
              <div key={`empty-${i}`} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] items-center text-[0.7rem] relative leading-none z-10 bg-[#1E1E1E] py-1 opacity-40">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border-2 border-[#444] bg-[#1E1E1E]"></div>
                <div className="pl-4 font-bold font-sans text-[#555]">----</div>
                <div className="text-right font-mono text-[#555]">--.-<span className="text-[0.55rem]">T</span></div>
                <div className="text-right font-mono text-[#555]">--.-<span className="text-[0.55rem]">T</span></div>
                <div className="text-right font-mono text-[#555]">--m</div>
                <div className="text-right font-mono text-[#555]">----z</div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 50%：Critical Points 面板 */}
        <div className="flex-1 mt-2 pt-2 border-t border-[#333] flex flex-col min-h-0">
          <div className="flex justify-between text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider leading-none mb-2 shrink-0">
            <span>Critical Points</span><span>Margin</span>
          </div>
          <div className="flex-1 flex flex-col justify-evenly min-h-0">
            {[...Array(6)].map((_, i) => (
              <div key={`cp-${i}`} className="flex justify-between items-center border-b border-dashed border-[#333] pb-1 last:border-b-0">
                <span className="text-[0.65rem] text-[#555] font-mono leading-none">--</span>
                <span className="text-[0.65rem] text-[#555] font-mono leading-none">--</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
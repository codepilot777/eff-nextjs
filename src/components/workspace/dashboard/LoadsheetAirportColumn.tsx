"use client";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { getDynamicAhm, getLatestSnapshot, buildClassCounts, getActiveStageWeights } from "@/lib/loadsheet/loadsheetHelpers";
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

  // 🌟 1. 確保拿到當前飛機大腦
  const ahm = getDynamicAhm(flightData);

  // 🌟 2. 獲取最新的 Payload Snapshot（同 FuelWeightColumn 用返同一套 fallback chain，
  // 包埋 azf_snapshot——以前呢度漏咗，AZF 階段會顯示錯咗嘅 Crew/Pax）
  const activeSnapshot = getLatestSnapshot(flightData) as { pax?: Record<string, unknown> } | null;

  // 🌟 3. 動態計算當前航班的實際艙等分布 (J / W / Y)
  let classCounts: Record<string, number>;

  if (activeSnapshot) {
    // 如果有 Snapshot，跟從物理引擎分區計算
    classCounts = buildClassCounts(ahm, activeSnapshot.pax);
  } else {
    // 補底防呆：如果未有任何 Loadsheet Snapshot，直接讀 SimBrief 嘅生肉數據
    classCounts = { J: flightData?.pax_j || 0, W: flightData?.pax_w || 0, Y: flightData?.pax_y || 0 };
  }

  // 🌟 4. 拼裝出完美的商業艙等字串 (e.g. "J35 W40 Y140")
  const dynamicClassStr = Object.keys(classCounts)
    .filter(cls => ahm.config.includes(cls)) // 只保留飛機 Config 有嘅艙等
    .map(cls => `${cls}${classCounts[cls]}`)
    .join(" ");

  // =====================================================================
  // 🌟 3. 原本嘅計算邏輯 (修正為使用本地變數)
  // =====================================================================
  // 🌟 修復：以前呢個卡直接顯示 calc.actualZfw——Fuel & Weight 卡度嗰個仲喺度郁緊嘅
  // live Revised ZFW 輸入。令即使 AZF 已經派發咗一個真正嘅 ZFW（由當時嘅 payload
  // 算出），trainee 之後再郁 Revised ZFW 輸入（未再派發任何新文件），呢張卡都會靜靜雞
  // 跟住個 live 輸入變，顯示緊一個從未真正派發過嘅數。而家同 LeftPanel.tsx 一樣，
  // 有已派發嘅 stage 就用返嗰個 stage 真正嘅 snapshot 數，未派發過先至用 live 估算
  const activeStage = getActiveStageWeights(flightData, calc);
  const displayZfw = activeStage.stage
    ? (activeStage.zfw / 1000).toFixed(1)
    : (calc.actualZfw > 0 ? calc.actualZfw.toFixed(1) : (calc.ofpZfw?.toFixed(1) || '0.0'));

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
  const crewCc = flightData?.crew_cc || 14;
  const totalCrew = crewFd + crewCc;

  // 🎯 真實 POB 誕生！
  const totalPob = dynamicPaxTot + totalCrew;

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
  // 🌟 修復：以前 Math.max(0, ...) 靜靜雞夾走負數，令真正嘅燃油短缺喺頂部 summary
  // 完全睇唔到；而家保留返真實數值（可以係負數），null = 未有 MDF 數據
  const destHoldFuel: number | null = activeAltnData?.holdFuel ?? null;
  const destHoldTime = activeAltnData?.holdTime || "--";
  const destEta = flightData?.sta_z?.replace('Z', 'z') || "--z";

  // 🌟 Hold fuel 係「夠唔夠」check，唔係 margin-against-a-limit（同 marginHelpers.ts
  // 嗰堆 ZFW/TOW/LW margin 方向相反：嗰邊正數先係壞，呢度負數先係壞），所以呢度用返
  // 自己嘅 local helper，唔借用 getMarginColor。
  const getHoldColor = (holdFuel: number | null, isSelected: boolean) => {
    if (holdFuel === null) return "text-[#555]";
    if (holdFuel < 0) return "text-[#FF1744] font-black animate-pulse";
    return isSelected ? "text-white" : "text-[#8fa0a6]";
  };

  const MIN_ALTN_ROWS = 4;
  const emptyAltnRows = Math.max(0, MIN_ALTN_ROWS - displayAlternates.length);

  return (
    <div className="flex-[4] flex flex-col gap-2 h-full overflow-hidden min-h-0 text-white font-sans w-full max-w-[320px]">
      
      {/* 1. Loadsheet 卡片 */}
      <div onClick={() => setActiveModal('Loadsheet')} className="bg-[#1E1E1E] rounded-xl p-3 shrink-0 flex flex-col cursor-pointer hover:bg-[#252525] transition-colors relative">
        <div className="flex justify-between items-center mb-1 border-b border-[#333] pb-1.5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[1.05rem] font-bold text-white leading-none">Loadsheet</h2>
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
      
      {/* 2. NOTOC 卡片 — 🌟 而家有真實 backing data model（flightData.notoc，教官
          喺建立航班表單度可以揀生成 random NOTOC 危險品訓練演習），撳落去睇返
          itemised 清單，同 Loadsheet/Airport 卡片一樣可以撳 */}
      <div
        onClick={() => setActiveModal('NOTOC')}
        className="bg-[#1E1E1E] rounded-xl p-3 shrink-0 flex flex-col relative overflow-hidden cursor-pointer hover:bg-[#252525] transition-colors"
      >
        {planeWatermark}
        <div className="flex justify-between items-center relative z-10">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">NOTOC</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>
        <div className="flex items-center justify-center relative z-10 py-3">
          {flightData?.notoc?.hasDg ? (
            <span className="text-[0.6rem] text-[#FF9100] uppercase tracking-widest font-bold">⚠️ DG Onboard</span>
          ) : (
            <span className="text-[0.6rem] text-[#8fa0a6] uppercase tracking-widest font-bold">Nil DG</span>
          )}
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
              <span className={`font-bold text-[0.8rem] text-right leading-none ${getHoldColor(destHoldFuel, true)}`}>
                {destHoldFuel !== null ? destHoldFuel.toFixed(1) : "--"}<span className="text-[0.55rem] font-bold text-[#8fa0a6]">T</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-wide leading-tight">Time</span>
              <span className={`font-bold text-[0.8rem] text-right leading-none ${destHoldFuel !== null && destHoldFuel < 0 ? 'text-[#FF1744]' : ''}`}>{destHoldTime}</span>
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
              const holdColor = getHoldColor(altn.holdFuel, isSelected);
              const mdfDisplay = altn.mdf != null ? altn.mdf.toFixed(1) : "--";
              // 🌟 修復：以前赤字（負數）永遠夾硬顯示 "0.0"，學員睇到「有嘢唔妥」但完全
              // 唔知差幾多；而家顯示返真實數值
              const holdDisplayFuel = altn.holdFuel != null ? altn.holdFuel.toFixed(1) : "--";

              return (
                <div key={index} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] items-center text-[0.7rem] relative leading-none z-10 bg-[#1E1E1E] py-1">
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border-2 ${isSelected ? 'border-white bg-white' : 'border-[#666] bg-[#1E1E1E]'}`}></div>
                  <div className={`pl-4 font-bold font-sans ${isSelected ? "text-white" : "text-[#8fa0a6]"}`}>{altn.icao}</div>
                  <div className={`text-right font-mono ${isSelected ? "text-white font-bold" : "text-[#8fa0a6]"}`}>{mdfDisplay}<span className="text-[0.55rem]">T</span></div>
                  <div className={`text-right font-mono ${holdColor}`}>{holdDisplayFuel}<span className="text-[0.55rem]">T</span></div>
                  <div className={`text-right font-mono ${holdColor}`}>{altn.holdTime}</div>
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

        {/* 底部 50%：Critical Points 面板 — 🌟 暫時冇真實 backing data model
            （唔係假 --/-- 6 行扮有嘢），老實顯示未有數據 */}
        <div className="flex-1 mt-2 pt-2 border-t border-[#333] flex flex-col min-h-0">
          <div className="flex justify-between text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider leading-none mb-2 shrink-0">
            <span>Critical Points</span><span>Margin</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <span className="text-[0.65rem] text-[#555] uppercase tracking-widest font-bold">No Critical Point Data Available</span>
          </div>
        </div>

      </div>
    </div>
  );
}
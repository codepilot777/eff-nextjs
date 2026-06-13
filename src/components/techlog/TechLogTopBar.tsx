"use client";

export default function TechLogTopBar({ tlData, flightData, roleMode, setRoleMode, setActiveTask, setShowInFlightMenu, isTrainee }: any) {
  const reg = flightData?.aircraft_reg || "B-HNQ";
  
  const currFlt = tlData?.tl_prep_flt || flightData?.flight_no || "CPA 564";
  const currDep = tlData?.tl_prep_dep || flightData?.dep_icao || "HKG";
  const currArr = tlData?.tl_prep_arr || flightData?.arr_icao || "KIX";
  
  const lastFlt = tlData?.tl_prev_flt || "CX881";
  const lastRoute = `${tlData?.tl_prev_dep || "LAX"} ➔ ${tlData?.tl_prev_arr || "HKG"}`;
  const lastFob = tlData?.tl_prev_fob || "10.5";

  const {
    tl_prepared: isPrepared,
    tl_accept: isAccepted,
    tl_flight_started: isStarted,
    tl_flight_status: flightStatus,
    tl_fluids: isFluids,
    tl_checks: isChecks,
    tl_defects: isDefects,
    tl_release: isReleased,
  } = tlData || {};

  // 🌟 重新設計的 Status Pill (專業 SVG 狀態)
  const StatusPill = ({ label, isOk }: { label: string, isOk: boolean }) => (
    <div className={`flex flex-col items-center gap-1.5 px-6 py-1.5 rounded-lg border border-transparent transition-all ${isOk ? 'bg-[#00E676]/10 border-[#00E676]/20' : ''}`}>
      {isOk ? (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-[#00E676]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#8fa0a6]">
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      <span className={`text-[0.65rem] font-bold tracking-widest uppercase leading-none ${isOk ? 'text-[#00E676]' : 'text-[#8fa0a6]'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="bg-[#1E1E1E] border-b border-[#333] shrink-0 relative transition-all duration-500 font-sans shadow-md">
      
      {/* 🌟 頂部：角色切換列 (非 Trainee 時顯示) */}
      {!isTrainee && (
        <div className="bg-[#0a0a0a] border-b border-[#333] px-4 py-2 flex justify-between items-center">
          <span className="text-[#8fa0a6] text-[0.6rem] font-bold tracking-widest uppercase">System Role Override</span>
          <div className="relative">
            <select 
              value={roleMode} 
              onChange={(e) => { setRoleMode(e.target.value); setActiveTask(null); setShowInFlightMenu(false); }}
              className="appearance-none bg-[#1a1a1a] border border-[#444] text-white text-[0.65rem] font-bold tracking-widest uppercase rounded pl-3 pr-8 py-1.5 outline-none cursor-pointer focus:border-[#00E676] transition-colors shadow-inner"
            >
              <option value="FLIGHT CREW">FLIGHT CREW MODE</option>
              <option value="ENGINEER">ENGINEER MODE</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8fa0a6]">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 主資訊區 */}
      <div className="p-4 flex flex-col gap-4">
        
        <div className="flex justify-between items-start">
          {/* 左：飛機註冊號碼與當前身份 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-mono font-black text-white leading-none tracking-tight">{reg}</h1>
              {roleMode === "ENGINEER" && (
                <div className="bg-[#2979FF] text-white text-[0.55rem] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">ENG</div>
              )}
            </div>
            <div className="text-[0.65rem] text-[#8fa0a6] font-bold tracking-widest mt-2 uppercase flex items-center gap-1.5">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              {roleMode} ACCESS
            </div>
          </div>
          
          {/* 中：Sector 流程圖 */}
          <div className="flex-[3] flex justify-center items-center gap-4">
            {!isStarted ? (
              <>
                {/* 舊 Sector */}
                <div className="flex flex-col items-center">
                  <div className="text-xl font-black font-mono text-[#8fa0a6] leading-none mb-1.5">{lastFlt}</div>
                  <div className="text-[0.65rem] font-bold font-mono text-[#8fa0a6] bg-[#0a0a0a] px-3 py-1 rounded border border-[#333]">
                    {lastRoute}
                  </div>
                </div>
                
                {/* 舊 Sector FOB */}
                <div className="flex items-center gap-1.5 text-[0.6rem] text-[#8fa0a6] font-bold tracking-widest uppercase bg-[#0a0a0a] px-2 py-1 rounded border border-[#333] shadow-inner ml-1">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 15v-6m0 0l-3 3m3-3l3 3" /></svg>
                  {lastFob} T
                </div>

                {/* 箭嘴 */}
                {isPrepared && (
                  <>
                    <div className="text-lg text-[#444] ml-2">➔</div>
                    
                    {/* 新 Sector */}
                    <div className="flex flex-col items-center transition-all duration-300 opacity-70 ml-2">
                      <div className="text-xl font-black font-mono text-white leading-none mb-1.5">{currFlt}</div>
                      <div className="text-[0.65rem] font-bold font-mono text-white bg-[#1a1a1a] px-3 py-1 rounded border border-[#555] shadow-sm">
                        {currDep} ➔ {currArr}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              // 已經起飛，只顯示當前 Sector 並且放大高亮
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center transition-all duration-500 scale-110">
                  <div className="text-2xl font-black font-mono text-[#00E676] leading-none mb-1.5 flex items-center gap-2">
                    {currFlt}
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E676]"></span>
                    </span>
                  </div>
                  <div className="text-[0.65rem] font-bold font-mono text-black bg-[#00E676] px-4 py-1 rounded shadow-[0_0_15px_rgba(0,230,118,0.3)]">
                    {flightStatus === "DIVERTED" ? `${currDep} ➔ DIVERTED` : `${currDep} ➔ ${currArr}`}
                  </div>
                </div>
                
                {/* 🌟 當前 Sector 嘅 FOB */}
                <div className="flex items-center gap-1.5 text-[0.6rem] text-[#FF9100] font-bold tracking-widest uppercase bg-[#FF9100]/10 px-2.5 py-1.5 rounded border border-[#FF9100]/30 shadow-sm ml-3">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 15v-6m0 0l-3 3m3-3l3 3" /></svg>
                  {lastFob} T
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-end items-start pt-1">
             <div className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center text-[#8fa0a6]">
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
             </div>
          </div>
        </div>

        {/* 🌟 底部：狀態膠囊 / 飛行警告條 */}
        {isStarted && roleMode === "FLIGHT CREW" ? (
          <div className="bg-[#00E676]/10 border border-[#00E676] rounded-lg py-2.5 flex items-center justify-center gap-3 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#00E676_10px,#00E676_20px)]"></div>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#00E676] relative z-10"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            <span className="text-[0.7rem] font-bold tracking-widest text-[#00E676] uppercase relative z-10">FLIGHT LOG LOCKED • AIRPLANE MODE ENABLED</span>
          </div>
        ) : (
          <div className="flex justify-around items-center pt-3 border-t border-[#333]">
            <StatusPill label="Fluids" isOk={isFluids} />
            <div className="w-px h-6 bg-[#333]"></div>
            <StatusPill label="Checks" isOk={isChecks} />
            <div className="w-px h-6 bg-[#333]"></div>
            <StatusPill label="Defects" isOk={isDefects} />
            <div className="w-px h-6 bg-[#333]"></div>
            <StatusPill label="Release" isOk={isReleased} />
            
            {roleMode === "FLIGHT CREW" && (
              <>
                <div className="w-px h-6 bg-[#333]"></div>
                <StatusPill label="Acceptance" isOk={isAccepted} />
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
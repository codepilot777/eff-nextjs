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

  const StatusPill = ({ label, isOk }: { label: string, isOk: boolean }) => (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-bold ${isOk ? 'text-[#00E676]' : 'text-[#FF9100]'}`}>
        {isOk ? '✅ ' : ''}{label}
      </span>
    </div>
  );

  return (
    <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 mb-4 border-t-4 border-t-[#00E676] shrink-0 shadow-lg relative transition-all duration-500">
      
      {!isTrainee && (
        <div className="absolute top-4 right-4 z-50">
          <select 
            value={roleMode} 
            onChange={(e) => { setRoleMode(e.target.value); setActiveTask(null); setShowInFlightMenu(false); }}
            className="bg-[#1a1a1a] border border-[#404040] text-[#00bfa5] text-xs font-bold rounded px-2 py-1 outline-none cursor-pointer hover:border-[#00bfa5] transition-colors"
          >
            <option value="FLIGHT CREW">👨‍✈️ FLIGHT CREW MODE</option>
            <option value="ENGINEER">🔧 ENGINEER MODE</option>
          </select>
        </div>
      )}

      <div className="flex justify-between items-start mb-4 pr-32">
        <div className="flex-1">
          <div className="text-3xl font-black text-[#00bfa5] tracking-widest">{reg}</div>
          <div className="text-xs text-[#8fa0a6] font-bold tracking-widest mt-1">{roleMode} MODE</div>
        </div>
        
        <div className="flex-[3] flex justify-start md:justify-center items-center gap-4">
          {!isStarted ? (
            <>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-black text-white">{lastFlt}</div>
                <div className="text-sm font-bold text-[#e2e8f0] mt-1 bg-[#1a1a1a] px-4 py-1 rounded border border-[#404040]">
                  {lastRoute}
                </div>
              </div>
              
              {/* 🌟 FOB 搬到 Sector 右邊，緊貼著上一個 Sector */}
              <div className="text-sm text-[#FF9100] font-black tracking-widest bg-[#FF9100]/10 px-3 py-1.5 rounded border border-[#FF9100]/30 shadow-sm ml-2">
                FOB {lastFob} T
              </div>

              {isPrepared && (
                <>
                  <div className="text-2xl font-black text-[#404040] ml-2">➔</div>
                  <div className="flex flex-col items-center transition-all duration-300 opacity-50 ml-2">
                    <div className="text-2xl font-black text-[#8fa0a6]">{currFlt}</div>
                    <div className="text-sm font-bold mt-1 bg-[#1a1a1a] px-4 py-1 rounded border text-[#8fa0a6] border-[#333333]">
                      {currDep} ➔ {currArr}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center transition-all duration-500 scale-110">
                <div className="text-2xl font-black text-[#00E676]">{currFlt}</div>
                <div className="text-sm font-bold mt-1 bg-[#1a1a1a] px-4 py-1 rounded border text-white border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.2)]">
                  {flightStatus === "DIVERTED" ? `${currDep} ➔ ⚠️ DIVERTED` : `${currDep} ➔ ${currArr}`}
                </div>
              </div>
              {/* 🌟 FOB 搬到 Sector 右邊，緊貼著當前 Sector */}
              <div className="text-sm text-[#FF9100] font-black tracking-widest bg-[#FF9100]/10 px-3 py-1.5 rounded border border-[#FF9100]/30 shadow-sm ml-2">
                FOB {lastFob} T
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-end justify-center">
          <div className="text-[0.65rem] font-bold text-[#8fa0a6] tracking-widest uppercase">
          </div>
        </div>
      </div>

      {isStarted && roleMode === "FLIGHT CREW" ? (
        <div className="text-center pt-3 border-t border-dashed border-[#333333] text-[#00E676] font-black tracking-widest">
          ✈️ FLIGHT STARTED ➔ ENABLE AIRPLANE MODE
        </div>
      ) : (
        <div className="flex justify-around border-t border-dashed border-[#333333] pt-3">
          <StatusPill label="Fluids" isOk={isFluids} />
          <StatusPill label="Checks" isOk={isChecks} />
          <StatusPill label="Defects" isOk={isDefects} />
          <StatusPill label="Release" isOk={isReleased} />
          {roleMode === "FLIGHT CREW" && <StatusPill label="Acceptance" isOk={isAccepted} />}
        </div>
      )}
    </div>
  );
}
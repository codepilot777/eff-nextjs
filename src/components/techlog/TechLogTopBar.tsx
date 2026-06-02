"use client";

export default function TechLogTopBar({ tlData, flightData, roleMode, setRoleMode, setActiveTask, setShowInFlightMenu, isTrainee }: any) {
  const reg = flightData?.aircraft_reg || "B-HNQ";
  
  // 自動從 raw_simbrief 提取 IATA 代碼，找不到則用 ICAO 或預設值
  const currDep = flightData?.raw_simbrief?.origin?.iata_code || flightData?.dep_icao || "HKG";
  const currArr = flightData?.raw_simbrief?.destination?.iata_code || flightData?.arr_icao || "KIX";
  const currFlt = flightData?.flight_no || "CPA 564";
  
  // Last Sector details (基於 History Dummy)
  const lastFlt = "CX881";
  const lastRoute = "LAX ➔ HKG";
  const lastFob = "10.5";

  const {
    tl_prepared: isPrepared,
    tl_accept: isAccepted,
    tl_flight_started: isStarted,
    tl_flight_status: flightStatus,
    tl_fluids: isFluids,
    tl_checks: isChecks,
    tl_defects: isDefects,
    tl_release: isReleased,
  } = tlData;

  const StatusPill = ({ label, isOk }: { label: string, isOk: boolean }) => (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-bold ${isOk ? 'text-[#00E676]' : 'text-[#FF9100]'}`}>
        {isOk ? '✅ ' : ''}{label}
      </span>
    </div>
  );

  return (
    <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 mb-4 border-t-4 border-t-[#00E676] shrink-0 shadow-lg relative">
      
      {/* 角色切換下拉選單 */}
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

      {/* 留空右邊 32 padding 防止同 absolute 下拉選單重疊 */}
      <div className="flex justify-between items-start mb-4 pr-32">
        
        {/* 👈 左側：飛機註冊號與目前模式 */}
        <div className="flex-1">
          <div className="text-3xl font-black text-[#00bfa5] tracking-widest">{reg}</div>
          <div className="text-xs text-[#8fa0a6] font-bold tracking-widest mt-1">{roleMode} MODE</div>
        </div>
        
        {/* 🎯 中間：航段序列 (Sequence) */}
        <div className="flex-[2] flex justify-center items-center gap-4">
          
          {/* Last Sector (永遠顯示) */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-black text-white">{lastFlt}</div>
            <div className="text-sm font-bold text-[#e2e8f0] mt-1 bg-[#1a1a1a] px-4 py-1 rounded border border-[#404040]">
              {lastRoute}
            </div>
          </div>

          {/* Pending / Active Current Flight (Prepare 後顯示) */}
          {isPrepared && (
            <>
              {/* 中間箭嘴 */}
              <div className={`text-2xl font-black ${isStarted ? 'text-[#00E676]' : 'text-[#404040]'}`}>
                ➔
              </div>
              
              {/* 目前航段 (未 Start 前為暗色，Start 後變白) */}
              <div className={`flex flex-col items-center transition-all duration-300 ${isStarted ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`text-2xl font-black ${isStarted ? 'text-white' : 'text-[#8fa0a6]'}`}>
                  {currFlt}
                </div>
                <div className={`text-sm font-bold mt-1 bg-[#1a1a1a] px-4 py-1 rounded border ${isStarted ? 'text-[#e2e8f0] border-[#00bfa5]' : 'text-[#8fa0a6] border-[#333333]'}`}>
                  {flightStatus === "DIVERTED" ? `${currDep} ➔ ⚠️ DIVERTED` : `${currDep} ➔ ${currArr}`}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 👉 右側：FOB 與狀態 (推過去右手邊) */}
        <div className="flex-1 flex flex-col items-end">
          <div className="text-xl text-[#FF9100] font-black tracking-widest">ARR FOB {lastFob} T</div>
          <div className="mt-2 text-[0.65rem] font-bold text-[#8fa0a6] tracking-widest uppercase">
            STATUS: <span className="text-white bg-[#404040] px-2 py-0.5 rounded ml-1">{flightStatus}</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Checks & Airplane Mode 指示 */}
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
          <StatusPill label="Acceptance" isOk={isAccepted} />
        </div>
      )}
    </div>
  );
}
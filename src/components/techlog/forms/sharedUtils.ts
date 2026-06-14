export function finalizeSector(
  actionName: string, 
  arrivalStation: string, 
  arrivalFuel: string, 
  extraDetails: any, 
  tlData: any, 
  updateTechLogData: any, 
  setActiveTask: any
) {
  // 🌟 1. 建立航班歷史紀錄 (Snapshot)
  const flightEntry = {
    id: `SEC-${Math.floor(1000 + Math.random() * 9000)}`, // 增加真實感嘅 Sector ID
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-'),
    flt: tlData?.tl_prep_flt || "UNKNOWN",
    route: `${tlData?.tl_prep_dep || "ORG"} ➔ ${arrivalStation}`,
    cmdr: extraDetails?.cmdr || tlData?.tl_cmdr,
    fuelArr: arrivalFuel,
    fuelUp: tlData?.tl_actual_uplift || "0",
    
    // 暫時留空，未來可以寫個 logic 由 tl_entries filter 出嚟
    checks: [], 
    serv: [], 
    
    def: tlData?.defects ? JSON.parse(JSON.stringify(tlData.defects)) : [], 
    tl_entries: tlData?.tl_entries ? JSON.parse(JSON.stringify(tlData.tl_entries)) : [], // 🌟 加呢行！將今程機嘅 Action Log 寫入歷史！
    action: actionName,
    
    // 🌟 Operational Details
    blocksOff: extraDetails?.blocksOff || "",
    takeOff: extraDetails?.takeOff || "",
    landing: extraDetails?.landing || "",
    blocksOn: extraDetails?.blocksOn || "",
    edto: extraDetails?.edto || "",
    autoland: extraDetails?.autoland || "",
    landingsCount: extraDetails?.landingsCount || "",
    overshoots: extraDetails?.overshoots || "",
    touchGo: extraDetails?.touchGo || ""
  };

  // 🌟 2. 檢查有無未處理嘅 Snag / Defect
  const hasOpenDefects = (tlData?.defects || []).some((d: any) => d.status === "OPEN");

  // 🌟 3. 更新 Database (重置架機準備做下一班)
  updateTechLogData({
    flights: [flightEntry, ...(tlData?.flights || [])], // 🔑 正名做 flights
    
    tl_prev_flt: tlData.tl_prep_flt,
    tl_prev_dep: tlData.tl_prep_dep,
    tl_prev_arr: arrivalStation,
    tl_prev_fob: arrivalFuel,
    
    // 機長流程重置
    tl_prepared: false,
    tl_fuel_record_completed: false,
    tl_accept: false,
    tl_flight_started: false,
    tl_flight_status: "SCHEDULED", // 轉回 SCHEDULED 準備下一次 Prepare Flight
    
    // 工程師流程重置 (落咗地，必須重新做 Transit Check 同簽發 Release)
    tl_fluids: false,
    tl_checks: false,
    tl_defects: !hasOpenDefects, // 🔑 如果有 Open Defect 亮紅燈，冇就亮綠燈
    tl_release: false,
    
    // 🔑 核心 Audit Trail 重置：洗走 Action Log 同舊嘅 CRS ID，迎接新一班機
    tl_entries: [],
    crs_id: ""
  });

  setActiveTask(null);
  alert(`Flight closed as ${actionName}. Sector recorded successfully.`);
}
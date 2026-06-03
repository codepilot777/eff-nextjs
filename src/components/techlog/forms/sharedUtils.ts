export function finalizeSector(actionName: string, arrivalStation: string, arrivalFuel: string, extraDetails: any, tlData: any, updateTechLogData: any, setActiveTask: any) {
  const historyEntry = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-'),
    flt: tlData?.tl_prep_flt || "UNKNOWN",
    route: `${tlData?.tl_prep_dep || "ORG"} ➔ ${arrivalStation}`,
    cmdr: extraDetails?.cmdr || tlData?.tl_cmdr,
    fuelArr: arrivalFuel,
    fuelUp: tlData?.tl_actual_uplift || "0",
    checks: ["EDTO Transit Check", "Daily Check", "Weekly Check"],
    serv: ["APU Oil", "Engine Oil", "Hydraulic Fluid"],
    def: tlData?.defects ? JSON.parse(JSON.stringify(tlData.defects)) : [], 
    action: actionName,
    
    // 🌟 全面擴充：接收所有 Operational Details
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

  updateTechLogData({
    history: [historyEntry, ...(tlData?.history || [])],
    tl_prev_flt: tlData.tl_prep_flt,
    tl_prev_dep: tlData.tl_prep_dep,
    tl_prev_arr: arrivalStation,
    tl_prev_fob: arrivalFuel,
    tl_prepared: false,
    tl_fuel_record_completed: false,
    tl_accept: false,
    tl_flight_started: false,
    tl_fluids: false,
    tl_checks: false,
    tl_defects: false,
    tl_release: false,
    tl_flight_status: "ARRIVED"
  });

  setActiveTask(null);
}
"use client";

import TechLogLeftPanel from "./TechLogLeftPanel";
import TechLogRightPanel from "./TechLogRightPanel";

export default function TechLogDashboard({ tlData, flightData, roleMode, activeTask, setActiveTask, selectedEntry, setSelectedEntry, showInFlightMenu, setShowInFlightMenu, updateTechLogData }: any) {
  
  const defects = tlData?.defects || [];

  return (
    <>
      <TechLogLeftPanel 
        tlData={tlData} 
        roleMode={roleMode} 
        setActiveTask={setActiveTask} 
        setSelectedEntry={setSelectedEntry} 
        updateTechLogData={updateTechLogData} 
        defects={defects}
      />
      <TechLogRightPanel 
        tlData={tlData} 
        flightData={flightData} 
        roleMode={roleMode} 
        activeTask={activeTask} 
        setActiveTask={setActiveTask} 
        selectedEntry={selectedEntry} 
        showInFlightMenu={showInFlightMenu} 
        setShowInFlightMenu={setShowInFlightMenu} 
        updateTechLogData={updateTechLogData} 
        defects={defects}
      />
    </>
  );
}
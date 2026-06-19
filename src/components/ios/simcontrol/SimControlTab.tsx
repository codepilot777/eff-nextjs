"use client";
import { useState } from "react";

import StatusBar from "./views/StatusBar";
import TelemetryView from "./views/TelemetryView";
import GroundOpsView from "./views/GroundOpsView";
import FailuresView from "./views/FailuresView";
// 🌟 引入新模組
import EnvironmentalsView from "./views/EnvironmentalsView"; 

const SIM_SECTIONS = [
  { id: "telemetry", label: "📊 Telemetry", desc: "Live Flight Data Monitor" },
  { id: "ground", label: "🚜 Ground Ops", desc: "Doors & Ground Equipment" },
  { id: "failures", label: "🔥 Failures", desc: "PMDG 777 Emergency Matrix" },
  // 🌟 改名做 Environmentals
  { id: "environmentals", label: "⛈️ Environmentals", desc: "METAR & Weather Control" }, 
];

export default function SimControlTab({ isConnected, sendToFSUIPC, telemetry, readSimData }: any) {
  const [activeSection, setActiveSection] = useState("telemetry");

  const currentSectionDesc = SIM_SECTIONS.find(s => s.id === activeSection)?.desc;

  return (
    <div className="w-full h-full flex flex-col gap-4 font-sans text-white p-2 min-h-0">
      
      <StatusBar isConnected={isConnected} sendToFSUIPC={sendToFSUIPC} currentModuleDesc={currentSectionDesc} />

      <div className="flex-1 bg-[#1E1E1E] border border-[#333333] rounded-2xl p-6 min-h-0 shadow-inner overflow-hidden relative flex flex-col">
        {activeSection === "telemetry" && (
  <TelemetryView 
    telemetry={telemetry} 
    readSimData={readSimData} 
    isConnected={isConnected} // 🌟 加多呢個 Prop!
  />
)}
        {activeSection === "ground" && <GroundOpsView isConnected={isConnected} sendToFSUIPC={sendToFSUIPC} />}
        {activeSection === "failures" && <FailuresView isConnected={isConnected} sendToFSUIPC={sendToFSUIPC} />}
        
        {/* 🌟 渲染天氣模組 */}
        {activeSection === "environmentals" && <EnvironmentalsView isConnected={isConnected} sendToFSUIPC={sendToFSUIPC} />}
      </div>

      <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-2 shrink-0 shadow-2xl flex gap-2 overflow-x-auto">
        {SIM_SECTIONS.map((section) => (
          <button
            key={section.id} onClick={() => setActiveSection(section.id)}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-xs tracking-widest uppercase transition-all select-none text-center ${
              activeSection === section.id 
                ? "bg-[#252525] text-[#C6FF00] border border-[#444] shadow-md font-black" 
                : "text-[#8fa0a6] hover:bg-[#222] hover:text-white"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

    </div>
  );
}
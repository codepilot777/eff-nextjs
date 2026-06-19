"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

// 🌟 兩大神級大腦
import { useFlightData } from "@/hooks/useFlightData"; 
import { useSim } from "@/hooks/useSim"; 

// 📱 EFB 模組組件
import InboxPanel from "@/components/ios/efbmonitor/InboxPanel";
import ConfigTab from "@/components/ios/efbmonitor/ConfigTab";
import PayloadTab from "@/components/ios/efbmonitor/PayloadTab";
import WxTab from "@/components/ios/efbmonitor/WxTab";
import NotamTab from "@/components/ios/efbmonitor/NotamTab";

// 🔧 TechLog 組件
import TechLogModal from "@/components/techlog/TechLogModal"; 

// 🕹️ Sim Control 組件
import SimControlTab from "@/components/ios/simcontrol/SimControlTab";

function IOSPanelContent() {
  const router = useRouter();
  
  // 🌟 頂層三大主模組狀態切換
  const [activeModule, setActiveModule] = useState<"EFB" | "TECHLOG" | "SIM">("EFB");
  
  // EFB 內部嘅 Workflow Tab 切換
  const [efbTab, setEfbTab] = useState("Config");

  // 📡 啟動 Database 大腦
  const { flightData, updateFlightData, isLoading } = useFlightData();
  
  // 📡 啟動 P3D FSUIPC 大腦
  const { isConnected, telemetry, readSimData, sendToFSUIPC } = useSim();

  if (isLoading && !flightData) return <div className="p-8 text-[#00bfa5] animate-pulse font-bold text-xl">Loading IOS Panel...</div>;
  if (!flightData) return <div className="p-8 text-[#FF1744]">Flight not found in database or URL ID missing.</div>;

  const efbWorkflowTabs = [
    { id: "Config", icon: "✈️", label: "1. Config" },
    { id: "Payload", icon: "⚖️", label: "2. Payload" },
    { id: "WX", icon: "🌦️", label: "3. WX" },
    { id: "NOTAMs", icon: "📢", label: "4. NOTAMs" },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] text-[#e2e8f0] font-sans p-6 flex flex-col overflow-hidden">
      
      {/* ========================================== */}
      {/* 頂部狀態列 (Top Bar) */}
      {/* ========================================== */}
      <div className="flex-none flex justify-between items-center bg-[#1a1a1a] p-4 rounded-xl border-b-[3px] border-[#00bfa5] shadow-md mb-4">
        <div>
          <h2 className="text-2xl font-black text-[#00bfa5] m-0">📡 Instructor Control Panel (IOS)</h2>
          <div className="flex items-center text-[#8fa0a6] text-sm mt-1">
            <span>Session: <strong className="text-white">{flightData.flight_no} ({flightData.aircraft_reg})</strong></span>
            <span className="mx-2">|</span>
            <span>Version: <strong className="text-white">V{flightData.ofp_version || 1}</strong></span>
            <span className="mx-2">|</span>
            
            {/* DB Sync 狀態 */}
            <span className="flex items-center text-[#00E676] font-bold">
              <span className="inline-block w-2 h-2 bg-[#00E676] rounded-full mr-1.5 animate-pulse shadow-[0_0_8px_#00E676]"></span>
              Live DB Sync
            </span>
            <span className="mx-2">|</span>
            
            {/* 🌟 P3D FSUIPC 實時連線狀態 */}
            <span className={`flex items-center font-bold tracking-wider ${isConnected ? 'text-[#C6FF00]' : 'text-[#FF1744]'}`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isConnected ? 'bg-[#C6FF00] animate-pulse shadow-[0_0_8px_#C6FF00]' : 'bg-[#FF1744] shadow-[0_0_8px_#FF1744]'}`}></span>
              {isConnected ? 'P3D LINKED' : 'P3D OFFLINE'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/instructor')} className="bg-[#2a2a2a] text-white border border-[#404040] px-6 py-3 rounded-lg font-bold hover:bg-[#404040] transition-colors">
            🚪 EXIT SESSION
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 三大主模組導航列 (Main Module Switcher) */}
      {/* ========================================== */}
      <div className="flex gap-4 mb-4 shrink-0">
        <button 
          onClick={() => setActiveModule("EFB")} 
          className={`flex-1 py-3 rounded-xl font-black tracking-widest text-sm transition-all ${
            activeModule === "EFB" ? "bg-[#00bfa5] text-black shadow-[0_0_15px_rgba(0,191,165,0.4)]" : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] border border-[#333]"
          }`}
        >
          📱 EFB MONITOR
        </button>
        <button 
          onClick={() => setActiveModule("TECHLOG")} 
          className={`flex-1 py-3 rounded-xl font-black tracking-widest text-sm transition-all ${
            activeModule === "TECHLOG" ? "bg-[#2979FF] text-white shadow-[0_0_15px_rgba(41,121,255,0.4)]" : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] border border-[#333]"
          }`}
        >
          🔧 E-TECHLOG
        </button>
        <button 
          onClick={() => setActiveModule("SIM")} 
          className={`flex-1 py-3 rounded-xl font-black tracking-widest text-sm transition-all ${
            activeModule === "SIM" ? "bg-[#C6FF00] text-black shadow-[0_0_15px_rgba(198,255,0,0.2)]" : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] border border-[#333]"
          }`}
        >
          🕹️ SIM CONTROL
        </button>
      </div>

      {/* ========================================== */}
      {/* 模組內容動態渲染區 (Dynamic Content Area) */}
      {/* ========================================== */}
      <div className="flex-1 overflow-hidden">
        
        {/* 📱 模組 1: EFB Monitor */}
        {activeModule === "EFB" && (
          <div className="flex gap-6 h-full">
            <InboxPanel />
            <div className="flex-[2.6] bg-[#2a2a2a] border border-[#333333] rounded-xl p-6 flex flex-col h-full overflow-hidden">
              <h4 className="text-[#00bfa5] font-bold text-lg mb-6">⏱️ WORKFLOW TIMELINE</h4>
              <div className="flex border-b border-[#333333] mb-6 overflow-x-auto shrink-0">
                {efbWorkflowTabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setEfbTab(t.id)}
                    className={`px-4 py-3 font-bold transition-colors whitespace-nowrap ${
                      efbTab === t.id ? "border-b-2 border-[#00bfa5] text-[#00bfa5]" : "text-[#8fa0a6] hover:text-white"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {efbTab === "Config" && <ConfigTab />}
                {efbTab === "Payload" && <PayloadTab />}
                {efbTab === "WX" && <WxTab />}
                {efbTab === "NOTAMs" && <NotamTab />}
              </div>
            </div>
          </div>
        )}

        {/* 🔧 模組 2: E-TechLog */}
        {activeModule === "TECHLOG" && (
          <div className="h-full bg-[#1a1a1a] border border-[#333] rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-6 animate-bounce">🔧</span>
            <h3 className="text-2xl font-black text-[#2979FF] mb-2 tracking-widest">E-TECHLOG SYSTEM ACTIVE</h3>
            <p className="text-gray-400 mb-8 max-w-md">The Electronic Technical Logbook is currently open in overlay mode. Close the modal to return.</p>
            <button
              onClick={() => setActiveModule("EFB")}
              className="bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-white px-8 py-3 rounded-xl font-bold tracking-widest transition-all"
            >
              RETURN TO EFB
            </button>
          </div>
        )}

        {/* 🕹️ 模組 3: Sim Control (我們剛重構的傑作) */}
        {activeModule === "SIM" && (
          <SimControlTab 
            isConnected={isConnected} 
            telemetry={telemetry} 
            readSimData={readSimData} 
            sendToFSUIPC={sendToFSUIPC} 
          />
        )}
        
      </div>

      {/* 🌟 保留 TechLog Modal 彈出邏輯：當 activeModule 切換至 TECHLOG 時，觸發開啟 */}
      <TechLogModal 
        isOpen={activeModule === "TECHLOG"} 
        onClose={() => setActiveModule("EFB")} 
      />
      
    </div>
  );
}

export default function IOSPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00bfa5] font-bold">Initializing IOS Environment...</div>}>
      <IOSPanelContent />
    </Suspense>
  );
}
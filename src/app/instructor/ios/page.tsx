"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦

// 載入模組
import InboxPanel from "@/components/ios/InboxPanel";
import ConfigTab from "@/components/ios/ConfigTab";
import PayloadTab from "@/components/ios/PayloadTab";
import WxTab from "@/components/ios/WxTab";
import NotamTab from "@/components/ios/NotamTab";
import TechLogModal from "@/components/techlog/TechLogModal"; 

function IOSPanelContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Config");
  const [isTechLogOpen, setIsTechLogOpen] = useState(false);

  // 🌟 從天上直接抽取 Data 同 Update Function (包含樂觀更新)
  // 注意：useFlightData 內部已經處理咗 flightId 嘅抓取同 3 秒 Polling
  const { flightData, updateFlightData, isLoading } = useFlightData();

  if (isLoading && !flightData) return <div className="p-8 text-[#00bfa5] animate-pulse font-bold text-xl">Loading IOS Panel...</div>;
  if (!flightData) return <div className="p-8 text-[#FF1744]">Flight not found in database or URL ID missing.</div>;

  const tabs = [
    { id: "Config", icon: "✈️", label: "1. Config" },
    { id: "Payload", icon: "⚖️", label: "2. Payload" },
    { id: "WX", icon: "🌦️", label: "3. WX" },
    { id: "NOTAMs", icon: "📢", label: "4. NOTAMs" },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] text-[#e2e8f0] font-sans p-6 flex flex-col overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex-none flex justify-between items-center bg-[#1a1a1a] p-4 rounded-xl border-b-[3px] border-[#00bfa5] shadow-md mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#00bfa5] m-0">📡 Instructor Control Panel (IOS)</h2>
          <div className="flex items-center text-[#8fa0a6] text-sm mt-1">
            <span>Session: <strong className="text-white">{flightData.flight_no} ({flightData.aircraft_reg})</strong></span>
            <span className="mx-2">|</span>
            <span>Version: <strong className="text-white">V{flightData.ofp_version || 1}</strong></span>
            <span className="mx-2">|</span>
            <span className="flex items-center text-[#00E676] font-bold">
              <span className="inline-block w-2 h-2 bg-[#00E676] rounded-full mr-2 animate-pulse shadow-[0_0_8px_#00E676]"></span>
              Live DB Sync Active
            </span>
          </div>
        </div>
        
        {/* 右上角的按鈕區 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsTechLogOpen(true)}
            className="bg-[#00bfa5]/15 border border-[#00bfa5] text-[#00bfa5] hover:bg-[#00bfa5] hover:text-black font-black text-xs px-5 py-3 rounded-lg transition-all tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(0,191,165,0.2)]"
          >
            <span className="text-sm">🔧</span>
            <span>E-TECHLOG</span>
          </button>

          <button onClick={() => router.push('/instructor')} className="bg-[#2a2a2a] text-white border border-[#404040] px-6 py-3 rounded-lg font-bold hover:bg-[#404040] transition-colors">
            🚪 EXIT SESSION
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* 左側：模組化的 InboxPanel */}
        {/* 🌟 舊有寫法暫時保留 Props 傳遞，之後你入面都可以改用 useFlightData 自己吸 */}
        <InboxPanel flightData={flightData} updateFlightData={updateFlightData} />

        {/* 右側：主工作區與 Tabs */}
        <div className="flex-[2.6] bg-[#2a2a2a] border border-[#333333] rounded-xl p-6 flex flex-col h-full overflow-hidden">
          <h4 className="text-[#00bfa5] font-bold text-lg mb-6">⏱️ WORKFLOW TIMELINE</h4>
          
          <div className="flex border-b border-[#333333] mb-6 overflow-x-auto shrink-0">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 font-bold transition-colors whitespace-nowrap ${
                  activeTab === t.id ? "border-b-2 border-[#00bfa5] text-[#00bfa5]" : "text-[#8fa0a6] hover:text-white"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {/* 🌟 舊有寫法暫時保留 Props 傳遞，稍後可以入去斬！ */}
            {activeTab === "Config" && <ConfigTab />}
            {activeTab === "Payload" && <PayloadTab />}
            {activeTab === "WX" && <WxTab />}
            {activeTab === "NOTAMs" && <NotamTab />}
          </div>
        </div>

      </div>

      {/* 🌟 TechLog Modal (之前已經幫你清走咗 Props，呢度唔好傳錯) */}
      <TechLogModal 
        isOpen={isTechLogOpen} 
        onClose={() => setIsTechLogOpen(false)} 
      />
      
    </div>
  );
}

export default function IOSPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]"></div>}>
      <IOSPanelContent />
    </Suspense>
  );
}
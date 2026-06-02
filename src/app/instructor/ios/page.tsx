"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// 載入我們剛剛拆分的模組
import InboxPanel from "@/components/ios/InboxPanel";
import ConfigTab from "@/components/ios/ConfigTab";
import PayloadTab from "@/components/ios/PayloadTab";
import WxTab from "@/components/ios/WxTab";
import NotamTab from "@/components/ios/NotamTab";
import FuelTab from "@/components/ios/FuelTab";
import TechLog from "@/components/TechLog";

function IOSPanelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flightId = searchParams.get("id");
  
  const [flightData, setFlightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Config");

  const fetchFlightData = async () => {
    if (!flightId) return;
    try {
      const res = await fetch(`/api/flight?id=${encodeURIComponent(flightId)}`);
      if (res.ok) setFlightData(await res.json());
    } catch (error) {
      console.error("Failed to fetch flight data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightData();
    const interval = setInterval(fetchFlightData, 3000);
    return () => clearInterval(interval);
  }, [flightId]);

  const updateFlightData = async (updates: any) => {
    const updatedData = { ...flightData, ...updates };
    setFlightData(updatedData); 
    try {
      await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flightId, data: updatedData })
      });
    } catch (error) {
      console.error("Failed to update flight data", error);
    }
  };

  if (!flightId) return <div className="p-8 text-red-500">Error: Missing flight ID</div>;
  if (isLoading && !flightData) return <div className="p-8 text-status-teal animate-pulse font-bold text-xl">Loading IOS Panel...</div>;
  if (!flightData) return <div className="p-8 text-red-500">Flight not found in database.</div>;

  const tabs = [
    { id: "Config", icon: "✈️", label: "1. Config" },
    { id: "Payload", icon: "⚖️", label: "2. Payload" },
    { id: "WX", icon: "🌦️", label: "3. WX" },
    { id: "NOTAMs", icon: "📢", label: "4. NOTAMs" },
    { id: "eTechLog", icon: "🔧", label: "5. eTechLog" },
    { id: "Fuel", icon: "⛽", label: "6. Fuel" }
  ];

  return (
    <div className="h-screen bg-lido-950 text-slate-300 font-sans p-6 flex flex-col overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex-none flex justify-between items-center bg-[#11151a] p-4 rounded-xl border-b-[3px] border-[#00bfa5] shadow-md mb-6">
        <div>
          <h2 className="text-2xl font-black text-status-teal m-0">📡 Instructor Control Panel (IOS)</h2>
          <div className="flex items-center text-text-muted text-sm mt-1">
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
        <button onClick={() => router.push('/instructor')} className="bg-lido-800 text-white border border-[#404040] px-6 py-3 rounded-lg font-bold hover:bg-[#34495e] transition-colors">
          🚪 EXIT SESSION
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* 左側：模組化的 InboxPanel */}
        <InboxPanel flightData={flightData} updateFlightData={updateFlightData} />

        {/* 右側：主工作區與 Tabs */}
        <div className="flex-[2.6] bg-lido-800 border border-[#333333] rounded-xl p-6 flex flex-col h-full overflow-hidden">
          <h4 className="text-status-teal font-bold text-lg mb-6">⏱️ WORKFLOW TIMELINE</h4>
          
          <div className="flex border-b border-[#333333] mb-6 overflow-x-auto shrink-0">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 font-bold transition-colors whitespace-nowrap ${
                  activeTab === t.id ? "border-b-2 border-[#00bfa5] text-status-teal" : "text-text-muted hover:text-white"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {activeTab === "Config" && <ConfigTab flightData={flightData} updateFlightData={updateFlightData} />}
            {activeTab === "Payload" && <PayloadTab flightData={flightData} updateFlightData={updateFlightData} />}
            {activeTab === "WX" && <WxTab flightData={flightData} updateFlightData={updateFlightData} />}
            {activeTab === "NOTAMs" && <NotamTab flightData={flightData} updateFlightData={updateFlightData} />}
            {activeTab === "eTechLog" && <TechLog flightData={flightData} updateFlightData={updateFlightData} forcedRole="ENGINEER" />}
            {activeTab === "Fuel" && <FuelTab flightData={flightData} updateFlightData={updateFlightData} />}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function IOSPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-lido-950"></div>}>
      <IOSPanelContent />
    </Suspense>
  );
}
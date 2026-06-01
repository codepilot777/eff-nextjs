"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import Navlog from "@/components/Navlog";
import Weather from "@/components/Weather";
import Notam from "@/components/Notam";
import Acars from "@/components/Acars";
import Atc from "@/components/Atc";
import TechLog from "@/components/TechLog"; // 🌟 新增 Import

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flightId = searchParams.get("id");
  const role = searchParams.get("role") || "Trainee";
  
  const [currentTab, setCurrentTab] = useState("DASH");
  const [flightData, setFlightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlightData = async () => {
    if (!flightId) return;
    try {
      const res = await fetch(`/api/flight?id=${encodeURIComponent(flightId)}`);
      if (res.ok) {
        const data = await res.json();
        setFlightData(data);
      }
    } catch (error) {
      console.error("Failed to fetch flight data:", error);
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

  const navButtons = [
    { id: "DASH", label: "DASHBOARD", icon: "📊" },
    { id: "NAVLOG", label: "NAVLOG", icon: "🗺️" },
    { id: "WEATHER", label: "WEATHER", icon: "🌦️" },
    { id: "NOTAM", label: "NOTAM", icon: "📢" },
    { id: "ACARS", label: "ACARS", icon: "📟" },
    { id: "ATC", label: "ATC COMM", icon: "📡" },
    { id: "TECHLOG", label: "TECH LOG", icon: "🔧" },
  ];

  if (!flightId) return <div className="p-8 text-red-500">Error: Missing flight ID.</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#080a0d] text-slate-300 font-sans selection:bg-[#00bfa5] selection:text-black">
      
      {isLoading && !flightData && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#080a0d]">
          <div className="text-2xl font-bold text-[#00bfa5] animate-pulse">Loading Flight {flightId}...</div>
        </div>
      )}

      <header className="flex-none flex items-center h-[65px] bg-[#11151a] border-b-[3px] border-[#005a54] px-6 shadow-md z-50">
        <div className="flex items-center gap-4 w-full">
          <div className="text-[1.25rem] font-black text-[#00bfa5] cursor-pointer hover:text-white transition-colors" onClick={() => router.push(`/flight-select?role=${role}`)}>
            {flightData?.flight_no || flightId}
          </div>
          
          <div className={`text-[0.65rem] px-2 py-1 rounded font-bold border ${flightData?.ofp_version > 0 ? 'bg-[#00E676]/15 text-[#00E676] border-[#00E676]' : 'bg-[#FF9100]/15 text-[#FF9100] border-[#FF9100]'}`}>
            V{flightData?.ofp_version || 1} {flightData?.ofp_version > 0 ? 'ACTIVATED' : 'PENDING'}
          </div>
          
          <div className="text-[0.95rem] text-[#8fa0a6] font-bold">
            19MAR
          </div>
          
          <div className="border-l-2 border-[#34495e] h-[18px] mx-1"></div>
          
          <div className="flex items-center gap-3 text-[0.95rem] font-bold">
            <span className="text-[#00bfa5]">{flightData?.dep_icao || "----"}</span> 
            <span className="text-[#8fa0a6]">{flightData?.std_z || "0000Z"}</span>
            <span className="text-[#00bfa5]">➔</span>
            <span className="text-[#00bfa5]">{flightData?.arr_icao || "----"}</span> 
            <span className="text-[#8fa0a6]">{flightData?.sta_z || "0000Z"}</span>
          </div>

          <div className="border-l-2 border-[#34495e] h-[18px] mx-1"></div>
          
          <div className="flex items-center gap-3 text-[0.95rem] font-bold">
            <span className="text-[#00E676] flex items-center">
              <span className="inline-block w-2 h-2 bg-[#00E676] rounded-full mr-2 animate-pulse shadow-[0_0_8px_#00E676]"></span>
              LIVE
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative p-2">
        {currentTab === "DASH" && flightData && <Dashboard flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "NAVLOG" && flightData && <Navlog flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "WEATHER" && flightData && <Weather flightData={flightData} />}
        {currentTab === "NOTAM" && flightData && <Notam flightData={flightData} />}
        {currentTab === "ACARS" && flightData && <Acars flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "ATC" && flightData && <Atc flightData={flightData} updateFlightData={updateFlightData} />}
        
        {/* 🌟 掛載真實的 TechLog 組件 */}
        {currentTab === "TECHLOG" && flightData && <TechLog flightData={flightData} updateFlightData={updateFlightData} />}
      </main>

      <footer className="flex-none flex items-center justify-around gap-2 bg-[#11151a] border-t-2 border-[#00bfa5] px-2 py-2 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-5px_25px_rgba(0,0,0,0.8)] z-50">
        {navButtons.map((btn) => {
          const isActive = currentTab === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setCurrentTab(btn.id)}
              className={`
                flex-1 h-[60px] flex flex-col items-center justify-center rounded-xl border transition-all duration-200
                ${isActive ? "bg-[#00bfa5]/15 border-[#00bfa5]" : "bg-transparent border-transparent hover:bg-[#17202a]"}
              `}
            >
              <span className="text-xl mb-1">{btn.icon}</span>
              <span className={`text-[0.8rem] font-extrabold m-0 ${isActive ? "text-[#00bfa5]" : "text-[#8fa0a6]"}`}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </footer>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="bg-[#080a0d] min-h-screen"></div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
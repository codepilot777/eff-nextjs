"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import Navlog from "@/components/Navlog";
import Weather from "@/components/Weather";
import Notam from "@/components/Notam";
import Comms from "@/components/Comms";
import TechLog from "@/components/TechLog";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flightId = searchParams.get("id");
  const role = searchParams.get("role") || "Trainee";
  
  const [currentTab, setCurrentTab] = useState("DASH");
  const [flightData, setFlightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

 // 🌟 加入更新鎖定標記
  const isUpdatingRef = useRef(false);

  const fetchFlightData = async () => {
    // 🌟 如果更新緊，暫停獲取舊資料，防止畫面閃爍倒退
    if (!flightId || isUpdatingRef.current) return;
    try {
      const res = await fetch(`/api/flight?id=${encodeURIComponent(flightId)}`);
      if (res.ok) {
        setFlightData(await res.json());
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
    isUpdatingRef.current = true; // 🌟 鎖上更新鎖
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
    } finally {
      // 🌟 給雲端資料庫 1.5 秒時間完全寫入，然後才解鎖 Live Sync
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1500);
    }
  };


  const navButtons = [
    { id: "DASH", label: "DASHBOARD" },
    { id: "NAVLOG", label: "NAVLOG" },
    { id: "WEATHER", label: "WEATHER" },
    { id: "NOTAM", label: "NOTAM" },
    { id: "COMMS", label: "COMMUNICATION" },
    { id: "TECHLOG", label: "TECH LOG" },
  ];

  if (!flightId) return <div className="p-8 text-[#FF1744]">Error: Missing flight ID.</div>;

  const isActivated = flightData?.activated_version > 0;
  const versionStr = isActivated ? `V${flightData.activated_version} ACTIVATED` : `V${flightData?.ofp_version || 1} PENDING`;
  
  const dateObj = flightData?.std_unix ? new Date(flightData.std_unix * 1000) : new Date();
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();

  const depIcao = flightData?.dep_icao || "----";
  const arrIcao = flightData?.arr_icao || "----";
  
  const depIata = flightData?.raw_simbrief?.origin?.iata_code || "---";
  const arrIata = flightData?.raw_simbrief?.destination?.iata_code || "---";

  const eetMins = Math.floor((flightData?.eet_seconds || 0) / 60);
  const fltH = Math.floor(eetMins / 60).toString().padStart(2, '0');
  const fltM = (eetMins % 60).toString().padStart(2, '0');
  
  const blkMins = eetMins + 30;
  const blkH = Math.floor(blkMins / 60).toString().padStart(2, '0');
  const blkM = (blkMins % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0a] text-[#e2e8f0] font-sans">
      
      {isLoading && !flightData && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-2xl font-bold text-[#00bfa5] animate-pulse">Loading Flight {flightId}...</div>
        </div>
      )}

      <header className="flex-none flex items-center justify-between h-[70px] bg-[#1a1a1a] border-b-[3px] border-[#00bfa5] px-6 shadow-md z-50">
        <div className="flex items-center gap-4">
          <div className="text-[1.25rem] font-black text-[#00bfa5] cursor-pointer hover:text-white transition-colors" onClick={() => router.push(`/flight-select?role=${role}`)}>
            {flightData?.flight_no || flightId}
          </div>
          <div className={`text-[0.65rem] px-2 py-1 rounded font-bold border ${isActivated ? 'bg-[#00E676]/15 text-[#00E676] border-[#00E676]' : 'bg-[#FF9100]/15 text-[#FF9100] border-[#FF9100]'}`}>
            {versionStr}
          </div>
          <div className="text-[0.95rem] text-[#8fa0a6] font-bold tracking-widest">
            {dateStr}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-[#00bfa5] font-bold text-lg">{depIcao}</span>
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold mt-0.5">{depIata}</span>
          </div>
          <div className="text-[#333333] text-xl font-light">➔</div>
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-[#00bfa5] font-bold text-lg">{arrIcao}</span>
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold mt-0.5">{arrIata}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm font-mono font-bold">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[#8fa0a6] text-[0.65rem]">FLIGHT TIME</span>
              <span className="text-[#e2e8f0]">{fltH}:{fltM}</span>
            </div>
            <div className="border-l border-[#333333] h-6"></div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[#8fa0a6] text-[0.65rem]">BLOCK TIME</span>
              <span className="text-[#e2e8f0]">{blkH}:{blkM}</span>
            </div>
          </div>
          <div className="border-l border-[#333333] h-8 mx-2"></div>
          <div className="flex items-center text-[#00E676] text-xs font-bold tracking-wider">
            <span className="inline-block w-2 h-2 bg-[#00E676] rounded-full mr-2 animate-pulse shadow-[0_0_8px_#00E676]"></span>
            LIVE SYNC
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative p-2 bg-[#0a0a0a]">
        {currentTab === "DASH" && flightData && <Dashboard flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "NAVLOG" && flightData && <Navlog flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "WEATHER" && flightData && <Weather flightData={flightData} />}
        {currentTab === "NOTAM" && flightData && <Notam flightData={flightData} />}
        {currentTab === "COMMS" && flightData && <Comms flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "TECHLOG" && flightData && <TechLog flightData={flightData} updateFlightData={updateFlightData} />}
      </main>

      <footer className="flex-none flex items-center justify-around gap-2 bg-[#1a1a1a] border-t-2 border-[#00bfa5] px-2 py-2 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-5px_25px_rgba(0,0,0,0.8)] z-50">
        {navButtons.map((btn) => {
          const isActive = currentTab === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setCurrentTab(btn.id)}
              className={`
                flex-1 h-[50px] flex items-center justify-center rounded-lg border transition-all duration-200
                ${isActive ? "bg-[#00bfa5]/15 border-[#00bfa5] text-[#00bfa5]" : "bg-transparent border-transparent text-[#8fa0a6] hover:bg-[#2a2a2a] hover:text-white"}
              `}
            >
              <span className="text-sm font-black tracking-widest uppercase">
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
    <Suspense fallback={<div className="bg-[#0a0a0a] min-h-screen"></div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
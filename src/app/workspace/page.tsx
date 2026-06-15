"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級 Hook

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
  const [isSyncing, setIsSyncing] = useState(false);

  // 🌟 一行取代舊有嘅 useState, useEffect, setInterval, fetchFlightData!
  const { flightData, updateFlightData: rqUpdateFlightData, isLoading } = useFlightData();

  // 🌟 包裝 update 函數以保留你原本嘅 1.5 秒 Sync Icon 動畫
  const updateFlightData = (updates: any) => {
    setIsSyncing(true);
    rqUpdateFlightData(updates, {
      onSettled: () => setTimeout(() => setIsSyncing(false), 1500)
    });
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

  // --- 數據格式化 (對應 Cathay EFB 佈局) ---
  const isActivated = flightData?.activated_version > 0;
  const versionNum = isActivated ? flightData.activated_version : (flightData?.ofp_version || 1);
  const statusText = isActivated ? "ACTIVATED" : "NOT ACTIVATED";

  const dateObj = flightData?.std_unix ? new Date(flightData.std_unix * 1000) : new Date();
  const dayStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit' });
  const weekdayStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

  const depIcao = flightData?.dep_icao || "----";
  const arrIcao = flightData?.arr_icao || "----";
  const depIata = flightData?.raw_simbrief?.origin?.iata_code || "---";
  const arrIata = flightData?.raw_simbrief?.destination?.iata_code || "---";

  const stdZ = flightData?.std_z?.replace('Z', 'z') || "--z";
  const staZ = flightData?.sta_z?.replace('Z', 'z') || "--z";

  const getLocalTime = (zTimeStr: string, airportObj: any) => {
    if (!zTimeStr || zTimeStr === "--z" || zTimeStr.length < 5) return "----L";
    let offset = 8; 
    if (airportObj && airportObj.timezone !== undefined) {
      offset = parseFloat(airportObj.timezone); 
    }
    const hours = parseInt(zTimeStr.substring(0, 2), 10);
    const mins = parseInt(zTimeStr.substring(2, 4), 10);
    let totalMins = (hours * 60) + mins + Math.round(offset * 60);
    totalMins = ((totalMins % 1440) + 1440) % 1440; 
    const localHours = Math.floor(totalMins / 60);
    const localMins = totalMins % 60;
    return `${localHours.toString().padStart(2, '0')}${localMins.toString().padStart(2, '0')}L`;
  };

  const stdL = getLocalTime(stdZ, flightData?.raw_simbrief?.origin);
  const staL = getLocalTime(staZ, flightData?.raw_simbrief?.destination);

  const eetMins = Math.floor((flightData?.eet_seconds || 0) / 60);
  const fltH = Math.floor(eetMins / 60).toString().padStart(2, '0');
  const fltM = (eetMins % 60).toString().padStart(2, '0');
  
  const blkMins = eetMins + 40; 
  const blkH = Math.floor(blkMins / 60).toString().padStart(2, '0');
  const blkM = (blkMins % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0a] text-[#e2e8f0] font-sans">
      
      {isLoading && !flightData && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-xl font-bold text-white animate-pulse">Loading Flight...</div>
        </div>
      )}

      {/* 🌟 頂部 Header */}
      <header className="flex-none flex items-center justify-between h-[54px] bg-[#1E1E1E] px-4 shadow-md z-50 border-b border-[#333]">
        
        {/* 左側：Flight No & Version Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/flight-select?role=${role}`)}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#8fa0a6]">
              <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
            <span className="text-[1.1rem] font-bold text-white tracking-wide">{flightData?.flight_no || flightId}</span>
          </div>

          <div className={`flex items-center rounded-full overflow-hidden text-[0.65rem] font-bold h-6 ml-2 transition-colors ${isActivated ? 'bg-[#C6FF00] text-black' : 'bg-[#333] text-[#8fa0a6]'}`}>
            <div className={`px-3 flex items-center h-full border-r ${isActivated ? 'border-black/20' : 'border-[#444]'}`}>
              V{versionNum}
            </div>
            <div className="px-3 flex items-center h-full tracking-widest uppercase">
              {statusText}
            </div>
          </div>
        </div>

        {/* 中間：Route & Times */}
        <div className="flex items-center gap-6 text-sm font-bold ml-6 flex-1">
          <div className="flex flex-col items-center leading-none pr-4 border-r border-[#444]">
            <span className="text-[1.1rem] text-white">{dayStr}</span>
            <span className="text-[0.6rem] text-[#8fa0a6]">{weekdayStr}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start leading-none gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-white text-[0.95rem]">{depIcao}</span>
                <span className="text-white text-xs">{stdZ}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[#8fa0a6] text-[0.7rem]">{depIata}</span>
                <span className="text-[#8fa0a6] text-[0.7rem]">{stdL}</span> 
              </div>
            </div>

            <span className="text-[#8fa0a6] text-lg mx-1">✈️</span>

            <div className="flex flex-col items-start leading-none gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-white text-[0.95rem]">{arrIcao}</span>
                <span className="text-white text-xs">{staZ}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[#8fa0a6] text-[0.7rem]">{arrIata}</span>
                <span className="text-[#8fa0a6] text-[0.7rem]">{staL}</span> 
              </div>
            </div>
          </div>

          <div className="flex gap-4 ml-4">
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-[#8fa0a6] text-[0.6rem] uppercase tracking-wide">Flight time</span>
              <span className="text-white text-sm">{fltH}{fltM}</span>
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-[#8fa0a6] text-[0.6rem] uppercase tracking-wide">Block time</span>
              <span className="text-white text-sm">{blkH}{blkM}</span>
            </div>
          </div>
        </div>

        {/* 右側：Notepad & Icons */}
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Notepad" 
            className="bg-[#2A2A2A] text-white px-3 py-1.5 rounded-md text-[0.8rem] border-none outline-none w-48 placeholder:text-[#555]"
          />
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isSyncing ? 'text-[#00E676]' : 'text-[#8fa0a6]'}`}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C6FF00] text-black">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-white bg-[#333]">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* 🌟 主內容區 */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative bg-[#0a0a0a] pt-4 px-4 pb-2">
        {/* 🌟 重點：Dashboard 已經獨立，只傳 flightId！其餘 Component 暫時保持不變 */}
        {currentTab === "DASH" && flightData && <Dashboard setCurrentTab={setCurrentTab} />}
        {currentTab === "NAVLOG" && flightData && <Navlog flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "WEATHER" && flightData && <Weather flightData={flightData} />}
        {currentTab === "NOTAM" && flightData && <Notam flightData={flightData} />}
        {currentTab === "COMMS" && flightData && <Comms flightData={flightData} updateFlightData={updateFlightData} />}
        {currentTab === "TECHLOG" && flightData && <TechLog flightData={flightData} updateFlightData={updateFlightData} />}
      </main>

      {/* 🌟 底部 Tabs */}
      <footer className="flex-none flex items-center justify-around gap-1 bg-[#121212] border-t border-[#333] px-2 py-1.5 pb-[max(8px,env(safe-area-inset-bottom))] z-50">
        {navButtons.map((btn) => {
          const isActive = currentTab === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setCurrentTab(btn.id)}
              className={`
                flex-1 h-[42px] flex items-center justify-center rounded transition-all duration-200
                ${isActive ? "bg-[#333333] text-white" : "bg-transparent text-[#8fa0a6] hover:bg-[#1E1E1E] hover:text-white"}
              `}
            >
              <span className="text-xs font-bold tracking-wider uppercase">
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
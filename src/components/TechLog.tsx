"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import TechLogTopBar from "./techlog/TechLogTopBar";
import TechLogDashboard from "./techlog/TechLogDashboard";
import TechLogHistory from "./techlog/TechLogHistory";
import TechLogReporting from "./techlog/TechLogReporting";

export default function TechLog({ flightData }: { flightData: any, updateFlightData?: any, forcedRole?: string }) {
  const searchParams = useSearchParams();
  const roleParam = (searchParams.get("role") || "").toLowerCase();
  const isInstructor = roleParam === "instructor" || roleParam === "ios";
  const isTrainee = roleParam === "trainee";

  const [roleMode, setRoleMode] = useState<"FLIGHT CREW" | "ENGINEER">(isInstructor ? "ENGINEER" : "FLIGHT CREW");
  
  useEffect(() => { setRoleMode(isInstructor ? "ENGINEER" : "FLIGHT CREW"); }, [isInstructor]);
  
  const [activeNav, setActiveNav] = useState<"dashboard" | "history" | "reporting">("dashboard");
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [showInFlightMenu, setShowInFlightMenu] = useState(false);

  const [tlData, setTlData] = useState<any>(null);
  const [tlLoading, setTlLoading] = useState(true);
  const isUpdatingTl = useRef(false);

  const currFlt = flightData?.flight_no || "CPA 564";

  const fetchTechLog = async () => {
    if (!currFlt || isUpdatingTl.current) return;
    try {
      const res = await fetch(`/api/techlog?flight_no=${encodeURIComponent(currFlt)}`);
      if (res.ok) setTlData(await res.json());
    } catch (e) { console.error(e); } finally { setTlLoading(false); }
  };

  useEffect(() => {
    fetchTechLog();
    const interval = setInterval(fetchTechLog, 3000);
    return () => clearInterval(interval);
  }, [currFlt]);

  const updateTechLogData = async (updates: any) => {
    isUpdatingTl.current = true;
    const updated = { ...tlData, ...updates };
    setTlData(updated);
    try {
      await fetch('/api/techlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flight_no: currFlt, data: updated })
      });
    } catch (e) {} finally { setTimeout(() => { isUpdatingTl.current = false; }, 1200); }
  };

  if (tlLoading || !tlData) {
    return <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a] text-xl font-bold text-[#00bfa5] animate-pulse">LOADING E-TECHLOG SECURE DATABASE...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#0a0a0a] animate-fade-in">
      
      <TechLogTopBar 
        tlData={tlData} flightData={flightData} roleMode={roleMode} 
        setRoleMode={setRoleMode} setActiveTask={setActiveTask} 
        setShowInFlightMenu={setShowInFlightMenu} isTrainee={isTrainee} 
      />

      <div className="flex-1 overflow-hidden flex gap-4 pb-2">
        {activeNav === "dashboard" && (
          <TechLogDashboard 
            tlData={tlData} flightData={flightData} roleMode={roleMode} 
            activeTask={activeTask} setActiveTask={setActiveTask} 
            selectedEntry={selectedEntry} setSelectedEntry={setSelectedEntry} 
            showInFlightMenu={showInFlightMenu} setShowInFlightMenu={setShowInFlightMenu} 
            updateTechLogData={updateTechLogData} 
          />
        )}
        {activeNav === "history" && <TechLogHistory tlData={tlData} />}
        {activeNav === "reporting" && (
          <TechLogReporting tlData={tlData} updateTechLogData={updateTechLogData} roleMode={roleMode} setActiveNav={setActiveNav} />
        )}
      </div>

      {/* 🚀 BOTTOM NAV BAR */}
      <div className="flex items-center justify-around gap-2 bg-[#1a1a1a] border-t border-[#404040] px-2 py-3 mt-auto shrink-0 shadow-lg relative z-20">
        {[
          { id: "dashboard", label: "Dashboard", icon: "📊" },
          { id: "history", label: "History", icon: "🕒" },
          { id: "reporting", label: "Reporting", icon: "📝" }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => { setActiveNav(btn.id as any); setActiveTask(null); setShowInFlightMenu(false); }}
            className={`flex-1 py-3 rounded-lg font-black tracking-widest text-sm transition-colors border ${
              activeNav === btn.id 
                ? "bg-[#00bfa5]/20 text-[#00bfa5] border-[#00bfa5]" 
                : "bg-transparent text-[#8fa0a6] border-transparent hover:bg-[#2a2a2a]"
            }`}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

    </div>
  );
}
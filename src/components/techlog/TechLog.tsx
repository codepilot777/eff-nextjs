"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { applyTechLogDirectives, TechLogPatch } from "@/lib/techlog/directives";

import TechLogTopBar from "./TechLogTopBar";
import TechLogDashboard from "./TechLogDashboard";
import TechLogHistory from "./TechLogHistory";
import TechLogReporting from "./TechLogReporting";

// 🌟 Props 終極大清洗：咩都唔使收！
export default function TechLog({ forcedRole }: { forcedRole?: string }) {
  
  // 🌟 從天上直接抽取 Data
  const { flightData } = useFlightData();

  const searchParams = useSearchParams();
  const roleParam = (searchParams.get("role") || "").toLowerCase();
  // 🌟 修復：之前 forcedRole prop 完全冇讀過，導致 TechLogModal 傳嘅 forcedRole="instructor"
  // 係死 prop——教官喺 IOS 開 E-TechLog 預設落咗喺 FLIGHT CREW 模式，要自己手動切換
  const isInstructor = forcedRole === "instructor" || roleParam === "instructor" || roleParam === "ios";
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

  // 監聽來自 Dashboard 嘅跳轉指令
  useEffect(() => {
    const handleOpenTask = (e: any) => {
      setActiveTask(e.detail);
    };
    window.addEventListener('open-techlog-task', handleOpenTask);
    
    return () => {
      window.removeEventListener('open-techlog-task', handleOpenTask);
    };
  }, []);

  // 防呆保護
  if (!flightData) return null;

  // 🌟 1. 攞返個 flight session id——techlog 而家 key by flight id（唔再係
  // aircraft reg），同一機牌嘅唔同 session 唔會再共用/互相蓋走 techlog（睇
  // db.ts migrateTechlogsTable 嘅 comment）
  const flightId = searchParams.get("id");

  // 🌟 2. Fetch 時使用 flight id 參數 (保留原有獨立 Polling 邏輯以策安全)
  const fetchTechLog = async () => {
    if (!flightId || isUpdatingTl.current) return;
    try {
      const res = await fetch(`/api/techlog?id=${encodeURIComponent(flightId)}`);
      if (res.ok) setTlData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setTlLoading(false);
    }
  };

  useEffect(() => {
    fetchTechLog();
    const interval = setInterval(fetchTechLog, 3000);
    return () => clearInterval(interval);
  }, [flightId]);

  // 🌟 3. Update 時 Payload 傳送 flight id
  // patch 可以係扁平 { field: value } (向後兼容，等同 { data: patch })，
  // 亦可以帶埋 directive 欄位 (defectUpdate/defectAppend/tlEntryAppend/...)
  const updateTechLogData = async (patch: TechLogPatch | Record<string, unknown>) => {
    const normalized: TechLogPatch = 'data' in patch || Object.keys(patch).some((k) =>
      ['defectUpdate', 'defectAppend', 'tlEntryAppend', 'tlEntriesReset', 'flightsPrepend', 'signOffDefects'].includes(k)
    ) ? (patch as TechLogPatch) : { data: patch as Record<string, unknown> };

    isUpdatingTl.current = true;
    // 本地即刻用返同一套 directive 邏輯合併，保持 UI 即時反應同server 行為一致
    setTlData((prev: Record<string, unknown> | null) => applyTechLogDirectives(prev || {}, normalized));
    try {
      const res = await fetch('/api/techlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flightId, ...normalized })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to update tech log (${res.status})`);
      }
    } catch (e) {
      console.error(e);
      alert(`⚠️ Failed to save tech log update: ${e instanceof Error ? e.message : String(e)}`);
      // 🌟 送失敗就重新 fetch 一次，令本地樂觀更新同 server 對返齊，唔好停留喺已經失效嘅狀態
      fetchTechLog();
    } finally {
      setTimeout(() => { isUpdatingTl.current = false; }, 1200);
    }
  };

  if (tlLoading || !tlData) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
        <svg className="w-10 h-10 text-[#00E676] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-sm font-mono tracking-widest text-[#8fa0a6] animate-pulse">CONNECTING TO E-TECHLOG DB...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#0a0a0a] animate-fade-in font-sans">
      
      <TechLogTopBar 
        tlData={tlData} flightData={flightData} roleMode={roleMode} 
        setRoleMode={setRoleMode} setActiveTask={setActiveTask} 
        setShowInFlightMenu={setShowInFlightMenu} isTrainee={isTrainee} 
      />

      {/* 🌟 Mobile：Left/Right panel 以前並排 + overflow-hidden 裁到 right panel
          嘅內容睇唔晒，而家 mobile 上下疊，用返自然文檔流 scroll */}
      <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row gap-4 pb-2">
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
      <div className="flex items-center justify-around gap-2 bg-[#1a1a1a] border-t border-[#333] px-3 py-3 mt-auto shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] relative z-20">
        
        {/* Dashboard Button */}
        <button
          onClick={() => { setActiveNav("dashboard"); setActiveTask(null); setShowInFlightMenu(false); }}
          className={`flex-1 py-3.5 rounded-xl font-bold tracking-widest text-[0.75rem] uppercase transition-colors border flex items-center justify-center gap-2.5 outline-none ${
            activeNav === "dashboard" 
              ? "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30 shadow-inner" 
              : "bg-transparent text-[#8fa0a6] border-transparent hover:bg-[#252525] hover:text-white"
          }`}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          Dashboard
        </button>

        {/* History Button */}
        <button
          onClick={() => { setActiveNav("history"); setActiveTask(null); setShowInFlightMenu(false); }}
          className={`flex-1 py-3.5 rounded-xl font-bold tracking-widest text-[0.75rem] uppercase transition-colors border flex items-center justify-center gap-2.5 outline-none ${
            activeNav === "history" 
              ? "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30 shadow-inner" 
              : "bg-transparent text-[#8fa0a6] border-transparent hover:bg-[#252525] hover:text-white"
          }`}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>

        {/* Reporting Button */}
        <button
          onClick={() => { setActiveNav("reporting"); setActiveTask(null); setShowInFlightMenu(false); }}
          className={`flex-1 py-3.5 rounded-xl font-bold tracking-widest text-[0.75rem] uppercase transition-colors border flex items-center justify-center gap-2.5 outline-none ${
            activeNav === "reporting" 
              ? "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30 shadow-inner" 
              : "bg-transparent text-[#8fa0a6] border-transparent hover:bg-[#252525] hover:text-white"
          }`}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Reporting
        </button>

      </div>
    </div>
  );
}
"use client";
import { useState } from "react";
import { PMDG_FAILURES, PmdgCommand } from "@/data/pmdgCommands";
import { sendPMDGControl, fireCDUMacro } from "@/services/pmdgService";

export default function FailuresView({ isConnected, sendToFSUIPC, telemetryData }: any) {
  const [isArmed, setIsArmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  // 🌟 修正點 1：用 State 陣列追蹤當前哪些故障正處於 Active 狀態，取代彈出式的 alert
  const [activeFailures, setActiveFailures] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000); // 3秒後非阻塞自動消失
  };

  const handleFailureClick = (f: PmdgCommand) => {
    const hasDispatchMethod = !!(f.macroSequence || f.eventId);
    // 🌟 防呆：呢類 entry 淨係嚟自 MEL map 對應，未有實測過嘅 CDU macro，唔應該可以撳
    // （按鈕本身已經 disabled，呢度係俾 handler 保持誠實，以防日後喺第二個地方重用）
    if (!hasDispatchMethod) return;

    const isActive = activeFailures.includes(f.id);

    if (isActive) {
      // 🌟 修正點 2：支援復原（Clear），傳入參數 0 代表修復該系統
      if (f.eventId) sendPMDGControl(sendToFSUIPC, f.eventId, 0); 
      setActiveFailures(prev => prev.filter(id => id !== f.id));
      triggerToast(`🟢 Failure Cleared: ${f.name}`);
    } else {
      // 注入故障（Inject），傳入參數 1 代表破壞
      if (f.macroSequence) fireCDUMacro(sendToFSUIPC, f.macroSequence);
      else if (f.eventId) sendPMDGControl(sendToFSUIPC, f.eventId, 1);
      setActiveFailures(prev => [...prev, f.id]);
      triggerToast(`🚀 Sabotage Injected: ${f.name}`);
    }
  };

  const filteredFailures = PMDG_FAILURES.filter((f) => 
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (selectedCategory === "ALL" || f.category === selectedCategory)
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 relative">
      
      {/* 🌟 智能非阻塞 Toast 提示條 */}
      {toastMessage && (
        <div className="absolute top-16 right-4 z-50 bg-[#1a1a1a] border border-[#00bfa5] text-white text-xs font-mono px-4 py-2.5 rounded-lg shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00bfa5] animate-ping" />
          {toastMessage}
        </div>
      )}

      {/* Control Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#151515] p-3 rounded-xl border border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-gray-500 pl-2">🔍</span>
          <input type="text" placeholder="SEARCH FAILURE..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent text-sm font-mono focus:outline-none w-full text-white placeholder-gray-600 uppercase tracking-wider" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto py-1">
          {["ALL", "ENGINE", "HYDRAULIC", "ELECTRICAL", "FUEL", "AIR", "APU"].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded text-[0.65rem] font-mono font-black tracking-widest transition-all ${selectedCategory === cat ? "bg-[#00bfa5] text-black" : "bg-[#252525] text-gray-400 hover:text-white"}`}>{cat}</button>
          ))}
        </div>
        <button onClick={() => setIsArmed(!isArmed)} className={`px-5 py-2 rounded-lg font-mono text-xs font-black tracking-widest transition-all ${isArmed ? "bg-[#FF1744] text-white animate-pulse border border-[#FF1744] shadow-[0_0_12px_rgba(255,23,68,0.4)]" : "bg-[#2A2A2A] text-gray-500 border border-[#444]"}`}>
          {isArmed ? "⚠️ INJECTION ARMED" : "🔒 INJECTION SAFE"}
        </button>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 content-start">
        {filteredFailures.map((f: PmdgCommand) => {
          const isCurrentActive = activeFailures.includes(f.id);
          const hasDispatchMethod = !!(f.macroSequence || f.eventId);

          return (
            <button
              key={f.id}
              disabled={!isArmed || !isConnected || !hasDispatchMethod}
              onClick={() => handleFailureClick(f)}
              title={f.melRefs ? `MEL Ref: ${f.melRefs.join(", ")}` : undefined}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all select-none group min-h-[90px] relative ${
                // 🌟 未有實測過嘅 macro：無論連線/armed 狀態點都要顯示做「MACRO PENDING」，行行企企唔可以撳
                !hasDispatchMethod ? "bg-[#1a1a1a] border-dashed border-[#555] opacity-60 cursor-not-allowed" :
                !isConnected ? "bg-[#222]/30 border-[#333] opacity-30 cursor-not-allowed" :
                !isArmed ? "bg-[#252525] border-[#333] opacity-50 cursor-not-allowed" :
                isCurrentActive ? "bg-[#42161C] border-[#FF1744] shadow-[0_0_15px_rgba(255,23,68,0.2)] animate-pulse" : // 🌟 活化狀態：紅色高亮閃爍
                f.severity === "CRITICAL" ? "bg-[#2A1518] border-[#FF1744]/30 hover:border-[#FF1744] active:scale-95" :
                "bg-[#2A2115] border-[#FF9100]/30 hover:border-[#FF9100] active:scale-95"
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[0.6rem] font-mono font-bold uppercase tracking-widest text-gray-500 px-1.5 py-0.5 rounded bg-black/40">{f.category || "SYS"}</span>
                {hasDispatchMethod ? (
                  <span className={`w-2 h-2 rounded-full ${isCurrentActive ? 'bg-[#FF1744] shadow-[0_0_8px_#FF1744]' : f.severity === 'CRITICAL' ? 'bg-[#FF1744]/40' : 'bg-[#FF9100]/40'}`} />
                ) : (
                  <span className="text-[0.55rem] font-mono font-bold uppercase tracking-widest text-gray-600 px-1.5 py-0.5 rounded border border-dashed border-gray-600">Pending</span>
                )}
              </div>
              <h5 className={`text-xs font-black uppercase tracking-wide mt-2 ${isCurrentActive ? 'text-[#FF1744]' : !isArmed || !hasDispatchMethod ? 'text-gray-400' : 'text-white'}`}>
                {isCurrentActive ? `⚠️ INOP: ${f.name}` : f.name}
              </h5>
              {f.melRefs && (
                <span className="text-[0.55rem] font-mono text-gray-600 mt-1 truncate">
                  MEL: {f.melRefs.join(", ")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
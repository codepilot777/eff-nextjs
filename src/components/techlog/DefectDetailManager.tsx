// src/components/techlog/DefectDetailManager.tsx
"use client";
import React, { useState, useEffect } from "react";
import { searchMelItems, getMelItem, MelItem } from "@/lib/mel/melRegistry";

// 🌟 真實嘅標準 MEL 分類補救期限（唔係亂作，係航空業界通用嘅 A/B/C/D 分類）
const MEL_CATEGORY_DEADLINES: Record<string, string> = {
  A: "AS SPECIFIED",
  B: "3 DAYS",
  C: "10 DAYS",
  D: "120 DAYS",
};

interface DefectDetailManagerProps {
  selectedEntry: string;
  defects: any[];
  roleMode: "ENGINEER" | "FLIGHT CREW";
  ahm: any;
  marginZfw: number;
  getMarginStr: (m: number) => string;
  getMarginColor: (m: number) => string;
  onClear: (id: string, actionDesc: string) => void;
  onDefer: (id: string, type: string, mel: string, reason: string) => void;
}

export function DefectDetailManager({
  selectedEntry,
  defects,
  roleMode,
  ahm,
  marginZfw,
  getMarginStr,
  getMarginColor,
  onClear,
  onDefer
}: DefectDetailManagerProps) {
  
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  const [engActionType, setEngActionType] = useState(""); 
  const [clearDesc, setClearDesc] = useState("");
  const [deferType, setDeferType] = useState("PADD");
  const [melSearch, setMelSearch] = useState("");
  const [melResults, setMelResults] = useState<MelItem[]>([]);
  const [selectedMel, setSelectedMel] = useState<MelItem | null>(null);
  const [deferReason, setDeferReason] = useState("");

  useEffect(() => {
    setEngActionType("");
    setShowActionsMenu(false);
    setClearDesc("");
    setDeferType("PADD");
    setMelSearch("");
    setMelResults([]);
    setSelectedMel(null);
    setDeferReason("");
  }, [selectedEntry]);

  const sel = defects.find((d: any) => d.id === selectedEntry);
  if (!sel) return <div className="text-gray-500 font-mono text-xs">Entry Not Found.</div>;

  // 🌟 由真實 MEL registry 查返呢條 defect 對應嘅分類，先至知道真正嘅補救期限
  const deferredMelInfo = sel.mel_ref ? getMelItem(sel.mel_ref) : null;
  const deadlineText = deferredMelInfo ? (MEL_CATEGORY_DEADLINES[deferredMelInfo.category] || "N/A") : "N/A";

  const getStatusBadge = (status: string) => {
    if (status === "OPEN") return "bg-[#FF1744]/20 text-[#FF1744] border-[#FF1744]/40";
    if (status === "DEFERRED") return "bg-[#FF9100]/20 text-[#FF9100] border-[#FF9100]/40";
    return "bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40";
  };

  const handleMelSearch = (val: string) => {
    setMelSearch(val);
    if (val.length >= 2) setMelResults(searchMelItems(val));
    else setMelResults([]);
  };

  const handleSelectMel = (item: MelItem) => {
    setSelectedMel(item);
    setMelSearch(item.ataCode);
    setMelResults([]);
    
    // 🌟 優化 Auto-fill：使用更專業簡潔的航空術語，避免超長備註塞爆輸入框
    let autoFillReason = `Deferred IAW MEL ${item.ataCode} (${item.title}). `;
    if (item.maintenanceProcedures) autoFillReason += `(M) Procedures complied with. `;
    if (item.operationalProcedures) autoFillReason += `(O) Procedures apply. `;
    
    setDeferReason(autoFillReason);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* 📌 Header 區 */}
      <div className="flex justify-between items-center border-b border-[#333] pb-4 mb-5">
        <h3 className="text-lg font-bold font-mono text-white flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-md border font-sans ${getStatusBadge(sel.status)}`}>
            {sel.status}
          </span>
          DEFECT LOG: {sel.id}
        </h3>
        <span className="text-xs text-[#8fa0a6] font-mono">AIRCRAFT: {ahm.reg}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 text-xs text-[#e2e8f0] flex flex-col gap-4 scrollbar-thin scrollbar-thumb-[#444]">
        
        {/* 📊 1. 航空級元數據面板 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0a0a0a] p-4 border border-[#252525] rounded-xl font-mono text-[0.7rem]">
          <div><span className="text-[#8fa0a6] block mb-0.5">REPORTED BY</span><span className="text-white font-sans font-bold">{sel.reported_by || "FLT CREW"}</span></div>
          <div><span className="text-[#8fa0a6] block mb-0.5">LOG DATE/TIME</span><span className="text-white font-bold">{sel.reported_time || sel.time || "N/A"}</span></div>
          <div><span className="text-[#8fa0a6] block mb-0.5">FLIGHT PHASE</span><span className="text-yellow-500 font-bold">{sel.flight_phase || "N/A"}</span></div>

          {sel.status === "DEFERRED" && (
            <>
              <div className="border-t border-[#222] pt-2"><span className="text-[#FF9100] block mb-0.5">MEL REFERENCE</span><span className="text-white font-bold">{sel.mel_ref || "N/A"}</span></div>
              <div className="border-t border-[#222] pt-2"><span className="text-[#FF9100] block mb-0.5">DEFERRAL TYPE</span><span className="text-white font-bold">{sel.deferral_type || "PADD"}</span></div>
              <div className="border-t border-[#222] pt-2"><span className="text-[#FF9100] block mb-0.5">DEADLINE</span><span className="text-red-400 font-bold">{deferredMelInfo ? `CAT ${deferredMelInfo.category} (${deadlineText})` : "N/A"}</span></div>
            </>
          )}
          {sel.status === "CLEARED" && (
            <div className="col-span-2 sm:col-span-3 border-t border-[#222] pt-2 flex justify-between items-center">
              <div><span className="text-[#00E676] block mb-0.5">CLEARED BY</span><span className="text-white font-bold">{sel.cleared_by || "N/A"}</span></div>
              <div className="text-right text-[#8fa0a6]">{sel.cleared_time ? `at ${sel.cleared_time}` : ""}</div>
            </div>
          )}
        </div>

        {/* 📝 2. 原始缺陷接報文 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.65rem] uppercase tracking-widest font-bold text-[#8fa0a6]">Original Defect Statement</span>
          <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#333] font-mono text-[0.75rem] leading-relaxed text-white shadow-inner">
            "{sel.description}"
          </div>
        </div>

        {/* 🧾 3. 歷史處置日誌 */}
        {sel.status === "DEFERRED" && (
          <div className="flex flex-col gap-1.5 border-l-2 border-[#FF9100] pl-3 py-1 bg-[#FF9100]/5 rounded-r-xl p-3">
            <span className="text-[0.65rem] uppercase tracking-widest font-bold text-[#FF9100]">MEL Authorization & Action Taken</span>
            <p className="font-mono text-[0.72rem] leading-relaxed text-white m-0">{sel.deferral_reason}</p>
          </div>
        )}
        {sel.status === "CLEARED" && (
          <div className="flex flex-col gap-1.5 border-l-2 border-[#00E676] pl-3 py-1 bg-[#00E676]/5 rounded-r-xl p-3">
            <span className="text-[0.65rem] uppercase tracking-widest font-bold text-[#00E676]">Rectification Log</span>
            <p className="font-mono text-[0.72rem] leading-relaxed text-white m-0">{sel.action_desc}</p>
          </div>
        )}

        {/* 🔧 4. 維修處置選單 */}
        {roleMode === "ENGINEER" && sel.status !== "CLEARED" && (
          <div className="mt-4 border-t border-[#333] pt-5 flex flex-col gap-4 relative">
            <h4 className="text-[0.65rem] uppercase tracking-widest font-bold text-[#8fa0a6]">
              {sel.status === "DEFERRED" ? "Further Maintenance Action (ADD Review)" : "Maintenance Disposition Action"}
            </h4>
            
            <div className="relative w-full">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className={`w-full bg-[#0a0a0a] border text-[0.75rem] font-bold px-4 py-3.5 rounded-xl transition-all flex items-center justify-between outline-none uppercase tracking-wider ${
                  engActionType === "Clear Defect" ? "border-[#C6FF00]/60 text-[#C6FF00]" :
                  engActionType === "Defer Defect" ? "border-[#FF9100]/60 text-[#FF9100]" :
                  "border-[#444] text-white hover:border-[#00E676]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                  <span>{engActionType || (sel.status === "DEFERRED" ? "Modify / Rectify this ADD" : "Select Maintenance Disposition")}</span>
                </div>
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 text-[#8fa0a6] transition-transform duration-200 ${showActionsMenu ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              
              {showActionsMenu && (
                <div className="absolute left-0 right-0 mt-2 w-full bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden p-1 z-[60] animate-fade-in">
                  <button 
                    onClick={() => { setEngActionType("Clear Defect"); setShowActionsMenu(false); }}
                    className="text-left px-4 py-3.5 text-[#C6FF00] text-[0.72rem] uppercase tracking-widest font-black hover:bg-[#C6FF00]/10 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Clear Defect (Rectify & Close Log)
                  </button>
                  <div className="h-px bg-[#333] my-1 mx-2"></div>
                  <button 
                    onClick={() => { setEngActionType("Defer Defect"); setShowActionsMenu(false); }}
                    className="text-left px-4 py-3.5 text-[#FF9100] text-[0.72rem] uppercase tracking-widest font-black hover:bg-[#FF9100]/10 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    {sel.status === "DEFERRED" ? "Further Defer / Update MEL Info" : "Defer Defect (Apply MEL Authorization)"}
                  </button>
                </div>
              )}
            </div>
            
            {/* 🛠️ A. 現場打鐵修復面版 */}
            {engActionType === "Clear Defect" && (
              <div className="animate-fade-in mt-1">
                <textarea 
                  value={clearDesc}
                  onChange={(e) => setClearDesc(e.target.value)}
                  placeholder="Enter detailed rectification actions taken, tooling used, and AMM testing standard applied..." 
                  className="w-full h-28 bg-[#0a0a0a] border border-[#444] p-4 rounded-xl text-white font-mono text-[0.75rem] outline-none focus:border-[#00E676] transition-colors mb-3 resize-none leading-relaxed" 
                />
                <button onClick={() => onClear(sel.id, clearDesc)} className="w-full py-4 bg-[#C6FF00] text-black text-[0.75rem] uppercase tracking-widest font-black rounded-xl hover:bg-[#a8db00] transition-colors shadow-lg">
                  SIGN CERTIFICATE OF RELEASE TO SERVICE (CRS)
                </button>
              </div>
            )}
            
            {/* 🔒 B. 智能 MEL 缺陷保留簽發 */}
            {engActionType === "Defer Defect" && (
              <div className="animate-fade-in mt-1 flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_2fr] gap-3">
                  <select value={deferType} onChange={(e) => setDeferType(e.target.value)} className="bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl text-white text-[0.75rem] font-bold tracking-widest uppercase outline-none focus:border-[#FF9100] appearance-none">
                    <option value="PADD">PADD</option>
                    <option value="SADD">SADD</option>
                    <option value="ADD">ADD</option>
                  </select>

                  <div className="relative">
                    <input type="text" value={melSearch} onChange={(e) => handleMelSearch(e.target.value)} placeholder="Search MEL Code/System..." className="w-full bg-[#0a0a0a] border border-[#444] p-3.5 rounded-xl text-white text-[0.75rem] font-mono outline-none focus:border-[#FF9100] uppercase" />
                    {melResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-[#252525] border border-[#444] rounded-xl shadow-2xl max-h-40 overflow-y-auto z-50 text-[0.7rem]">
                        {melResults.map(item => (
                          <div key={item.ataCode} onClick={() => handleSelectMel(item)} className="p-3 hover:bg-[#FF9100] hover:text-black cursor-pointer border-b border-[#333] font-mono flex justify-between">
                            <span className="font-bold">{item.ataCode}</span>
                            <span className="truncate max-w-[180px] opacity-80">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 🌟 升級版 MEL 詳細資料面板：全面展現你 Parser 的 3D 數據！ */}
                {selectedMel && (
                  <div className="bg-[#151515] border border-[#FF9100]/40 rounded-xl p-3 text-[0.7rem] font-mono animate-fade-in flex flex-col gap-2 shadow-inner">
                    
                    {/* Header: Code & Category */}
                    <div className="flex justify-between items-center text-[#FF9100] font-black border-b border-[#333] pb-1.5">
                      <span className="text-sm tracking-widest">{selectedMel.ataCode}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-[0.6rem]">INST: {selectedMel.installed} | REQ: {selectedMel.required}</span>
                        <span className="bg-[#FF9100]/20 text-[#FF9100] px-1.5 py-0.5 rounded">CAT {selectedMel.category}</span>
                      </div>
                    </div>
                    
                    <p className="text-white font-bold font-sans m-0 leading-tight">{selectedMel.title}</p>
                    
                    {/* Badges: (M) & (O) 醒目提示 */}
                    <div className="flex gap-2 my-1">
                      {selectedMel.maintenanceProcedures && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded text-[0.6rem] font-bold tracking-wider">(M) PROCEDURE REQ</span>}
                      {selectedMel.operationalProcedures && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded text-[0.6rem] font-bold tracking-wider">(O) PROCEDURE REQ</span>}
                    </div>
                    
                    {/* Remarks: Scrollable Area */}
                    <div className="bg-black/50 p-2.5 rounded border border-[#222] max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-[#444]">
                      <span className="text-[#8fa0a6] block mb-1 font-bold text-[0.6rem] uppercase tracking-widest">Dispatch Provisos / Remarks</span>
                      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed m-0 text-[0.65rem]">{selectedMel.remarks || "No provisos listed."}</p>
                    </div>

                    {/* Maintenance Note Preview (如果有) */}
                    {selectedMel.maintenanceNote && (
                      <div className="mt-1 border-l-2 border-blue-500 pl-2">
                        <span className="text-blue-400 font-bold block text-[0.6rem] tracking-widest mb-0.5">MAINTENANCE INSTRUCTIONS:</span>
                        <p className="text-gray-400 text-[0.65rem] line-clamp-3 leading-tight m-0">{selectedMel.maintenanceNote}</p>
                      </div>
                    )}
                  </div>
                )}

                <textarea value={deferReason} onChange={(e) => setDeferReason(e.target.value)} placeholder="Justify reason for deferral..." className="w-full h-28 bg-[#0a0a0a] border border-[#444] p-4 rounded-xl text-white font-mono text-[0.75rem] outline-none focus:border-[#FF9100] transition-colors mb-2 resize-none leading-relaxed" />
                <div className="text-[0.6rem] text-[#8fa0a6] bg-[#0a0a0a] p-2.5 border border-[#222] rounded-lg mb-1 leading-normal flex items-center justify-between">
                  <span>⚠️ System Limit Check ({ahm.reg})</span>
                  <span>ZFW Margin: <span className={getMarginColor(marginZfw)}>{getMarginStr(marginZfw)} T</span></span>
                </div>
                {/* 🌟 修復：以前 send melSearch（自由輸入嘅文字），撳咗個 MEL 之後仲可以改
                    個輸入框，令實際送出嘅同畫面顯示緊嘅 MEL 詳情唔一致。而家送 selectedMel.ataCode，
                    即係實際顯示緊嗰條——按鈕本身已經 disabled={!selectedMel}，所以呢度一定唔會係 null */}
                <button onClick={() => onDefer(sel.id, deferType, selectedMel!.ataCode, deferReason)} disabled={!selectedMel} className={`w-full py-4 text-black text-[0.75rem] uppercase tracking-widest font-black rounded-xl transition-all ${selectedMel ? 'bg-[#FF9100] hover:bg-orange-500 shadow-lg' : 'bg-[#333] text-[#666] cursor-not-allowed'}`}>
                  CONFIRM MAINTENANCE DISPOSITION
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
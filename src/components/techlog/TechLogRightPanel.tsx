// src/components/techlog/TechLogRightPanel.tsx
"use client";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { executeDualDispatch } from "@/services/dualDispatchService";
import { useFlightData } from "@/hooks/useFlightData";
import { useSim } from "@/hooks/useSim";
import { getMargin, getMarginColor, getMarginStr, getZfwValue } from "@/lib/marginHelpers";
// 🌟 引入剛剛解耦出來的缺陷詳情管家
import { DefectDetailManager } from "./DefectDetailManager";
import { 
  TaskPrepareFlight, TaskFuelRecord, TaskAcceptance, 
  TaskNormalClose, TaskGroundReturn, TaskAirReturn, 
  TaskDiversion, TaskDidNotDepart 
} from "./forms";

export default function TechLogRightPanel({ tlData, flightData, roleMode, activeTask, setActiveTask, selectedEntry, showInFlightMenu, setShowInFlightMenu, updateTechLogData, defects }: any) {
  
  const { calc } = useFlightData(); // 接通核心計算大腦
  const { sendToFSUIPC, isConnected} = useSim();
  const { tl_flight_started: isStarted } = tlData;

  // 1. 全動態機型定錨
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 通用時間與簽名
  const getCurrentTime = () => new Date().toISOString().substring(11, 16) + "Z";
  const currentSign = "ENG SYSTEM (#8821)";


  // -----------------------------------------------------
  // 🔧 封裝底層更新邏輯 (維持純數據管道，不干涉 UI)
  // -----------------------------------------------------
  const handleClearDefect = (id: string, actionDesc: string) => {
    if (!confirm(`Sign Certificate of Release to Service for defect ${id}? This cannot be undone.`)) return;

    const defectToClear = defects.find((d: any) => d.id === id);
    const newEntry = {
      id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`,
      time: getCurrentTime(),
      action: "DEFECT RECTIFIED",
      ref: id,
      original_desc: defectToClear?.description || "Unknown Defect",
      desc: actionDesc || "Defect rectified and tested IAW AMM. Ops normal.",
      sign: currentSign
    };
    // 🌟 用 defectUpdate directive 淨係改呢一條 defect，唔再send成個 defects array，
    // 避免蓋走另一邊（機師/教官）啱啱同時寫低嘅其他 defect 改動
    updateTechLogData({
      defectUpdate: { id, changes: { status: "CLEARED", action_desc: actionDesc, cleared_by: currentSign, cleared_time: getCurrentTime() } },
      tlEntryAppend: newEntry,
    });
    setActiveTask(null);
  };

  const handleDeferDefect = async (id: string, type: string, mel: string, reason: string) => {
    if (!confirm(`Defer defect ${id} as ${type} under MEL ${mel}?`)) return;

    const defectToDefer = defects.find((d: any) => d.id === id);
    const numMatch = id.match(/\d+/);
    const num = numMatch ? numMatch[0] : Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newId = `${type === "PADD" ? "P" : type === "SADD" ? "S" : "A"}${num}`;

    const newEntry = {
      id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`,
      time: getCurrentTime(),
      action: "DEFECT DEFERRED",
      ref: `${id} ➔ ${newId}`,
      original_desc: defectToDefer?.description || "Unknown Defect",
      desc: `Deferred as ${type}. MEL Ref: ${mel}. Details: ${reason}`,
      sign: currentSign
    };

    // 1️⃣ 軌道一：UI 狀態與網頁資料庫更新 (先執行，保持網頁流暢)
    updateTechLogData({
      defectUpdate: { id, changes: { id: newId, status: "DEFERRED", deferral_type: type, mel_ref: mel, deferral_reason: reason } },
      tlEntryAppend: newEntry,
    });
    setActiveTask(null);

    // 2️⃣ 軌道二：激活雙軌派發 (FSUIPC 物理注入)
    if (isConnected) {
      try {
        const dispatchResult = await executeDualDispatch(mel, sendToFSUIPC);
        if (dispatchResult.dispatchedToSim) {
          alert(`🚨 [MCC SIGN-OFF SUCCESS]\n缺陷保留成功！P3D 模擬機已同步爆發物理故障：[${dispatchResult.pmdgTitle}]`);
        } else if (dispatchResult.macroPending) {
          alert(`📄 [MCC SIGN-OFF SUCCESS]\n文本保留成功！MEL (${mel}) 已對應物理故障 [${dispatchResult.pmdgTitle}]，但尚未撰寫 CDU 按鍵巨集，未寫入模擬機。`);
        } else {
          alert(`📄 [MCC SIGN-OFF SUCCESS]\n純文本保留成功！該 MEL (${mel}) 無對應物理故障表現，已跳過 FSUIPC 注入。`);
        }
      } catch (error) {
        console.error("Dual Dispatch Synchro Failed:", error);
        alert("⚠️ 雙軌派發失敗！無法將故障寫入 P3D，但網頁日誌已更新。");
      }
    } else {
      // 模擬機未連線時的溫馨提示
      alert(`📄 [MCC SIGN-OFF OFFLINE]\n文本保留成功！(注意：FSUIPC 未連線，故障並未寫入模擬機)`);
    }
  };

  // 靜態簽發調度
  const handleCompleteChecks = () => {
    const newEntry = { id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`, time: getCurrentTime(), action: "MAINTENANCE CHECK", ref: "N/A", desc: "Transit Check completed IAW AMM.", sign: currentSign };
    updateTechLogData({ data: { tl_checks: true }, tlEntryAppend: newEntry });
    setActiveTask(null);
  };

  const handleCompleteFluids = () => {
    const newEntry = { id: `SRV-${Math.floor(1000 + Math.random() * 9000)}`, time: getCurrentTime(), action: "SERVICING UPLIFT", ref: "N/A", desc: "Routine fluids uplift recorded and verified.", sign: currentSign };
    updateTechLogData({ data: { tl_fluids: true }, tlEntryAppend: newEntry });
    setActiveTask(null);
  };

  const handleReleaseAircraft = () => {
    if (!confirm("Sign the Certificate of Release to Service for this aircraft? This cannot be undone.")) return;

    const crsId = `CRS-${Math.floor(1000 + Math.random() * 9000)}-X`;
    const newEntry = { id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`, time: getCurrentTime(), action: "AIRCRAFT RELEASED", ref: crsId, desc: "Certificate of Release to Service (CRS) signed and issued.", sign: currentSign };
    updateTechLogData({ data: { tl_release: true, crs_id: crsId }, tlEntryAppend: newEntry });
    setActiveTask(null);
  };

  // 動態極限數值計算 (用於工程看板與子組件連動)
  const zfwVal = getZfwValue(calc);
  const marginZfw = getMargin(zfwVal, ahm.limits.MZFW);

  return (
    <div className="md:flex-[6] bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 md:p-7 shadow-lg md:overflow-y-auto relative font-sans scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
      
      {/* ✈️ 右上角 In-Flight Dropdown 艙內選單 */}
      {isStarted && roleMode === "FLIGHT CREW" && (
        <div className="absolute top-6 right-6 z-50">
          <button onClick={() => setShowInFlightMenu(!showInFlightMenu)} className="bg-[#00E676]/10 border border-[#00E676]/50 text-[#00E676] text-[0.65rem] font-bold px-4 py-2.5 rounded-xl hover:bg-[#00E676] hover:text-black transition-all shadow-lg tracking-widest uppercase flex items-center gap-2 outline-none">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            <span>In-Flight Controls</span>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${showInFlightMenu ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showInFlightMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden p-1 z-50">
              <button onClick={() => {setActiveTask("op_normal_close"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#00E676] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#00E676]/10 rounded-lg flex items-center gap-3 transition-colors">Normal Close Flight</button>
              <button onClick={() => {setActiveTask("op_diversion"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#FF9100] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#FF9100]/10 rounded-lg flex items-center gap-3 transition-colors">Diversion</button>
              <button onClick={() => {setActiveTask("op_ground_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#FF1744] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#FF1744]/10 rounded-lg flex items-center gap-3 transition-colors">Ground Return</button>
              <button onClick={() => {setActiveTask("op_air_return"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#FF1744] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#FF1744]/10 rounded-lg flex items-center gap-3 transition-colors mt-1">Air Return</button>
              <button onClick={() => {setActiveTask("op_cancel_gate"); setShowInFlightMenu(false);}} className="text-left px-4 py-3.5 text-[#8fa0a6] text-[0.7rem] uppercase tracking-widest font-bold hover:bg-[#252525] hover:text-white rounded-lg flex items-center gap-3 transition-colors">Did Not Depart Gate</button>
            </div>
          )}
        </div>
      )}

      {/* 👈 中央渲染路由器：Task 精準分流 */}
      {!activeTask ? (
        <div className="h-full flex flex-col items-center justify-center text-[#555] select-none">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mb-6 text-[#333] animate-pulse"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" /></svg>
          <span className="text-[0.8rem] font-bold tracking-widest uppercase">Select An Action From The Left Dashboard</span>
        </div>
      ) : (
        <div className="animate-fade-in h-full flex flex-col">
          
          {/* ✈️ Flight Crew 模組 */}
          {activeTask === "prepare" && <TaskPrepareFlight flightData={flightData} tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "fuel_record" && <TaskFuelRecord flightData={flightData} tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "acceptance" && <TaskAcceptance tlData={tlData} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_normal_close" && <TaskNormalClose tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_ground_return" && <TaskGroundReturn tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_air_return" && <TaskAirReturn tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_diversion" && <TaskDiversion tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}
          {activeTask === "op_cancel_gate" && <TaskDidNotDepart tlData={tlData} defects={defects} updateTechLogData={updateTechLogData} setActiveTask={setActiveTask} />}

          {/* 🔧 Engineer Routine 模組 */}
          {activeTask === "maint_check" && (
            <div className="flex flex-col gap-4 h-full">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3">Maintenance Check ({ahm.reg})</h3>
              <div className="text-xs font-mono text-[#8fa0a6] bg-[#0a0a0a] p-4 border border-[#333] rounded-xl leading-relaxed">
                👉 Current MZFW Structural Limit: <span className="text-white font-bold">{ahm.limits.MZFW.toLocaleString()} KG</span><br/>
                👉 Margin calculated: <span className={getMarginColor(marginZfw)}>{getMarginStr(marginZfw)} Tons</span>
              </div>
              <button onClick={handleCompleteChecks} className="w-full py-4.5 bg-[#C6FF00] text-black text-[0.8rem] uppercase tracking-widest font-black rounded-xl mt-auto shadow-md hover:bg-[#a8db00]">CONFIRM SIGN-OFF</button>
            </div>
          )}
          
          {activeTask === "fluids_uplift" && (
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3">Fluids Uplift</h3>
              <button onClick={handleCompleteFluids} className="w-full py-4.5 bg-[#C6FF00] text-black text-[0.8rem] uppercase tracking-widest font-black rounded-xl mt-auto hover:bg-[#a8db00]">CONFIRM FLUIDS RECORD</button>
            </div>
          )}
          
          {activeTask === "release_aircraft" && (
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#00E676] border-b border-[#333] pb-4 mb-6 flex items-center gap-3">Release Aircraft</h3>
              <button onClick={handleReleaseAircraft} className="w-full py-4.5 bg-[#C6FF00] text-black text-[0.8rem] uppercase tracking-widest font-black rounded-xl mt-auto hover:bg-[#a8db00]">SIGN RELEASING STATEMENT</button>
            </div>
          )}

          {/* 📋 🌟 終極重構：將原本沉重的 view_entry 邏輯，全權外包交給動態大腦託管！ */}
          {activeTask === "view_entry" && selectedEntry && (
            <DefectDetailManager
              selectedEntry={selectedEntry}
              defects={defects}
              roleMode={roleMode}
              ahm={ahm}
              marginZfw={marginZfw}
              getMarginStr={getMarginStr}
              getMarginColor={getMarginColor}
              onClear={handleClearDefect}
              onDefer={handleDeferDefect}
            />
          )}

        </div>
      )}
    </div>
  );
}
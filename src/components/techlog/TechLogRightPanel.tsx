// src/components/techlog/TechLogRightPanel.tsx
"use client";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { useFlightData } from "@/hooks/useFlightData";
import { useSim } from "@/hooks/useSim";
// 🌟 引入剛剛解耦出來的缺陷詳情管家
import { DefectDetailManager } from "./DefectDetailManager";
import { 
  TaskPrepareFlight, TaskFuelRecord, TaskAcceptance, 
  TaskNormalClose, TaskGroundReturn, TaskAirReturn, 
  TaskDiversion, TaskDidNotDepart 
} from "./forms";
import { buildFailureMacro } from "@/services/dynamicMacroBuilder";
import { fireCDUMacro } from "@/services/pmdgService";

export default function TechLogRightPanel({ tlData, flightData, roleMode, activeTask, setActiveTask, selectedEntry, showInFlightMenu, setShowInFlightMenu, updateTechLogData, defects }: any) {
  
  const { calc } = useFlightData(); // 接通核心計算大腦
  const { sendToFSUIPC, isConnected} = useSim();
  const { tl_flight_started: isStarted, tl_entries } = tlData;

  // 1. 全動態機型定錨
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 通用時間與簽名
  const getCurrentTime = () => new Date().toISOString().substring(11, 16) + "Z";
  const currentSign = "ENG SYSTEM (#8821)";


  // =====================================================
  // 🚨 🌟 新增：PMDG 777 系統故障動態注入器 (SimConnect / FSUIPC)
  // =====================================================
  const triggerPmdgSystemFailure = async (ataCode: string, defectDesc: string) => {
    // 🚀 一行代碼，直接呼叫 Macro 工廠嘔出 Event ID 數值陣列 (number[])
    const pmdgEventSequence = buildFailureMacro(ataCode);

    console.log("%c📡 [FSUIPC MACRO BLOCK] Ready to stream array sequence into PMDG Cockpit via C++ SimConnect link:", "color: #00E676; font-weight: bold;");
    console.log(`   -> Target Defect: "${defectDesc}"`);
    console.log(`   -> Generated Token IDs: [${pmdgEventSequence.join(", ")}]`);

    // 🚀 火牛通網後直接解除註釋，一秒灌入 FSUIPC 後端：
    if (!isConnected) {
      console.warn("⚠️ [DATA LINK DISCONNECTED] WebSocket not open. Aborting stream to PMDG.");
      return;
    }

    // 🎯 終極一擊：直接把 sendToFSUIPC 傳入 fireCDUMacro！
    // 它會全自動：包裝 JSON -> 先發 param -> 再發 control -> 延時 150ms -> 循環發下一粒
    await fireCDUMacro(sendToFSUIPC, pmdgEventSequence);
  };
  // -----------------------------------------------------
  // 🔧 封裝底層更新邏輯 (維持純數據管道，不干涉 UI)
  // -----------------------------------------------------
  const handleClearDefect = (id: string, actionDesc: string) => {
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
    updateTechLogData({ 
      defects: defects.map((d: any) => d.id === id ? { ...d, status: "CLEARED", action_desc: actionDesc } : d),
      tl_entries: [...(tl_entries || []), newEntry] 
    });
    setActiveTask(null);
  };

  const handleDeferDefect = (id: string, type: string, mel: string, reason: string) => {
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

    // 🌟 核心聯動點：當工程師按下確定保留的一瞬間，直接將故障脈衝射向模擬機！
    triggerPmdgSystemFailure(mel, defectToDefer?.description || "System Defect");

    setActiveTask(null);
    updateTechLogData({ 
      defects: defects.map((d: any) => d.id === id ? { ...d, id: newId, status: "DEFERRED", deferral_type: type, mel_ref: mel, deferral_reason: reason } : d),
      tl_entries: [...(tl_entries || []), newEntry]
    });
    setActiveTask(null);
  };

  // 靜態簽發調度
  const handleCompleteChecks = () => {
    const newEntry = { id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`, time: getCurrentTime(), action: "MAINTENANCE CHECK", ref: "N/A", desc: "Transit Check completed IAW AMM.", sign: currentSign };
    updateTechLogData({ tl_checks: true, tl_entries: [...(tl_entries || []), newEntry] });
    setActiveTask(null);
  };

  const handleCompleteFluids = () => {
    const newEntry = { id: `SRV-${Math.floor(1000 + Math.random() * 9000)}`, time: getCurrentTime(), action: "SERVICING UPLIFT", ref: "N/A", desc: "Routine fluids uplift recorded and verified.", sign: currentSign };
    updateTechLogData({ tl_fluids: true, tl_entries: [...(tl_entries || []), newEntry] });
    setActiveTask(null);
  };

  const handleReleaseAircraft = () => {
    const crsId = `CRS-${Math.floor(1000 + Math.random() * 9000)}-X`;
    const newEntry = { id: `ENT-${Math.floor(1000 + Math.random() * 9000)}`, time: getCurrentTime(), action: "AIRCRAFT RELEASED", ref: crsId, desc: "Certificate of Release to Service (CRS) signed and issued.", sign: currentSign };
    updateTechLogData({ tl_release: true, crs_id: crsId, tl_entries: [...(tl_entries || []), newEntry] });
    setActiveTask(null);
  };

  // 動態極限數值計算 (用於工程看板與子組件連動)
  const zfwVal = calc?.showRevVal ? (calc.actualZfw > 0 ? calc.actualZfw : calc.ofpZfw) : calc?.ofpZfw || 205;
  const marginZfw = zfwVal - (ahm.limits.MZFW / 1000);
  const getMarginStr = (m: number) => m > 0 ? `+${m.toFixed(1)}` : m.toFixed(1);
  const getMarginColor = (m: number) => m > 0 ? 'text-[#FF1744] font-black' : 'text-[#8fa0a6]';

  return (
    <div className="flex-[6] bg-[#1E1E1E] border border-[#333] rounded-2xl p-7 shadow-lg overflow-y-auto relative font-sans scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
      
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
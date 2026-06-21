"use client";
import { useState } from "react";
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";

// 🌟 核心重構：直接引入你一早拆好、我哋啱啱全域執靚咗嘅 3 大獨立大腦組件！
// (💡 請根據你專案實際的資料夾路徑，自行調整下面的 import path)
import { LeftPanel } from "./ModalLoadsheet/LeftPanel";         
import { RightHeader } from "./ModalLoadsheet/RightHeader";     
import { HistoryPanel } from "./ModalLoadsheet/HistoryPanel";   

export function ModalLoadsheet({ flightData, updateFlightData, calc, setActiveModal }: any) {
  // 僅保留最終機長簽名確認彈窗的控制開關
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  // 🌟 核心動態定錨：獲取目前執飛的飛機註冊號，查出專屬 AHM 大腦
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 Weight Limits 邏輯動態自適應（集中喺度計一次，分發畀唔同 Component 享用）
  const sysMtow = ahm.limits.MTOW / 1000;
  const sysMlaw = ahm.limits.MLAW / 1000;
  const sysMzfw = ahm.limits.MZFW / 1000;

  const isCustomWt = flightData?.is_custom_weight || false;
  const dispMtow = isCustomWt ? (flightData?.custom_mtow || sysMtow) : sysMtow;
  const dispMlaw = isCustomWt ? (flightData?.custom_mlaw || sysMlaw) : sysMlaw;
  const dispMlawMargin = isCustomWt ? (flightData?.custom_mlaw_margin || 0.0) : 0.0;
  const dispMzfw = isCustomWt ? (flightData?.custom_mzfw || sysMzfw) : sysMzfw;
  const effectiveMlaw = dispMlaw - dispMlawMargin;

  // 🎯 依據外置子組件各需要的介面格式，將 Limits 打包
  const limitsForHeader = { isCustomWt, dispMtow, dispMlawMargin, dispMlaw, dispMzfw };
  const limitsForHistory = { dispMzfw, dispMtow, effectiveMlaw };

  // 🌟 修正點：彈窗顯示的 Version 號，同樣要從歷史陣列抽取「真正生效」的版本號，防止跳過頭
  const activeFinalVer = flightData?.final_history?.[flightData.final_history.length - 1]?.version || 1;
  
  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative font-sans">
      
      {/* 🧩 1. 左邊欄面板 (已完全移交出去，乾淨俐落) */}
      <LeftPanel flightData={flightData} calc={calc} />

      {/* 右邊上下流線結構 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* 🧩 2. 右上：飛機資訊 + Setup & Limits 操控區 (調用外部組件) */}
        <RightHeader 
          flightData={flightData} 
          updateFlightData={updateFlightData} 
          calc={calc} 
          limits={limitsForHeader} 
        />
        
        {/* 🧩 3. 右下：文檔歷史滾動區 (調用外部組件) */}
        <HistoryPanel 
          flightData={flightData} 
          calc={calc} 
          setActiveModal={setActiveModal} 
          limits={limitsForHistory} 
          setShowFinalConfirm={setShowFinalConfirm} 
        />
      </div>
      
      {/* 🧩 4. 確認彈窗 Sub-Modal (只在需要時覆蓋一層) */}
      {showFinalConfirm && (
        <div className="absolute inset-[-1.5rem] z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in rounded-2xl">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-[340px] p-6 shadow-2xl flex flex-col relative">
            <button onClick={() => setShowFinalConfirm(false)} className="absolute top-4 right-4 text-[#8fa0a6] hover:text-white font-black text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333]">✕</button>
            <p className="text-sm font-bold text-white mb-6 mt-4 text-center leading-relaxed font-sans">
              Confirm the data of loadsheet<br/>
              <span className="text-[#2979FF] text-xl font-black block mt-2">FINAL {activeFinalVer.toString().padStart(2, '0')}</span>
            </p>
            <div className="flex flex-col gap-3 font-sans">
              <button onClick={() => { setShowFinalConfirm(false); updateFlightData({ pilots_signed_final: true }); }} className="w-full bg-[#C6FF00] text-black font-black uppercase tracking-widest text-[0.7rem] px-4 py-3.5 rounded-lg shadow-md hover:bg-[#b0e600] transition-colors">Accept</button>
              <button onClick={() => { setShowFinalConfirm(false); setActiveModal('RejectFinal'); }} className="w-full text-[#FF1744] bg-[#FF1744]/10 border border-[#FF1744]/50 font-black uppercase tracking-widest text-[0.7rem] px-4 py-3.5 rounded-lg hover:bg-[#FF1744] hover:text-white transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
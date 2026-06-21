"use client";
import { useState } from "react";
// 🌟 核心修改：引入總註冊表大腦，剷走單一機型
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { LeftPanel } from "./LeftPanel";
import { RightHeader } from "./RightHeader";
import { HistoryPanel } from "./HistoryPanel";

export function ModalLoadsheet(props: any) {
  const { flightData, updateFlightData, setActiveModal } = props;
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  // 🌟 核心動態定錨：獲取目前執飛的飛機註冊號，查出專屬 limits
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 統一計算 Weight Limits (隨 ahm 自動變更，確保 Header 同 Loadsheet 文本 100% 同步)
  const sysMtow = ahm.limits.MTOW / 1000;
  const sysMlaw = ahm.limits.MLAW / 1000;
  const sysMzfw = ahm.limits.MZFW / 1000;

  const isCustomWt = flightData?.is_custom_weight || false;
  const dispMtow = isCustomWt ? (flightData?.custom_mtow || sysMtow) : sysMtow;
  const dispMlaw = isCustomWt ? (flightData?.custom_mlaw || sysMlaw) : sysMlaw;
  const dispMlawMargin = isCustomWt ? (flightData?.custom_mlaw_margin || 0.0) : 0.0;
  const dispMzfw = isCustomWt ? (flightData?.custom_mzfw || sysMzfw) : sysMzfw;

  const effectiveMlaw = dispMlaw - dispMlawMargin;

  // 打包好 Limits 傳落去 (交由子組件動態渲染)
  const limits = { isCustomWt, dispMtow, dispMlaw, dispMlawMargin, dispMzfw, effectiveMlaw };

  return (
    <div className="flex flex-row h-full w-full overflow-hidden relative font-sans">
      
      {/* 左邊：狀態與 Revised Weights 面板 */}
      <LeftPanel {...props} />

      {/* 右邊：上下結構 (Header & History) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <RightHeader {...props} limits={limits} />
        <HistoryPanel {...props} limits={limits} setShowFinalConfirm={setShowFinalConfirm} />
      </div>
      
      {/* 🌟 最終確認彈窗 (最高層級覆蓋) */}
      {showFinalConfirm && (
        <div className="absolute inset-[-1.5rem] z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in rounded-2xl">
          <div className="bg-[#1a1a1a] border border-[#33 ] rounded-2xl w-[340px] p-6 shadow-2xl flex flex-col relative">
            <button onClick={() => setShowFinalConfirm(false)} className="absolute top-4 right-4 text-[#8fa0a6] hover:text-white font-black text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333]">✕</button>
            <p className="text-sm font-bold text-white mb-6 mt-4 text-center leading-relaxed font-sans">
              Confirm the data of loadsheet<br/>
              <span className="text-[#2979FF] text-xl font-black block mt-2">FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}</span>
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
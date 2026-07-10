"use client";
// 🌟 核心修改：引入總註冊表大腦，剷走單一機型
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { LeftPanel } from "./LeftPanel";
import { RightHeader } from "./RightHeader";
import { HistoryPanel } from "./HistoryPanel";

export function ModalLoadsheet(props: any) {
  const { flightData } = props;

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
        <HistoryPanel {...props} limits={limits} />
      </div>
    </div>
  );
}
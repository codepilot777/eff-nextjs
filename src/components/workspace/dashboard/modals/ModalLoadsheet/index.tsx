"use client";
// 🌟 核心修改：引入總註冊表大腦，剷走單一機型
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";
import { getEffectiveWeightLimits } from "@/lib/loadsheet/loadsheetHelpers";
import { LeftPanel } from "./LeftPanel";
import { RightHeader } from "./RightHeader";
import { HistoryPanel } from "./HistoryPanel";

export function ModalLoadsheet(props: any) {
  const { flightData } = props;

  // 🌟 核心動態定錨：獲取目前執飛的飛機註冊號，查出專屬 limits
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 統一計算 Weight Limits (隨 ahm 自動變更，確保 Header 同 Loadsheet 文本 100% 同步；
  // 呢個 helper 同 PayloadTab.tsx 共用，等教官自己嗰邊嘅過limit warning 都睇到同一組數)
  const limits = getEffectiveWeightLimits(ahm, flightData);

  return (
    // 🌟 Mobile：LeftPanel（固定 300px）+ 右邊 RightHeader/HistoryPanel（本身仲有
    // 460px 嘅固定寬度子面板）以前恆定並排，窄屏幕加埋隨時爆過 700-800px，
    // 而家 mobile 先變上下疊，desktop 完全冇變
    <div className="flex flex-col md:flex-row h-full w-full overflow-y-auto md:overflow-hidden relative font-sans">

      {/* 左邊：狀態與 Revised Weights 面板 */}
      <LeftPanel {...props} />

      {/* 右邊：上下結構 (Header & History) */}
      <div className="flex-1 flex flex-col md:h-full md:overflow-hidden min-w-0">
        <RightHeader {...props} limits={limits} />
        <HistoryPanel {...props} limits={limits} />
      </div>
    </div>
  );
}
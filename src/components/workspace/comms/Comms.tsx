"use client";

import { useFlightData } from "@/hooks/useFlightData";
import AcarsTerminal from "./AcarsTerminal";
import PdcController from "./PdcController";
import AtisController from "./AtisController";

export default function Comms() {
  const { flightData } = useFlightData();

  // 防呆保護
  if (!flightData) return null;

  return (
    // 🌟 Mobile：ACARS/PDC/ATIS 三個板塊由並排（overflow-hidden 裁走睇唔晒嘅嗰截）
    // 變成上下疊，成個畫面用返自然文檔流 scroll，唔會再切走右邊嗰截內容
    <div className="h-full w-full flex flex-col md:flex-row gap-5 overflow-y-auto md:overflow-hidden animate-fade-in font-sans p-1 pb-6 md:pb-1">
      {/* 1. ACARS 聊天室端 (左側) */}
      <AcarsTerminal />

      {/* 2. Datalink 控制端 (右側) */}
      <div className="flex-[1.5] flex flex-col gap-5 md:overflow-y-auto md:pr-2 md:pb-10">
        {/* 上半部：PDC 控制器 */}
        <PdcController />

        {/* 下半部：ATIS 控制器 */}
        <AtisController />
      </div>
    </div>
  );
}
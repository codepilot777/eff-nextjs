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
    <div className="h-full w-full flex gap-5 overflow-hidden animate-fade-in font-sans p-1">
      {/* 1. ACARS 聊天室端 (左側) */}
      <AcarsTerminal />

      {/* 2. Datalink 控制端 (右側) */}
      <div className="flex-[1.5] flex flex-col gap-5 overflow-y-auto pr-2 pb-10">
        {/* 上半部：PDC 控制器 */}
        <PdcController />

        {/* 下半部：ATIS 控制器 */}
        <AtisController />
      </div>
    </div>
  );
}
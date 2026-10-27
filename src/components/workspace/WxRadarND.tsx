"use client";

import { useMemo, useRef } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import { useWxRadarSync } from "@/hooks/useWxRadarSync";
import { parseSigmetBulletin } from "@/lib/weather/sigmetParser";
import { extractRouteFixes } from "@/lib/weather/routeFixes";

// 🌟 Trainee/Observer 嘅 ND 雷達畫面——同 IOS 嗰個 WX RADAR tab 用緊同一個
// weather_nd_standalone.html，但呢度冇 SIGMET 編輯 UI（嗰個係教官專屬資料，
// 睇 validation.ts 嘅 scenario_sigmets_raw）。
// 🌟 ?mode=trainee 令個 iframe 自己切去「教官揀低嗰張」單一畫面（睇
// public/weather-nd/index.html 嘅 applyTraineeMode()/paneActive），trainee
// 淨係留低 Range 一個掣——position 由固定嘅 planned trajectory 決定，唔靠
// 任何即時 simulation 同步，保證同教官見到嘅一致。
// 🌟 教官喺 IOS 度揀低嘅 scenario_active_snapshot_idx，透過 useWxRadarSync
// postMessage 落呢個 iframe——trainee 睇到嘅畫面，永遠同教官揀嘅一致
export default function WxRadarND() {
  const { flightData } = useFlightData();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const rawText: string = flightData?.scenario_sigmets_raw || "";
  const parsed = parseSigmetBulletin(rawText);
  const routeFixes = useMemo(() => extractRouteFixes(flightData?.raw_simbrief), [flightData?.raw_simbrief]);
  useWxRadarSync(iframeRef, parsed, flightData?.scenario_airborne_time_z, flightData?.scenario_active_snapshot_idx, undefined, routeFixes);

  return (
    <div className="flex-1 min-h-0 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden flex flex-col">
      <iframe
        ref={iframeRef}
        src="/weather-nd/index.html?mode=trainee"
        title="Weather Radar ND"
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}

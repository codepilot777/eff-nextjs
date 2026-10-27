"use client";

import { useRef } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import { useWxRadarSync } from "@/hooks/useWxRadarSync";
import { parseSigmetBulletin } from "@/lib/weather/sigmetParser";

// 🌟 Trainee/Observer 嘅 ND 雷達畫面——同 IOS 嗰個 WX RADAR tab 用緊同一個
// weather_nd_standalone.html，但呢度冇 SIGMET 編輯 UI（嗰個係教官專屬資料，
// 睇 validation.ts 嘅 scenario_sigmets_raw），trainee 淨係見到、操作個雷達
// 畫面本身——帶住教官已經搭好嘅天氣。
// 🌟 ?mode=trainee 令個 iframe 自己拎走 Clock/Observer view/Tilt/Lateral/
// Heading/Direct 呢幾樣教官專屬嘅手動控制（睇 public/weather-nd/index.html
// 嘅 applyTraineeMode()），trainee 淨係留低 Range/Gain/Altitude 呢幾個同
// 「操作部雷達」直接有關嘅掣。
// 🌟 Phase 2：教官喺 IOS 度 save 低嘅 SIGMET/airborne time，透過 useWxRadarSync
// postMessage 落呢個 iframe——trainee 睇到嘅天氣，同教官搭嘅景永遠一致
export default function WxRadarND() {
  const { flightData } = useFlightData();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const rawText: string = flightData?.scenario_sigmets_raw || "";
  const parsed = parseSigmetBulletin(rawText);
  useWxRadarSync(iframeRef, parsed, flightData?.scenario_airborne_time_z, flightData?.scenario_aircraft_override);

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

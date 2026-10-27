"use client";

import { useEffect, useRef } from "react";
import type { ParsedSigmet } from "@/lib/weather/sigmetParser";

export interface AircraftOverride {
  mode?: string;
  selHdg?: number;
  tgtName?: string | null;
  atcHold?: boolean;
  nextIdx?: number;
  altMode?: string;
  altSel?: number;
}

// 🌟 將 EFF 呢邊 parse 好嘅 SIGMET + airborne time + 教官手動 override 嘅
// aircraft 狀態，postMessage 落 weather-nd 個 iframe（睇 public/weather-nd/
// index.html 嘅 applyScenarioSigmets/applyScenarioAirborne/applyScenarioAircraft）。
// 等個 iframe 自己送嚟 "eff-nd-ready" 先開始送資料（佢可能重未 load 完/init()
// 重未行完），之後呢幾樣資料一變就即刻再送多次——IOS 嗰邊教官一撳 Save/撳
// Flight 掣，Observer 個 radar 畫面就跟住變。
// 🌟 IOS 自己個 iframe（教官嗰邊）撳 Flight 掣嗰陣會反過嚟 postMessage 一個
// "eff-aircraft-action" 畀 parent（睇 weather-nd/index.html 嘅
// broadcastAircraftOverride）——`onAircraftAction` 俾 WxRadarTab 用嚟接住呢個
// 訊息，寫落 scenario_aircraft_override；trainee 嗰邊唔使呢個 callback，淨係
// 單向接收 aircraftOverride 就夠
// 🌟 "ready" 嘅 listener 淨係 mount 一次就夠（個 iframe 本身冇重新 load 過，
// 唔會再送多次 "eff-nd-ready"）——如果跟住啲 prop 嘅 effect 一齊重新 run，
// 會將 readyRef 錯誤咁reset 返 false，之後嘅更新就send 唔到出去
export function useWxRadarSync(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  sigmets: ParsedSigmet[],
  airborneZ: string | undefined,
  aircraftOverride?: AircraftOverride | null,
  onAircraftAction?: (override: AircraftOverride) => void
) {
  const readyRef = useRef(false);
  const latestRef = useRef({ sigmets, airborneZ, aircraftOverride });
  const onAircraftActionRef = useRef(onAircraftAction);

  useEffect(() => {
    latestRef.current = { sigmets, airborneZ, aircraftOverride };
  }, [sigmets, airborneZ, aircraftOverride]);

  useEffect(() => {
    onAircraftActionRef.current = onAircraftAction;
  }, [onAircraftAction]);

  useEffect(() => {
    const send = () => {
      const win = iframeRef.current?.contentWindow;
      if (!win || !readyRef.current) return;
      const latest = latestRef.current;
      win.postMessage({ type: "eff-scenario-sigmets", sigmets: latest.sigmets }, "*");
      if (latest.airborneZ) win.postMessage({ type: "eff-scenario-airborne", airborneZ: latest.airborneZ }, "*");
      if (latest.aircraftOverride) win.postMessage({ type: "eff-scenario-aircraft", override: latest.aircraftOverride }, "*");
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === "eff-nd-ready") {
        readyRef.current = true;
        send();
        return;
      }
      if (e.data?.type === "eff-aircraft-action") {
        onAircraftActionRef.current?.(e.data.override);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !readyRef.current) return;
    win.postMessage({ type: "eff-scenario-sigmets", sigmets }, "*");
    if (airborneZ) win.postMessage({ type: "eff-scenario-airborne", airborneZ }, "*");
    if (aircraftOverride) win.postMessage({ type: "eff-scenario-aircraft", override: aircraftOverride }, "*");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigmets, airborneZ, aircraftOverride]);
}

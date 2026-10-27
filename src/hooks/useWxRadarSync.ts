"use client";

import { useEffect, useRef } from "react";
import type { ParsedSigmet } from "@/lib/weather/sigmetParser";

// 🌟 將 EFF 呢邊 parse 好嘅 SIGMET + airborne time，postMessage 落 weather-nd
// 個 iframe（睇 public/weather-nd/index.html 嘅 applyScenarioSigmets/
// applyScenarioAirborne）。等個 iframe 自己送嚟 "eff-nd-ready" 先開始送資料
// （佢可能重未 load 完/init() 重未行完），之後 SIGMET/airborne time 一變就
// 即刻再送多次——IOS 嗰邊教官一撳 Save，Observer 個 radar 畫面就跟住變。
// 🌟 "ready" 嘅 listener 淨係 mount 一次就夠（個 iframe 本身冇重新 load 過，
// 唔會再送多次 "eff-nd-ready"）——如果跟住 sigmets/airborneZ 嘅 effect 一齊
// 重新 run，會將 readyRef 錯誤咁reset 返 false，之後嘅更新就send 唔到出去
export function useWxRadarSync(iframeRef: React.RefObject<HTMLIFrameElement | null>, sigmets: ParsedSigmet[], airborneZ: string | undefined) {
  const readyRef = useRef(false);
  const latestRef = useRef({ sigmets, airborneZ });

  useEffect(() => {
    latestRef.current = { sigmets, airborneZ };
  }, [sigmets, airborneZ]);

  useEffect(() => {
    const send = () => {
      const win = iframeRef.current?.contentWindow;
      if (!win || !readyRef.current) return;
      win.postMessage({ type: "eff-scenario-sigmets", sigmets: latestRef.current.sigmets }, "*");
      if (latestRef.current.airborneZ) win.postMessage({ type: "eff-scenario-airborne", airborneZ: latestRef.current.airborneZ }, "*");
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "eff-nd-ready") return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      readyRef.current = true;
      send();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigmets, airborneZ]);
}

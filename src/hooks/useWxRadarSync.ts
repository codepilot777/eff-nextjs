"use client";

import { useEffect, useRef } from "react";
import type { ParsedSigmet } from "@/lib/weather/sigmetParser";
import type { RouteFix } from "@/lib/weather/routeFixes";

// 🌟 將 EFF 呢邊 parse 好嘅 SIGMET + airborne time + 教官揀低嘅 active
// snapshot index，postMessage 落 weather-nd 個 iframe（睇 public/weather-nd/
// index.html 嘅 applyScenarioSigmets/applyScenarioAirborne/
// applyScenarioActiveSnapshot）。等個 iframe 自己送嚟 "eff-nd-ready" 先開始
// 送資料（佢可能重未 load 完/init() 重未行完），之後呢幾樣資料一變就即刻
// 再送多次——IOS 嗰邊教官一撳 Save/揀低一張 snapshot，trainee 嗰邊個畫面
// 就跟住變。
// 🌟 position 本身唔靠呢個 postMessage 同步——教官同 trainee 兩邊都係由
// 同一份 route/airborne 數據自己 build 返同一份 planned trajectory（PLAN），
// 淨係 activeSnapshotIdx（教官揀低邊一張）先至要真係傳過去。IOS 自己個
// iframe 揀咗邊張之後會反過嚟 postMessage 一個 "eff-active-snapshot-action"
// 畀 parent（睇 weather-nd/index.html 嘅 setActive）——`onActiveSnapshotAction`
// 俾 WxRadarTab 用嚟接住，寫落 scenario_active_snapshot_idx；trainee 嗰邊
// 唔使呢個 callback，淨係單向接收 activeSnapshotIdx 就夠
// 🌟 "ready" 嘅 listener 淨係 mount 一次就夠（個 iframe 本身冇重新 load 過，
// 唔會再送多次 "eff-nd-ready"）——如果跟住啲 prop 嘅 effect 一齊重新 run，
// 會將 readyRef 錯誤咁reset 返 false，之後嘅更新就send 唔到出去
// 🌟 routeFixes（睇 lib/weather/routeFixes.ts）係由真實 SimBrief navlog
// 揀出嚟嘅航路座標——iframe 嗰邊會用嚟換走自己 hard-code 嗰套示範地理。
// 呢個 array 每次 poll 都會係新 reference（flightData 一路 refetch），但
// iframe 入面 applyScenarioRoute() 自己有做 signature 比對，唔會因為不斷
// 重送而不斷將飛機 reset 返去起點
export function useWxRadarSync(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  sigmets: ParsedSigmet[],
  airborneZ: string | undefined,
  activeSnapshotIdx?: number | null,
  onActiveSnapshotAction?: (idx: number) => void,
  routeFixes?: RouteFix[]
) {
  const readyRef = useRef(false);
  const latestRef = useRef({ sigmets, airborneZ, activeSnapshotIdx, routeFixes });
  const onActiveSnapshotActionRef = useRef(onActiveSnapshotAction);

  useEffect(() => {
    latestRef.current = { sigmets, airborneZ, activeSnapshotIdx, routeFixes };
  }, [sigmets, airborneZ, activeSnapshotIdx, routeFixes]);

  useEffect(() => {
    onActiveSnapshotActionRef.current = onActiveSnapshotAction;
  }, [onActiveSnapshotAction]);

  useEffect(() => {
    const send = () => {
      const win = iframeRef.current?.contentWindow;
      if (!win || !readyRef.current) return;
      const latest = latestRef.current;
      win.postMessage({ type: "eff-scenario-sigmets", sigmets: latest.sigmets }, "*");
      if (latest.airborneZ) win.postMessage({ type: "eff-scenario-airborne", airborneZ: latest.airborneZ }, "*");
      if (typeof latest.activeSnapshotIdx === "number") win.postMessage({ type: "eff-scenario-active-snapshot", idx: latest.activeSnapshotIdx }, "*");
      if (latest.routeFixes) win.postMessage({ type: "eff-scenario-route", route: { fixes: latest.routeFixes } }, "*");
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === "eff-nd-ready") {
        readyRef.current = true;
        send();
        return;
      }
      if (e.data?.type === "eff-active-snapshot-action" && typeof e.data.idx === "number") {
        onActiveSnapshotActionRef.current?.(e.data.idx);
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
    if (typeof activeSnapshotIdx === "number") win.postMessage({ type: "eff-scenario-active-snapshot", idx: activeSnapshotIdx }, "*");
    if (routeFixes) win.postMessage({ type: "eff-scenario-route", route: { fixes: routeFixes } }, "*");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigmets, airborneZ, activeSnapshotIdx, routeFixes]);
}

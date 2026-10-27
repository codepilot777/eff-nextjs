"use client";

import { useEffect, useRef } from "react";
import type { ParsedSigmet } from "@/lib/weather/sigmetParser";
import type { RouteFix } from "@/lib/weather/routeFixes";

// 🌟 任意嘅 JSON——instructor 嗰邊 iframe 撳「📸 Capture for trainee」嗰刻
// 「影低」成個畫面要畫嘅嘢（aircraft 狀態/模擬時間/typhoon shift/view 設定），
// 結構由 public/weather-nd/index.html 自己定義同消費，EFF 呢邊淨係原封不動
// 存低、傳返出去，唔使識佢嘅內部形狀
export type ActiveSnapshot = Record<string, unknown>;

// 🌟 將 EFF 呢邊 parse 好嘅 SIGMET + airborne time + 教官 Capture 低嘅完整
// ND 畫面，postMessage 落 weather-nd 個 iframe（睇 public/weather-nd/
// index.html 嘅 applyScenarioSigmets/applyScenarioAirborne/
// applyScenarioActiveSnapshot）。等個 iframe 自己送嚟 "eff-nd-ready" 先開始
// 送資料（佢可能重未 load 完/init() 重未行完），之後呢幾樣資料一變就即刻
// 再送多次。
// 🌟 position 本身唔靠呢個 postMessage 做即時同步（試過，教官自己
// simulate 緊、trainee 又自己 simulate 緊，兩份唔準）——教官喺 Interactive
// 入面搵到啱嘅一刻，自己撳 Capture，將嗰刻成個畫面（唔淨係一個 index）
// 凍結低傳過去，trainee 嗰邊 100% 原樣 replay，唔使再計。IOS 自己個 iframe
// 撳 Capture 之後會反過嚟 postMessage 一個 "eff-active-snapshot-action"
// 畀 parent（睇 weather-nd/index.html 嘅 btnCapture handler）——
// `onActiveSnapshotAction` 俾 WxRadarTab 用嚟接住，寫落
// scenario_active_snapshot；trainee 嗰邊唔使呢個 callback，淨係單向接收
// activeSnapshot 就夠
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
  activeSnapshot?: ActiveSnapshot | null,
  onActiveSnapshotAction?: (snapshot: ActiveSnapshot) => void,
  routeFixes?: RouteFix[]
) {
  const readyRef = useRef(false);
  const latestRef = useRef({ sigmets, airborneZ, activeSnapshot, routeFixes });
  const onActiveSnapshotActionRef = useRef(onActiveSnapshotAction);

  useEffect(() => {
    latestRef.current = { sigmets, airborneZ, activeSnapshot, routeFixes };
  }, [sigmets, airborneZ, activeSnapshot, routeFixes]);

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
      if (latest.activeSnapshot) win.postMessage({ type: "eff-scenario-active-snapshot", snapshot: latest.activeSnapshot }, "*");
      if (latest.routeFixes) win.postMessage({ type: "eff-scenario-route", route: { fixes: latest.routeFixes } }, "*");
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === "eff-nd-ready") {
        readyRef.current = true;
        send();
        return;
      }
      if (e.data?.type === "eff-active-snapshot-action" && e.data.snapshot) {
        onActiveSnapshotActionRef.current?.(e.data.snapshot);
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
    if (activeSnapshot) win.postMessage({ type: "eff-scenario-active-snapshot", snapshot: activeSnapshot }, "*");
    if (routeFixes) win.postMessage({ type: "eff-scenario-route", route: { fixes: routeFixes } }, "*");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigmets, airborneZ, activeSnapshot, routeFixes]);
}

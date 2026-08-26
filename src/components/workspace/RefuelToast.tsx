"use client";

import { useEffect, useRef, useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";

// 🌟 簡單、唔使 manifest/service worker 嘅「通知」：純 in-app toast + 提示音，
// 靠 useFlightData 已有嘅 3 秒 polling 偵測 fuel_receipt_sent 由 false 變 true
// （教官喺 PayloadTab.tsx dispatch 咗 fuel receipt）。限制係淨係喺呢個 tab
// 開住喺前景先會觸發，唔係真正 OS 級 push notification（嗰個一定要 PWA +
// manifest + service worker + Web Push）

let audioCtx: AudioContext | null = null;

// 🌟 iOS Safari 一定要用戶做過至少一次手動 interaction 先畀 AudioContext
// 真正發聲，所以要等第一下 pointerdown 先建立 context，唔可以一 mount 就開
function ensureAudioUnlocked() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
}

// 🌟 現場合成兩下「叮咚」，唔使掛額外音效檔案
function playChime() {
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  [880, 1174].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.16;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });
}

export default function RefuelToast() {
  const { flightData } = useFlightData();
  const [message, setMessage] = useState<string | null>(null);
  // 🌟 undefined = 仲未攞過第一手數據；用嚟分辨「啱啱先由 false 變 true」
  // 同「一 load page 個 flag 本身已經係 true」（後者唔應該 toast）
  const prevRef = useRef<boolean | undefined>(undefined);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.addEventListener("pointerdown", ensureAudioUnlocked, { once: true });
    return () => document.removeEventListener("pointerdown", ensureAudioUnlocked);
  }, []);

  const fuelReceiptSent = flightData?.fuel_receipt_sent;
  useEffect(() => {
    if (fuelReceiptSent === undefined) return;
    const isRefueled = !!fuelReceiptSent;
    if (prevRef.current === undefined) {
      prevRef.current = isRefueled;
      return;
    }
    if (!prevRef.current && isRefueled) {
      setMessage("⛽ Refuelling Complete");
      playChime();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => setMessage(null), 6000);
    }
    prevRef.current = isRefueled;
  }, [fuelReceiptSent]);

  useEffect(() => {
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      onClick={() => setMessage(null)}
      className="fixed top-[64px] left-1/2 -translate-x-1/2 z-[200] bg-[#00E676] text-black font-black px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm uppercase tracking-widest animate-fade-in cursor-pointer"
    >
      {message}
    </div>
  );
}

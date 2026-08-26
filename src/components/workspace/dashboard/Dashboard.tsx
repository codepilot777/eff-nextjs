"use client";

import { useRef, useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";

import FmcCrewColumn from "./FmcCrewColumn";
import FuelWeightColumn from "./FuelWeightColumn";
import LoadsheetAirportColumn from "./LoadsheetAirportColumn";
import RefuelAircraftColumn from "./RefuelAircraftColumn";
import DashboardModals from "./DashboardModals";

// 🌟 Mobile：4 條 desktop 側邊並排嘅 column，內部個個都已經自成一套
// h-full/overflow-hidden/flex-[N] 嘅「fit 喺一屏度」邏輯（好多層 min-h-0 chain）。
// 與其逐個 column 拆晒重寫，不如喺 mobile 版將佢哋變做 4 頁可以上下 swipe/scroll
// 嘅全屏 slide（scroll-snap）——每個 column 入面嘅密度/排版同 desktop 一模一樣，
// 唔使承受重寫成套 flex chain 嘅風險，用戶淨係識由並排變做上下逐頁滑動
const SLIDE_LABELS = ["FMC & ATS", "FUEL & WEIGHT", "LOADSHEET", "REFUEL"];

export default function Dashboard({ setCurrentTab }: { setCurrentTab?: any }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 🌟 只需要攞 isLoading 嚟做 Spinner
  const { flightData, isLoading } = useFlightData();

  if (isLoading || !flightData) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#333] border-t-[#00E676] rounded-full animate-spin"></div>
        <span className="text-[#8fa0a6] font-mono tracking-widest text-sm animate-pulse">LOADING FLIGHT DATA...</span>
      </div>
    );
  }

  const scrollToSlide = (i: number) => {
    slideRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientHeight === 0) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveSlide(Math.max(0, Math.min(SLIDE_LABELS.length - 1, idx)));
  };

  return (
    <div className="relative flex flex-col h-full w-full">

      {/* 🌟 Mobile-only quick nav：跳去對應 slide，同時顯示緊 which slide */}
      <div className="flex md:hidden gap-1.5 justify-center pb-2 shrink-0 overflow-x-auto">
        {SLIDE_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => scrollToSlide(i)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-wide transition-colors ${
              activeSlide === i ? 'bg-[#C6FF00] text-black' : 'bg-[#1E1E1E] text-[#8fa0a6]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex flex-col md:flex-row gap-2 min-h-0 overflow-y-auto md:overflow-visible snap-y snap-mandatory md:snap-none scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent"
      >
        {/* 🌟 md:contents：desktop 完全消失做返直接 flex item，同改版前一模一樣；
            mobile 就係一個 h-full w-full snap-start 嘅獨立 slide */}
        <div ref={(el) => { slideRefs.current[0] = el; }} className="shrink-0 h-full w-full snap-start md:contents">
          <FmcCrewColumn setActiveModal={setActiveModal} />
        </div>
        <div ref={(el) => { slideRefs.current[1] = el; }} className="shrink-0 h-full w-full snap-start md:contents">
          <FuelWeightColumn setActiveModal={setActiveModal} />
        </div>
        <div ref={(el) => { slideRefs.current[2] = el; }} className="shrink-0 h-full w-full snap-start md:contents">
          <LoadsheetAirportColumn setActiveModal={setActiveModal} />
        </div>
        <div ref={(el) => { slideRefs.current[3] = el; }} className="shrink-0 h-full w-full snap-start md:contents">
          <RefuelAircraftColumn setActiveModal={setActiveModal} setCurrentTab={setCurrentTab} />
        </div>
      </div>

      <DashboardModals activeModal={activeModal} setActiveModal={setActiveModal} />
    </div>
  );
}

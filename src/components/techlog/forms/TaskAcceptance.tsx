"use client";
import { useState } from "react";
import { computeFuelDerived } from "@/lib/techlog/fuelRecord";
import { MaintenanceWorkCard } from "@/components/techlog/shared/MaintenanceWorkCard";
import { ServicingSummaryCard } from "@/components/techlog/shared/ServicingSummaryCard";
import { FuelRecordCard } from "@/components/techlog/shared/FuelRecordCard";

// 🌟 淨係用嚟顯示航班資訊卡嘅機場全名，冇資料嘅機場就淨係顯示 code（睇下面 fallback）
const AIRPORT_NAMES: Record<string, string> = {
  HKG: "Hong Kong Intl",
  SIN: "Singapore Changi",
  KIX: "Kansai Intl",
  BKK: "Suvarnabhumi",
  TPE: "Taiwan Taoyuan",
  NGO: "Chubu Centrair",
  NRT: "Narita Intl",
  ICN: "Incheon Intl",
  PVG: "Shanghai Pudong",
  MNL: "Ninoy Aquino Intl",
  CGK: "Soekarno-Hatta Intl",
  KUL: "Kuala Lumpur Intl",
  CTS: "New Chitose",
};

// 🌟 起機嗰刻/歷史記錄都會顯示嘅通用機務通告，純粹裝飾（同 History 個 sector
// 詳情共用同一句），冇對應嘅 data model 欄位
const MAINTENANCE_NOTICE = "PITOT / STATIC PROBE COVERS — NIL FITTED, ACCOUNTED FOR";

export function TaskAcceptance({ tlData, updateTechLogData, setActiveTask }: any) {
  const [acceptToggle, setAcceptToggle] = useState(false);
  const {
    tl_release: isReleased, tl_checks: isChecks,
    tl_total_departure_fuel: totalDepFuel, tl_actual_uplift: actualUplift,
    tl_prev_fob: prevFob, tl_fuel_cycling_confirmed: fuelCyclingConfirmed,
    tl_prep_flt, tl_prep_dep, tl_prep_arr, tl_cmdr, tl_galaxy_id,
    crs_id, tl_entries
  } = tlData;

  // 🌟 Expected Uplift/Discrepancy 同 TaskFuelRecord.tsx 用返同一條公式（睇
  // lib/techlog/fuelRecord.ts），Fuel Record 個 task 填低嘅原始數（FOB before/
  // total departure/actual uplift）已經存喺 tlData，呢度即時計返出嚟顯示，
  // 唔使額外開多個欄位存呢啲衍生數
  const fobBefore = parseFloat(prevFob || "10.5") || 0;
  const totalDeparture = parseFloat(totalDepFuel || 0) || 0;
  const parsedActualUplift = parseFloat(actualUplift || 0) || 0;
  const { expectedUplift, discrepancy } = computeFuelDerived(fobBefore, totalDeparture, parsedActualUplift);

  const handleConfirm = () => {
    if (!isReleased || !acceptToggle) return;
    updateTechLogData({
      data: {
        tl_accept: true,
        tl_flight_started: true,
        tl_flight_status: "IN_FLIGHT"
      }
    });
    setActiveTask(null);
  };

  const depName = AIRPORT_NAMES[String(tl_prep_dep).toUpperCase()];
  const arrName = AIRPORT_NAMES[String(tl_prep_arr).toUpperCase()];
  const canConfirm = isReleased && acceptToggle;

  return (
    <div className="flex flex-col h-full relative font-sans">

      {/* 🌟 Header：Close/Confirm 搬咗上嚟，唔使 scroll 到底先揾到個 confirm 掣 */}
      <div className="flex items-center justify-between gap-3 border-b border-[#333] pb-4 mb-6 shrink-0">
        <button
          onClick={() => setActiveTask(null)}
          aria-label="Close"
          className="w-9 h-9 shrink-0 rounded-lg bg-white/5 border border-[#444] text-[#8fa0a6] flex items-center justify-center hover:text-white hover:border-[#666] transition-colors"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3 className="flex-1 text-base font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#00E676] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Commander's Acceptance
        </h3>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={`shrink-0 px-4 py-2.5 rounded-lg font-black text-[0.65rem] uppercase tracking-widest transition-all ${
            canConfirm
              ? 'bg-[#C6FF00] text-black hover:bg-[#a8db00] shadow-[0_4px_15px_rgba(198,255,0,0.3)]'
              : 'bg-white/5 text-[#555] border border-[#333] cursor-not-allowed'
          }`}
        >
          Confirm
        </button>
      </div>

      {!isReleased ? (
        /* 🛑 未 Release 警告畫面 */
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-[#FF1744]/10 border border-[#FF1744]/50 rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_0_30px_rgba(255,23,68,0.15)] max-w-md">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-[#FF1744] mb-4 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-[#FF1744] font-black uppercase tracking-widest text-lg mb-2">Aircraft Not Released</h4>
            <p className="text-[#e2e8f0] text-[0.75rem] font-bold leading-relaxed">
              The aircraft has not been released by Engineering yet. Commander's acceptance is currently disabled.
            </p>
          </div>
        </div>
      ) : (
        /* ✅ 已 Release 表單畫面 */
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent pb-4">

          {/* 🌟 頂部：Maintenance Release (CRS) 狀態橫幅 */}
          <div className="bg-[#00E676]/10 border border-[#00E676]/30 p-4 rounded-xl flex items-center justify-between shadow-inner">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#00E676]/20 rounded-full flex items-center justify-center text-[#00E676]">
                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9 9-4.03 9-9z" /></svg>
               </div>
               <div>
                 <div className="text-[#00E676] font-black text-[0.7rem] uppercase tracking-widest">Maintenance Release Issued</div>
                 <div className="text-white font-mono font-bold text-sm mt-0.5">{crs_id || 'CRS-PENDING'}</div>
               </div>
             </div>
             <div className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest text-right">
               Status:<br/><span className="text-[#00E676]">Airworthy</span>
             </div>
          </div>

          <MaintenanceWorkCard entries={tl_entries} noticeLine={MAINTENANCE_NOTICE} />

          <ServicingSummaryCard checksCompleted={!!isChecks} />

          <FuelRecordCard
            title="Latest Fuel Record"
            data={{ fobBefore, totalDeparture, actualUplift: parsedActualUplift, expectedUplift, discrepancy, doorCyclingConfirmed: !!fuelCyclingConfirmed }}
          />

          {/* 第 3 行：Flight Details */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Flight Number</label>
              <input type="text" value={tl_prep_flt} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 text-center">Origin</label>
                <input type="text" value={tl_prep_dep} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-center text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
                {depName && <div className="text-center text-[0.6rem] font-bold uppercase tracking-widest text-[#555] mt-1.5">{depName}</div>}
              </div>
              <div className="text-[#555] pb-5">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
              </div>
              <div className="flex-1">
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2 text-center">Destination</label>
                <input type="text" value={tl_prep_arr} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-center text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
                {arrName && <div className="text-center text-[0.6rem] font-bold uppercase tracking-widest text-[#555] mt-1.5">{arrName}</div>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">Commander</label>
                <input type="text" value={tl_cmdr} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold uppercase tracking-widest mb-2">GalaCXy ID</label>
                <input type="text" value={tl_galaxy_id} disabled className="w-full bg-[#1a1a1a] border border-[#333] p-4 rounded-xl font-mono font-bold text-[#8fa0a6] cursor-not-allowed shadow-inner uppercase" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#333] w-full my-1"></div>

          {/* 第 4 行：Declaration & Toggle */}
          <div
            onClick={() => setAcceptToggle(!acceptToggle)}
            className={`flex items-center justify-between bg-[#0a0a0a] border p-5 rounded-xl cursor-pointer transition-colors select-none shadow-inner ${acceptToggle ? 'border-[#00E676]/50' : 'border-[#444] hover:border-[#666]'}`}
          >
            <div className="flex flex-col pr-6">
              <p className={`text-[0.75rem] font-mono leading-relaxed italic transition-colors ${acceptToggle ? 'text-[#00E676]' : 'text-[#8fa0a6]'}`}>
                "I accept the aircraft's declared airworthiness and certify that the fuel grade, distribution and quantity is sufficient for the intended flight."
              </p>
            </div>
            <div className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner shrink-0 ${acceptToggle ? 'bg-[#00E676]' : 'bg-[#333]'}`}>
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${acceptToggle ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
          <div className={`text-center text-[0.65rem] font-bold uppercase tracking-widest ${acceptToggle ? 'text-[#00E676]' : 'text-[#FF1744]'}`}>
            {acceptToggle ? 'Ready to confirm' : 'Confirm acceptance to continue'}
          </div>

        </div>
      )}
    </div>
  );
}

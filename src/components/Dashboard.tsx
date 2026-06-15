"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFlightData } from "@/hooks/useFlightData";

import FmcCrewColumn from "./dashboard/FmcCrewColumn";
import FuelWeightColumn from "./dashboard/FuelWeightColumn";
import LoadsheetAirportColumn from "./dashboard/LoadsheetAirportColumn";
import RefuelAircraftColumn from "./dashboard/RefuelAircraftColumn";
import DashboardModals from "./dashboard/DashboardModals";

export default function Dashboard({ setCurrentTab }: { setCurrentTab?: any }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // 🌟 1. 從 Hook 提取 Backend Data 同 Handlers
  const { flightData, calc: fuelCalc, handlers, updateFlightData, isLoading } = useFlightData();

  // Techlog 輪詢
  const reg = flightData?.aircraft_reg || flightData?.raw_simbrief?.general?.aircraft_reg || 'B-HNQ';
  const { data: techlogData } = useQuery({
    queryKey: ["techlog", reg],
    queryFn: async () => {
      const res = await fetch(`/api/techlog?reg=${reg}`);
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!reg && !!flightData,
  });

  // Loading 防護網，確保 flightData 準備好先 Render
  if (isLoading || !flightData || !fuelCalc) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#333] border-t-[#00E676] rounded-full animate-spin"></div>
        <span className="text-[#8fa0a6] font-mono tracking-widest text-sm animate-pulse">LOADING FLIGHT DATA...</span>
      </div>
    );
  }

  // =====================================================================
  // 🌟 2. 恢復 UI Metadata (頭先剷得太過火，依家擺返入嚟畀子組件用)
  // =====================================================================
  const rawSb = flightData?.raw_simbrief || {};
  const gen = rawSb.general || {};
  const orig = rawSb.origin || {};
  const dest = rawSb.destination || {};
  const fuelSb = rawSb.fuel || {};

  const acType = flightData?.aircraft_type || gen.icao_aircraft || 'B773';
  const routeStr = flightData?.route_id || gen.route || 'DCT';
  const shortRoute = routeStr.split(" ").length > 5 ? routeStr.split(" ").slice(0, 5).join(" ") + " ..." : routeStr;
  const costIndex = flightData?.cost_index || (gen.costindex ? `CI ${gen.costindex}` : 'CI 85');
  const depIcao = flightData?.dep_icao || orig.icao_code || 'VHHH';
  const arrIcao = flightData?.arr_icao || dest.icao_code || 'RJBB';
  
  const depIata = orig.iata_code || "---";
  const arrIata = dest.iata_code || "---";

  const dragFf = flightData?.drag_ff || 'P0.0 / P0.0';
  const melCdl = flightData?.mel_cdl || 'NIL';
  const totalDist = flightData?.ground_dist || gen.route_distance || '1000';

  let rawCruiseAlt = flightData?.cruise_alt || gen.initial_altitude || '35000';
  let cruiseAlt = rawCruiseAlt;
  if (rawCruiseAlt && typeof rawCruiseAlt === 'string') {
      if (rawCruiseAlt.length >= 4) cruiseAlt = `FL${rawCruiseAlt.substring(0, 3)}`;
      else if (!rawCruiseAlt.startsWith('FL')) cruiseAlt = `FL${rawCruiseAlt}`;
  }

  const tocTemp = flightData?.toc_temp || 'M45';
  const edtoFlight = flightData?.edto_flight || (gen.is_etops === "1" ? "YES" : "NO");

  const resFuel = (parseInt(fuelSb.reserve || 0) / 1000.0) || flightData?.fuel_reserve_ofp || 0;
  const altnFuel = (parseInt(fuelSb.alternate_burn || 0) / 1000.0) || flightData?.fuel_altn_ofp || 0;
  const minDivert = ((resFuel + altnFuel) > 0) ? (resFuel + altnFuel).toFixed(1) + ' T' : '--';

  let windStr = flightData?.avg_wind || gen.avg_wind_comp || 'N/A';
  if (windStr !== 'N/A' && typeof windStr === 'string' && !windStr.startsWith('P') && !windStr.startsWith('M')) {
    const numWind = parseInt(windStr);
    if (!isNaN(numWind)) windStr = (numWind >= 0 ? 'P' : 'M') + Math.abs(numWind).toString().padStart(3, '0');
  }
  const avgWind = windStr;
  const avgTrip = flightData?.avg_trip_burn || '18.5';
  const mraHigh = flightData?.highest_trip_mra || '41';
  const mraEdg = flightData?.edg_mra || '--';
  const sid = flightData?.sid_route || gen.sid_ident || 'AWY';
  const star = flightData?.star_route || gen.star_ident || 'AWY';
  const depRwy = flightData?.dep_rwy || orig.plan_rwy || '07R';
  const arrRwy = flightData?.arr_rwy || dest.plan_rwy || '05R';

  const paxTot = (flightData?.pax_f || 0) + (flightData?.pax_j || 0) + (flightData?.pax_w || 0) + (flightData?.pax_y || 0);
  const cgo_total = (flightData?.cargo_hold_1 || 0) + (flightData?.cargo_hold_2 || 0) + (flightData?.cargo_hold_3 || 0) + (flightData?.cargo_hold_4 || 0) + (flightData?.cargo_bulk || 0);

  let lsStageHtml = <div className="mt-2 text-[#8fa0a6] text-center font-bold text-xs border border-dashed border-[#404040] p-1 rounded">NO LOAD INFO RECEIVED</div>;
  let isLsActive = false;
  if (flightData?.final_ls_sent) {
    const fVer = flightData?.final_ls_version || 1;
    lsStageHtml = flightData?.pilots_signed_final 
      ? <div className="mt-2 bg-[#00E676] text-black p-1 rounded text-center font-bold text-xs shadow-[0_0_8px_rgba(0,230,118,0.4)]">FINAL {fVer.toString().padStart(2, '0')} Ack.</div>
      : <div className="mt-2 bg-[#FF9100] text-black p-1 rounded text-center font-bold text-xs shadow-[0_0_8px_rgba(255,145,0,0.4)] animate-pulse">FINAL {fVer.toString().padStart(2, '0')}</div>;
    isLsActive = true;
  } else if (flightData?.prelim_ls_sent) {
    lsStageHtml = <div className="mt-2 bg-[#FF9100] text-black p-1 rounded text-center font-bold text-xs shadow-[0_0_8px_rgba(255,145,0,0.4)]">PRELIM {(flightData?.prelim_ls_version || 1).toString().padStart(2, '0')}</div>;
    isLsActive = true;
  } else if (flightData?.azf_sent) {
    lsStageHtml = <div className="mt-2 text-[#00E676] text-center font-bold text-xs border border-dashed border-[#00E676] p-1 rounded">AZF SENT</div>;
    isLsActive = true;
  } else if (flightData?.ezfw_sent) {
    lsStageHtml = <div className="mt-2 text-[#00bfa5] text-center font-bold text-xs border border-dashed border-[#00bfa5] p-1 rounded">EZFW SENT</div>;
    isLsActive = true;
  }

  let refuelHtml = null;
  if (!flightData?.final_fuel_accepted) refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full"><span className="text-[#8fa0a6] text-[0.65rem] font-bold">STANDBY FIGURE SENT</span><span className="text-white text-xl font-bold">{Math.max(0, fuelCalc.currTotal - 5.0).toFixed(1)} T</span></div>;
  else if (!flightData?.fuel_receipt_sent) refuelHtml = <div className="flex flex-col items-center justify-center py-3 h-full"><span className="text-[#FF9100] text-lg font-bold tracking-widest animate-pulse">REFUELLING...</span></div>;
  else if (!flightData?.pilots_signed_fuel) refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full cursor-pointer hover:scale-105 transition-transform"><div className="bg-[#FF9100] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(255,145,0,0.4)]">SIGN RECEIPT</div></div>;
  else refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full"><div className="bg-[#00E676] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(0,230,118,0.4)]">FUEL ACCEPTED</div></div>;

  let acStatus = <div className="bg-[#1c2630] text-[#8fa0a6] p-1 rounded text-center font-bold mb-2 text-xs border border-dashed border-[#404040]">AWAITING TECHLOG RELEASE</div>;
  if (flightData?.tl_release && flightData?.tl_accept && flightData?.tl_flight_started) acStatus = <div className="bg-[#00E676] text-black p-1 rounded text-center font-bold mb-2 text-xs">✅ AIRCRAFT ACCEPTED</div>;
  else if (flightData?.tl_release) acStatus = <div className="bg-[#FF9100] text-black p-1 rounded text-center font-bold mb-2 text-xs">⏳ TECHLOG RELEASED</div>;

  // 🌟 3. 將 UI 變數 同 Hook 畀我哋嘅燃油變數「合體」，重現完整 calc！
  const fullCalc = {
    acType, reg, routeStr, shortRoute, costIndex, depIcao, arrIcao, depIata, arrIata, dragFf, melCdl,
    totalDist, cruiseAlt, tocTemp, edtoFlight, minDivert, avgWind, avgTrip, mraHigh, mraEdg,
    sid, star, depRwy, arrRwy, paxTot, cgo_total, lsStageHtml, isLsActive,
    refuelHtml, acStatus,
    ...fuelCalc // 👈 完美導入 autoTaxi, currTotal, mf, 等等
  };

  return (
    <div className="relative flex gap-2 h-full w-full">
      <FmcCrewColumn flightData={flightData} calc={fullCalc} setActiveModal={setActiveModal} />
      <FuelWeightColumn setActiveModal={setActiveModal} />
      <LoadsheetAirportColumn flightData={flightData} calc={fullCalc} setActiveModal={setActiveModal} />
      <RefuelAircraftColumn flightData={flightData} updateFlightData={updateFlightData} calc={fullCalc} setActiveModal={setActiveModal} setCurrentTab={setCurrentTab} techlogData={techlogData}/>
      <DashboardModals flightData={flightData} updateFlightData={updateFlightData} activeModal={activeModal} setActiveModal={setActiveModal} calc={fullCalc} handlers={handlers} />
    </div>
  );
}
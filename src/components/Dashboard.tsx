"use client";

import { useState, useEffect } from "react";
import FmcCrewColumn from "./dashboard/FmcCrewColumn";
import FuelWeightColumn from "./dashboard/FuelWeightColumn";
import LoadsheetAirportColumn from "./dashboard/LoadsheetAirportColumn";
import RefuelAircraftColumn from "./dashboard/RefuelAircraftColumn";
import DashboardModals from "./dashboard/DashboardModals";

export default function Dashboard({ flightData, updateFlightData }: { flightData?: any, updateFlightData?: any }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // 🌟 1. 新增 Techlog 專用 State (undefined 代表 Loading 中)
  const [techlogData, setTechlogData] = useState<any>(undefined);

  const rawSb = flightData?.raw_simbrief || {};
  const gen = rawSb.general || {};
  const orig = rawSb.origin || {};
  const dest = rawSb.destination || {};
  const fuelSb = rawSb.fuel || {};

  const acType = flightData?.aircraft_type || gen.icao_aircraft || 'B773';
  const reg = flightData?.aircraft_reg || gen.aircraft_reg || 'B-HNQ';

  // 🌟 2. 使用 useEffect 獨立去 Call 第二個 API 讀取 Techlog
  // 🌟 獨立去 Call API 讀取 Techlog (加強版：加入實時同步)
  useEffect(() => {
    const fetchTechlog = async () => {
      if (!reg) return;
      
      try {
        const res = await fetch(`/api/techlog?reg=${reg}`);
        
        if (res.ok) {
          const data = await res.json();
          setTechlogData(data);
        } else {
          setTechlogData({ defects: flightData?.defects || [] }); 
        }
      } catch (error) {
        console.error("Failed to fetch techlog data", error);
        setTechlogData({ defects: flightData?.defects || [] });
      }
    };

    // 1. 初次載入時即刻 Fetch 一次
    fetchTechlog();

    // 🌟 2. 加入「心跳機制」：每 3 秒去 Database 攞一次最新 Defect 狀態
    const interval = setInterval(fetchTechlog, 3000);

    // 🌟 3. Clean up function：當離開 Dashboard 畫面時停止 polling，防止 Memory Leak
    return () => clearInterval(interval);
    
  }, [reg, flightData?.defects]); // 依賴項保持不變 🌟 Dependency 係架飛機

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
  if (rawCruiseAlt.length >= 4) cruiseAlt = `FL${rawCruiseAlt.substring(0, 3)}`;
  else if (!rawCruiseAlt.startsWith('FL')) cruiseAlt = `FL${rawCruiseAlt}`;

  const tocTemp = flightData?.toc_temp || 'M45';
  const edtoFlight = flightData?.edto_flight || (gen.is_etops === "1" ? "YES" : "NO");

  const resFuel = (parseInt(fuelSb.reserve || 0) / 1000.0) || flightData?.fuel_reserve_ofp || 0;
  const altnFuel = (parseInt(fuelSb.alternate_burn || 0) / 1000.0) || flightData?.fuel_altn_ofp || 0;
  const minDivert = ((resFuel + altnFuel) > 0) ? (resFuel + altnFuel).toFixed(1) + ' T' : '--';

  let windStr = flightData?.avg_wind || gen.avg_wind_comp || 'N/A';
  if (windStr !== 'N/A' && !windStr.toString().startsWith('P') && !windStr.toString().startsWith('M')) {
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
  
  let lsStageHtml = <div className="mt-2 text-text-muted text-center font-bold text-xs border border-dashed border-[#404040] p-1 rounded">NO LOAD INFO RECEIVED</div>;
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
    lsStageHtml = <div className="mt-2 text-status-teal text-center font-bold text-xs border border-dashed border-[#00bfa5] p-1 rounded">EZFW SENT</div>;
    isLsActive = true;
  }

  const isManual = flightData?.fuel_manual_mode || false;
  
  const alternates = flightData?.alternates || [];
  const altnList = alternates.length > 0 ? alternates : [{ icao: flightData?.altn_icao || 'N/A', burn: flightData?.fuel_altn_ofp || 0.0, time: 30 }];
  const altnOptions = altnList.map((a: any) => a.icao);
  const selectedAltn = flightData?.selected_altn || altnOptions[0] || 'N/A';
  
  const baseAltnOfp = altnList.find((a: any) => a.icao === selectedAltn)?.burn || flightData?.fuel_altn_ofp || 0.0;
  const currAltnOfp = baseAltnOfp;

  const ofpZfw = flightData?.weight_zfw_ofp || 0.0;
  const ofpTaxi = flightData?.fuel_taxi_ofp || 0.0;
  const ofpTrip = flightData?.fuel_trip_ofp || 0.0;
  const ofpCont = flightData?.fuel_cont_ofp || 0.0;
  const ofpRes = flightData?.fuel_reserve_ofp || 0.0;
  const ofpReqdBase = ofpTaxi + ofpTrip + ofpCont + baseAltnOfp + ofpRes;
  const ofpTotal = ofpReqdBase; 
  
  const actualZfw = flightData?.trainee_input_zfw || 0.0;
  const delta = actualZfw > 0 ? actualZfw - ofpZfw : 0.0;
  const autoTaxi = ofpTaxi;
  const autoCont = ofpCont;
  const autoTrip = ofpTrip + (delta * 0.03);
  const autoReqdBase = autoTaxi + autoTrip + autoCont + currAltnOfp + ofpRes;
  const autoTotal = autoReqdBase;
  
  const mf = flightData?.manual_fuel || {};
  const currTaxi = isManual ? (mf.taxi ?? autoTaxi) : autoTaxi;
  const currTrip = isManual ? (mf.trip ?? autoTrip) : autoTrip;
  const currCont = isManual ? (mf.cont ?? autoCont) : autoCont;
  const currTank = isManual ? (mf.tankering ?? 0.0) : 0.0;
  const currExtra = isManual ? (mf.extra ?? 0.0) : 0.0;
  const currReqdBase = currTaxi + currTrip + currCont + currAltnOfp + ofpRes;
  const currTotal = isManual ? (mf.total ?? (currReqdBase + currTank + currExtra)) : (currReqdBase + currTank + currExtra);
  const currTow = (actualZfw > 0 ? actualZfw : ofpZfw) + (currTotal - currTaxi);
  const currLw = currTow - currTrip;
  const showRevVal = isManual || (actualZfw > 0) || (selectedAltn !== (altnOptions[0] || 'N/A'));

  let refuelHtml = null;
  if (!flightData?.final_fuel_accepted) refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full"><span className="text-text-muted text-[0.65rem] font-bold">STANDBY FIGURE SENT</span><span className="text-white text-xl font-bold">{Math.max(0, currTotal - 5.0).toFixed(1)} T</span></div>;
  else if (!flightData?.fuel_receipt_sent) refuelHtml = <div className="flex flex-col items-center justify-center py-3 h-full"><span className="text-[#FF9100] text-lg font-bold tracking-widest animate-pulse">REFUELLING...</span></div>;
  else if (!flightData?.pilots_signed_fuel) refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full cursor-pointer hover:scale-105 transition-transform"><div className="bg-[#FF9100] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(255,145,0,0.4)]">SIGN RECEIPT</div></div>;
  else refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full"><div className="bg-[#00E676] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(0,230,118,0.4)]">FUEL ACCEPTED</div></div>;

  let acStatus = <div className="bg-[#1c2630] text-text-muted p-1 rounded text-center font-bold mb-2 text-xs border border-dashed border-[#404040]">AWAITING TECHLOG RELEASE</div>;
  if (flightData?.tl_release && flightData?.tl_accept && flightData?.tl_flight_started) acStatus = <div className="bg-[#00E676] text-black p-1 rounded text-center font-bold mb-2 text-xs">✅ AIRCRAFT ACCEPTED</div>;
  else if (flightData?.tl_release) acStatus = <div className="bg-[#FF9100] text-black p-1 rounded text-center font-bold mb-2 text-xs">⏳ TECHLOG RELEASED</div>;

  const calc = {
    acType, reg, routeStr, shortRoute, costIndex, depIcao, arrIcao, depIata, arrIata, dragFf, melCdl,
    totalDist, cruiseAlt, tocTemp, edtoFlight, minDivert, avgWind, avgTrip, mraHigh, mraEdg,
    sid, star, depRwy, arrRwy, paxTot, cgo_total, lsStageHtml, isLsActive,
    isManual, ofpZfw, ofpTaxi, ofpTrip, ofpCont, ofpRes, baseAltnOfp, ofpReqdBase, ofpTotal,
    actualZfw, delta, autoTaxi, autoCont, autoTrip, alternates, altnList, altnOptions, selectedAltn, currAltnOfp,
    mf, currTaxi, currTrip, currCont, currTank, currExtra, currReqdBase, currTotal, currTow, currLw, showRevVal,
    refuelHtml, acStatus
  };

  const handlers = {
    handleManualToggle: () => {
      const newMode = !isManual;
      if (newMode) {
        updateFlightData({ fuel_manual_mode: newMode, manual_fuel: { taxi: Number(autoTaxi.toFixed(1)), trip: Number(autoTrip.toFixed(1)), cont: Number(autoCont.toFixed(1)), tankering: 0.0, extra: 0.0, total: Number(autoTotal.toFixed(1)) } });
      } else updateFlightData({ fuel_manual_mode: newMode });
    },
    handleFuelInput: (field: string, val: string) => {
      if (!updateFlightData) return;
      const num = parseFloat(val) || 0.0;
      const newMf = { ...mf, [field]: num };
      if (field !== 'total') newMf.total = Number((newMf.taxi + newMf.trip + newMf.cont + currAltnOfp + ofpRes + newMf.tankering + newMf.extra).toFixed(1));
      else {
        let calcExtra = num - (newMf.taxi + newMf.trip + newMf.cont + currAltnOfp + ofpRes + newMf.tankering);
        newMf.extra = calcExtra < 0 ? 0.0 : Number(calcExtra.toFixed(1));
        newMf.total = calcExtra < 0 ? Number((newMf.taxi + newMf.trip + newMf.cont + currAltnOfp + ofpRes + newMf.tankering).toFixed(1)) : num;
      }
      updateFlightData({ manual_fuel: newMf, final_fuel_accepted: false });
    },
    handleZfwInput: (val: string) => {
      const num = parseFloat(val) || 0.0;
      if (num !== flightData?.trainee_input_zfw) updateFlightData({ trainee_input_zfw: num, final_fuel_accepted: false });
    },
    handleAcceptFuel: () => { updateFlightData({ final_fuel_accepted: true, final_fuel_request: currTotal }); },
    diffStr: (rev: number, ofp: number) => {
      if (typeof rev !== 'number' || typeof ofp !== 'number') return null;
      if (ofp === 0 && rev === 0) return null;
      const diff = rev - ofp;
      if (Math.abs(diff) < 0.05) return null;
      return <span className={diff > 0 ? "text-[#FF9100]" : "text-[#00E676]"}>{diff > 0 ? "+" : ""}{diff.toFixed(1)}</span>;
    }
  };

  return (
    <div className="relative flex gap-2 h-full w-full">
      <FmcCrewColumn flightData={flightData} calc={calc} setActiveModal={setActiveModal} />
      <FuelWeightColumn flightData={flightData} updateFlightData={updateFlightData} calc={calc} handlers={handlers} setActiveModal={setActiveModal}/>
      <LoadsheetAirportColumn flightData={flightData} calc={calc} setActiveModal={setActiveModal} />
      {/* 🌟 3. 將 techlogData 當做 prop 傳畀 RefuelAircraftColumn */}
      <RefuelAircraftColumn flightData={flightData} techlogData={techlogData} updateFlightData={updateFlightData} calc={calc} setActiveModal={setActiveModal} />
      <DashboardModals flightData={flightData} updateFlightData={updateFlightData} activeModal={activeModal} setActiveModal={setActiveModal} calc={calc} handlers={handlers} />
    </div>
  );
}
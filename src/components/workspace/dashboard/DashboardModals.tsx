"use client";

// 從 index.ts 一次過引入所有模組
import { ModalReject, ModalFMS, ModalDOCS, ModalRefuelling, ModalSNN, ModalAcceptFuel, ModalDefects, ModalNOTOC, ModalCrew } from "./modals";
import { ModalLoadsheet } from './modals/ModalLoadsheet/index'
import { ModalAirports } from "./modals/ModalAirports/index";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { useTechlogData } from "@/hooks/useTechlogData";

// 🌟 Props 大清洗：只保留 activeModal 同 setActiveModal
export default function DashboardModals({ activeModal, setActiveModal }: { activeModal: string | null, setActiveModal: any }) {

  // 🌟 從 React Query 抽取資料
  const { flightData, calc: fuelCalc, handlers, updateFlightData } = useFlightData();
  const { data: techlogData } = useTechlogData(flightData);

  if (!activeModal || !flightData || !fuelCalc) return null;

  // ==========================================
  // 🌟 重構 fullCalc 畀入面啲 Modal 用 (完美自給自足)
  // ==========================================
  const rawSb = flightData?.raw_simbrief || {};
  const gen = rawSb.general || {};
  const orig = rawSb.origin || {};
  const dest = rawSb.destination || {};

  const acType = flightData?.aircraft_type || gen.icao_aircraft || 'B773';
  const reg = flightData?.aircraft_reg || gen.aircraft_reg || 'B-HNQ';
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

  const fullCalc = {
    acType, reg, routeStr, shortRoute, costIndex, depIcao, arrIcao, depIata, arrIata, dragFf, melCdl,
    totalDist, cruiseAlt, tocTemp, edtoFlight, avgWind, avgTrip, mraHigh, mraEdg,
    sid, star, depRwy, arrRwy, paxTot, cgo_total,
    ...fuelCalc 
  };

  // 判定 Modal Title
  let modalTitle = "";
  switch(activeModal) {
    case 'FMS': modalTitle = 'FMS & ATS Data Preview'; break;
    case 'Loadsheet': modalTitle = 'Loadsheet & Payload Detail'; break;
    case 'RejectPrelim': modalTitle = 'Reject PRELIM Loadsheet'; break;
    case 'RejectFinal': modalTitle = 'Reject FINAL Loadsheet'; break;
    case 'RejectFuel': modalTitle = 'Reject Fuel Receipt'; break;
    case 'Airports': modalTitle = 'Airports'; break;
    case 'Refuelling': modalTitle = 'Refuelling Order & Receipt'; break;
    case 'SNN': modalTitle = 'Special Navigation Note'; break;
    case 'DOCS': modalTitle = 'Operational Flight Plan'; break;
    case 'AcceptFuel': modalTitle = 'Accept Final Fuel Figures'; break;
    case 'Defects': modalTitle = 'Aircraft Defects (PADD / SADD / ADD)'; break;
    case 'NOTOC': modalTitle = 'Notification to Captain (NOTOC)'; break;
    case 'Crew': modalTitle = 'Crew Roster'; break;
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6 md:p-8 backdrop-blur-sm animate-fade-in">
      <div className={`bg-[#1c1c1c] border border-[#333333] rounded-2xl w-full ${activeModal === 'Airports' || activeModal === 'NOTOC' ? 'max-w-7xl' : 'max-w-6xl'} shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[90vh]`}>
        <div className="flex justify-between items-center px-6 py-4 bg-[#1c1c1c] border-b border-[#333333] shrink-0">
          <h2 className="text-lg font-bold text-white tracking-wide">{modalTitle}</h2>
          <button onClick={() => setActiveModal(null)} className="text-[#8fa0a6] hover:text-white hover:bg-[#333333] rounded-full w-8 h-8 flex items-center justify-center font-black transition-colors">
            ✕
          </button>
        </div>
        
        <div className={`p-6 overflow-y-auto text-[#e2e8f0] flex-1 ${activeModal !== 'Airports' ? 'font-mono' : 'font-sans'} text-sm leading-relaxed bg-[#0a0a0a]`}>
          {activeModal === 'FMS' && <ModalFMS calc={fullCalc} flightData={flightData} />}
          {activeModal === 'Loadsheet' && <ModalLoadsheet calc={fullCalc} flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          {activeModal === 'RejectPrelim' && <ModalReject type="PRELIM" flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          {activeModal === 'RejectFinal' && <ModalReject type="FINAL" flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          {activeModal === 'RejectFuel' && <ModalReject type="FUEL" flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          {activeModal === 'Airports' && <ModalAirports calc={fullCalc} flightData={flightData} /> }
          {activeModal === 'Refuelling' && <ModalRefuelling flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          {activeModal === 'SNN' && <ModalSNN flightData={flightData} />}
          {activeModal === 'DOCS' && <ModalDOCS flightData={flightData} />}
          {/* 🌟 修復：以前呢度冇傳 updateFlightData，令 ModalAcceptFuel 入面
              `if (updateFlightData)` 個 guard 恆定 false，Log Fuel/estimated_uplift
              寫入靜靜雞冇咗，淨係 handlers.handleAcceptFuel() 真正生效 */}
          {activeModal === 'AcceptFuel' && <ModalAcceptFuel flightData={flightData} updateFlightData={updateFlightData} calc={fullCalc} handlers={handlers} setActiveModal={setActiveModal} />}
          {activeModal === 'Defects' && <ModalDefects techlogData={techlogData} />}
          {activeModal === 'NOTOC' && <ModalNOTOC flightData={flightData} />}
          {activeModal === 'Crew' && <ModalCrew flightData={flightData} />}
        </div>
      </div>
    </div>
  );
}
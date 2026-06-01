"use client";

import { useState } from "react";

export default function Dashboard({ flightData, updateFlightData }: { flightData?: any, updateFlightData?: any }) {
  
  // Modal 狀態控制
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // 用於解碼 SimBrief 傳回的 HTML 特殊字元
  const unescapeHTML = (str: string) => {
    if (!str) return "No briefing HTML available.";
    return str.replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
  };

  // ==============================================
  // 1. FMC & Crew 資料與擴展變數
  // ==============================================
  const acType = flightData?.aircraft_type || 'B773';
  const reg = flightData?.aircraft_reg || 'B-HNQ';
  const routeStr = flightData?.route_id || 'DCT';
  const shortRoute = routeStr.split(" ").length > 5 ? routeStr.split(" ").slice(0, 5).join(" ") + " ..." : routeStr;
  const costIndex = flightData?.cost_index || 'CI 85';
  
  const depIcao = flightData?.dep_icao || 'VHHH';
  const arrIcao = flightData?.arr_icao || 'RJBB';
  
  // FMS & ATS 新增擴展變數
  const dragFf = 'P0.0 / P0.0'; // Hard coded as requested
  const melCdl = flightData?.mel_cdl || 'NIL';
  const totalDist = flightData?.ground_dist || '1000';
  const cruiseAlt = flightData?.cruise_alt || '350';
  const tocTemp = flightData?.toc_temp || 'M45';
  const edtoFlight = flightData?.edto_flight || '--';
  const minDivert = flightData?.min_divert_fuel || '--';
  const avgTrip = flightData?.avg_trip_burn || '18.5';
  const mraHigh = flightData?.highest_trip_mra || '41';
  const mraEdg = flightData?.edg_mra || '--';
  const sid = flightData?.sid_route || 'DALOL1A';
  const star = flightData?.star_route || 'TONGA1A';
  const depRwy = flightData?.dep_rwy || '07R';
  const arrRwy = flightData?.arr_rwy || '05R';
  const avgWind = flightData?.avg_wind || 'N/A';

  // ==============================================
  // 2. Loadsheet 狀態計算
  // ==============================================
  const paxTot = (flightData?.pax_f || 0) + (flightData?.pax_j || 0) + (flightData?.pax_w || 0) + (flightData?.pax_y || 0);
  let lsStageHtml = <div className="mt-2 text-[#8fa0a6] text-center font-bold text-xs border border-dashed border-[#34495e] p-1 rounded">NO LOAD INFO RECEIVED</div>;
  let isLsActive = false;

  if (flightData?.final_ls_sent) {
    const fVer = flightData?.final_ls_version || 1;
    lsStageHtml = flightData?.pilots_signed_final 
      ? <div className="mt-2 bg-[#00E676] text-black p-1 rounded text-center font-bold text-xs shadow-[0_0_8px_rgba(0,230,118,0.4)]">FINAL {fVer.toString().padStart(2, '0')} Ack.</div>
      : <div className="mt-2 bg-[#FF9100] text-black p-1 rounded text-center font-bold text-xs shadow-[0_0_8px_rgba(255,145,0,0.4)] animate-pulse">FINAL {fVer.toString().padStart(2, '0')}</div>;
    isLsActive = true;
  } else if (flightData?.prelim_ls_sent) {
    const pVer = flightData?.prelim_ls_version || 1;
    lsStageHtml = <div className="mt-2 bg-[#FF9100] text-black p-1 rounded text-center font-bold text-xs shadow-[0_0_8px_rgba(255,145,0,0.4)]">PRELIM {pVer.toString().padStart(2, '0')}</div>;
    isLsActive = true;
  } else if (flightData?.azf_sent) {
    lsStageHtml = <div className="mt-2 text-[#00E676] text-center font-bold text-xs border border-dashed border-[#00E676] p-1 rounded">AZF SENT</div>;
    isLsActive = true;
  } else if (flightData?.ezfw_sent) {
    lsStageHtml = <div className="mt-2 text-[#00bfa5] text-center font-bold text-xs border border-dashed border-[#00bfa5] p-1 rounded">EZFW SENT</div>;
    isLsActive = true;
  }

  // ==============================================
  // 3. Fuel & Weight 複雜計算邏輯與 ALTN
  // ==============================================
  const isManual = flightData?.fuel_manual_mode || false;
  
  // A. OFP 基準備用資料 (不可變，作為 Diff 的對比基準)
  const ofpZfw = flightData?.weight_zfw_ofp || 0.0;
  const ofpTaxi = flightData?.fuel_taxi_ofp || 0.0;
  const ofpTrip = flightData?.fuel_trip_ofp || 0.0;
  const ofpCont = flightData?.fuel_cont_ofp || 0.0;
  const ofpRes = flightData?.fuel_reserve_ofp || 0.0;
  const baseAltnOfp = flightData?.fuel_altn_ofp || 0.0;
  
  // 公式重構：Fuel Required = Taxi + Trip + Cont + Altn + Reserve
  const ofpReqdBase = ofpTaxi + ofpTrip + ofpCont + baseAltnOfp + ofpRes;
  const ofpTotal = ofpReqdBase; // OFP 預設 Tankering 與 Extra 為 0
  
  // B. Auto 模式動態推算資料
  const actualZfw = flightData?.trainee_input_zfw || 0.0;
  const delta = actualZfw > 0 ? actualZfw - ofpZfw : 0.0;
  
  const autoTaxi = ofpTaxi;
  const autoCont = ofpCont;
  const autoTrip = ofpTrip + (delta * 0.03);
  
  const alternates = flightData?.alternates || [];
  const altnList = alternates.length > 0 ? alternates : [{ icao: flightData?.altn_icao || 'N/A', burn: baseAltnOfp, time: 30 }];
  const altnOptions = altnList.map((a: any) => a.icao);
  const selectedAltn = flightData?.selected_altn || altnOptions[0] || 'N/A';
  const currAltnOfp = altnList.find((a: any) => a.icao === selectedAltn)?.burn || baseAltnOfp;
  
  const autoReqdBase = autoTaxi + autoTrip + autoCont + currAltnOfp + ofpRes;
  const autoTotal = autoReqdBase;

  // C. 最終顯示資料 (Manual Override)
  const mf = flightData?.manual_fuel || {};
  const currTaxi = isManual ? (mf.taxi ?? autoTaxi) : autoTaxi;
  const currTrip = isManual ? (mf.trip ?? autoTrip) : autoTrip;
  const currCont = isManual ? (mf.cont ?? autoCont) : autoCont;
  const currTank = isManual ? (mf.tankering ?? 0.0) : 0.0;
  const currExtra = isManual ? (mf.extra ?? 0.0) : 0.0;
  
  const currReqdBase = currTaxi + currTrip + currCont + currAltnOfp + ofpRes;
  // 公式重構：Total Fuel = Fuel Required + Tankering + Extra
  const currTotal = isManual ? (mf.total ?? (currReqdBase + currTank + currExtra)) : (currReqdBase + currTank + currExtra);

  // 飛機重量計算：TOW 不包含 Taxi Fuel
  const currTow = (actualZfw > 0 ? actualZfw : ofpZfw) + (currTotal - currTaxi);
  const currLw = currTow - currTrip;

  // 顯示 Revised 數值條件
  const showRevVal = isManual || (actualZfw > 0) || (selectedAltn !== (altnOptions[0] || 'N/A'));

  const handleManualToggle = () => {
    const newMode = !isManual;
    const updates: any = { fuel_manual_mode: newMode };
    if (newMode) {
      updates.manual_fuel = { 
        taxi: Number(autoTaxi.toFixed(1)), 
        trip: Number(autoTrip.toFixed(1)), 
        cont: Number(autoCont.toFixed(1)), 
        tankering: 0.0, 
        extra: 0.0, 
        total: Number(autoTotal.toFixed(1)) 
      };
    }
    updateFlightData(updates);
  };

  const handleFuelInput = (field: string, val: string) => {
    if (!updateFlightData) return;
    const num = parseFloat(val) || 0.0;
    const newMf = { ...mf, [field]: num };
    
    // 如果修改的不是 Total，依公式重新計算 Total
    if (field !== 'total') {
      newMf.total = Number((newMf.taxi + newMf.trip + newMf.cont + currAltnOfp + ofpRes + newMf.tankering + newMf.extra).toFixed(1));
    } else {
      // 如果修改的是 Total，逆推出 Extra Fuel
      let calcExtra = num - (newMf.taxi + newMf.trip + newMf.cont + currAltnOfp + ofpRes + newMf.tankering);
      newMf.extra = calcExtra < 0 ? 0.0 : Number(calcExtra.toFixed(1));
      newMf.total = calcExtra < 0 ? Number((newMf.taxi + newMf.trip + newMf.cont + currAltnOfp + ofpRes + newMf.tankering).toFixed(1)) : num;
    }
    updateFlightData({ manual_fuel: newMf, final_fuel_accepted: false });
  };

  const handleZfwInput = (val: string) => {
    const num = parseFloat(val) || 0.0;
    if (num !== flightData?.trainee_input_zfw) {
      updateFlightData({ trainee_input_zfw: num, final_fuel_accepted: false });
    }
  };

  const handleAcceptFuel = () => {
    updateFlightData({ final_fuel_accepted: true, final_fuel_request: currTotal });
  };

  const diffStr = (rev: number, ofp: number) => {
    if (typeof rev !== 'number' || typeof ofp !== 'number') return null;
    if (ofp === 0 && rev === 0) return null;
    const diff = rev - ofp;
    if (Math.abs(diff) < 0.05) return null;
    return <span className={diff > 0 ? "text-[#FF9100]" : "text-[#00E676]"}>{diff > 0 ? "+" : ""}{diff.toFixed(1)}</span>;
  };

  // ==============================================
  // 4. Refueling 狀態
  // ==============================================
  let refuelHtml = null;
  if (!flightData?.final_fuel_accepted) {
    refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full"><span className="text-[#8fa0a6] text-[0.65rem] font-bold">STANDBY FIGURE SENT</span><span className="text-white text-xl font-bold">{Math.max(0, currTotal - 5.0).toFixed(1)} T</span></div>;
  } else if (!flightData?.fuel_receipt_sent) {
    refuelHtml = <div className="flex flex-col items-center justify-center py-3 h-full"><span className="text-[#FF9100] text-lg font-bold tracking-widest animate-pulse">REFUELLING...</span></div>;
  } else if (!flightData?.pilots_signed_fuel) {
    refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full cursor-pointer hover:scale-105 transition-transform"><div className="bg-[#FF9100] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(255,145,0,0.4)]">SIGN RECEIPT</div></div>;
  } else {
    refuelHtml = <div className="flex flex-col items-center justify-center py-2 h-full"><div className="bg-[#00E676] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(0,230,118,0.4)]">FUEL ACCEPTED</div></div>;
  }

  const isReleased = flightData?.tl_release || false;
  const isAccepted = flightData?.tl_accept || false;
  const isStarted = flightData?.tl_flight_started || false;
  
  let acStatus = <div className="bg-[#1c2630] text-[#8fa0a6] p-1 rounded text-center font-bold mb-2 text-xs border border-dashed border-[#34495e]">AWAITING TECHLOG RELEASE</div>;
  if (isReleased && isAccepted && isStarted) acStatus = <div className="bg-[#00E676] text-black p-1 rounded text-center font-bold mb-2 text-xs">✅ AIRCRAFT ACCEPTED</div>;
  else if (isReleased) acStatus = <div className="bg-[#FF9100] text-black p-1 rounded text-center font-bold mb-2 text-xs">⏳ TECHLOG RELEASED</div>;

  const Row = ({ label, ofp, rev, isInput, field, isBold, color = "#e2e8f0" }: any) => (
    <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#1d2733]">
      <div className={`text-xs ${isBold ? 'font-bold text-[#00E676]' : `text-[${color}]`}`}>{label}</div>
      <div className="text-xs text-right text-[#8fa0a6]">{ofp.toFixed(1)}</div>
      <div className="text-xs text-right font-bold">{diffStr(rev, ofp)}</div>
      <div className="text-right">
        {isInput && isManual ? (
          <input 
            type="number" step="0.1" 
            defaultValue={rev || ''} 
            onBlur={(e) => handleFuelInput(field, e.target.value)}
            key={`${field}-${rev}`} // 加上 key 確保 Backend 更新時會 Remount，但不會打斷輸入
            className="w-full bg-[#007979] text-white text-right text-xs font-bold rounded px-1 py-0.5 outline-none" 
          />
        ) : (
          <span className={`text-xs font-bold ${showRevVal ? (Math.abs(rev - ofp) > 0.05 ? 'text-[#FF9100]' : 'text-white') : 'text-transparent'}`}>{rev.toFixed(1)}</span>
        )}
      </div>
      <div></div>
    </div>
  );

  // ==============================================
  // 5. 產生 Loadsheet 電報字串的 Helper 函數
  // ==============================================
  const zfw_act = Math.round((actualZfw > 0 ? actualZfw : ofpZfw) * 1000);
  const tow_act = Math.round(currTow * 1000);
  const law_act = Math.round(currLw * 1000);
  const trip_act = Math.round(currTrip * 1000);
  const taxi_act = Math.round(currTaxi * 1000);
  const pax_wt_total = paxTot * (flightData?.pax_weight_std || 84);
  const underload = 224528 - zfw_act;
  const dow_kg = flightData?.dow || 161968;
  const dispatcher = flightData?.dispatcher || 'SYSTEM';
  const flight_num_clean = flightData?.flight_no?.replace(" ", "") || 'CPA564';
  const reg_clean = reg.replace("-", "");
  const pax_j = flightData?.pax_j || 0;
  const pax_y = flightData?.pax_y || 0;
  const pax_f = flightData?.pax_f || 0;
  const pax_w = flightData?.pax_w || 0;
  const crew_fd = flightData?.crew_fd || 2;
  const crew_cc = flightData?.crew_cc || 14;
  const cgo_h1 = flightData?.cargo_hold_1 || 0;
  const cgo_h2 = flightData?.cargo_hold_2 || 0;
  const cgo_h3 = flightData?.cargo_hold_3 || 0;
  const cgo_h4 = flightData?.cargo_hold_4 || 0;
  const cgo_bulk = flightData?.cargo_bulk || 0;
  const cgo_total = cgo_h1 + cgo_h2 + cgo_h3 + cgo_h4 + cgo_bulk;

  const date_str_ls = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '').toUpperCase();
  const date_str_ezfw = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '').toUpperCase();

  const getLsText = (isFinal: boolean) => {
    const lsType = isFinal ? "FINAL" : "PRELIM";
    const lsVer = isFinal ? (flightData?.final_ls_version || 1) : (flightData?.prelim_ls_version || 1);
    const lsVerStr = lsVer.toString().padStart(2, '0');
    
    return `LDS/${reg_clean}/${flight_num_clean}
LOADSHEET                   ${lsType}  ${lsVerStr}
${depIcao.substring(0,3)}  ${arrIcao.substring(0,3)}  ${flight_num_clean}/20                ${reg_clean}
J${pax_j.toString().padEnd(2)}Y${pax_y.toString().padEnd(3)}      ${crew_fd}/${crew_cc}                ${date_str_ls}

ZFW ACT ${zfw_act.toString().padEnd(8)}  MAX 224528  L   ${underload}
TO FUEL ${(-taxi_act).toString().padEnd(8)}
TOW ACT ${tow_act.toString().padEnd(8)}  MAX 263083      ${263083 - tow_act}
TRIP FUEL ${trip_act.toString().padEnd(8)}
LAW ACT ${law_act.toString().padEnd(8)}  MAX 237682      ${237682 - law_act}

BALANCE AND SEATING
BW  155582      DOW ${dow_kg}
BI  715.00      DOI 741.09
LIZFW   678.16  MACZFW  22.75
LITOW   683.36  MATOW   23.77
LILAW   675.30  MACLAW  23.33

STAB TO 5.5
0A/${pax_f.toString().padEnd(3)} 0B/${pax_j.toString().padEnd(3)} 0C/${pax_w.toString().padEnd(3)} 0D/${pax_y.toString().padEnd(3)}
T${pax_wt_total.toString().padEnd(5)} .1/${cgo_h1.toString().padEnd(4)} .2/${cgo_h2.toString().padEnd(4)} .3/${cgo_h3.toString().padEnd(4)} .4/${cgo_h4.toString().padEnd(4)} .5/${cgo_bulk.toString().padEnd(4)}

${arrIcao.substring(0,3)}  J${pax_j.toString().padStart(3, '0')}    Y${pax_y.toString().padStart(3, '0')}
TTL PAX ${paxTot.toString().padEnd(5)}   UNDERLOAD   ${underload}

CMDR NAME
SIGN

SI
NOTOC:
PANTRY CODE:        77P-A
PANTRY EFFECT       4285/11-
SERVICE WEIGHT ADJUSTMENT/INDEX ADD
${arrIcao.substring(0,3)}    POTABLE WATER       15/16   94  PCT
805 53

NORMAL MACTOW LIMITS:
FWD MACTOW LIMIT        14.1
AFT MACTOW LIMIT        38.6
LOADSHEETER/${dispatcher}/HKG1576`;
  };

  const getAzfText = () => {
    const tow_reqd = Math.round(zfw_act + (ofpReqdBase * 1000));
    return `AZF/${reg_clean}/${flight_num_clean}
- PAX/ ${paxTot}
- CGO/ ${cgo_total}
- ZFW/ ${zfw_act}
- CRW/ ${crew_fd}/${crew_cc}
- TOW/ ${tow_reqd}
- DEP/ ${(flightData?.std_z || '0000').replace('Z', '')}
- SEC/ ${depIcao}-${arrIcao}

FLT STATUS: closed
LCO: ${dispatcher}

SI`;
  };

  const getEzfwText = () => {
    const ttlLoad = pax_wt_total + cgo_total;
    const estZfwKg = Math.round((flightData?.weight_zfw_ofp || 0.0) * 1000);
    return `EZFW ${flight_num_clean}/${date_str_ezfw} ${reg_clean} J${pax_j}Y${pax_y}
${crew_fd}/${crew_cc} ${depIcao}${arrIcao}

PASSENGER           ${pax_wt_total.toString().padEnd(6)} KG
CARGO               ${cgo_total.toString().padEnd(6)} KG
TTL TRAFFIC LOAD    ${ttlLoad.toString().padEnd(6)} KG

J${pax_j}  Y${pax_y}
DOW                 ${dow_kg.toString().padEnd(6)} KG
EST ZFW             ${estZfwKg.toString().padEnd(6)} KG

LCO: ${dispatcher}
SI
LATEST EZFW`;
  };

  return (
    <div className="relative flex gap-2 h-full w-full">
      
      {/* ========================================== */}
      {/* Column 1: FMC & Crew                       */}
      {/* ========================================== */}
      <div className="flex-[1.1] flex flex-col gap-2 h-full overflow-hidden">
        <div 
          onClick={() => setActiveModal('FMS')}
          className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">FMC & ATS</h3>
            <span className="text-[#34495e] text-xs">🔍</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[0.65rem]">
            {/* Row 1 */}
            <div><span className="text-[#8fa0a6] block">Aircraft Type</span><span className="font-bold text-[#e2e8f0]">{acType}</span></div>
            <div><span className="text-[#8fa0a6] block">Reg</span><span className="font-bold text-[#e2e8f0]">{reg}</span></div>
            
            {/* Row 2 */}
            <div><span className="text-[#8fa0a6] block">Drag/F-F Factor</span><span className="font-bold text-[#e2e8f0]">{dragFf}</span></div>
            <div><span className="text-[#8fa0a6] block">MEL/CDL Pen</span><span className="font-bold text-[#e2e8f0]">{melCdl}</span></div>

            {/* Row 3 */}
            <div className="pr-1"><span className="text-[#8fa0a6] block">FMS Route</span><span className="font-bold text-[#00E676] truncate block w-full">{shortRoute}</span></div>
            <div><span className="text-[#8fa0a6] block">Total Distance</span><span className="font-bold text-[#e2e8f0]">{totalDist} NM</span></div>

            {/* Row 4 */}
            <div><span className="text-[#8fa0a6] block">TOC</span><span className="font-bold text-[#e2e8f0]">{cruiseAlt}</span></div>
            <div><span className="text-[#8fa0a6] block">TOC Temp</span><span className="font-bold text-[#e2e8f0]">{tocTemp}</span></div>

            {/* Row 5 */}
            <div><span className="text-[#8fa0a6] block">Cost Index</span><span className="font-bold text-[#e2e8f0]">{costIndex}</span></div>
            <div><span className="text-[#8fa0a6] block">EDTO Flight</span><span className="font-bold text-[#e2e8f0]">{edtoFlight}</span></div>

            {/* Row 6 */}
            <div><span className="text-[#8fa0a6] block">Reserve</span><span className="font-bold text-[#e2e8f0]">{ofpRes.toFixed(1)} T</span></div>
            <div><span className="text-[#8fa0a6] block">Min Divert Fuel</span><span className="font-bold text-[#e2e8f0]">{minDivert}</span></div>

            {/* Row 7 */}
            <div><span className="text-[#8fa0a6] block">Avg Wind</span><span className="font-bold text-[#e2e8f0]">{avgWind}</span></div>
            <div><span className="text-[#8fa0a6] block">Avg Trip (kg/gnm)</span><span className="font-bold text-[#e2e8f0]">{avgTrip}</span></div>

            {/* Row 8 */}
            <div><span className="text-[#8fa0a6] block">Highest Trip MRA</span><span className="font-bold text-[#e2e8f0]">{mraHigh}</span></div>
            <div><span className="text-[#8fa0a6] block">EDG MRA</span><span className="font-bold text-[#e2e8f0]">{mraEdg}</span></div>

            {/* Row 9 */}
            <div><span className="text-[#8fa0a6] block">Dep Rwy</span><span className="font-bold text-[#e2e8f0]">{depRwy}</span></div>
            <div><span className="text-[#8fa0a6] block">Arr Rwy</span><span className="font-bold text-[#e2e8f0]">{arrRwy}</span></div>

            {/* Row 10 */}
            <div><span className="text-[#8fa0a6] block">SID</span><span className="font-bold text-[#FF9100]">{sid}</span></div>
            <div><span className="text-[#8fa0a6] block">STAR</span><span className="font-bold text-[#FF9100]">{star}</span></div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveModal('SNN')} 
            className="flex-1 bg-[#17202a] border border-[#34495e] text-white py-2 rounded-lg hover:border-[#00bfa5] hover:text-[#00bfa5] font-bold text-xs transition-all"
          >
            📝 SNN
          </button>
          <button 
            onClick={() => setActiveModal('DOCS')} 
            className="flex-1 bg-[#17202a] border border-[#34495e] text-white py-2 rounded-lg hover:border-[#00bfa5] hover:text-[#00bfa5] font-bold text-xs transition-all"
          >
            📁 DOCS
          </button>
        </div>

        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 flex-1 flex flex-col justify-center">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">Crew</h3>
          <div className="flex justify-between text-sm">
            <span className="text-[#8fa0a6]">Flight Deck</span><span className="text-[#00E676] font-bold">FD {flightData?.crew_fd || 2}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-[#8fa0a6]">Cabin Crew</span><span className="text-[#00E676] font-bold">C {flightData?.crew_cc || 14}</span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* Column 2: Fuel & Weight                    */}
      {/* ========================================== */}
      <div className="flex-[1.9] flex flex-col h-full overflow-hidden">
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 h-full flex flex-col">
          
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h3 className="text-[#8fa0a6] text-[0.75rem] font-bold uppercase">Fuel & Weight</h3>
            <button 
              onClick={handleManualToggle}
              className={`text-[0.65rem] px-3 py-1 rounded font-bold border transition-colors ${isManual ? 'bg-[#FF9100]/20 text-[#FF9100] border-[#FF9100]' : 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]'}`}
            >
              {isManual ? 'MANUAL' : 'AUTO'}
            </button>
          </div>

          {showRevVal && !flightData?.final_fuel_accepted ? (
            <button onClick={handleAcceptFuel} className="bg-[#FF9100] text-black w-full py-1.5 rounded text-sm font-black mb-2 shrink-0 shadow-[0_2px_8px_rgba(255,145,0,0.4)] animate-pulse">
              PENDING FINAL FUEL {currTotal.toFixed(1)}T
            </button>
          ) : showRevVal && flightData?.final_fuel_accepted ? (
            <div className="bg-[#00E676] text-black w-full py-1.5 rounded text-sm font-black mb-2 shrink-0 text-center shadow-[0_2px_8px_rgba(0,230,118,0.4)]">
              FINAL FUEL {currTotal.toFixed(1)}T
            </div>
          ) : null}

          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 text-[0.65rem] text-[#8fa0a6] uppercase border-b border-[#34495e] pb-1 mb-1 shrink-0">
            <div>Category</div><div className="text-right">OFP</div><div className="text-right">Diff</div><div className="text-right">{showRevVal ? 'Revised' : ''}</div><div></div>
          </div>

          <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1 text-sm mt-1">
            
            {Row({ label: "Trip Fuel", ofp: ofpTrip, rev: currTrip, isInput: true, field: 'trip' })}
            {Row({ label: "Cont", ofp: ofpCont, rev: currCont, isInput: true, field: 'cont' })}
            {Row({ label: "Dest Hold", ofp: 0.0, rev: 0.0 })}
            {Row({ label: "Additional", ofp: 0.0, rev: 0.0 })}

            {/* ALTN 下拉選單與資料列 */}
            <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#1d2733]">
              <div className="text-xs text-[#00bfa5] font-bold flex items-center justify-between pr-2">
                <span>ALTN</span>
                <select 
                  value={selectedAltn}
                  onChange={(e) => updateFlightData({ selected_altn: e.target.value, final_fuel_accepted: false })}
                  className="bg-[#1a222a] border border-[#34495e] text-[#FF9100] rounded text-[0.65rem] outline-none px-1 py-0.5 w-[50px]"
                >
                  {altnOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="text-xs text-right text-[#8fa0a6]">{baseAltnOfp.toFixed(1)}</div>
              <div className="text-xs text-right font-bold">{diffStr(currAltnOfp, baseAltnOfp)}</div>
              <div className="text-right text-xs font-bold">{showRevVal ? <span className={Math.abs(currAltnOfp - baseAltnOfp) > 0.05 ? 'text-[#FF9100]' : 'text-white'}>{currAltnOfp.toFixed(1)}</span> : ''}</div>
              <div></div>
            </div>

            {Row({ label: "Reserve", ofp: ofpRes, rev: ofpRes })}
            {Row({ label: "Fuel Reqd", ofp: ofpReqdBase, rev: currReqdBase, isBold: true })}
            
            {Row({ label: "Tankering", ofp: 0.0, rev: currTank, isInput: true, field: 'tankering' })}
            {Row({ label: "Extra", ofp: 0.0, rev: currExtra, isInput: true, field: 'extra' })}
            {Row({ label: "Taxi", ofp: ofpTaxi, rev: currTaxi, isInput: true, field: 'taxi' })}
            {Row({ label: "Total Fuel", ofp: ofpTotal, rev: currTotal, isInput: true, field: 'total', isBold: true })}

            <div className="flex-[0.5] flex items-center justify-center text-[0.6rem] text-[#8fa0a6]">Margin</div>

            {/* ZFW 與動態 onBlur 更新 */}
            <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#1d2733]">
              <div className="text-xs text-[#e2e8f0]">ZFW</div>
              <div className="text-xs text-right text-[#8fa0a6]">{ofpZfw.toFixed(1)}</div>
              <div className="text-xs text-right font-bold">{diffStr(actualZfw > 0 ? actualZfw : ofpZfw, ofpZfw)}</div>
              <div className="text-right">
                <input 
                  type="number" step="0.1" placeholder="Tons"
                  defaultValue={actualZfw || ''} 
                  onBlur={(e) => handleZfwInput(e.target.value)}
                  key={`zfw-${actualZfw}`}
                  className="w-full bg-[#1a222a] border border-[#00bfa5] text-[#FF9100] text-right text-xs font-bold rounded px-1 py-0.5 outline-none"
                />
              </div>
              <div></div>
            </div>

            {Row({ label: "TOW", ofp: flightData?.weight_tow_ofp || 0, rev: currTow })}
            
            {/* LW: 去除底線，保持排版美觀 */}
            <div className="flex-1 grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center">
              <div className="text-xs text-[#e2e8f0]">LW</div>
              <div className="text-xs text-right text-[#8fa0a6]">{flightData?.weight_lw_ofp?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-right font-bold">{diffStr(currLw, flightData?.weight_lw_ofp || 0)}</div>
              <div className="text-right">
                <span className={`text-xs font-bold ${showRevVal ? (Math.abs(currLw - (flightData?.weight_lw_ofp || 0)) > 0.05 ? 'text-[#FF9100]' : 'text-white') : 'text-transparent'}`}>{currLw.toFixed(1)}</span>
              </div>
              <div></div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* Column 3: Loadsheet & Airport              */}
      {/* ========================================== */}
      <div className="flex-[1] flex flex-col gap-2 h-full overflow-hidden">
        <div 
          onClick={() => setActiveModal('Loadsheet')}
          className={`bg-[#17202a] border ${isLsActive ? 'border-[#00bfa5]' : 'border-[#242f3d]'} rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">Loadsheet</h3>
            <span className="text-[#34495e] text-xs">🔍</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#8fa0a6]">Pax</span><span className="text-white font-bold">{paxTot}</span>
          </div>
          <div className="flex justify-end text-[0.65rem] text-[#00E676] mb-1">
            F{flightData?.pax_f||0} J{flightData?.pax_j||0} W{flightData?.pax_w||0} Y{flightData?.pax_y||0}
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#8fa0a6]">Cargo</span><span className="text-white font-bold">
              {(cgo_total) / 1000} T
            </span>
          </div>
          {lsStageHtml}
        </div>
        
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">NOTOC</h3>
          <div className="border border-dashed border-[#00E676] text-[#00E676] text-center font-bold py-1 rounded text-xs">NIL</div>
        </div>
        
        <div 
          onClick={() => setActiveModal('Airports')}
          className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 flex-1 flex flex-col hover:border-[#00bfa5] transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">Airport Info</h3>
            <span className="text-[#34495e] text-xs">🔍</span>
          </div>
          <div className="text-[#00E676] font-bold text-lg mb-2">{arrIcao}</div>
          <div className="flex justify-between text-[0.65rem] text-[#8fa0a6] border-b border-[#333] pb-1">
            <span>ALTN</span><span>MDF</span><span>TIME</span>
          </div>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-white">{selectedAltn}</span>
            <span className="text-white">{currAltnOfp.toFixed(1)}</span>
            <span className="text-[#FF9100]">-{flightData?.alternates?.[0]?.time || 30}</span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* Column 4: Refueling & Aircraft             */}
      {/* ========================================== */}
      <div className="flex-[1] flex flex-col gap-2 h-full overflow-hidden">
        
        <div 
          onClick={() => setActiveModal('Refuelling')}
          className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">Refueling</h3>
            <span className="text-[#34495e] text-xs">🔍</span>
          </div>
          {refuelHtml}
        </div>
        
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 flex-1 flex flex-col">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">Aircraft</h3>
          {acStatus}
          <div className="flex justify-between text-xs mt-2 border-b border-dashed border-[#34495e] pb-2">
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Bay</span><span className="text-white font-bold">{flightData?.bay_no || '45'}</span></div>
            <div className="text-right"><span className="text-[#8fa0a6] block text-[0.65rem]">Defects</span><span className="text-white font-bold">{(flightData?.defects || []).length > 0 ? 'ADD' : 'NIL'}</span></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[#8fa0a6] text-xs">Log Fuel T</span>
            <input 
              type="number" step="0.1" 
              defaultValue={flightData?.trainee_log_fuel || ''} 
              onBlur={(e) => updateFlightData({ trainee_log_fuel: parseFloat(e.target.value) || 0.0 })}
              key={`logfuel-${flightData?.trainee_log_fuel}`}
              className="bg-[#1a222a] border border-[#00bfa5] text-[#FF9100] text-right text-xs font-bold rounded px-1 py-1 outline-none w-16"
            />
          </div>
        </div>
        
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">Efficient</span>
            <span className="text-[#00E676] text-xs font-bold">{costIndex}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase">OTP</span>
            <span className="bg-[#00E676]/15 text-[#00E676] text-[0.65rem] font-bold px-2 py-0.5 rounded">ON TIME</span>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* 模態彈出視窗 (Modal)                         */}
      {/* ========================================== */}
      {activeModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-md animate-fade-in">
          <div className="bg-[#11161d] border border-[#00bfa5] rounded-xl w-full max-w-5xl shadow-[0_0_40px_rgba(0,191,165,0.2)] flex flex-col overflow-hidden max-h-[90vh]">
            
            <div className="flex justify-between items-center p-4 bg-[#17202a] border-b border-[#242f3d] shrink-0">
              <h2 className="text-lg font-black text-[#00bfa5] tracking-widest uppercase">
                {activeModal === 'FMS' && 'FMS & ATS Data Preview'}
                {activeModal === 'Loadsheet' && 'Loadsheet & Payload Detail'}
                {activeModal === 'Airports' && 'Airport Intelligence'}
                {activeModal === 'Refuelling' && 'Refuelling Order & Receipt'}
                {activeModal === 'SNN' && 'Special Navigation Note'}
                {activeModal === 'DOCS' && 'Flight Briefing Documents'}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-[#8fa0a6] hover:text-white font-black text-xl px-2"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-[#e2e8f0] flex-1 font-mono text-sm leading-relaxed">
              {activeModal === 'FMS' && (
                <div className="flex flex-col md:flex-row gap-8 h-full">
                  {/* 左側：FMS 數據 */}
                  <div className="flex-[1.2]">
                    <div className="text-[#00bfa5] font-bold mb-4 border-b border-[#242f3d] pb-2">FMS OPERATION SUMMARY</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Aircraft Type</span><span className="font-bold">{acType}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Reg</span><span className="font-bold">{reg}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Drag/F-F Factor</span><span className="font-bold">P0.0 / P0.0</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">MEL/CDL Pen</span><span className="font-bold">{melCdl}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">FMS Route</span><span className="font-bold text-[#00E676]">{routeStr}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Total Distance</span><span className="font-bold">{totalDist} NM</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">TOC</span><span className="font-bold">{cruiseAlt}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">TOC Temp</span><span className="font-bold">{tocTemp}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Cost Index</span><span className="font-bold">{costIndex}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">EDTO Flight</span><span className="font-bold">{edtoFlight}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Reserve</span><span className="font-bold">{ofpRes.toFixed(1)} T</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Min Divert Fuel</span><span className="font-bold">{minDivert}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Avg Wind</span><span className="font-bold">{avgWind}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Avg Trip (kg/gnm)</span><span className="font-bold">{avgTrip}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Highest Trip MRA</span><span className="font-bold">{mraHigh}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">EDG MRA</span><span className="font-bold">{mraEdg}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Dep Rwy</span><span className="font-bold">{depRwy}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">Arr Rwy</span><span className="font-bold">{arrRwy}</span></div>
                      
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">SID</span><span className="font-bold text-[#FF9100]">{sid}</span></div>
                      <div><span className="text-[#8fa0a6] text-xs uppercase block">STAR</span><span className="font-bold text-[#FF9100]">{star}</span></div>
                    </div>
                  </div>
                  
                  {/* 右側：ATS Flight Plan */}
                  <div className="flex-[0.8] flex flex-col h-full">
                    <div className="text-[#00bfa5] font-bold mb-4 border-b border-[#242f3d] pb-2">ICAO ATS FLIGHT PLAN</div>
                    <div className="bg-[#0a0a0a] p-4 rounded border border-[#34495e] font-mono text-xs text-[#e2e8f0] whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto min-h-[300px]">
{flightData?.raw_simbrief?.atc?.flightplan_text || `(FPL-${flightData?.flight_no?.replace(" ", "") || 'CPA564'}-IS
-B773/H-SDE3GHIJ2J3J5M1RWXY/LB1
-${flightData?.dep_icao || 'VHHH'}${flightData?.std_z?.substring(0,4) || '0000'}
-N0480F${cruiseAlt} ${routeStr} ${flightData?.sid_route || ''} DCT OCEAN DCT MKG DCT ${flightData?.star_route || ''}
-${flightData?.arr_icao || 'RJBB'}0315 ${flightData?.dep_icao || 'VHHH'}
-REG/${reg.replace("-", "")} CAPT/${flightData?.captain?.replace(" ", "") || 'PILOT'})`}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 🌟 Loadsheet Modal：嚴格區分左右容器，左側固定，右側獨立水平滾動 */}
              {activeModal === 'Loadsheet' && (
                <div className="flex flex-row h-full w-full overflow-hidden">
                  
                  {/* 左側容器：固定寬度 340px，加上右側分隔線 */}
                  <div className="w-[340px] shrink-0 flex flex-col h-full border-r border-[#242f3d] pr-6">
                    <div className="text-xl font-bold text-[#00bfa5] border-b border-[#242f3d] pb-2 mb-4 uppercase shrink-0">
                      Weights & Fuel ({isManual ? 'MANUAL' : (actualZfw > 0 ? 'REVISED' : 'OFP')})
                    </div>
                    <div className="overflow-y-auto pr-2 flex-1 min-h-0">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr><td className="text-[#8fa0a6] py-1">Trip Fuel</td><td className="text-right font-bold" style={{color: isManual ? '#FF9100' : (actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{currTrip.toFixed(1)} T</td></tr>
                          <tr><td className="text-[#8fa0a6] py-1">Contingency</td><td className="text-right font-bold" style={{color: isManual ? '#FF9100' : (actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{currCont.toFixed(1)} T</td></tr>
                          <tr><td className="text-[#8fa0a6] py-1">Alternate</td><td className="text-right font-bold" style={{color: isManual ? '#FF9100' : (actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{currAltnOfp.toFixed(1)} T</td></tr>
                          <tr><td className="text-[#8fa0a6] py-1">Reserve</td><td className="text-right font-bold" style={{color: isManual ? '#FF9100' : (actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{ofpRes.toFixed(1)} T</td></tr>
                          <tr className="border-b border-[#333]"><td className="text-[#00E676] py-1 font-bold">Fuel Reqd</td><td className="text-right font-bold text-[#00E676]">{currReqdBase.toFixed(1)} T</td></tr>
                          <tr><td className="text-[#8fa0a6] py-1 pt-3">Zero Fuel Wt</td><td className="text-right font-bold pt-3" style={{color: isManual ? '#FF9100' : (actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{(actualZfw > 0 ? actualZfw : ofpZfw).toFixed(1)} T</td></tr>
                          <tr><td className="text-[#8fa0a6] py-1">Takeoff Wt</td><td className="text-right font-bold" style={{color: isManual ? '#FF9100' : (actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{currTow.toFixed(1)} T</td></tr>
                          <tr><td className="text-[#8fa0a6] py-1">Landing Wt</td><td className="text-right font-bold" style={{color: isManual ? '#FF9100' : (actualZfw > 0 ? '#00E676' : '#e2e8f0')}}>{currLw.toFixed(1)} T</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 右側容器：佔滿剩餘寬度，專門處理水平滾動 */}
                  <div className="flex-1 overflow-x-auto overflow-y-hidden h-full pl-6 pb-2">
                    <div className="flex gap-4 w-max h-full min-h-0">
                      {(!flightData?.final_ls_sent && !flightData?.prelim_ls_sent && !flightData?.azf_sent && !flightData?.ezfw_sent) && (
                        <div className="text-[#8fa0a6] p-8 text-center italic w-full flex items-center justify-center">No load documents dispatched yet.</div>
                      )}
                      {flightData?.final_ls_sent && (
                        <div className="bg-[#0a0a0a] border border-[#242f3d] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                          <h4 className="text-[#2979FF] border-b-2 border-dashed border-[#34495e] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">FINAL {(flightData?.final_ls_version || 1).toString().padStart(2, '0')}</h4>
                          <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                            <pre className="text-[#e2e8f0] font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getLsText(true)}</pre>
                          </div>
                        </div>
                      )}
                      {flightData?.prelim_ls_sent && (
                        <div className="bg-[#0a0a0a] border border-[#242f3d] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                          <h4 className="text-[#FF9100] border-b-2 border-dashed border-[#34495e] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">PRELIM {(flightData?.prelim_ls_version || 1).toString().padStart(2, '0')}</h4>
                          <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                            <pre className="text-[#e2e8f0] font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getLsText(false)}</pre>
                          </div>
                        </div>
                      )}
                      {flightData?.azf_sent && (
                        <div className="bg-[#0a0a0a] border border-[#242f3d] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                          <h4 className="text-[#00E676] border-b-2 border-dashed border-[#34495e] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">AZF DATASHEET</h4>
                          <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                            <pre className="text-[#e2e8f0] font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getAzfText()}</pre>
                          </div>
                        </div>
                      )}
                      {flightData?.ezfw_sent && (
                        <div className="bg-[#0a0a0a] border border-[#242f3d] rounded-lg p-5 w-[480px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col h-full min-h-0">
                          <h4 className="text-[#00bfa5] border-b-2 border-dashed border-[#34495e] pb-2 mt-0 font-mono text-[1.2rem] font-black tracking-widest shrink-0">EZFW DATASHEET</h4>
                          <div className="flex-1 overflow-y-auto mt-2 min-h-0">
                            <pre className="text-[#e2e8f0] font-mono text-[0.9rem] font-bold leading-[1.4] tracking-[0.05em] whitespace-pre-wrap m-0">{getEzfwText()}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'Airports' && (
                <div>
                  <div className="text-[#00bfa5] mb-4">-- AERODROME SUMMARY --</div>
                  <strong>DEPARTURE: {depIcao}</strong><br />
                  ELEVATION: 28 FT<br />
                  RUNWAY IN USE: {flightData?.dep_rwy || '07R'} (Length: 3800m)<br /><br />
                  <strong>ARRIVAL: {arrIcao}</strong><br />
                  ELEVATION: 15 FT<br />
                  RUNWAY IN USE: {flightData?.arr_rwy || '05R'} (Length: 3500m)<br /><br />
                  <strong>ALTERNATE: {selectedAltn}</strong><br />
                  REQUIRED FUEL: {currAltnOfp.toFixed(1)} T<br />
                  FLIGHT TIME: {flightData?.alternates?.[0]?.time || 30} MINS
                </div>
              )}
              
              {/* 🌟 完整還原 Streamlit Refuelling Modal 邏輯與樣式 */}
              {activeModal === 'Refuelling' && (
                <div className="flex flex-col">
                  <div className="text-[1.1rem] font-bold color-[#00bfa5] mb-4 uppercase">Fuel Supplier Receipt</div>
                  
                  {!flightData?.fuel_receipt_sent ? (
                    <div className="bg-[#11161d] border border-[#FF9100] text-[#FF9100] p-6 rounded-lg text-center font-bold">
                      ⏳ Waiting for fuel supplier tender.
                    </div>
                  ) : (
                    <div className="bg-[#11161d] border border-[#242f3d] rounded-lg p-6">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <div className="text-[#8fa0a6] text-xs font-bold uppercase mb-1">Supplier Code</div>
                          <div className="font-mono text-white text-lg">AFSC (HKIA)</div>
                          <div className="text-[#8fa0a6] text-xs font-bold uppercase mt-4 mb-1">Date</div>
                          <div className="font-mono text-white text-lg">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}</div>
                        </div>
                        <div>
                          <div className="text-[#8fa0a6] text-xs font-bold uppercase mb-1">Product</div>
                          <div className="font-mono text-white text-lg">JET A-1</div>
                          <div className="text-[#8fa0a6] text-xs font-bold uppercase mt-4 mb-1">SG</div>
                          <div className="font-mono text-white text-lg">0.795</div>
                        </div>
                      </div>
                      
                      <hr className="border-[#34495e] mb-6"/>
                      
                      <div className="grid grid-cols-2 gap-6 mb-8 text-center">
                        <div className="bg-[#0a0a0a] border border-[#00bfa5] rounded-lg p-4">
                          <div className="text-[#8fa0a6] text-xs font-bold uppercase mb-2">Uplifted</div>
                          <div className="text-4xl font-black text-white">{(flightData?.actual_uplift || 0).toFixed(1)} <span className="text-xl text-[#00bfa5]">T</span></div>
                        </div>
                        <div className="bg-[#0a0a0a] border border-[#00bfa5] rounded-lg p-4">
                          <div className="text-[#8fa0a6] text-xs font-bold uppercase mb-2">Total FOB</div>
                          <div className="text-4xl font-black text-[#00E676]">{((flightData?.trainee_log_fuel || 0) + (flightData?.actual_uplift || 0)).toFixed(1)} <span className="text-xl text-[#00E676]">T</span></div>
                        </div>
                      </div>
                      
                      {!flightData?.pilots_signed_fuel ? (
                        <button 
                          onClick={() => {
                            updateFlightData({ pilots_signed_fuel: true });
                            setActiveModal(null);
                          }}
                          className="w-full py-4 bg-[#00E676] text-black font-black text-xl rounded-lg hover:bg-[#00c853] shadow-[0_4px_15px_rgba(0,230,118,0.4)] transition-all"
                        >
                          ACCEPT FUEL RECEIPT
                        </button>
                      ) : (
                        <div className="bg-[#00E676]/20 border border-[#00E676] text-[#00E676] p-4 rounded-lg text-center font-bold text-lg">
                          ✅ FUEL RECEIPT ACCEPTED.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {activeModal === 'SNN' && (
                <div>
                  <div className="text-[#FF9100] mb-4">-- SPECIAL NAVIGATION NOTE (SNN) --</div>
                  <div className="bg-[#1c2630] border-l-4 border-[#FF9100] p-4 rounded text-[#e2e8f0] text-sm leading-relaxed whitespace-pre-wrap">
                    {flightData?.snn || "Check NOTAM for TWY closures. Expect radar vectors after departure. Monitor fuel temp closely due to cold airmass."}
                  </div>
                </div>
              )}
              {activeModal === 'DOCS' && (
                <div>
                  <div className="text-[#00E676] mb-4">-- OPERATIONAL FLIGHT PLAN (OFP) --</div>
                  <div 
                    className="bg-[#0a0a0a] p-4 rounded-lg border border-[#34495e] overflow-y-auto max-h-[50vh]"
                    style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "1.3", whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{ __html: unescapeHTML(flightData?.ofp_telex_text) }}
                  />
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
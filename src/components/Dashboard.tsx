"use client";

import { useState } from "react";

export default function Dashboard({ flightData, updateFlightData }: { flightData?: any, updateFlightData?: any }) {
  
  // ==============================================
  // 1. FMC & Crew 資料
  // ==============================================
  const acType = flightData?.aircraft_type || 'B773';
  const reg = flightData?.aircraft_reg || 'B-HNQ';
  const routeStr = flightData?.route_id || 'DCT';
  const shortRoute = routeStr.split(" ").length > 5 ? routeStr.split(" ").slice(0, 5).join(" ") + " ..." : routeStr;
  const costIndex = flightData?.cost_index || 'CI 85';
  const arrIcao = flightData?.arr_icao || 'RJBB';
  
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
    lsStageHtml = <div className="mt-2 bg-[#FF9100] text-black p-1 rounded text-center font-bold text-xs shadow-[0_0_8px_rgba(255,145,0,0.4)]">PRELIM {(flightData?.prelim_ls_version || 1).toString().padStart(2, '0')}</div>;
    isLsActive = true;
  } else if (flightData?.azf_sent) {
    lsStageHtml = <div className="mt-2 text-[#00E676] text-center font-bold text-xs border border-dashed border-[#00E676] p-1 rounded">AZF SENT</div>;
    isLsActive = true;
  } else if (flightData?.ezfw_sent) {
    lsStageHtml = <div className="mt-2 text-[#00bfa5] text-center font-bold text-xs border border-dashed border-[#00bfa5] p-1 rounded">EZFW SENT</div>;
    isLsActive = true;
  }

  // ==============================================
  // 3. Fuel & Weight 複雜計算邏輯
  // ==============================================
  const isManual = flightData?.fuel_manual_mode || false;
  const actualZfw = flightData?.trainee_input_zfw || 0.0;
  
  const ofpZfw = flightData?.weight_zfw_ofp || 0.0;
  const ofpTaxi = flightData?.fuel_taxi_ofp || 0.0;
  const ofpTrip = flightData?.fuel_trip_ofp || 0.0;
  const ofpCont = flightData?.fuel_cont_ofp || 0.0;
  const ofpRes = flightData?.fuel_reserve_ofp || 0.0;
  const altnOfp = flightData?.fuel_altn_ofp || 0.0;
  const ofpReqdBase = ofpTrip + ofpCont + altnOfp + ofpRes;
  const ofpTotal = ofpReqdBase + ofpTaxi;

  // 自動模式逆推修正
  const delta = actualZfw > 0 ? actualZfw - ofpZfw : 0.0;
  const autoTaxi = ofpTaxi; // 修正：加入 autoTaxi 的定義
  const autoCont = ofpCont; // 修正：加入 autoCont 的定義
  const autoTrip = ofpTrip + (delta * 0.03);
  const autoReqdBase = autoTrip + autoCont + altnOfp + ofpRes;
  const autoTotal = autoReqdBase + autoTaxi;

  // 手動模式資料提取
  const mf = flightData?.manual_fuel || {};
  const currTaxi = isManual ? (mf.taxi ?? autoTaxi) : autoTaxi;
  const currTrip = isManual ? (mf.trip ?? autoTrip) : autoTrip;
  const currCont = isManual ? (mf.cont ?? autoCont) : autoCont;
  const currTank = isManual ? (mf.tankering ?? 0.0) : 0.0;
  const currExtra = isManual ? (mf.extra ?? 0.0) : 0.0;
  const currReqdBase = currTrip + currCont + altnOfp + ofpRes;
  const currTakeoff = currReqdBase + currTank + currExtra;
  const currTotal = isManual ? (mf.total ?? currTakeoff + currTaxi) : autoTotal;

  const showRevVal = (actualZfw > 0) || isManual;

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
    
    // 如果修改的不是 Total，重新計算 Total
    if (field !== 'total') {
      newMf.total = Number((newMf.taxi + newMf.trip + newMf.cont + altnOfp + ofpRes + newMf.tankering + newMf.extra).toFixed(1));
    } else {
      // 如果修改的是 Total，逆推 Extra
      let calcExtra = num - (newMf.taxi + newMf.trip + newMf.cont + altnOfp + ofpRes + newMf.tankering);
      newMf.extra = calcExtra < 0 ? 0.0 : Number(calcExtra.toFixed(1));
      newMf.total = calcExtra < 0 ? Number((newMf.taxi + newMf.trip + newMf.cont + altnOfp + ofpRes + newMf.tankering).toFixed(1)) : num;
    }
    updateFlightData({ manual_fuel: newMf });
  };

  const handleZfwInput = (val: string) => {
    const num = parseFloat(val) || 0.0;
    updateFlightData({ trainee_input_zfw: num, final_fuel_accepted: false });
  };

  const handleAcceptFuel = () => {
    updateFlightData({ final_fuel_accepted: true, final_fuel_request: currTotal });
  };

  const diffStr = (rev: number, ofp: number, show: boolean) => {
    if (!show || ofp === 0) return null;
    const diff = rev - ofp;
    if (Math.abs(diff) < 0.05) return null;
    return <span className={diff > 0 ? "text-[#FF9100]" : "text-[#00E676]"}>{diff > 0 ? "+" : ""}{diff.toFixed(1)}</span>;
  };

  // ==============================================
  // 4. Refueling 狀態
  // ==============================================
  let refuelHtml = null;
  if (!flightData?.final_fuel_accepted) {
    refuelHtml = (
      <div className="flex flex-col items-center justify-center py-2 h-full">
        <span className="text-[#8fa0a6] text-[0.65rem] font-bold">STANDBY FIGURE SENT</span>
        <span className="text-white text-xl font-bold">{Math.max(0, currTotal - 5.0).toFixed(1)} T</span>
      </div>
    );
  } else if (!flightData?.fuel_receipt_sent) {
    refuelHtml = (
      <div className="flex flex-col items-center justify-center py-3 h-full">
         <span className="text-[#FF9100] text-lg font-bold tracking-widest animate-pulse">REFUELLING...</span>
      </div>
    );
  } else if (!flightData?.pilots_signed_fuel) {
    refuelHtml = (
      <div className="flex flex-col items-center justify-center py-2 h-full cursor-pointer hover:scale-105 transition-transform">
         <div className="bg-[#FF9100] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(255,145,0,0.4)]">SIGN RECEIPT</div>
      </div>
    );
  } else {
    refuelHtml = (
      <div className="flex flex-col items-center justify-center py-2 h-full">
         <div className="bg-[#00E676] text-black py-2 px-4 w-full text-center font-black rounded shadow-[0_2px_8px_rgba(0,230,118,0.4)]">FUEL ACCEPTED</div>
      </div>
    );
  }

  // ==============================================
  // 5. Aircraft 狀態
  // ==============================================
  const isReleased = flightData?.tl_release || false;
  const isAccepted = flightData?.tl_accept || false;
  const isStarted = flightData?.tl_flight_started || false;
  
  let acStatus = <div className="bg-[#1c2630] text-[#8fa0a6] p-1 rounded text-center font-bold mb-2 text-xs border border-dashed border-[#34495e]">AWAITING TECHLOG RELEASE</div>;
  if (isReleased && isAccepted && isStarted) acStatus = <div className="bg-[#00E676] text-black p-1 rounded text-center font-bold mb-2 text-xs">✅ AIRCRAFT ACCEPTED</div>;
  else if (isReleased) acStatus = <div className="bg-[#FF9100] text-black p-1 rounded text-center font-bold mb-2 text-xs">⏳ TECHLOG RELEASED</div>;

  const Row = ({ label, ofp, rev, isInput, field, isBold, color = "#e2e8f0" }: any) => (
    <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#1d2733] py-1">
      <div className={`text-xs ${isBold ? 'font-bold text-[#00E676]' : `text-[${color}]`}`}>{label}</div>
      <div className="text-xs text-right text-[#8fa0a6]">{ofp.toFixed(1)}</div>
      <div className="text-xs text-right font-bold">{diffStr(rev, ofp, showRevVal)}</div>
      <div className="text-right">
        {isInput && isManual ? (
          <input 
            type="number" step="0.1" 
            value={rev || ''} 
            onChange={(e) => handleFuelInput(field, e.target.value)}
            className="w-full bg-[#007979] text-white text-right text-xs font-bold rounded px-1 py-0.5 outline-none"
          />
        ) : (
          <span className={`text-xs font-bold ${showRevVal ? 'text-[#FF9100]' : 'text-transparent'}`}>{rev.toFixed(1)}</span>
        )}
      </div>
      <div></div>
    </div>
  );

  return (
    <div className="flex gap-2 h-full w-full">
      
      {/* ========================================== */}
      {/* Column 1: FMC & Crew                       */}
      {/* ========================================== */}
      <div className="flex-[1.1] flex flex-col gap-2 h-full overflow-hidden">
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">FMC & ATS</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Aircraft</span><span className="font-bold text-[#e2e8f0]">{acType}</span></div>
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Reg</span><span className="font-bold text-[#e2e8f0]">{reg}</span></div>
            <div className="col-span-2"><span className="text-[#8fa0a6] block text-[0.65rem]">Route</span><span className="font-bold text-[#00E676] truncate block">{shortRoute}</span></div>
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">TOC</span><span className="font-bold text-[#e2e8f0]">FL{flightData?.cruise_alt || 350}</span></div>
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Cost Index</span><span className="font-bold text-[#e2e8f0]">{costIndex}</span></div>
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Avg Wind</span><span className="font-bold text-[#e2e8f0]">{flightData?.avg_wind || 'N/A'}</span></div>
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Reserve</span><span className="font-bold text-[#e2e8f0]">{ofpRes.toFixed(1)} T</span></div>
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Dep Rwy</span><span className="font-bold text-[#e2e8f0]">{flightData?.dep_rwy || '07R'}</span></div>
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Arr Rwy</span><span className="font-bold text-[#e2e8f0]">{flightData?.arr_rwy || '05R'}</span></div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 bg-[#17202a] border border-[#34495e] text-white py-2 rounded-lg hover:border-[#00bfa5] hover:text-[#00bfa5] font-bold text-xs transition-all">📝 SNN</button>
          <button className="flex-1 bg-[#17202a] border border-[#34495e] text-white py-2 rounded-lg hover:border-[#00bfa5] hover:text-[#00bfa5] font-bold text-xs transition-all">📁 DOCS</button>
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
      {/* Column 2: Fuel & Weight (燃油計算心臟)       */}
      {/* ========================================== */}
      <div className="flex-[1.9] flex flex-col h-full overflow-hidden">
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 h-full flex flex-col">
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#8fa0a6] text-[0.75rem] font-bold uppercase">Fuel & Weight</h3>
            <button 
              onClick={handleManualToggle}
              className={`text-[0.65rem] px-3 py-1 rounded font-bold border transition-colors ${isManual ? 'bg-[#FF9100]/20 text-[#FF9100] border-[#FF9100]' : 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]'}`}
            >
              {isManual ? 'MANUAL' : 'AUTO'}
            </button>
          </div>

          {showRevVal && !flightData?.final_fuel_accepted ? (
            <button onClick={handleAcceptFuel} className="bg-[#FF9100] text-black w-full py-1.5 rounded text-sm font-black mb-2 shadow-[0_2px_8px_rgba(255,145,0,0.4)] animate-pulse">
              PENDING FINAL FUEL {currTotal.toFixed(1)}T
            </button>
          ) : showRevVal && flightData?.final_fuel_accepted ? (
            <div className="bg-[#00E676] text-black w-full py-1.5 rounded text-sm font-black mb-2 text-center shadow-[0_2px_8px_rgba(0,230,118,0.4)]">
              FINAL FUEL {currTotal.toFixed(1)}T
            </div>
          ) : null}

          {/* 表格標頭 */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 text-[0.65rem] text-[#8fa0a6] uppercase border-b border-[#34495e] pb-1 mb-1">
            <div>Category</div><div className="text-right">OFP</div><div className="text-right">Diff</div><div className="text-right">{showRevVal ? 'Revised' : ''}</div><div></div>
          </div>

          {/* 表格內容 (可滾動) */}
          <div className="flex-1 overflow-y-auto pr-1 text-sm">
            
            {/* Input Row Generator */}
            {Row({ label: "Taxi", ofp: ofpTaxi, rev: currTaxi, isInput: true, field: 'taxi' })}
            {Row({ label: "Trip Fuel", ofp: ofpTrip, rev: currTrip, isInput: true, field: 'trip' })}
            {Row({ label: "Cont", ofp: ofpCont, rev: currCont, isInput: true, field: 'cont' })}
            {Row({ label: "Dest Hold", ofp: 0.0, rev: 0.0 })}
            {Row({ label: "Additional", ofp: 0.0, rev: 0.0 })}

            {/* Alternate 特殊列 */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#1d2733] py-1">
              <div className="text-xs text-[#00bfa5] font-bold">ALTN <span className="text-[#8fa0a6] font-normal">RJBB</span></div>
              <div className="text-xs text-right text-[#8fa0a6]">{altnOfp.toFixed(1)}</div>
              <div></div>
              <div className="text-right text-xs font-bold text-[#FF9100]">{showRevVal ? altnOfp.toFixed(1) : ''}</div>
              <div></div>
            </div>

            {Row({ label: "Reserve", ofp: ofpRes, rev: ofpRes })}
            {Row({ label: "Fuel Reqd", ofp: ofpReqdBase, rev: currReqdBase, isBold: true })}
            
            {Row({ label: "Tankering", ofp: 0.0, rev: currTank, isInput: true, field: 'tankering' })}
            {Row({ label: "Extra", ofp: 0.0, rev: currExtra, isInput: true, field: 'extra' })}
            {Row({ label: "Total Fuel", ofp: ofpTotal, rev: currTotal, isInput: true, field: 'total', isBold: true })}

            <div className="text-center text-[0.6rem] text-[#8fa0a6] my-1">Margin</div>

            {/* ZFW 特殊輸入列 */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_0.5fr] gap-1 items-center border-b border-dashed border-[#1d2733] py-1">
              <div className="text-xs text-[#e2e8f0]">ZFW</div>
              <div className="text-xs text-right text-[#8fa0a6]">{ofpZfw.toFixed(1)}</div>
              <div className="text-xs text-right font-bold">{diffStr(actualZfw, ofpZfw, actualZfw > 0)}</div>
              <div className="text-right">
                <input 
                  type="number" step="0.1" placeholder="Tons"
                  value={actualZfw || ''} 
                  onChange={(e) => handleZfwInput(e.target.value)}
                  className="w-full bg-[#1a222a] border border-[#00bfa5] text-[#FF9100] text-right text-xs font-bold rounded px-1 py-0.5 outline-none"
                />
              </div>
              <div></div>
            </div>

            {Row({ label: "TOW", ofp: flightData?.weight_tow_ofp || 0, rev: (actualZfw || ofpZfw) + currTakeoff })}
            {Row({ label: "LW", ofp: flightData?.weight_lw_ofp || 0, rev: ((actualZfw || ofpZfw) + currTakeoff) - currTrip })}

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* Column 3: Loadsheet & Airport              */}
      {/* ========================================== */}
      <div className="flex-[1] flex flex-col gap-2 h-full overflow-hidden">
        <div className={`bg-[#17202a] border ${isLsActive ? 'border-[#00bfa5]' : 'border-[#242f3d]'} rounded-lg p-3 hover:border-[#00bfa5] transition-colors cursor-pointer`}>
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">Loadsheet</h3>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#8fa0a6]">Pax</span><span className="text-white font-bold">{paxTot}</span>
          </div>
          <div className="flex justify-end text-[0.65rem] text-[#00E676] mb-1">
            F{flightData?.pax_f||0} J{flightData?.pax_j||0} W{flightData?.pax_w||0} Y{flightData?.pax_y||0}
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#8fa0a6]">Cargo</span><span className="text-white font-bold">--</span>
          </div>
          {lsStageHtml}
        </div>
        
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">NOTOC</h3>
          <div className="border border-dashed border-[#00E676] text-[#00E676] text-center font-bold py-1 rounded text-xs">NIL</div>
        </div>
        
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 flex-1 flex flex-col hover:border-[#00bfa5] transition-colors cursor-pointer">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">Airport Info</h3>
          <div className="text-[#00E676] font-bold text-lg mb-2">{arrIcao}</div>
          <div className="flex justify-between text-[0.65rem] text-[#8fa0a6] border-b border-[#333] pb-1">
            <span>ALTN</span><span>MDF</span><span>TIME</span>
          </div>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-white">{flightData?.selected_altn || flightData?.altn_icao || 'N/A'}</span>
            <span className="text-white">{altnOfp.toFixed(1)}</span>
            <span className="text-[#FF9100]">-{flightData?.alternates?.[0]?.time || 30}</span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* Column 4: Refueling & Aircraft             */}
      {/* ========================================== */}
      <div className="flex-[1] flex flex-col gap-2 h-full overflow-hidden">
        
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-1">Refueling</h3>
          {refuelHtml}
        </div>
        
        <div className="bg-[#17202a] border border-[#242f3d] rounded-lg p-3 flex-1 flex flex-col">
          <h3 className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase mb-2">Aircraft</h3>
          {acStatus}
          <div className="flex justify-between text-xs mt-2 border-b border-dashed border-[#34495e] pb-2">
            <div><span className="text-[#8fa0a6] block text-[0.65rem]">Bay</span><span className="text-white font-bold">{flightData?.bay_no || '45'}</span></div>
            <div className="text-right"><span className="text-[#8fa0a6] block text-[0.65rem]">Defects</span><span className="text-white font-bold">P0 / S0 / A1</span></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[#8fa0a6] text-xs">Log Fuel T</span>
            <input 
              type="number" step="0.1" 
              value={flightData?.trainee_log_fuel || ''} 
              onChange={(e) => updateFlightData({ trainee_log_fuel: parseFloat(e.target.value) || 0.0 })}
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

    </div>
  );
}
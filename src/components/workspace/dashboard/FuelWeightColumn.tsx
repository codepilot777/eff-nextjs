"use client";
import React from "react";
import { getDynamicAhm, getEngineWeights } from "@/lib/loadsheet/loadsheetHelpers";
import { useFlightData } from "@/hooks/useFlightData";
import { getMargin, getMarginColor, getMarginStr, getZfwValue } from "@/lib/marginHelpers";

// 🌟 冇任何地方有 per-aircraft-type 嘅平均油耗數據，呢個係最尾嘅 last-resort fallback
// (B773 fleet average)，唔係亂作
const DEFAULT_FUEL_FLOW_KG_HR = 7653;

export default function FuelWeightColumn({ setActiveModal }: { setActiveModal: any }) {

  // 一句說話，從大腦抽取所需狀態
  const { flightData, calc, handlers } = useFlightData();

  // 如果 data 仲未 ready (防呆)
  if (!flightData || !calc || !handlers) return null;

  // 🌟 核心動態定錨：獲取目前執飛的飛機註冊號，查出專屬 limits
  const ahm = getDynamicAhm(flightData);

  // 🌟 真正由 payload 文件計出嚟嘅 weights，學員未發送過任何文件之前係 null（唔夾硬計假數）
  const engineWeights = getEngineWeights(flightData, calc);

  // ==========================================
  // 1. Time / Endurance 計算邏輯 (保留純 UI 顯示用)
  // ==========================================
  const ofpTripKg = (flightData?.fuel_trip_ofp || 0) * 1000;
  const eetHours = (flightData?.eet_seconds || 0) / 3600;
  const fuelFlow = parseFloat(flightData?.raw_simbrief?.fuel?.avg_fuel_flow)
    || (eetHours > 0 ? ofpTripKg / eetHours : 0)
    || DEFAULT_FUEL_FLOW_KG_HR;

  const getMins = (fuelTons: number) => {
    if (!fuelTons) return 0;
    return Math.round((fuelTons * 1000) / fuelFlow * 60);
  };
  
  const formatTime = (mins: number) => {
    if (mins === 0) return "0000";
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}${m}`;
  };

  // 根據 toggle 決定顯示邊組數
  const tripFuel = calc.showRevVal ? calc.currTrip : calc.ofpTrip;
  const contFuel = calc.showRevVal ? calc.currCont : calc.ofpCont;
  const altnFuel = calc.showRevVal ? calc.currAltnOfp : calc.baseAltnOfp;
  const tankFuel = calc.showRevVal ? calc.currTank : 0;
  const extraFuel = calc.showRevVal ? calc.currExtra : 0;

  // 🌟 呢兩個係固定嘅程序性數值 (標準地面滑行時間 / 標準最低備用油持續時間)，
  // flightData/raw_simbrief 入面完全冇 per-flight 嘅對應數據，唔係「漏咗冇填」嘅 fallback
  const DEFAULT_TAXI_MINS = 20;
  const DEFAULT_RESERVE_MINS = 30;

  const taxiMins = DEFAULT_TAXI_MINS;
  const tripMins = getMins(tripFuel);
  const contMins = getMins(contFuel);
  const altnMins = calc.altnList?.find((a: any) => a.icao === calc.selectedAltn)?.time || getMins(altnFuel);
  const resMins = DEFAULT_RESERVE_MINS;

  const reqdMins = taxiMins + tripMins + contMins + altnMins + resMins;
  const tankMins = getMins(tankFuel);
  const extraMins = getMins(extraFuel);
  const totalMins = reqdMins + tankMins + extraMins;

  // ==========================================
  // 2. Structural Margin 計算邏輯 (🌟 徹底告別硬編碼！)
  // ==========================================
  const zfwVal = getZfwValue(calc);
  const marginZfw = getMargin(zfwVal, ahm.limits.MZFW); // 👈 動態扣減當前機型的最大無油重量

  const towVal = calc.showRevVal ? calc.currTow : (flightData?.weight_tow_ofp || 0);
  const marginTow = getMargin(towVal, ahm.limits.MTOW); // 👈 動態扣減當前機型的最大起飛重量

  const lwVal = calc.showRevVal ? calc.currLw : (flightData?.weight_lw_ofp || 0);
  const marginLw = getMargin(lwVal, ahm.limits.MLAW); // 👈 動態扣減當前機型的最大落地重量

  // 🌟 有真正 payload 數據，同 mass-balance 快速估算差超過 0.3T 先提示——唔改動
  // calc.currTow/currLw 本身（Dashboard 嘅即時燃油視圖同 ModalAcceptFuel 都仲係鎖住呢兩個
  // 數字），淨係加返個「呢個係約數」嘅可見提示
  const towDiverges = engineWeights && Math.abs(engineWeights.tow - calc.currTow) > 0.3;
  const lwDiverges = engineWeights && Math.abs(engineWeights.law - calc.currLw) > 0.3;

  // ==========================================
  // 3. Row UI 組件
  // ==========================================
  const Row = ({ label, ofp, rev, sideValue, sideValueColor, isInput, field, isBold, isTotal, pillStyle }: any) => {
    const diff = rev - ofp;
    const hasDiff = Math.abs(diff) > 0.05;
    const diffSign = diff > 0 ? "+" : "";
    const diffText = hasDiff ? `${diffSign}${diff.toFixed(1)}` : "";
    const diffColor = "text-[#00E676]";
    const labelClass = isBold ? "text-white font-bold" : "text-[#8fa0a6]";

    let revClass = "text-right font-bold ";
    if (isTotal) revClass += "text-[#00E676] text-[0.95rem] leading-none";
    else if (pillStyle === 'green') revClass = "bg-[#153f36] text-[#00E676] text-right font-bold py-0.5 px-2 rounded-l ml-auto w-max leading-none";
    else if (pillStyle === 'white') revClass = "bg-white text-[#1E1E1E] text-right font-bold py-0.5 px-2 rounded-l ml-auto w-max text-[0.9rem] leading-none";
    else revClass += "text-[#00E676] leading-none";

    return (
      <div className={`grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] gap-1 items-center py-0.5 ${isTotal || pillStyle === 'white' ? 'border-y border-[#333]' : 'border-b border-dashed border-[#333]'}`}>
        <div className={`text-[0.65rem] ${labelClass} leading-none`}>{label}</div>
        <div className="text-right leading-none pr-2">
          <span className={`text-[0.8rem] ${isBold ? 'font-bold text-white' : 'text-white'}`}>{ofp?.toFixed(1) || '0.0'}</span>
        </div>
        <div className={`text-center text-[0.65rem] font-bold font-mono ${diffColor} leading-none`}>
          {calc.showRevVal ? diffText : ""}
        </div>
        <div className="text-right flex justify-end items-center pr-2">
          {isInput && calc.isManual ? (
            <input
              type="number" step="0.1" defaultValue={rev || ''}
              onBlur={(e) => handlers.handleFuelInput(field, e.target.value)}
              key={`${field}-${rev}`}
              className="w-14 bg-[#1a1a1a] text-[#00E676] text-right text-[0.8rem] font-bold rounded px-1 py-0.5 outline-none border border-[#333] focus:border-[#00E676] leading-none transition-colors"
            />
          ) : (
            <div className={`${calc.showRevVal ? '' : 'opacity-0'} flex items-center`}>
              <div className={revClass}>{rev?.toFixed(1) || '0.0'}</div>
            </div>
          )}
        </div>
        <div className={`text-right text-[0.6rem] font-mono pr-1 leading-none ${sideValueColor || 'text-[#00E676]'}`}>{sideValue}</div>
      </div>
    );
  };

  return (
    <div className="flex-[4] flex flex-col h-full overflow-hidden min-h-0 text-white font-sans w-full max-w-[420px]">
      <div className="bg-[#1E1E1E] rounded-xl flex flex-col h-full shadow-lg min-h-0 overflow-hidden">
        
        {/* Header & Toggle Switch */}
        <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-[#333] shrink-0">
          {/* 🌟 UI 加強：高調展示當前正在運算的飛機註冊號與機型 */}
          <h2 className="text-[1.05rem] font-bold leading-none flex items-center gap-2">
            Fuel & Weight
          </h2>
          <div onClick={handlers.handleManualToggle} className="flex items-center gap-2 cursor-pointer bg-[#0a0a0a] border border-[#333] rounded-full px-2 py-1 hover:bg-[#252525] transition-colors">
            <span className={`text-[0.55rem] font-bold uppercase tracking-wider pl-1 leading-none transition-colors ${!calc.isManual ? 'text-white' : 'text-[#555]'}`}>Auto</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${calc.isManual ? 'bg-[#00E676]' : 'bg-[#555]'}`}>
               <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] shadow-sm transition-transform duration-300 ${calc.isManual ? 'translate-x-[16px]' : 'translate-x-[2px]'}`}></div>
            </div>
            <span className={`text-[0.55rem] font-bold uppercase tracking-wider pr-1 leading-none transition-colors ${calc.isManual ? 'text-[#00E676]' : 'text-[#555]'}`}>Manual</span>
          </div>
        </div>

        {/* Banner — 🌟 修復：以前綁死喺 calc.showRevVal（幾乎恆定 true），showRevVal 改啱咗
            之後如果淨係靠佢嚟決定顯唔顯示，未改過任何嘢嘅航班就會完全冇路入 AcceptFuel。
            呢個係學員入 AcceptFuel 嘅唯一入口，一定要恆常顯示，淨係樣式跟 final_fuel_accepted 變
            🌟 修復：以前 final_fuel_accepted=true 之後個 onClick 直接 undefined 死，學員一旦
            accept 咗就永遠冇得再撳返入去 review/re-request final fuel figures。而家掣恆常可撳，
            淨係樣式（顏色/pulse）繼續反映已 accept 定未 */}
        <div
          onClick={() => setActiveModal('AcceptFuel')}
          className={`mx-4 mt-3 rounded-lg px-3 py-2 flex justify-between items-center text-black shadow-md transition-all shrink-0 cursor-pointer ${flightData?.final_fuel_accepted ? 'bg-[#C6FF00]' : 'bg-[#FFD600] animate-pulse'}`}
        >
          <div className="font-bold text-[0.8rem] leading-none flex items-center">
            {flightData?.final_fuel_accepted ? 'Final fuel' : 'Pending fuel'} <span className="text-[1rem] font-black ml-1.5 leading-none">{calc.currTotal.toFixed(1)}<span className="text-[0.6rem] font-bold ml-[1px]">T</span></span>
          </div>
          <div className="font-bold text-[0.65rem] flex items-center gap-1 leading-none">
            ALTN {calc.selectedAltn} (A) <span className="text-lg leading-none pb-0.5">›</span>
          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 px-4 pb-3 mt-3 flex flex-col min-h-0">
          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider mb-2 border-b border-[#333] pb-1 shrink-0">
            <div></div><div className="text-right pr-2">OFP</div><div className="text-center">Diff</div><div className="text-right pr-2">Revised</div><div className="text-right">Time</div>
          </div>

          <div className="font-mono flex-[1.6] flex flex-col justify-between min-h-0">
            {Row({ label: "Taxi", ofp: calc.ofpTaxi, rev: calc.currTaxi, sideValue: formatTime(taxiMins), isInput: true, field: 'taxi' })}
            {Row({ label: "Trip Fuel", ofp: calc.ofpTrip, rev: calc.currTrip, sideValue: formatTime(tripMins), isInput: true, field: 'trip' })}
            {Row({ label: "Cont", ofp: calc.ofpCont, rev: calc.currCont, sideValue: formatTime(contMins), isInput: true, field: 'cont' })}

            {/* Alternate Row */}
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] gap-1 items-center py-0.5 border-b border-dashed border-[#333]">
              <div className="text-[0.65rem] leading-none">
                <div className="bg-white text-black px-1 py-0.5 rounded text-[0.55rem] font-bold font-sans inline-block w-max leading-tight cursor-pointer">
                  ALTN<br/>
                  <select
                     value={calc.selectedAltn}
                     onChange={(e) => handlers.handleAltnSelect(e.target.value)}
                     className="bg-transparent font-bold outline-none cursor-pointer appearance-none text-center">
                    {(calc.altnOptions || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select> ∨
                </div>
              </div>
              <div className="text-right leading-none pr-2"><span className="text-[0.8rem] text-white">{calc.baseAltnOfp?.toFixed(1) || '0.0'}</span></div>
              <div className="text-center text-[0.65rem] font-bold font-mono text-[#00E676] leading-none">
                {calc.showRevVal ? (Math.abs(calc.currAltnOfp - calc.baseAltnOfp) > 0.05 ? `+${Math.abs(calc.currAltnOfp - calc.baseAltnOfp).toFixed(1)}` : "") : ""}
              </div>
              <div className="text-right text-[#00E676] font-bold leading-none pr-2">{calc.showRevVal ? calc.currAltnOfp?.toFixed(1) : ''}</div>
              <div className="text-right text-[0.6rem] text-[#00E676] font-mono pr-1 leading-none">{formatTime(altnMins)}</div>
            </div>

            {Row({ label: "Reserve", ofp: calc.ofpRes, rev: calc.ofpRes, sideValue: formatTime(resMins) })}
            {Row({ label: "Fuel Reqd", ofp: calc.ofpReqdBase, rev: calc.currReqdBase, sideValue: formatTime(reqdMins), isBold: true, isTotal: true })}
            {Row({ label: "Tankering", ofp: 0.0, rev: calc.currTank, sideValue: formatTime(tankMins), isInput: true, field: 'tankering' })}
            {Row({ label: "Extra", ofp: 0.0, rev: calc.currExtra, sideValue: formatTime(extraMins), isInput: true, field: 'extra' })}
            {Row({ label: "Total Fuel", ofp: calc.ofpTotal, rev: calc.currTotal, sideValue: formatTime(totalMins), isBold: true, isTotal: true, isInput: true, field: 'total' })}
          </div>

          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider mt-3 mb-2 shrink-0">
            <div></div><div className="text-right pr-2">OFP</div><div className="text-center">Diff</div><div className="text-right pr-2">Revised</div><div className="text-right pr-1">Margin</div>
          </div>
          
          <div className="font-mono flex-[0.5] flex flex-col justify-between min-h-0">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1fr_0.8fr] gap-1 items-center py-0.5 border-b border-dashed border-[#333]">
              <div className="text-[0.65rem] text-[#8fa0a6] leading-none">ZFW</div>
              <div className="text-right leading-none pr-2">
                <span className="text-[0.8rem] font-bold text-white">{calc.ofpZfw?.toFixed(1)}</span>
              </div>
              <div className="text-center text-[0.65rem] font-bold font-mono text-[#00E676] leading-none">
                {calc.showRevVal ? (Math.abs(zfwVal - calc.ofpZfw) > 0.05 ? (
                  `${(zfwVal - calc.ofpZfw) > 0 ? '+' : ''}${(zfwVal - calc.ofpZfw).toFixed(1)}`
                ) : "") : ""}
              </div>
              <div className="text-right flex justify-end items-center pr-2">
                {/* 🌟 修復：以前 defaultValue 用 calc.actualZfw，但 actualZfw 本身已經
                    fallback 落 ofpZfw（未輸入過就恆等於 OFP），令個 box 未撳過都已經
                    「扮咗」有個真實輸入值。而家淨係讀 trainee 自己真正打落嘅
                    trainee_input_zfw，未輸入過就真係 blank，用 placeholder 提示 OFP 數 */}
                <input
                  type="number" step="0.1" defaultValue={flightData?.trainee_input_zfw || ''}
                  placeholder={calc.ofpZfw?.toFixed(1)}
                  onBlur={(e) => handlers.handleZfwInput(e.target.value)}
                  key={`zfw-${flightData?.trainee_input_zfw}-${calc.isManual}`}
                  className={`w-14 text-right text-[0.8rem] font-bold rounded px-1 py-0.5 outline-none leading-none transition-all placeholder:text-[#00E676]/40 ${
                    calc.isManual
                      ? 'bg-[#1a1a1a] text-[#00E676] border border-[#00E676]/50 focus:border-[#00E676]'
                      : 'bg-[#153f36] text-[#00E676] border border-transparent focus:border-[#00E676]/50'
                  }`}
                />
              </div>
              <div className={`text-right text-[0.6rem] pr-1 leading-none ${getMarginColor(marginZfw)}`}>
                {getMarginStr(marginZfw)}
              </div>
            </div>

            {Row({ label: "TOW", ofp: flightData?.weight_tow_ofp || 0, rev: calc.currTow, sideValue: getMarginStr(marginTow), sideValueColor: getMarginColor(marginTow), isBold: true, pillStyle: 'white' })}
            {Row({ label: "LW", ofp: flightData?.weight_lw_ofp || 0, rev: calc.currLw, sideValue: getMarginStr(marginLw), sideValueColor: getMarginColor(marginLw), pillStyle: 'green' })}
            {(towDiverges || lwDiverges) && (
              <div className="text-[0.55rem] text-[#FF9100] font-mono leading-tight mt-0.5" title={`Loadsheet payload shows TOW ${engineWeights?.tow.toFixed(1)}T / LW ${engineWeights?.law.toFixed(1)}T`}>
                ⚠ Diverges from Loadsheet payload figures
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-[0.6rem] font-mono text-[#8fa0a6] border-t border-[#333] pt-3 shrink-0">
            <div className="flex justify-between leading-none"><span className="font-sans">LNDG CG</span><span className="text-white">{engineWeights ? `${engineWeights.macLaw.toFixed(1)}% MAC` : '--'}</span></div>
            <div className="flex justify-between leading-none"><span className="font-sans">RAMP CG</span><span className="text-white">{engineWeights ? `${engineWeights.macTow.toFixed(1)}% MAC` : '--'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
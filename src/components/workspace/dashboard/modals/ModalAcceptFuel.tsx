"use client";
import React, { useState } from "react";
import { getDynamicAhm, distributeFuelKg } from "@/lib/loadsheet/loadsheetHelpers";
import { getMainTankCapacity, getCenterTankCapacity } from "@/lib/loadsheet/LoadsheetEngine";

// 🌟 Load Control / Fuel Company「係咪都要通知」嘅 include/exclude 掣，
// 樣式跟返 FuelWeightColumn.tsx 已有嘅 Auto/Manual toggle 慣例
function IncludeToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[#e2e8f0] text-[0.8rem] font-sans">{label}</span>
      <div onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer bg-[#0a0a0a] border border-[#333] rounded-full px-2 py-1 hover:bg-[#252525] transition-colors">
        <span className={`text-[0.55rem] font-bold uppercase tracking-wider pl-1 leading-none transition-colors ${!checked ? 'text-white' : 'text-[#555]'}`}>Exclude</span>
        <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${checked ? 'bg-[#00E676]' : 'bg-[#555]'}`}>
          <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] shadow-sm transition-transform duration-300 ${checked ? 'translate-x-[16px]' : 'translate-x-[2px]'}`}></div>
        </div>
        <span className={`text-[0.55rem] font-bold uppercase tracking-wider pr-1 leading-none transition-colors ${checked ? 'text-[#00E676]' : 'text-[#555]'}`}>Include</span>
      </div>
    </div>
  );
}

// 🌟 簡化版飛機示意圖（唔係 payload-tab/AircraftVisualizer.tsx 嗰個成套 pax/cargo/CG
// 版本——呢度淨係需要顯示 airplane model + 三個油缸，用返嗰個太重手）
function AircraftFuelVisual({ acType, reg, standard, left, center, right }: { acType: string; reg: string; standard: boolean; left: number; center: number; right: number }) {
  const tankColor = standard ? '#00E676' : '#FF9100';
  const tankFill = standard ? '#153f36' : '#2a1f0a';
  return (
    <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-4 flex flex-col items-center shadow-inner">
      <span className="text-[#8fa0a6] text-[0.6rem] font-bold uppercase tracking-widest mb-3">{acType} · {reg}</span>
      <svg viewBox="0 0 260 150" className="w-full h-28">
        {/* fuselage */}
        <rect x="122" y="6" width="16" height="138" rx="8" fill="#2a2a2a" stroke="#444" strokeWidth="1" />
        {/* wings */}
        <polygon points="130,60 10,120 10,132 130,92" fill="#2a2a2a" stroke="#444" strokeWidth="1" />
        <polygon points="130,60 250,120 250,132 130,92" fill="#2a2a2a" stroke="#444" strokeWidth="1" />
        {/* left tank */}
        <rect x="35" y="98" width="46" height="22" rx="3" fill={tankFill} stroke={tankColor} strokeWidth="1.5" />
        {/* center tank */}
        <rect x="112" y="70" width="36" height="20" rx="3" fill={tankFill} stroke={tankColor} strokeWidth="1.5" />
        {/* right tank */}
        <rect x="179" y="98" width="46" height="22" rx="3" fill={tankFill} stroke={tankColor} strokeWidth="1.5" />
      </svg>
      <div className="grid grid-cols-3 gap-2 w-full mt-2 text-center font-mono">
        {[["Left", left], ["Center", center], ["Right", right]].map(([label, val]) => (
          <div key={label as string}>
            <div className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-wider">{label}</div>
            <div className="text-[0.85rem] font-bold" style={{ color: tankColor }}>{((val as number) / 1000).toFixed(1)}T</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModalAcceptFuel({ flightData, updateFlightData, calc, handlers, setActiveModal }: any) {

  // 🌟 左邊數據狀態
  const finalFuel = calc.currTotal || 0.0;
  const finalFuelKg = Math.round(finalFuel * 1000);
  const [logFuel, setLogFuel] = useState<number>(flightData?.fuel_on_board || 0.0);
  const expectedUplift = Math.max(0, finalFuel - logFuel);

  // 🌟 右邊：機型 + 油缸分配狀態。跟 PayloadTab.tsx 派發油量嗰陣同一套
  // distributeFuelKg 邏輯計標準分配，非標準先俾 trainee 自己覆寫每個缸嘅數
  const ahm = getDynamicAhm(flightData);
  const maxMain = getMainTankCapacity(ahm);
  const maxCenter = getCenterTankCapacity(ahm);
  const stdSplit = distributeFuelKg(ahm, finalFuelKg);

  const [tanksStandard, setTanksStandard] = useState<boolean>(flightData?.final_fuel_tanks_standard ?? true);
  const [leftKg, setLeftKg] = useState<number>(flightData?.fuel_left_main || stdSplit.left);
  const [centerKg, setCenterKg] = useState<number>(flightData?.fuel_center || stdSplit.center);
  const [rightKg, setRightKg] = useState<number>(flightData?.fuel_right_main || stdSplit.right);

  const [notifyLoadControl, setNotifyLoadControl] = useState<boolean>(flightData?.final_fuel_notify_load_control ?? true);
  const [notifyFuelCompany, setNotifyFuelCompany] = useState<boolean>(flightData?.final_fuel_notify_fuel_company ?? true);

  const displayLeft = tanksStandard ? stdSplit.left : leftKg;
  const displayCenter = tanksStandard ? stdSplit.center : centerKg;
  const displayRight = tanksStandard ? stdSplit.right : rightKg;

  const handleConfirm = () => {
    if (updateFlightData) {
      updateFlightData({
        fuel_on_board: logFuel,
        // 🌟 呢個係學員自己嘅估算，唔係教官真正派發嘅數（嗰個先叫 actual_uplift，
        // 由 PayloadTab.tsx 送 fuel receipt 嗰刻先寫）
        estimated_uplift: expectedUplift,
        final_fuel_tanks_standard: tanksStandard,
        fuel_left_main: displayLeft,
        fuel_center: displayCenter,
        fuel_right_main: displayRight,
        final_fuel_notify_load_control: notifyLoadControl,
        final_fuel_notify_fuel_company: notifyFuelCompany,
      });
    }
    handlers.handleAcceptFuel();
    setActiveModal(null);
  };

  return (
    // 🌟 褪去所有外殼，直接使用 w-full h-full，完美貼合父層 Modal
    <div className="w-full h-full font-sans flex flex-col min-h-0">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* ============== 左欄：原有 Final Fuel / Log Fuel / Expected Uplift ============== */}
        <div className="flex flex-col gap-4">
          {/* FINAL FUEL 大字報 */}
          <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 shadow-md">
            <span className="text-[#8fa0a6] text-xs font-bold uppercase tracking-widest block mb-2">Final Fuel</span>
            <div className="text-5xl font-mono font-black text-[#00E676]">
              {finalFuel.toFixed(1)} <span className="text-2xl font-sans font-bold text-[#8fa0a6] ml-1">T</span>
            </div>
          </div>

          {/* Log Fuel & Expected Uplift 並排 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-5 shadow-md">
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest block mb-2">Log Fuel</span>
              <div className="flex items-baseline border-b border-[#555] focus-within:border-[#00E676] pb-1 transition-colors">
                <input
                  type="number" step="0.1"
                  value={logFuel || ''}
                  onChange={(e) => setLogFuel(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-white text-3xl font-mono font-bold outline-none"
                />
                <span className="text-lg font-bold text-[#8fa0a6] ml-1">T</span>
              </div>
            </div>

            <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-5 shadow-md flex flex-col justify-between">
              <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest block mb-2">Expected Uplift</span>
              <div className="text-3xl font-mono font-black text-white mt-auto pb-1">
                {expectedUplift.toFixed(1)} <span className="text-lg font-sans font-bold text-[#8fa0a6] ml-1">T</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============== 右欄：飛機示意圖 / Standard 掣 / Tank 分配 / 通知第三方 ============== */}
        <div className="flex flex-col gap-3">
          <AircraftFuelVisual
            acType={ahm.acType} reg={ahm.reg} standard={tanksStandard}
            left={displayLeft} center={displayCenter} right={displayRight}
          />

          <div className="flex items-center bg-[#0a0a0a] border border-[#333] rounded-full p-1">
            <button
              onClick={() => setTanksStandard(true)}
              className={`flex-1 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest transition-colors ${tanksStandard ? 'bg-[#00E676] text-black' : 'text-[#8fa0a6] hover:text-white'}`}
            >
              Standard
            </button>
            <button
              onClick={() => setTanksStandard(false)}
              className={`flex-1 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest transition-colors ${!tanksStandard ? 'bg-[#FF9100] text-black' : 'text-[#8fa0a6] hover:text-white'}`}
            >
              Non-standard
            </button>
          </div>

          {!tanksStandard && (
            <div className="grid grid-cols-3 gap-2 bg-[#1E1E1E] border border-[#333] rounded-xl p-3 shadow-md">
              {[
                { label: 'Left', val: leftKg, set: setLeftKg, max: maxMain },
                { label: 'Center', val: centerKg, set: setCenterKg, max: maxCenter },
                { label: 'Right', val: rightKg, set: setRightKg, max: maxMain },
              ].map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-1">
                  <span className="text-[#8fa0a6] text-[0.55rem] font-bold uppercase tracking-widest">{t.label}</span>
                  <div className="flex items-baseline gap-0.5">
                    <input
                      type="number" step="0.1" min={0} max={t.max / 1000}
                      value={t.val ? (t.val / 1000) : ''}
                      onChange={(e) => t.set(Math.round((parseFloat(e.target.value) || 0) * 1000))}
                      className="w-14 bg-[#0a0a0a] text-[#FF9100] text-center text-[0.85rem] font-mono font-bold rounded px-1 py-1 outline-none border border-[#333] focus:border-[#FF9100] transition-colors"
                    />
                    <span className="text-[#555] text-[0.6rem]">T</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-dashed border-[#333]"></div>

          <div>
            <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest block mb-1">Send final fuel figures to other parties</span>
            <div className="bg-[#1E1E1E] border border-[#333] rounded-xl px-4 divide-y divide-[#333]">
              <IncludeToggle label="Load Control" checked={notifyLoadControl} onChange={setNotifyLoadControl} />
              <IncludeToggle label="Fuel Company" checked={notifyFuelCompany} onChange={setNotifyFuelCompany} />
            </div>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* 🌟 底部按鈕：移除 Cancel，改為大隻的 Amber 掣 */}
      {/* ========================================== */}
      <div className="mt-auto shrink-0 flex w-full">
        <button
          onClick={handleConfirm}
          className="w-full py-4 bg-[#FF9100] text-black font-mono font-black tracking-widest text-[0.9rem] uppercase rounded-xl hover:bg-[#e68200] active:scale-[0.99] transition-all text-center shadow-[0_4px_20px_rgba(255,145,0,0.2)]"
        >
          [Accept Final Fuel {finalFuel.toFixed(1)}T]
        </button>
      </div>

    </div>
  );
}

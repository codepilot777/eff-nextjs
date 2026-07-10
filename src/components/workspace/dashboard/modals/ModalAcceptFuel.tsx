"use client";
import React, { useState } from "react";

export function ModalAcceptFuel({ flightData, updateFlightData, calc, handlers, setActiveModal }: any) {

  // 🌟 左邊數據狀態
  const finalFuel = calc.currTotal || 0.0;
  const [logFuel, setLogFuel] = useState<number>(flightData?.fuel_on_board || 0.0);
  const expectedUplift = Math.max(0, finalFuel - logFuel);

  const handleConfirm = () => {
    if (updateFlightData) {
      updateFlightData({
        fuel_on_board: logFuel,
        // 🌟 呢個係學員自己嘅估算，唔係教官真正派發嘅數（嗰個先叫 actual_uplift，
        // 由 PayloadTab.tsx 送 fuel receipt 嗰刻先寫）
        estimated_uplift: expectedUplift,
      });
    }
    handlers.handleAcceptFuel();
    setActiveModal(null);
  };

  return (
    // 🌟 褪去所有外殼，直接使用 w-full h-full，完美貼合父層 Modal
    <div className="w-full h-full font-sans flex flex-col min-h-0">

      {/* FINAL FUEL 大字報 */}
      <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-6 shadow-md mb-6 shrink-0">
        <span className="text-[#8fa0a6] text-xs font-bold uppercase tracking-widest block mb-2">Final Fuel</span>
        <div className="text-5xl font-mono font-black text-[#00E676]">
          {finalFuel.toFixed(1)} <span className="text-2xl font-sans font-bold text-[#8fa0a6] ml-1">T</span>
        </div>
      </div>

      {/* Log Fuel & Expected Uplift 並排 */}
      <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">

        {/* Log Fuel (可輸入) */}
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

        {/* Expected Uplift (自動計算) */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-5 shadow-md flex flex-col justify-between">
          <span className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest block mb-2">Expected Uplift</span>
          <div className="text-3xl font-mono font-black text-white mt-auto pb-1">
            {expectedUplift.toFixed(1)} <span className="text-lg font-sans font-bold text-[#8fa0a6] ml-1">T</span>
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

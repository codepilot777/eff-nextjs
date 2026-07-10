"use client";
import React, { useState } from "react";

export function ModalAcceptFuel({ flightData, updateFlightData, calc, handlers, setActiveModal }: any) {
  
  // 🌟 左邊數據狀態
  const finalFuel = calc.currTotal || 0.0;
  const [logFuel, setLogFuel] = useState<number>(flightData?.fuel_on_board || 0.0);
  const expectedUplift = Math.max(0, finalFuel - logFuel);

  // 🌟 右邊飛機油箱狀態
  const [isStandard, setIsStandard] = useState(true);
  const [tankL, setTankL] = useState("");
  const [tankC, setTankC] = useState("");
  const [tankR, setTankR] = useState("");

  // 🌟 下方派發部門狀態
  const [sendLC, setSendLC] = useState(true);
  const [sendFuelCo, setSendFuelCo] = useState(true);

  const handleConfirm = () => {
    if (updateFlightData) {
      updateFlightData({
        fuel_on_board: logFuel,
        actual_uplift: expectedUplift,
        fuel_distribution: isStandard ? 'STANDARD' : { L: tankL, C: tankC, R: tankR },
        fuel_sent_lc: sendLC,
        fuel_sent_fc: sendFuelCo
      });
    }
    handlers.handleAcceptFuel();
    setActiveModal(null);
  };

  return (
    // 🌟 褪去所有外殼，直接使用 w-full h-full，完美貼合父層 Modal
    <div className="w-full h-full font-sans flex flex-col min-h-0">
      
      {/* ========================================== */}
      {/* 🌟 上半部分：左右分欄 */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 shrink-0">
        
        {/* ⬅️ 左邊：Fuel 數據 */}
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
        </div>

        {/* ➡️ 右邊：飛機圖案與 Distribution */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-5 shadow-md flex flex-col items-center relative">
          
          {/* Toggle Switch */}
          <div className="flex items-center gap-3 mb-4 z-10 bg-[#0a0a0a] py-1.5 px-4 rounded-full border border-[#333] shadow-sm">
            <span className={`text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${isStandard ? 'text-[#00E676]' : 'text-[#555]'}`}>Standard</span>
            
            <div onClick={() => setIsStandard(!isStandard)} className="w-10 h-5 rounded-full relative cursor-pointer bg-[#333] border border-[#444]">
              <div className={`w-4 h-4 rounded-full absolute top-[1px] shadow-md transition-transform duration-300 ${!isStandard ? 'bg-[#FF9100] translate-x-[22px]' : 'bg-[#00E676] translate-x-[1px]'}`}></div>
            </div>

            <span className={`text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${!isStandard ? 'text-[#FF9100]' : 'text-[#555]'}`}>Non-Standard</span>
          </div>
          
          {/* Aircraft Logo & Input Boxes */}
          <div className="relative w-full flex-1 flex justify-center items-center min-h-[150px]">
            
            {/* 飛機俯視圖 */}
            <svg className="w-44 h-44 text-[#0a0a0a] drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
            </svg>

            {/* Non-Standard 油箱 Input (左、中、右) */}
            {!isStandard && (
              <>
                <input 
                  value={tankL} onChange={e => setTankL(e.target.value)} placeholder="L"
                  className="absolute top-[45%] left-[10%] w-14 bg-[#0a0a0a] text-[#FF9100] border border-[#FF9100]/60 text-center text-sm font-bold font-mono rounded py-1 outline-none focus:border-[#FF9100] shadow-md animate-fade-in" 
                />
                <input 
                  value={tankC} onChange={e => setTankC(e.target.value)} placeholder="C"
                  className="absolute top-[12%] left-1/2 -translate-x-1/2 w-14 bg-[#0a0a0a] text-[#FF9100] border border-[#FF9100]/60 text-center text-sm font-bold font-mono rounded py-1 outline-none focus:border-[#FF9100] shadow-md animate-fade-in" 
                />
                <input 
                  value={tankR} onChange={e => setTankR(e.target.value)} placeholder="R"
                  className="absolute top-[45%] right-[10%] w-14 bg-[#0a0a0a] text-[#FF9100] border border-[#FF9100]/60 text-center text-sm font-bold font-mono rounded py-1 outline-none focus:border-[#FF9100] shadow-md animate-fade-in" 
                />
              </>
            )}
          </div>

          <div className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest mt-1">Fuel Distribution</div>
        </div>

      </div>

      {/* ========================================== */}
      {/* 🌟 下半部分：傳送對象 */}
      {/* ========================================== */}
      <div className="bg-[#1E1E1E] border border-[#333] rounded-xl p-5 mb-6 shrink-0">
        <div className="text-[#8fa0a6] text-[0.7rem] font-bold uppercase tracking-widest mb-4">Send final fuel figure to other parties</div>
        
        <div className="flex flex-col gap-3">
          {/* Load Control Row */}
          <div className="flex justify-between items-center bg-[#0a0a0a] px-4 py-3 rounded-lg border border-[#333]">
            <span className="text-white font-bold text-sm tracking-wide">Load Control</span>
            <div onClick={() => setSendLC(!sendLC)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${sendLC ? 'bg-[#00E676]' : 'bg-[#555]'}`}>
               <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform duration-300 ${sendLC ? 'translate-x-[26px]' : 'translate-x-[2px]'}`}></div>
            </div>
          </div>
          
          {/* Fuel Company Row */}
          <div className="flex justify-between items-center bg-[#0a0a0a] px-4 py-3 rounded-lg border border-[#333]">
            <span className="text-white font-bold text-sm tracking-wide">Fuel Company</span>
            <div onClick={() => setSendFuelCo(!sendFuelCo)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${sendFuelCo ? 'bg-[#00E676]' : 'bg-[#555]'}`}>
               <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform duration-300 ${sendFuelCo ? 'translate-x-[26px]' : 'translate-x-[2px]'}`}></div>
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
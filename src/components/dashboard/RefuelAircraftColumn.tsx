"use client";
import React from "react";

export default function RefuelAircraftColumn({ flightData, updateFlightData, calc, setActiveModal }: { flightData: any, updateFlightData: any, calc: any, setActiveModal: any }) {
  
  // 1. 判斷是否處於 Standby Fuel 階段
  const isStandbyFuel = !flightData?.final_fuel_accepted;
  const isRefueled = flightData?.fuel_receipt_sent;

  // 2. 預備讀取 TechLog Database 的 Defects 邏輯
  const defects = flightData?.defects || [];
  const paddCount = defects.filter((d: any) => d.type === 'PADD' || d.category === 'PADD').length || 0;
  const saddCount = defects.filter((d: any) => d.type === 'SADD' || d.category === 'SADD').length || 5; // 模擬數據 S5
  const addCount = defects.filter((d: any) => d.type === 'ADD' || d.category === 'ADD').length || 2;   // 模擬數據 A2
  const defectsStr = `P${paddCount} S${saddCount} A${addCount}`;

  // 計算 Estimated Uplift (Final Fuel - Log Fuel)
  const logFuelT = flightData?.fuel_on_board || 11.0;
  const totalFuelT = flightData?.final_fuel_request || calc.currTotal || 36.4;
  const estimatedUplift = Math.max(0, totalFuelT - logFuelT).toFixed(1);

  return (
    <div className="flex-[3] flex flex-col gap-3 h-full overflow-hidden text-white font-sans w-full max-w-[280px]">
      
      {/* 🌟 1. Refueling 區塊 */}
      <div className="flex flex-col shrink-0">
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-[1.1rem] font-bold text-white">Refueling</h2>
          {/* 油車 Icon */}
          <div className="bg-[#1E1E1E] border border-[#333] w-7 h-7 rounded-full flex items-center justify-center text-[#C6FF00]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.2-8.543c-.1-.137-.234-.249-.391-.32L14.25 7.5H11.25" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.25h16.5m-16.5 0v-6.75A2.25 2.25 0 016 5.25h6.75a2.25 2.25 0 012.25 2.25v6.75" />
            </svg>
          </div>
        </div>
        
        {isRefueled ? (
          <div className="bg-[#C6FF00] rounded-lg p-3 flex justify-between items-center text-black shadow-md cursor-pointer hover:bg-[#b0e600] transition-colors">
            <span className="font-bold text-sm">Refuel Accepted</span>
            <span className="text-lg leading-none pb-0.5">›</span>
          </div>
        ) : (
          <div 
            onClick={() => { if (!isStandbyFuel) setActiveModal('Refuelling'); }}
            className={`rounded-lg p-3 flex justify-between items-center text-black shadow-md transition-colors ${!isStandbyFuel ? 'bg-[#FFD600] cursor-pointer hover:bg-[#e6c100] animate-pulse' : 'bg-[#555] text-[#888] cursor-not-allowed'}`}
          >
            <span className="font-bold text-sm">Pending Uplift</span>
            <span className="text-lg leading-none pb-0.5">›</span>
          </div>
        )}
      </div>
      
      {/* 🌟 2. Aircraft 區塊 */}
      <div className="bg-[#1E1E1E] rounded-xl p-4 flex flex-col shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[1.1rem] font-bold text-white">Aircraft</h2>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>
        
        <div className="bg-[#C6FF00] text-black font-bold px-3 py-2 rounded-lg flex justify-between items-center mb-4 shadow-sm">
          <span className="text-sm">Aircraft Accepted</span>
          <span className="text-xs flex items-center gap-1">0210z <span className="text-base leading-none pb-0.5">›</span></span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-[#8fa0a6] text-[0.65rem] uppercase tracking-wide mb-4">
          <div>Inbound<br/><span className="text-white font-bold text-sm">--</span></div>
          <div>ETA<br/><span className="text-white font-mono text-sm">--z</span></div>
          <div className="text-right">Bay<br/><span className="text-white font-bold text-sm">{flightData?.bay_no || '66'}</span></div>
        </div>
        
        {/* Log Fuel Input Box */}
        <div className="bg-[#2A2A2A] rounded-lg p-3 flex justify-between items-center border border-[#333] mb-4">
          <div className="flex flex-col">
            <span className="text-[#00E676] text-[0.65rem] font-bold mb-1">Log Fuel</span>
            <div className="flex items-baseline">
              <input 
                type="number" step="0.1" 
                defaultValue={logFuelT} 
                onBlur={(e) => updateFlightData({ fuel_on_board: parseFloat(e.target.value) || 0.0 })}
                key={`logfuel-${logFuelT}`}
                className="w-14 bg-transparent text-white font-bold text-xl outline-none border-b border-[#555] focus:border-[#00E676] mr-1 text-center transition-colors"
              />
              <span className="text-[#8fa0a6] text-xs font-bold">T</span>
            </div>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[#8fa0a6] text-[0.65rem] mb-1">Estimated Uplift</span>
            <div><span className="text-white font-bold text-lg">{estimatedUplift}</span><span className="text-[#8fa0a6] text-xs font-bold ml-1">T</span></div>
          </div>
        </div>
        
        {/* Defects */}
        <div className="flex flex-col">
          <span className="text-[#8fa0a6] text-[0.65rem]">Defect (PADD/ SADD/ ADD)</span>
          <span className="text-white font-mono text-sm mt-1 tracking-wider">{defectsStr}</span>
        </div>
      </div>
      
      {/* 🌟 3. Efficiency 區塊 */}
      <div className="bg-[#1E1E1E] rounded-xl p-4 flex flex-col shrink-0">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-[1.1rem] font-bold text-white">Efficiency</h2>
          <span className="text-[#8fa0a6] text-xl font-light">›</span>
        </div>
        <div className="text-center text-[#8fa0a6] text-[0.6rem] mb-3">Average time</div>
        
        <div className="flex justify-between px-2">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[#8fa0a6] text-[0.55rem] uppercase">Taxi out</span>
            <div className="w-11 h-11 rounded-full border-2 border-[#FFD600] flex flex-col items-center justify-center shadow-[0_0_8px_rgba(255,214,0,0.2)]">
              <span className="text-white font-bold text-sm leading-none">20</span>
              <span className="text-[#8fa0a6] text-[0.5rem] leading-none mt-0.5">min</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[#8fa0a6] text-[0.55rem] uppercase">Overburn</span>
            <div className="w-11 h-11 rounded-full border-2 border-[#555] flex flex-col items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">7</span>
              <span className="text-[#8fa0a6] text-[0.5rem] leading-none mt-0.5">min</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[#8fa0a6] text-[0.55rem] uppercase">Holding</span>
            <div className="w-11 h-11 rounded-full border-2 border-[#FFD600] flex flex-col items-center justify-center shadow-[0_0_8px_rgba(255,214,0,0.2)]">
              <span className="text-white font-bold text-sm leading-none">5</span>
              <span className="text-[#8fa0a6] text-[0.5rem] leading-none mt-0.5">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 4. OTP 區塊 (On-Time Performance) */}
      <div className="bg-[#1E1E1E] rounded-xl p-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-[1.1rem] font-bold text-white">OTP</h2>
          <div className="flex items-center text-[#8fa0a6] text-[0.65rem] gap-1 cursor-pointer hover:text-white transition-colors">
            Avg Off Block <span className="text-white font-mono font-bold ml-1 text-xs">0306z</span> <span className="text-lg font-light leading-none pb-0.5">›</span>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="relative flex-1 overflow-y-auto font-mono text-[0.75rem] text-[#8fa0a6] ml-2 pr-1">
          {/* Vertical Dashed Line */}
          <div className="absolute left-[3px] top-2 bottom-[30px] w-px border-l-2 border-dashed border-[#444]"></div>
          
          <div className="flex items-center mb-3 relative">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-5 w-6">OUT</span>
            <span className="text-[#00E676] font-bold ml-1 w-12">0330z</span>
            <span className="ml-2 w-10">1130L</span>
            <span className="ml-auto text-[#FFD600] font-bold text-xs tracking-wider">Late 65</span>
          </div>
          
          <div className="flex items-center mb-3 relative">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-5 w-6">OFF</span>
            <span className="text-[#00E676] font-bold ml-1 w-12">0344z</span>
            <span className="ml-2 w-10">1144L</span>
          </div>
          
          <div className="ml-5 mb-3 text-right text-[0.65rem] pr-1 flex justify-end items-center gap-2">
            Avg hold <span className="text-white font-bold text-xs">5</span>
          </div>
          
          <div className="flex items-center mb-3 relative">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-5 w-6">ON</span>
            <span className="text-[#00E676] font-bold ml-1 w-12">0648z</span>
            <span className="ml-2 w-10">1448L</span>
          </div>
          
          <div className="flex items-center relative">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-5 w-6">IN</span>
            <span className="text-[#00E676] font-bold ml-1 w-12">0652z</span>
            <span className="ml-2 w-10">1452L</span>
            <span className="ml-auto text-[#FFD600] font-bold text-xs tracking-wider">Late 42</span>
          </div>
        </div>
        
        {/* Timezones Footer */}
        <div className="flex justify-between items-center text-[0.65rem] font-mono text-[#8fa0a6] border-t border-[#333] pt-3 shrink-0">
          <span className="bg-[#2A2A2A] px-2 py-0.5 rounded text-white font-bold shadow-sm">
            HKG <span className="text-[#8fa0a6] font-normal">+0800 +1h</span>
          </span>
          <span className="bg-[#2A2A2A] px-2 py-0.5 rounded text-white font-bold shadow-sm">
            KIX <span className="text-[#8fa0a6] font-normal">+0900</span>
          </span>
        </div>
      </div>
      
    </div>
  );
}
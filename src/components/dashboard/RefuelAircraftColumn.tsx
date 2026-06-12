"use client";
import React from "react";

export default function RefuelAircraftColumn({ flightData, updateFlightData, calc, setActiveModal }: { flightData: any, updateFlightData: any, calc: any, setActiveModal: any }) {
  
  const isStandbyFuel = !flightData?.final_fuel_accepted;
  const isRefueled = flightData?.fuel_receipt_sent;

  const defects = flightData?.defects || [];
  const paddCount = defects.filter((d: any) => d.type === 'PADD' || d.category === 'PADD').length || 0;
  const saddCount = defects.filter((d: any) => d.type === 'SADD' || d.category === 'SADD').length || 5; 
  const addCount = defects.filter((d: any) => d.type === 'ADD' || d.category === 'ADD').length || 2;   
  const defectsStr = `P${paddCount} S${saddCount} A${addCount}`;

  const logFuelT = flightData?.fuel_on_board || 11.0;
  const totalFuelT = flightData?.final_fuel_request || calc.currTotal || 36.4;
  const estimatedUplift = Math.max(0, totalFuelT - logFuelT).toFixed(1);

  return (
    <div className="flex-[3] flex flex-col gap-2 h-full overflow-hidden min-h-0 text-white font-sans w-full max-w-[280px]">
      
      {/* 🌟 1. Refueling 區塊 (flex-[0.5]) */}
      <div className="flex flex-col flex-[0.5] justify-between min-h-0">
        <div className="flex justify-between items-center px-1 shrink-0">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">Refueling</h2>
          <div className="bg-[#1E1E1E] border border-[#333] w-6 h-6 rounded-full flex items-center justify-center text-[#C6FF00]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.2-8.543c-.1-.137-.234-.249-.391-.32L14.25 7.5H11.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.25h16.5m-16.5 0v-6.75A2.25 2.25 0 016 5.25h6.75a2.25 2.25 0 012.25 2.25v6.75" /></svg>
          </div>
        </div>
        
        {isRefueled ? (
          <div className="bg-[#C6FF00] rounded-lg px-3 py-2 flex justify-between items-center text-black shadow-md cursor-pointer hover:bg-[#b0e600] transition-colors mt-auto">
            <span className="font-bold text-[0.8rem] leading-none">Refuel Accepted</span>
            <span className="text-sm leading-none pb-px">›</span>
          </div>
        ) : (
          <div onClick={() => { if (!isStandbyFuel) setActiveModal('Refuelling'); }} className={`rounded-lg px-3 py-2 flex justify-between items-center text-black shadow-md transition-colors mt-auto ${!isStandbyFuel ? 'bg-[#FFD600] cursor-pointer hover:bg-[#e6c100] animate-pulse' : 'bg-[#555] text-[#888] cursor-not-allowed'}`}>
            <span className="font-bold text-[0.8rem] leading-none">Pending Uplift</span>
            <span className="text-sm leading-none pb-px">›</span>
          </div>
        )}
      </div>
      
      {/* 🌟 2. Aircraft 區塊 (flex-[1.4]) */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 flex-[1.4] flex flex-col min-h-0">
        <div className="flex justify-between items-center shrink-0 mb-2">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">Aircraft</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="bg-[#C6FF00] text-black font-bold px-2.5 py-1.5 rounded-lg flex justify-between items-center shadow-sm leading-none">
            <span className="text-[0.75rem]">Aircraft Accepted</span>
            <span className="text-[0.65rem] flex items-center gap-1">0210z <span className="text-sm leading-none pb-px">›</span></span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-[#8fa0a6] text-[0.55rem] uppercase tracking-wide">
            <div className="leading-tight">Inbound<br/><span className="text-white font-bold text-[0.8rem] leading-none">--</span></div>
            <div className="leading-tight">ETA<br/><span className="text-white font-mono text-[0.8rem] leading-none">--z</span></div>
            <div className="text-right leading-tight">Bay<br/><span className="text-white font-bold text-[0.8rem] leading-none">{flightData?.bay_no || '66'}</span></div>
          </div>
          
          <div className="bg-[#2A2A2A] rounded-lg px-2.5 py-1.5 flex justify-between items-center border border-[#333]">
            <div className="flex flex-col">
              <span className="text-[#00E676] text-[0.55rem] font-bold leading-none mb-0.5">Log Fuel</span>
              <div className="flex items-baseline leading-none">
                <input type="number" step="0.1" defaultValue={logFuelT} onBlur={(e) => updateFlightData({ fuel_on_board: parseFloat(e.target.value) || 0.0 })} key={`logfuel-${logFuelT}`} className="w-12 bg-transparent text-white font-bold text-[1rem] outline-none border-b border-[#555] focus:border-[#00E676] mr-1 text-center transition-colors leading-none"/>
                <span className="text-[#8fa0a6] text-[0.65rem] font-bold">T</span>
              </div>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[#8fa0a6] text-[0.55rem] leading-none mb-0.5">Estimated Uplift</span>
              <div className="leading-none"><span className="text-white font-bold text-[1rem]">{estimatedUplift}</span><span className="text-[#8fa0a6] text-[0.65rem] font-bold ml-px">T</span></div>
            </div>
          </div>
          
          <div className="flex flex-col leading-tight">
            <span className="text-[#8fa0a6] text-[0.55rem]">Defect (PADD/ SADD/ ADD)</span>
            <span className="text-white font-mono text-[0.75rem] tracking-wider">{defectsStr}</span>
          </div>
        </div>
      </div>
      
      {/* 🌟 3. Efficiency 區塊 (flex-[0.8]) */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 flex-[0.8] flex flex-col min-h-0">
        <div className="flex justify-between items-center shrink-0 mb-1">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">Efficiency</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between min-h-0">
          <div className="text-center text-[#8fa0a6] text-[0.55rem] leading-none">Average time</div>
          <div className="flex justify-between px-1">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#8fa0a6] text-[0.5rem] uppercase leading-none">Taxi out</span>
              <div className="w-9 h-9 rounded-full border-2 border-[#FFD600] flex flex-col items-center justify-center shadow-[0_0_8px_rgba(255,214,0,0.2)]"><span className="text-white font-bold text-[0.75rem] leading-none">20</span><span className="text-[#8fa0a6] text-[0.45rem] leading-none mt-px">min</span></div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#8fa0a6] text-[0.5rem] uppercase leading-none">Overburn</span>
              <div className="w-9 h-9 rounded-full border-2 border-[#555] flex flex-col items-center justify-center"><span className="text-white font-bold text-[0.75rem] leading-none">7</span><span className="text-[#8fa0a6] text-[0.45rem] leading-none mt-px">min</span></div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#8fa0a6] text-[0.5rem] uppercase leading-none">Holding</span>
              <div className="w-9 h-9 rounded-full border-2 border-[#FFD600] flex flex-col items-center justify-center shadow-[0_0_8px_rgba(255,214,0,0.2)]"><span className="text-white font-bold text-[0.75rem] leading-none">5</span><span className="text-[#8fa0a6] text-[0.45rem] leading-none mt-px">min</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 4. OTP 區塊 (flex-[1.5]) */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 flex-[1.5] flex flex-col min-h-0 overflow-hidden">
        <div className="flex justify-between items-center shrink-0 mb-2">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">OTP</h2>
          <div className="flex items-center text-[#8fa0a6] text-[0.55rem] gap-1 cursor-pointer hover:text-white transition-colors leading-none">
            Avg Off Block <span className="text-white font-mono font-bold ml-0.5 text-[0.65rem]">0306z</span> <span className="text-sm font-light leading-none pb-px">›</span>
          </div>
        </div>
        
        {/* 🌟 Timeline (用 justify-between 完美拉開距離) */}
        <div className="relative flex-1 flex flex-col justify-between font-mono text-[0.65rem] text-[#8fa0a6] ml-2 pr-1 min-h-0 py-1">
          <div className="absolute left-[3px] top-1.5 bottom-1.5 w-px border-l-2 border-dashed border-[#444]"></div>
          
          <div className="flex items-center relative leading-none">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-4 w-5">OUT</span><span className="text-[#00E676] font-bold ml-1 w-10">0330z</span><span className="ml-1 w-8">1130L</span><span className="ml-auto text-[#FFD600] font-bold text-[0.6rem] tracking-wider">Late 65</span>
          </div>
          
          <div className="flex items-center relative leading-none">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-4 w-5">OFF</span><span className="text-[#00E676] font-bold ml-1 w-10">0344z</span><span className="ml-1 w-8">1144L</span>
          </div>
          
          <div className="ml-4 text-right text-[0.55rem] pr-1 flex justify-end items-center gap-1.5 leading-none">
            Avg hold <span className="text-white font-bold text-[0.65rem]">5</span>
          </div>
          
          <div className="flex items-center relative leading-none">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-4 w-5">ON</span><span className="text-[#00E676] font-bold ml-1 w-10">0648z</span><span className="ml-1 w-8">1448L</span>
          </div>
          
          <div className="flex items-center relative leading-none">
            <div className="w-2 h-2 rounded-full border-2 border-[#8fa0a6] bg-[#1E1E1E] z-10 absolute left-0"></div>
            <span className="ml-4 w-5">IN</span><span className="text-[#00E676] font-bold ml-1 w-10">0652z</span><span className="ml-1 w-8">1452L</span><span className="ml-auto text-[#FFD600] font-bold text-[0.6rem] tracking-wider">Late 42</span>
          </div>
        </div>
        
        {/* Timezones Footer */}
        <div className="flex justify-between items-center text-[0.55rem] font-mono text-[#8fa0a6] border-t border-[#333] pt-1.5 shrink-0 mt-1 leading-none">
          <span className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white font-bold shadow-sm">HKG <span className="text-[#8fa0a6] font-normal">+0800 +1h</span></span>
          <span className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white font-bold shadow-sm">KIX <span className="text-[#8fa0a6] font-normal">+0900</span></span>
        </div>
      </div>
    </div>
  );
}
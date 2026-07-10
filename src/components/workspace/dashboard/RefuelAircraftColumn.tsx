"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query"; // 🌟 引入 React Query
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { getStandbyFuelT } from "@/lib/fuelCalculator";

// 🌟 Props 大清洗：只保留 setActiveModal 同 setCurrentTab
export default function RefuelAircraftColumn({ setActiveModal, setCurrentTab }: { setActiveModal: any, setCurrentTab: any }) {
  
  // 🌟 1. 從天上直接抽取 Flight 數據
  const { flightData, calc, updateFlightData } = useFlightData();

  // 🌟 2. 獨立自主！自己喺度 Fetch Techlog 數據 (完美封裝)
  const reg = flightData?.aircraft_reg || flightData?.raw_simbrief?.general?.aircraft_reg || 'B-HNQ';
  const { data: techlogData } = useQuery({
    queryKey: ["techlog", reg],
    queryFn: async () => {
      const res = await fetch(`/api/techlog?reg=${reg}`);
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!reg && !!flightData,
  });

  // 防呆保護
  if (!flightData || !calc) return null;

  const isStandbyFuel = !flightData?.final_fuel_accepted;
  const isRefueled = flightData?.fuel_receipt_sent;
  const isAccepted = flightData?.pilots_signed_fuel;

  // 🌟 獨立處理 Techlog 數據 (嚴格過濾 DEFERRED 狀態)
  let defectsStr = "LOADING...";
  
  if (techlogData) {
    const defects = techlogData.defects || [];
    const paddCount = defects.filter((d: any) => d.status === "DEFERRED" && d.id.startsWith("P")).length;
    const saddCount = defects.filter((d: any) => d.status === "DEFERRED" && d.id.startsWith("S")).length; 
    const addCount = defects.filter((d: any) => d.status === "DEFERRED" && d.id.startsWith("A")).length;   
    defectsStr = `P${paddCount} S${saddCount} A${addCount}`;
  } else if (techlogData === null) {
    defectsStr = "N/A";
  }

  // 🌟 Techlog Release vs Commander Acceptance 狀態機
  const tlReleased = techlogData?.tl_release || false;
  const tlAccepted = techlogData?.tl_accept || false;

  let aircraftStatusBanner;
  if (tlAccepted) {
    aircraftStatusBanner = (
      <div className="bg-[#C6FF00] text-black font-bold px-2.5 py-1.5 rounded-lg flex justify-between items-center shadow-sm leading-none transition-colors">
        <span className="text-[0.75rem] uppercase tracking-widest">Aircraft Accepted</span>
        <span className="text-[0.7rem] flex items-center gap-1 font-black">✓ <span className="text-sm font-light leading-none pb-px">›</span></span>
      </div>
    );
  } else if (tlReleased) {
    aircraftStatusBanner = (
      <div className="bg-[#FF9100] text-black font-bold px-2.5 py-1.5 rounded-lg flex justify-between items-center shadow-sm leading-none cursor-pointer hover:bg-[#e68a00] transition-colors" 
        onClick={() => {
          if (setCurrentTab) setCurrentTab("TECHLOG"); 
        }}
      >
        <span className="text-[0.75rem] uppercase tracking-widest flex items-center gap-1.5">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Techlog Released
        </span>
      </div>
    );
  } else {
    aircraftStatusBanner = (
      <div className="bg-[#1a1a1a] border border-[#333] text-[#8fa0a6] font-bold px-2.5 py-1.5 rounded-lg flex justify-between items-center shadow-sm leading-none">
        <span className="text-[0.75rem] uppercase tracking-widest">Techlog Pending</span>
        <span className="text-[0.65rem] font-black tracking-widest">---</span>
      </div>
    );
  }

  // 🌟 重新整理 Fuel 計算邏輯
  const logFuelT = flightData?.fuel_on_board || 0.0;
  const liveTargetFuelT = calc.currTotal || 36.4; // 學員即時嘅燃油估算（會隨 ZFW/manual fuel/備降場改變）
  const totalFuelT = flightData?.final_fuel_request || liveTargetFuelT;
  const estimatedUplift = Math.max(0, totalFuelT - logFuelT).toFixed(1);

  // 🌟 修復：以前 fuel receipt 送咗之後都仲係恆常顯示緊個即時估算，冇轉做教官真正
  // 派發嘅實際數字——一旦有真數就應該顯示返真數，唔好再顯示已經過時嘅估算
  const showRealUplift = isRefueled;
  const upliftLabel = showRealUplift ? "Uplift" : "Estimated Uplift";
  const upliftValue = showRealUplift ? (flightData?.actual_uplift || 0).toFixed(1) : estimatedUplift;

  // 🌟 修復：以前用 calc.currTotal（會郁）計 Standby Fuel，同 PayloadTab 用
  // flightData.plan_fuel_total（凍結咗嘅原始 OFP 總油量）唔一致，令學員同教官
  // 睇到唔同嘅 Standby Fuel 數字。而家用返同一個共用 helper。
  const standbyFuelT = getStandbyFuelT(flightData).toFixed(1);

  let logoColor = "text-[#555]";
  let ringSvg = null;
  let refuelBanner = null;

  const truckIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.2-8.543c-.1-.137-.234-.249-.391-.32L14.25 7.5H11.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.25h16.5m-16.5 0v-6.75A2.25 2.25 0 016 5.25h6.75a2.25 2.25 0 012.25 2.25v6.75" />
    </svg>
  );

  if (isAccepted) {
    logoColor = "text-[#C6FF00]";
    ringSvg = (
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle cx="12" cy="12" r="10" stroke="#C6FF00" strokeWidth="2" fill="transparent" />
      </svg>
    );
    refuelBanner = (
      // 🌟 修復：以前呢個分支冇 onClick，學員 accept 咗之後就完全冇路再撳返入去睇張 fuel receipt
      <div
        onClick={() => setActiveModal('Refuelling')}
        className="bg-[#C6FF00] rounded-lg px-3 py-2 flex justify-between items-center text-black shadow-md cursor-pointer hover:bg-[#b0e600] transition-colors mt-auto shrink-0"
      >
        <span className="font-bold text-[0.8rem] leading-none uppercase tracking-widest">Refuel Accepted</span>
        <span className="text-[0.65rem] font-black">✓</span>
      </div>
    );
  } else if (isRefueled) {
    logoColor = "text-[#FF9100]";
    ringSvg = (
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle cx="12" cy="12" r="10" stroke="#FF9100" strokeWidth="2" fill="transparent" />
      </svg>
    );
    refuelBanner = (
      <div 
        onClick={() => setActiveModal('Refuelling')} 
        className="bg-[#FF9100] rounded-lg px-3 py-2 flex justify-between items-center text-black shadow-md cursor-pointer hover:bg-[#e68a00] transition-colors mt-auto shrink-0"
      >
        <span className="font-bold text-[0.8rem] leading-none uppercase tracking-widest">Refuelling Complete</span>
        <span className="text-sm leading-none pb-px">›</span>
      </div>
    )
    } else if (!isStandbyFuel) {
    logoColor = "text-[#FF9100]";
    ringSvg = (
      <svg className="absolute inset-0 w-full h-full transform -rotate-90 animate-spin">
        <circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="2" fill="transparent" />
        <circle cx="12" cy="12" r="10" stroke="#FF9100" strokeWidth="2" fill="transparent" strokeDasharray="62.8" strokeDashoffset="47.1" strokeLinecap="round" />
      </svg>
    );
    refuelBanner = (
      <div className="bg-[#1a1a1a] border border-[#FF9100] rounded-lg px-3 py-2 flex justify-between items-center text-[#FF9100] mt-auto shrink-0">
        <span className="font-bold text-[0.8rem] leading-none uppercase tracking-widest animate-pulse">Refuelling...</span>
      </div>
    );
  } else {
    logoColor = "text-[#555]";
    refuelBanner = (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 flex justify-between items-center text-[#8fa0a6] mt-auto shrink-0">
        <span className="font-bold text-[0.8rem] leading-none uppercase tracking-widest">
          Standby {standbyFuelT}T Sent
        </span>
      </div>
    );
  }

  return (
    <div className="flex-[3] flex flex-col gap-2 h-full overflow-hidden min-h-0 text-white font-sans w-full max-w-[280px]">
      
      {/* 🌟 1. Refueling 區塊 */}
      <div className="flex flex-col flex-[0.5] justify-between min-h-0">
        <div className="flex justify-between items-center px-1 shrink-0">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">Refueling</h2>
          
          <div className={`relative w-6 h-6 flex items-center justify-center ${logoColor}`}>
            {ringSvg}
            <div className="z-10">{truckIcon}</div>
          </div>
        </div>
        
        {refuelBanner}
      </div>
      
      {/* 🌟 2. Aircraft 區塊 */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 flex-[1.4] flex flex-col min-h-0">
        <div className="flex justify-between items-center shrink-0 mb-2">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">Aircraft</h2>
          <span className="text-[#8fa0a6] text-lg font-light leading-none">›</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-between min-h-0">
          {aircraftStatusBanner}
          
          <div className="grid grid-cols-3 gap-2 text-[#8fa0a6] text-[0.55rem] uppercase tracking-wide mt-1">
            <div className="leading-tight">Inbound<br/><span className="text-white font-bold text-[0.8rem] leading-none">--</span></div>
            <div className="leading-tight">ETA<br/><span className="text-white font-mono text-[0.8rem] leading-none">--z</span></div>
            <div className="text-right leading-tight">Bay<br/><span className="text-white font-bold text-[0.8rem] leading-none">{flightData?.bay_no || '--'}</span></div>
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
              <span className="text-[#8fa0a6] text-[0.55rem] leading-none mb-0.5">{upliftLabel}</span>
              <div className="leading-none"><span className="text-white font-bold text-[1rem]">{upliftValue}</span><span className="text-[#8fa0a6] text-[0.65rem] font-bold ml-px">T</span></div>
            </div>
          </div>
          
          <div className="flex flex-col leading-tight">
            <span className="text-[#8fa0a6] text-[0.55rem]">Defect (PADD/ SADD/ ADD)</span>
            <span className={`font-mono text-[0.75rem] tracking-wider ${!techlogData ? 'text-[#FF9100] animate-pulse' : 'text-white'}`}>
              {defectsStr}
            </span>
          </div>
        </div>
      </div>
      
      {/* 🌟 3. Efficiency 區塊 */}
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

      {/* 🌟 4. OTP 區塊 */}
      <div className="bg-[#1E1E1E] rounded-xl p-3 flex-[1.5] flex flex-col min-h-0 overflow-hidden">
        <div className="flex justify-between items-center shrink-0 mb-2">
          <h2 className="text-[1.05rem] font-bold text-white leading-none">OTP</h2>
          <div className="flex items-center text-[#8fa0a6] text-[0.55rem] gap-1 cursor-pointer hover:text-white transition-colors leading-none">
            Avg Off Block <span className="text-white font-mono font-bold ml-0.5 text-[0.65rem]">0306z</span> <span className="text-sm font-light leading-none pb-px">›</span>
          </div>
        </div>
        
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
        
        <div className="flex justify-between items-center text-[0.55rem] font-mono text-[#8fa0a6] border-t border-[#333] pt-1.5 shrink-0 mt-1 leading-none">
          <span className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white font-bold shadow-sm">HKG <span className="text-[#8fa0a6] font-normal">+0800 +1h</span></span>
          <span className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white font-bold shadow-sm">KIX <span className="text-[#8fa0a6] font-normal">+0900</span></span>
        </div>
      </div>
    </div>
  );
}
"use client";
import { getCommonFlightInfo } from "@/lib/loadsheet/loadsheetHelpers";

export function RightHeader({ flightData, updateFlightData, calc, limits }: any) {
  const info = getCommonFlightInfo(flightData, calc);
  
  // 🌟 從最近的 Snapshot 提取真實的乘客分布
  const activeSnapshot = flightData?.final_snapshot || flightData?.prelim_snapshot || flightData?.ezfw_snapshot;
  const actualPaxJ = activeSnapshot?.pax?.OA || 0;
  const actualPaxY = (activeSnapshot?.pax?.OB || 0) + (activeSnapshot?.pax?.OC || 0) + (activeSnapshot?.pax?.OD || 0);
  const totalPax = actualPaxJ + actualPaxY;

  const desiredFuelType = flightData?.desired_fuel_type || 'NONE';
  const desiredFuelVal = flightData?.desired_fuel_value || '';

  return (
    // 🌟 縮小 Padding (p-6 -> p-4) 同 Margin (mb-4 -> mb-3) 偷取 vh
    <div className="bg-[#1E1E1E] rounded-xl border border-[#333333] p-4 shadow-lg mb-3 shrink-0 flex flex-row relative overflow-hidden">
      
      {/* 飛機 SVG Watermark */}
      <svg className="absolute -bottom-12 -right-10 w-[300px] h-[300px] text-[#ffffff] opacity-[0.03] transform -rotate-[25deg] pointer-events-none" fill="currentColor" viewBox="0 0 512 512">
        <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"/>
      </svg>

      {/* 左半：飛機與座位資訊 */}
      <div className="flex-1 relative z-10 flex flex-col justify-center pr-4">
        <div className="flex items-end gap-5 mb-2">
          {/* 字體微縮以迎合較小的 container */}
          <span className="text-[2.5rem] font-black text-white tracking-wider leading-none drop-shadow-md">{info.reg_clean}</span>
          <div className="flex flex-col mb-1">
             <span className="text-[#8fa0a6] font-bold text-[0.6rem] uppercase tracking-widest leading-none mb-0.5">CREW</span>
             <span className="text-white font-mono font-bold text-base leading-none">FD{info.crew_fd} <span className="text-[#8fa0a6]">/</span> C{info.crew_cc}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-5 text-[0.8rem] font-bold text-[#8fa0a6] uppercase tracking-widest mb-1.5">
          <div className="flex items-center gap-2">
             <span>PAX</span>
             <span className="text-white text-lg font-mono">{totalPax}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#0a0a0a] px-2 py-0.5 rounded border border-[#333]">
             <span className="text-white font-mono text-xs">F0 J{actualPaxJ} W0 Y{actualPaxY}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-5 text-[0.8rem] font-bold text-[#8fa0a6] uppercase tracking-widest">
          <div className="flex items-center gap-2">
             <span>CAP</span>
             <span className="text-white text-lg font-mono">438</span>
          </div>
          <div className="flex items-center gap-2 bg-[#333] text-white px-2 py-0.5 rounded">
             <span className="font-mono text-xs">F0 J42 W0 Y396</span>
          </div>
        </div>
      </div>

      {/* 右半：Setup & Limits 操控區 */}
      <div className="w-[460px] shrink-0 relative z-10 border-l border-[#333] pl-4 flex flex-col justify-center">
        
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[0.9rem] font-bold text-white uppercase tracking-widest">Weight Limit</span>
          
          <div onClick={() => updateFlightData({is_custom_weight: !limits.isCustomWt, final_fuel_accepted: false})} className="flex items-center gap-1.5 cursor-pointer bg-[#0a0a0a] border border-[#333] rounded-full px-1.5 py-0.5 hover:bg-[#252525] transition-colors">
            <span className={`text-[0.55rem] font-bold uppercase tracking-wider pl-0.5 leading-none transition-colors ${!limits.isCustomWt ? 'text-[#00E676]' : 'text-[#555]'}`}>SYS</span>
            <div className={`w-6 h-3 rounded-full relative transition-colors duration-300 ${limits.isCustomWt ? 'bg-[#FF9100]' : 'bg-[#555]'}`}>
               <div className={`w-2 h-2 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform duration-300 ${limits.isCustomWt ? 'translate-x-[14px]' : 'translate-x-[2px]'}`}></div>
            </div>
            <span className={`text-[0.55rem] font-bold uppercase tracking-wider pr-0.5 leading-none transition-colors ${limits.isCustomWt ? 'text-[#FF9100]' : 'text-[#555]'}`}>CUST</span>
          </div>
        </div>
        
        <div className="flex items-stretch gap-2">
          {/* Main Box (Padding 同 Gap 縮減) */}
          <div className="flex-1 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-[#333] shadow-inner flex flex-col gap-2">
            
            {/* Row 1: Desired Fuel */}
            <div className="flex gap-2">
              <div className="flex-[1.2] flex flex-col gap-0.5">
                 <label className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-widest font-bold">Desired Fuel</label>
                 <select 
                   value={desiredFuelType}
                   onChange={(e) => updateFlightData({ desired_fuel_type: e.target.value, final_fuel_accepted: false })}
                   className="bg-[#1a1a1a] text-white text-[0.75rem] font-bold rounded p-1 outline-none border border-[#444] focus:border-[#00E676] cursor-pointer appearance-none transition-colors"
                 >
                   <option value="NONE">Min Legal (Def)</option>
                   <option value="OFF_BLOCK">Off Block</option>
                   <option value="ON_LANDING">On Landing</option>
                 </select>
              </div>
              <div className={`flex-[0.8] flex flex-col gap-0.5 transition-opacity ${desiredFuelType === 'NONE' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                 <label className="text-[0.55rem] text-[#8fa0a6] uppercase tracking-widest font-bold">Value</label>
                 <div className="flex items-center gap-1">
                   <input 
                     type="number" step="0.1" defaultValue={desiredFuelVal}
                     onBlur={(e) => updateFlightData({ desired_fuel_value: parseFloat(e.target.value) || 0.0, final_fuel_accepted: false })}
                     className="w-full bg-[#1a1a1a] text-[#00E676] text-[0.85rem] font-black rounded p-1 outline-none border border-[#444] focus:border-[#00E676] transition-colors text-right"
                   />
                   <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                 </div>
              </div>
            </div>
            
            {/* Row 2: Weight Limits Layout */}
            <div className="flex flex-col gap-1.5 border-t border-[#222] pt-2">
              
              {/* Top Row for limits: MTOW (Aligned Right) */}
              <div className="flex justify-end">
                <div className="flex flex-col gap-0.5 items-end">
                   <label className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-widest font-bold leading-none">MTOW</label>
                   <div className="flex items-center gap-1">
                     <input 
                       key={`mtow-${limits.isCustomWt}`} type="number" step="0.1" disabled={!limits.isCustomWt} defaultValue={limits.dispMtow.toFixed(1)} 
                       onBlur={(e)=> updateFlightData({custom_mtow: parseFloat(e.target.value), final_fuel_accepted: false})} 
                       className={`w-16 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-0.5 outline-none border transition-colors text-right ${limits.isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                     />
                     <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                   </div>
                </div>
              </div>

              {/* Bottom Row for limits: Margin (Left), MLAW (Right) */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                   <label className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-widest font-bold leading-none">LW Margin</label>
                   <div className="flex items-center gap-1">
                     <input 
                       key={`margin-${limits.isCustomWt}`} type="number" step="0.1" disabled={!limits.isCustomWt} defaultValue={limits.dispMlawMargin.toFixed(1)} 
                       onBlur={(e)=> updateFlightData({custom_mlaw_margin: parseFloat(e.target.value), final_fuel_accepted: false})} 
                       className={`w-14 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-0.5 outline-none border transition-colors text-center ${limits.isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                     />
                     <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                   </div>
                </div>

                <div className="flex flex-col gap-0.5 items-end">
                   <label className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-widest font-bold leading-none">MLAW</label>
                   <div className="flex items-center gap-1">
                     <input 
                       key={`mlaw-${limits.isCustomWt}`} type="number" step="0.1" disabled={!limits.isCustomWt} defaultValue={limits.dispMlaw.toFixed(1)} 
                       onBlur={(e)=> updateFlightData({custom_mlaw: parseFloat(e.target.value), final_fuel_accepted: false})} 
                       className={`w-16 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-0.5 outline-none border transition-colors text-right ${limits.isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                     />
                     <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                   </div>
                </div>
              </div>

            </div>
          </div>

          {/* 🌟 擴大後的 MZFW Outlier */}
          <div className="w-[75px] flex flex-col items-center justify-center gap-1 border-l border-[#333] pl-3">
             <label className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold text-center leading-tight">MZFW</label>
             <div className="flex flex-col items-center w-full">
               <input 
                 key={`mzfw-${limits.isCustomWt}`} type="number" step="0.1" disabled={!limits.isCustomWt} defaultValue={limits.dispMzfw.toFixed(1)} 
                 onBlur={(e)=> updateFlightData({custom_mzfw: parseFloat(e.target.value), final_fuel_accepted: false})} 
                 className={`w-full bg-transparent text-[1rem] font-black rounded outline-none border-b text-center px-0 py-0.5 transition-colors ${limits.isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
               />
               <span className="text-[#8fa0a6] font-bold text-[0.55rem] mt-0.5">Tons</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
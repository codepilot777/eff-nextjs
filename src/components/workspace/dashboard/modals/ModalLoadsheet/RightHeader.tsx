"use client";
import { getCommonFlightInfo, buildClassCounts, getLatestSnapshot } from "@/lib/loadsheet/loadsheetHelpers";
// 🌟 引入總大腦矩陣
import { AIRCRAFT_REGISTRY } from "@/lib/loadsheet/MockAHM";

export function RightHeader({ flightData, updateFlightData, calc, limits }: any) {
  const info = getCommonFlightInfo(flightData, calc);

  // 🌟 精確鎖定當前執飛飛機的 AHM
  const currentReg = flightData?.aircraft_reg || "B-HNQ";
  const ahm = AIRCRAFT_REGISTRY[currentReg.toUpperCase()] || AIRCRAFT_REGISTRY["B-HNQ"];

  // 🌟 從最近的 Snapshot 提取真實的乘客分布（同 LoadsheetAirportColumn 共用同一個 helper，
  // 由 final_history/prelim_history 陣列度攞返「最後發送」嗰份，唔再讀恆定冇寫過嘅扁平欄位）
  const activeSnapshot = getLatestSnapshot(flightData) as { pax?: Record<string, unknown> } | null;

  // 🎯 實際載客：按 AHM 定義嘅 primaryClass 動態加總（同 LoadsheetAirportColumn 共用同一個 helper）
  const classCounts = buildClassCounts(ahm, activeSnapshot?.pax);
  const totalPax = Object.values(classCounts).reduce((sum, count) => sum + count, 0);

  // 根據這架飛機 AHM 實際擁有的商業艙等（Config 字串入面有咩字母），動態輸出對應的實際人數
  // 例如：B773 (J42Y396) 就只會嘔出 "J20 Y180"；B77W (J45W48Y268) 就會嘔出 "J30 W24 Y150"
  const actualPaxBreakdown = Object.keys(classCounts)
    .map(cls => `${cls}${classCounts[cls]}`) // 拼裝成 J30 這種格式
    .join(" ");

  // 🎯 2. 空機配置：理論座位容量 (CAP) 加總
  const maxCap = Object.values(ahm.stations.pax).reduce((acc, zone) => acc + zone.maxPax, 0);

  // 🎯 3. 核心優化：將原本 Cabin 拆分改為直接讀取 AHM 入面優美嘅官方 Config 配置 (例如 J45W48Y268)
  // 並加上美化空格，例如 "J45 W48 Y268"
  const beautifulConfig = ahm.config.replace(/([A-Z])(\d+)/g, "$1$2 ").trim();

  const desiredFuelType = flightData?.desired_fuel_type || 'NONE';
  const desiredFuelVal = flightData?.desired_fuel_value || '';

  return (
    // 🌟 Mobile：左半（reg/pax 資訊）+ 右半（固定 460px 嘅 Weight Limit 控制區）
    // 以前恆定並排，而家 mobile 上下疊
    <div className="bg-[#1E1E1E] rounded-xl border border-[#333333] p-4 shadow-lg mb-3 shrink-0 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* 飛機 SVG Watermark */}
      <svg className="absolute -bottom-12 -right-10 w-[300px] h-[300px] text-[#ffffff] opacity-[0.03] transform -rotate-[25deg] pointer-events-none" fill="currentColor" viewBox="0 0 512 512">
        <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"/>
      </svg>

      {/* 左半：飛機與座位資訊 */}
      <div className="flex-1 relative z-10 flex flex-col justify-center pr-0 md:pr-4">
        <div className="flex items-end gap-5 mb-2">
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
             {/* 👥 實際分艙搭乘人數 */}
             <span className="text-white font-mono text-xs">{actualPaxBreakdown || "--"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-5 text-[0.8rem] font-bold text-[#8fa0a6] uppercase tracking-widest">
          <div className="flex items-center gap-2">
             <span>CAP</span>
             <span className="text-white text-lg font-mono">{maxCap}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#333] text-white px-2 py-0.5 rounded">
             {/* 🌟 修正點：這裡忠實呈現官方註冊表定義嘅 Config配置 (如 J42 Y396) */}
             <span className="font-mono text-xs">{beautifulConfig}</span>
          </div>
        </div>
      </div>

      {/* 右半：Setup & Limits 操控區 (維持不變) */}
      <div className="w-full md:w-[460px] shrink-0 relative z-10 border-t md:border-t-0 md:border-l border-[#333] pt-4 md:pt-0 mt-4 md:mt-0 pl-0 md:pl-4 flex flex-col justify-center">
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
          <div className="flex-1 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-[#333] shadow-inner flex flex-col gap-2">
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
            
            <div className="flex flex-col gap-1.5 border-t border-[#222] pt-2">
              <div className="flex justify-end">
                <div className="flex flex-col gap-0.5 items-end">
                   <label className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-widest font-bold leading-none">MTOW</label>
                   <div className="flex items-center gap-1">
                     <input 
                       key={`mtow-${limits.isCustomWt}`} type="number" step="0.1" disabled={!limits.isCustomWt} defaultValue={limits.dispMtow.toFixed(1)} 
                       onBlur={(e)=> updateFlightData({custom_mtow: parseFloat(e.target.value) || 0.0, final_fuel_accepted: false})}
                       className={`w-16 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-0.5 outline-none border transition-colors text-right ${limits.isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                     />
                     <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                   <label className="text-[0.5rem] text-[#8fa0a6] uppercase tracking-widest font-bold leading-none">LW Margin</label>
                   <div className="flex items-center gap-1">
                     <input 
                       key={`margin-${limits.isCustomWt}`} type="number" step="0.1" disabled={!limits.isCustomWt} defaultValue={limits.dispMlawMargin.toFixed(1)} 
                       onBlur={(e)=> updateFlightData({custom_mlaw_margin: parseFloat(e.target.value) || 0.0, final_fuel_accepted: false})}
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
                       onBlur={(e)=> updateFlightData({custom_mlaw: parseFloat(e.target.value) || 0.0, final_fuel_accepted: false})}
                       className={`w-16 bg-[#1a1a1a] text-[0.85rem] font-black rounded p-0.5 outline-none border transition-colors text-right ${limits.isCustomWt ? 'text-[#FF9100] border-[#FF9100]/50 focus:border-[#FF9100]' : 'text-[#555] border-transparent'}`} 
                     />
                     <span className="text-[#8fa0a6] font-bold text-[0.6rem] w-2">T</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[75px] flex flex-col items-center justify-center gap-1 border-l border-[#333] pl-3">
             <label className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold text-center leading-tight">MZFW</label>
             <div className="flex flex-col items-center w-full">
               <input 
                 key={`mzfw-${limits.isCustomWt}`} type="number" step="0.1" disabled={!limits.isCustomWt} defaultValue={limits.dispMzfw.toFixed(1)} 
                 onBlur={(e)=> updateFlightData({custom_mzfw: parseFloat(e.target.value) || 0.0, final_fuel_accepted: false})}
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
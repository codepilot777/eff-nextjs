"use client";
import { parseAirportsData } from "@/lib/airports/airportHelpers";
import { AirportRow } from "./AirportRow";

export function ModalAirports({ calc, flightData }: any) {
  // 利用 Helper 處理所有凌亂嘅 Data
  const { dep, arr, alternates } = parseAirportsData(flightData, calc);

  return (
    <div className="flex flex-col h-full overflow-hidden w-full max-w-full font-sans">
      <div className="bg-[#121212] rounded-2xl border border-[#333] flex-1 overflow-x-auto overflow-y-auto shadow-2xl pb-4 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        <div className="min-w-[1100px]">
          
          {/* 🌟 Table Header (極簡專業灰) */}
          <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.5fr_0.8fr_0.8fr_0.8fr_0.8fr_1.8fr_1.5fr_1fr_1fr_0.6fr_0.6fr] gap-2 p-3 text-[0.55rem] text-[#71717a] font-bold tracking-widest border-b border-[#333] uppercase bg-[#0a0a0a] rounded-t-2xl">
            <div className="pl-4">Airport Chk</div>
            <div>Type<br/>Con</div>
            <div>MDF<br/>Delta</div>
            <div>MTR</div>
            <div>Dis</div>
            <div>FL<br/><span className="text-[#a1a1aa]">MORA</span></div>
            <div>Speed<br/>WC</div>
            <div>Time<br/>ETA</div>
            <div>Appch<br/>Rwy</div>
            <div className="text-center">From/Till</div>
            <div>Ceil Reqd<br/>Ceil Fcst</div>
            <div>Vis Reqd<br/>Vis Fcst</div>
            <div>H/T<br/>WC</div>
            <div>XWC</div>
          </div>

          {/* 🛫 渲染 DEP */}
          <AirportRow data={dep} />
          
          {/* 🛬 渲染 ARR */}
          <AirportRow data={arr} />

          {/* 🔄 渲染 Alternates (包含 Click-to-Expand 邏輯) */}
          {alternates.map((alt: any, idx: number) => (
            <AirportRow key={`altn-${idx}`} data={alt} />
          ))}
          
        </div>
      </div>
    </div>
  );
}
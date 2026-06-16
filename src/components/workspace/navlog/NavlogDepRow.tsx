"use client";

import React from "react";
import { useFlightData } from "@/hooks/useFlightData";

export default function NavlogDepRow() {
  const { flightData, updateFlightData } = useFlightData();

  if (!flightData) return null;

  const rawOrigin = flightData?.raw_simbrief?.origin || {};
  const depAirportName = rawOrigin.name || flightData?.dep_icao || 'HONG KONG INTL';
  const depRunway = flightData?.dep_rwy || rawOrigin.plan_rwy || '07R';
  
  const reqdOfp = (flightData?.fuel_trip_ofp || 0) + (flightData?.fuel_cont_ofp || 0) + (flightData?.fuel_altn_ofp || 0) + (flightData?.fuel_reserve_ofp || 0);

  const navInputs = flightData?.navlog_inputs || {};
  const depTimes = navInputs.dep_times || { doors: "", ready: "", out: "", off: "", fuel: "" };

  const handleDepInputChange = (field: string, val: string) => {
    const updatedInputs = { ...navInputs, dep_times: { ...depTimes, [field]: val } };
    updateFlightData({ navlog_inputs: updatedInputs });
  };

  return (
    <div className="flex px-3 py-2 border-b border-[#1e2630] items-center">
      <div className="flex-[1.6]">
        <div className="text-2xl font-black text-white tracking-wider leading-none mb-1">{flightData?.dep_icao || 'VHHH'}</div>
        <div className="text-xs text-text-muted font-mono leading-tight">{depAirportName}<br/>{depRunway}</div>
      </div>
      <div className="flex-[4.6] text-xs text-text-muted font-mono pt-3">RWY</div>
      <div className="flex-[1.0] flex flex-col items-end gap-1">
        <div className="text-[0.95rem] font-bold font-mono text-text-main">{reqdOfp.toFixed(1)}T <span className="text-[#00E676] text-[0.7rem]">3.6</span></div>
        <input 
          type="number" step="0.1" placeholder="T" defaultValue={depTimes.fuel || ""}
          onBlur={(e) => handleDepInputChange("fuel", e.target.value)}
          className="w-[80px] bg-[#007979] text-white font-mono font-black text-right border-none rounded-sm px-1 py-0.5 outline-none placeholder:text-white/50 focus:bg-[#009999] transition-colors"
        />
      </div>
      <div className="flex-[1.0] flex justify-end gap-2 text-xs">
        <div className="flex flex-col text-right text-text-muted font-mono leading-[1.6rem] pt-1">
          <span>DOORS</span><span>READY</span><span>OUT</span><span>OFF</span>
        </div>
        <div className="flex flex-col gap-1 w-[60px]">
          {['doors', 'ready', 'out', 'off'].map((field) => (
            <input 
              key={field} type="text" placeholder="z" defaultValue={depTimes[field] || ""}
              onBlur={(e) => handleDepInputChange(field, e.target.value)}
              className="w-full bg-[#007979] text-white font-mono font-black text-right border-none rounded-sm px-1 py-0.5 outline-none placeholder:text-white/50 focus:bg-[#009999] transition-colors"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
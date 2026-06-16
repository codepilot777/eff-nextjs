"use client";

import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";

import FmcCrewColumn from "./FmcCrewColumn";
import FuelWeightColumn from "./FuelWeightColumn";
import LoadsheetAirportColumn from "./LoadsheetAirportColumn";
import RefuelAircraftColumn from "./RefuelAircraftColumn";
import DashboardModals from "./DashboardModals";

export default function Dashboard({ setCurrentTab }: { setCurrentTab?: any }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // 🌟 只需要攞 isLoading 嚟做 Spinner
  const { flightData, isLoading } = useFlightData();

  if (isLoading || !flightData) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#333] border-t-[#00E676] rounded-full animate-spin"></div>
        <span className="text-[#8fa0a6] font-mono tracking-widest text-sm animate-pulse">LOADING FLIGHT DATA...</span>
      </div>
    );
  }

  return (
    <div className="relative flex gap-2 h-full w-full">
      <FmcCrewColumn setActiveModal={setActiveModal} />
      <FuelWeightColumn setActiveModal={setActiveModal} />
      <LoadsheetAirportColumn setActiveModal={setActiveModal} />
      <RefuelAircraftColumn setActiveModal={setActiveModal} setCurrentTab={setCurrentTab} />
      <DashboardModals activeModal={activeModal} setActiveModal={setActiveModal} />
    </div>
  );
}
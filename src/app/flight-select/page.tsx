"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ==========================================
// 🌟 內部組件 1: 左側航班清單
// ==========================================
const FlightListColumn = ({ flights, selectedFlight, onSelect }: { flights: any[], selectedFlight: any, onSelect: (f: any) => void }) => (
  <div className="w-[280px] shrink-0 bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 flex flex-col shadow-lg min-h-0">
    <h4 className="text-[#8fa0a6] font-bold text-[0.65rem] uppercase mb-4 tracking-widest border-b border-[#333] pb-3 shrink-0">
      Available Flights
    </h4>
    {flights.length === 0 ? (
      <div className="text-[#555] text-sm text-center mt-10 italic">No flights found.</div>
    ) : (
      <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        {flights.map((f) => {
          const isSelected = selectedFlight?._db_id === f._db_id;
          return (
            <button
              key={f._db_id}
              onClick={() => onSelect(f)}
              className={`w-full py-4 px-5 rounded-xl text-left transition-all flex justify-between items-center border-l-4 outline-none ${
                isSelected 
                  ? "bg-[#252525] border-y border-r border-y-[#333] border-r-[#333] border-l-[#C6FF00] shadow-md" 
                  : "bg-[#0a0a0a] border-[#333] hover:bg-[#1a1a1a] border-l-transparent"
              }`}
            >
              <span className={`font-mono font-bold text-[1.1rem] tracking-wide ${isSelected ? 'text-white' : 'text-[#8fa0a6]'}`}>
                {f.flight_no}
              </span>
              <span className={`text-[0.65rem] px-2 py-1 rounded font-black tracking-widest ${isSelected ? 'bg-[#C6FF00] text-black' : 'bg-[#333] text-white'}`}>
                {f.dep_icao}
              </span>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

// ==========================================
// 🌟 內部組件 2: iOS 風格 Toggle Switch
// ==========================================
const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled: boolean }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange()}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${checked ? "bg-[#C6FF00]" : "bg-[#333333]"}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5 bg-black" : "translate-x-0"
      }`}
    />
  </button>
);

// ==========================================
// 🌟 主頁面組件
// ==========================================
function FlightSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "Trainee";
  const queryClient = useQueryClient();

  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);

  // 1. React Query: 自動讀取航班
  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['flights', 'available'],
    queryFn: async () => {
      const res = await fetch('/api/flights');
      if (!res.ok) throw new Error('Failed to load flights');
      return res.json();
    }
  });

  // 2. React Query: 樂觀更新 Activate 狀態
  const activateMutation = useMutation({
    mutationFn: async ({ id, newVersion }: { id: string, newVersion: number }) => {
      const flightToUpdate = flights.find((f: any) => f._db_id === id);
      const updatedData = { ...flightToUpdate, activated_version: newVersion };
      const res = await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data: updatedData })
      });
      if (!res.ok) throw new Error('Failed to update');
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights', 'available'] });
    }
  });

  const selectedFlight = flights.find((f: any) => f._db_id === selectedFlightId) || null;

  const handleSelectFlight = (flight: any) => {
    setSelectedFlightId(flight._db_id);
    setSelectedVersion(flight.ofp_version || 1);
  };

  const handleToggleActivate = () => {
    if (!selectedFlight) return;
    const isCurrentlyActivated = selectedFlight.activated_version === selectedVersion;
    const newVersion = isCurrentlyActivated ? 0 : selectedVersion;
    
    activateMutation.mutate({ id: selectedFlight._db_id, newVersion });
  };

  const isCurrentVersionActive = selectedFlight?.activated_version === selectedVersion;

  return (
    <div className="h-screen bg-[#0a0a0a] text-[#e2e8f0] font-sans p-6 md:p-8 flex flex-col overflow-hidden">
      
      {/* 🌟 Header 容器改為 Flex Layout，方便擺放右上角 Return 按鈕 */}
      <div className="mb-6 flex justify-between items-start shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#8fa0a6]">
              <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
            {role === "Instructor" ? "IOS Dispatch Control" : "EFB Flight Selection"}
          </h1>
          <h2 className="text-[#8fa0a6] text-[0.8rem] font-bold tracking-widest uppercase mt-1">
            Electronic Flight Folder System
          </h2>
        </div>

        {/* 🌟 右上角 Return Button */}
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 border border-[#333333] hover:border-[#555555] bg-[#1a1a1a] text-[#8fa0a6] hover:text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 shadow-sm"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Return
        </button>
      </div>

      {isLoading ? (
        <div className="text-[#8fa0a6] font-mono text-sm flex-1 flex items-center justify-center animate-pulse">
          Retrieving active flights from database...
        </div>
      ) : (
        <div className="flex flex-1 gap-6 min-h-0">
          
          {/* 左欄：航班清單 */}
          <FlightListColumn flights={flights} selectedFlight={selectedFlight} onSelect={handleSelectFlight} />

          {/* 統一右側大容器 */}
          <div className="flex-1 bg-[#1E1E1E] border border-[#333333] rounded-2xl flex overflow-hidden shadow-lg min-h-0">
            {!selectedFlight ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#555] bg-[#0a0a0a]/50">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
                <span className="text-[0.8rem] font-mono tracking-widest uppercase">Select a flight to view details</span>
              </div>
            ) : (
              <>
                {/* 內左欄：OFP 版本選擇 */}
                <div className="w-[180px] shrink-0 border-r border-[#333333] p-5 flex flex-col bg-[#0a0a0a]">
                  <h4 className="text-[#8fa0a6] font-bold text-[0.65rem] uppercase mb-4 tracking-widest border-b border-[#333] pb-3 shrink-0">
                    OFP Versions
                  </h4>
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
                    {Array.from({ length: selectedFlight.ofp_version || 1 }, (_, i) => i + 1).map((v) => {
                      const isVerSelected = selectedVersion === v;
                      const isActivated = selectedFlight.activated_version === v;
                      
                      return (
                        <button
                          key={v}
                          onClick={() => setSelectedVersion(v)}
                          className={`w-full p-4 rounded-xl text-left transition-all border outline-none ${
                            isVerSelected 
                              ? "bg-[#1E1E1E] border-[#8fa0a6] shadow-md" 
                              : "bg-transparent border-[#333333] hover:border-[#555]"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`font-mono font-black text-lg ${isVerSelected ? 'text-white' : 'text-[#8fa0a6]'}`}>
                              V{v.toString().padStart(2, '0')}
                            </span>
                            {isActivated && (
                              <span className="bg-[#C6FF00] text-black text-[0.6rem] font-black tracking-widest px-2 py-0.5 rounded-sm">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[0.65rem] text-[#555] uppercase tracking-widest font-bold">
                            Generated by Dispatch
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 內右欄：SNN 與 底部控制列 */}
                <div className="flex-1 p-6 md:p-8 flex flex-col relative bg-[#1E1E1E] min-w-0">
                  <div className="flex flex-col h-full animate-fade-in min-h-0">
                    
                    {/* 航班摘要 */}
                    <div className="flex justify-between items-end mb-6 border-b border-[#333333] pb-5 shrink-0">
                      <div>
                        <h4 className="text-4xl font-mono font-black text-white">{selectedFlight.flight_no}</h4>
                        <div className="text-[#8fa0a6] font-bold tracking-widest mt-2 text-[0.9rem] flex items-center gap-2">
                          <span className="text-white">{selectedFlight.dep_icao}</span>
                          <span className="text-[#555] text-xs">▶</span>
                          <span className="text-white">{selectedFlight.arr_icao}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono font-bold text-xl">{selectedFlight.aircraft_reg}</div>
                        <div className="text-[#8fa0a6] text-[0.65rem] uppercase tracking-widest font-bold mt-1">{selectedFlight.aircraft_type}</div>
                      </div>
                    </div>

                    {/* SNN 顯示區 */}
                    <div className="flex flex-col flex-1 min-h-0 mb-6">
                      <h5 className="text-[#8fa0a6] font-bold text-[0.65rem] uppercase tracking-widest mb-2 shrink-0">
                        Special Navigation Notes
                      </h5>
                      <div className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-xl p-5 overflow-y-auto shadow-inner font-mono text-[0.85rem] text-[#e2e8f0] leading-relaxed whitespace-pre-wrap scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
                        {selectedFlight.raw_simbrief?.general?.dx_rmk 
                          ? selectedFlight.raw_simbrief.general.dx_rmk
                          : `** V${selectedVersion.toString().padStart(2, '0')} SNN BRIEFING **\n\nNIL SIGNIFICANT DISPATCHER REMARKS ENROUTE.`
                        }
                      </div>
                    </div>

                    {/* 🌟 底部控制列：將原本的按鈕改為完美的 Toggle Switch + VIEW 按鈕 */}
                    <div className="flex justify-between items-center border-t border-[#333333] pt-5 shrink-0">
                      
                      {/* 左側：Toggle Switch 連同文字狀態說明 */}
                      <div className="flex items-center gap-3">
                        <ToggleSwitch 
                          checked={isCurrentVersionActive}
                          onChange={handleToggleActivate}
                          disabled={activateMutation.isPending}
                        />
                        <div className="flex flex-col select-none">
                          <span className="text-xs font-black tracking-widest uppercase text-white">
                            {activateMutation.isPending 
                              ? "PROCESSING..." 
                              : isCurrentVersionActive 
                                ? "ACTIVATED" 
                                : "ACTIVATE FLIGHT PLAN"
                            }
                          </span>
                        </div>
                      </div>

                      {/* 右側：VIEW 按鈕 */}
                      <button 
                        onClick={() => router.push(`/workspace?role=${role}&id=${encodeURIComponent(selectedFlight._db_id)}`)}
                        className="px-8 py-3 bg-white text-black hover:bg-gray-200 font-black text-[0.75rem] tracking-widest uppercase rounded-xl shadow-md transition-colors border border-white"
                      >
                        VIEW
                      </button>

                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}

export default function FlightSelectPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0a0a] flex items-center justify-center text-[#8fa0a6] font-mono text-sm animate-pulse">Loading System...</div>}>
      <FlightSelectContent />
    </Suspense>
  );
}
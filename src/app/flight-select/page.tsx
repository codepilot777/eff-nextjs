"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FlightSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "Trainee";

  const [flights, setFlights] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const res = await fetch('/api/flights');
        if (res.ok) {
          const data = await res.json();
          setFlights(data);
        }
      } catch (error) {
        console.error("Failed to load flights", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlights();
  }, []);

  const handleSelectFlight = (flight: any) => {
    setSelectedFlight(flight);
    setSelectedVersion(flight.ofp_version || 1);
  };

  const handleActivate = async () => {
    if (!selectedFlight) return;
    setIsActivating(true);
    
    const updatedData = { ...selectedFlight, activated_version: selectedVersion };
    
    try {
      const res = await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedFlight._db_id, data: updatedData })
      });

      if (res.ok) {
        setSelectedFlight(updatedData);
        setFlights(flights.map(f => f._db_id === updatedData._db_id ? updatedData : f));
      }
    } catch (error) {
      console.error("Failed to activate flight plan", error);
      alert("Activation failed. Please check connection.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    // 🌟 鎖死全螢幕高度 h-screen，底色全黑
    <div className="h-screen bg-[#0a0a0a] text-[#e2e8f0] font-sans p-6 md:p-8 flex flex-col overflow-hidden">
      
      {/* 🌟 Header */}
      <div className="mb-6 flex flex-col gap-1 shrink-0">
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

      {isLoading ? (
        <div className="text-[#8fa0a6] font-mono text-sm flex-1 flex items-center justify-center animate-pulse">
          Retrieving active flights from database...
        </div>
      ) : (
        // 🌟 主容器：使用 min-h-0 確保內部可以 scroll
        <div className="flex flex-1 gap-6 min-h-0">
          
          {/* ========================================== */}
          {/* 左欄：航班清單 (Column 1) */}
          {/* ========================================== */}
          <div className="flex-[1] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 flex flex-col shadow-lg min-h-0 max-w-[350px]">
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
                      onClick={() => handleSelectFlight(f)}
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

          {/* ========================================== */}
          {/* 統一右側大容器：包含版本選擇與詳細資料 */}
          {/* ========================================== */}
          <div className="flex-[2.5] bg-[#1E1E1E] border border-[#333333] rounded-2xl flex overflow-hidden shadow-lg min-h-0">
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
                <div className="flex-[1] border-r border-[#333333] p-5 flex flex-col bg-[#0a0a0a]">
                  <h4 className="text-[#8fa0a6] font-bold text-[0.65rem] uppercase mb-4 tracking-widest border-b border-[#333] pb-3 shrink-0">
                    OFP Versions
                  </h4>
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
                    {Array.from({ length: selectedFlight.ofp_version || 1 }, (_, i) => i + 1).reverse().map((v) => {
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
                              <span className="bg-[#00E676] text-black text-[0.6rem] font-black tracking-widest px-2 py-0.5 rounded-sm">
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

                {/* 內右欄：SNN 與 動作按鈕 */}
                <div className="flex-[2] p-6 md:p-8 flex flex-col relative bg-[#1E1E1E]">
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
                        {`** V${selectedVersion.toString().padStart(2, '0')} SNN BRIEFING **\n\n1. WEATHER THREATS:\n   NIL SIG WX ENROUTE.\n   CHECK NOTAM FOR ARRIVAL RUNWAY CLOSURE EXPECTED AFTER 1400Z.\n\n2. ATC & DATALINK:\n   CPDLC LOGON VHHK REQUIRED PRIOR TO FIR ENTRY.\n   ADSB-OUT MANDATORY FOR THIS ROUTING.\n\n3. COMPANY NOTES:\n   EFFSIM DISPATCH - AUTO GENERATED OFP.\n   COST INDEX ${selectedFlight.cost_index || '85'} SELECTED FOR OTP.\n   \n4. ALTERNATE INFO:\n   ${selectedFlight.altn_icao || 'NIL'} REQUIRES PRIOR PPR FOR PARKING.`}
                      </div>
                    </div>

                    {/* 動作按鈕列 */}
                    <div className="flex justify-between items-center gap-4 shrink-0">
                      
                      <div className="flex-1">
                        {selectedFlight.activated_version === selectedVersion ? (
                           <button disabled className="w-full py-3.5 bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] rounded-xl font-bold text-[0.75rem] tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2">
                             <span className="text-xs">✓</span> FLIGHT PLAN ACTIVATED
                           </button>
                        ) : (
                           <button 
                             onClick={handleActivate}
                             disabled={isActivating}
                             className="w-full py-3.5 bg-transparent border border-[#8fa0a6] text-[#8fa0a6] rounded-xl font-bold text-[0.75rem] tracking-widest uppercase hover:bg-[#8fa0a6] hover:text-black transition-colors"
                           >
                             {isActivating ? "ACTIVATING..." : "ACTIVATE FLIGHT PLAN"}
                           </button>
                        )}
                      </div>

                      <div className="flex-1">
                        <button 
                          onClick={() => router.push(`/workspace?role=${role}&id=${encodeURIComponent(selectedFlight._db_id)}`)}
                          className="w-full py-3.5 bg-[#C6FF00] border border-[#C6FF00] text-black rounded-xl font-black text-[0.75rem] tracking-widest uppercase hover:bg-[#b0e600] shadow-md transition-colors"
                        >
                          View Dashboard
                        </button>
                      </div>

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
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

  // 當選擇航班時，預設選擇最新的 Version
  const handleSelectFlight = (flight: any) => {
    setSelectedFlight(flight);
    setSelectedVersion(flight.ofp_version || 1);
  };

  // 處理 Activate Flight Plan
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
        // 更新本地 State 確保 UI 即時反映
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
    <div className="min-h-screen bg-[#080a0d] text-slate-300 font-sans p-8 flex flex-col">
      <h1 className="text-3xl font-black text-[#00bfa5] mb-2">
        {role === "Instructor" ? "📡 IOS - Active Sessions" : "👨‍✈️ EFB - Select Flight"}
      </h1>
      <h2 className="text-[#8fa0a6] font-bold mb-6">Cathay Pacific EFF Dispatch System</h2>

      {isLoading ? (
        <div className="text-[#00bfa5] animate-pulse font-bold text-xl flex-1 flex items-center justify-center">Loading flights from Database...</div>
      ) : (
        <div className="flex flex-1 gap-6 min-h-[60vh]">
          
          {/* ========================================== */}
          {/* 左欄：航班清單 (Column 1)                  */}
          {/* ========================================== */}
          <div className="flex-[1] bg-[#11161d] border border-[#242f3d] rounded-xl p-4 flex flex-col shadow-lg">
            <h4 className="text-white font-bold text-sm uppercase mb-4 tracking-wider">🛫 Available Flights</h4>
            {flights.length === 0 ? (
              <div className="text-[#8fa0a6] text-sm text-center mt-10">No flights found in database.</div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto pr-2">
                {flights.map((f) => {
                  const isSelected = selectedFlight?._db_id === f._db_id;
                  return (
                    <button
                      key={f._db_id}
                      onClick={() => handleSelectFlight(f)}
                      className={`w-full py-4 px-4 rounded-lg font-bold text-left transition-all flex justify-between items-center ${
                        isSelected 
                          ? "bg-[#00bfa5] text-black shadow-[0_0_15px_rgba(0,191,165,0.4)]" 
                          : "bg-[#17202a] text-white hover:border-[#00bfa5] border border-transparent"
                      }`}
                    >
                      <span>✈️ {f.flight_no}</span>
                      <span className={`text-xs px-2 py-1 rounded ${isSelected ? 'bg-black/20' : 'bg-[#11161d]'}`}>
                        {f.dep_icao}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* 統一右側大容器：包含版本選擇與詳細資料       */}
          {/* ========================================== */}
          <div className="flex-[3] bg-[#11161d] border border-[#242f3d] rounded-xl flex overflow-hidden shadow-lg">
            {!selectedFlight ? (
              <div className="w-full h-full flex items-center justify-center text-[#8fa0a6] italic text-lg bg-[#0a0a0a]/30">
                👈 Select a flight from the left column to view details.
              </div>
            ) : (
              <>
                {/* 內左欄：OFP 版本選擇 */}
                <div className="flex-[1] border-r border-[#242f3d] p-4 flex flex-col bg-[#0a0a0a]/40">
                  <h4 className="text-white font-bold text-sm uppercase mb-4 tracking-wider">📄 OFP Versions</h4>
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                    {/* 動態產生版本清單 (1 到 ofp_version) */}
                    {Array.from({ length: selectedFlight.ofp_version || 1 }, (_, i) => i + 1).reverse().map((v) => {
                      const isVerSelected = selectedVersion === v;
                      const isActivated = selectedFlight.activated_version === v;
                      
                      return (
                        <button
                          key={v}
                          onClick={() => setSelectedVersion(v)}
                          className={`w-full p-4 rounded-lg text-left transition-all border ${
                            isVerSelected 
                              ? "bg-[#1e2a38] border-[#00bfa5] shadow-md" 
                              : "bg-[#0a0a0a] border-[#242f3d] hover:border-[#8fa0a6]"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-black text-xl ${isVerSelected ? 'text-[#00bfa5]' : 'text-white'}`}>
                              V{v}
                            </span>
                            {isActivated && (
                              <span className="bg-[#00E676]/20 text-[#00E676] text-[0.65rem] font-bold px-2 py-1 rounded border border-[#00E676]">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#8fa0a6]">
                            Generated by Dispatch
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 內右欄：SNN 與 動作按鈕 */}
                <div className="flex-[2.5] p-6 flex flex-col relative bg-[#11161d]">
                  <div className="flex flex-col h-full animate-fade-in">
                    
                    {/* 航班摘要 */}
                    <div className="flex justify-between items-start mb-6 border-b border-[#242f3d] pb-4">
                      <div>
                        <h4 className="text-3xl font-black text-white">{selectedFlight.flight_no}</h4>
                        <div className="text-[#00bfa5] font-bold tracking-widest mt-1 text-lg">
                          {selectedFlight.dep_icao} ➔ {selectedFlight.arr_icao}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#e2e8f0] font-bold text-lg">{selectedFlight.aircraft_reg}</div>
                        <div className="text-[#8fa0a6] text-sm">{selectedFlight.aircraft_type}</div>
                      </div>
                    </div>

                    {/* SNN 顯示區 */}
                    <h5 className="text-white font-bold text-sm uppercase mb-2">📝 Special Navigation Notes (SNN)</h5>
                    <div className="flex-1 bg-[#0a0a0a] border border-[#34495e] rounded-lg p-5 overflow-y-auto mb-6 shadow-inner font-mono text-sm text-[#e2e8f0] leading-relaxed whitespace-pre-wrap">
                      {`** V${selectedVersion} SNN BRIEFING **

1. WEATHER THREATS:
   NIL SIG WX ENROUTE.
   CHECK NOTAM FOR ARRIVAL RUNWAY CLOSURE EXPECTED AFTER 1400Z.

2. ATC & DATALINK:
   CPDLC LOGON VHHK REQUIRED PRIOR TO FIR ENTRY.
   ADSB-OUT MANDATORY FOR THIS ROUTING.

3. COMPANY NOTES:
   EFFSIM DISPATCH - AUTO GENERATED OFP.
   COST INDEX ${selectedFlight.cost_index || '85'} SELECTED FOR OTP.
   
4. ALTERNATE INFO:
   ${selectedFlight.altn_icao || 'NIL'} REQUIRES PRIOR PPR FOR PARKING.`}
                    </div>

                    {/* 動作按鈕列 (左 Activate, 右 View) */}
                    <div className="flex justify-between items-center gap-6 mt-auto shrink-0">
                      
                      {/* 左：ACTIVATE 按鈕 */}
                      <div className="flex-1">
                        {selectedFlight.activated_version === selectedVersion ? (
                           <button disabled className="w-full py-4 bg-[#00E676]/10 border-2 border-[#00E676] text-[#00E676] rounded-xl font-black text-lg cursor-not-allowed">
                             ✅ ATS FLIGHT PLAN ACTIVATED
                           </button>
                        ) : (
                           <button 
                             onClick={handleActivate}
                             disabled={isActivating}
                             className="w-full py-4 bg-[#17202a] border-2 border-[#00bfa5] text-[#00bfa5] rounded-xl font-black text-lg hover:bg-[#00bfa5] hover:text-black transition-colors"
                           >
                             {isActivating ? "⏳ ACTIVATING..." : "▶️ ACTIVATE FLIGHT PLAN"}
                           </button>
                        )}
                      </div>

                      {/* 右：VIEW 按鈕 */}
                      <div className="flex-1">
                        <button 
                          onClick={() => router.push(`/workspace?role=${role}&id=${encodeURIComponent(selectedFlight._db_id)}`)}
                          className="w-full py-4 bg-[#00bfa5] border-2 border-[#00bfa5] text-black rounded-xl font-black text-lg hover:bg-[#00E676] hover:border-[#00E676] shadow-[0_4px_15px_rgba(0,191,165,0.3)] transition-colors"
                        >
                          👀 VIEW DASHBOARD
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
    <Suspense fallback={<div className="p-8 text-[#00bfa5]">Loading...</div>}>
      <FlightSelectContent />
    </Suspense>
  );
}
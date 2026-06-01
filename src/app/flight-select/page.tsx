"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FlightSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "Trainee";

  const [flights, setFlights] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#080a0d] text-slate-300 font-sans p-8">
      <h1 className="text-3xl font-bold text-white mb-6">
        {role} Workspace - Select Active Flight
      </h1>

      {isLoading ? (
        <div className="text-[#00bfa5] animate-pulse font-bold text-xl">Loading flights from Database...</div>
      ) : (
        <div className="flex gap-6">
          {/* 左側：航班列表 */}
          <div className="flex-[1] bg-[#11161d] border border-[#242f3d] rounded-xl p-4">
            <h4 className="text-[#00bfa5] font-bold text-lg mb-4">🛫 Created Flights</h4>
            {flights.length === 0 ? (
              <div className="text-[#8fa0a6]">No flights found in database.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {flights.map((f) => {
                  const isSelected = selectedFlight?._db_id === f._db_id;
                  return (
                    <button
                      key={f._db_id}
                      onClick={() => setSelectedFlight(f)}
                      className={`w-full py-3 px-4 rounded-lg font-bold text-left transition-all ${
                        isSelected 
                          ? "bg-[#00bfa5] text-black" 
                          : "bg-[#17202a] text-white hover:border-[#00bfa5] border border-transparent"
                      }`}
                    >
                      ✈️ {f._db_id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 右側：航班詳情 */}
          <div className="flex-[2] bg-[#11161d] border border-[#242f3d] rounded-xl p-6">
            {selectedFlight ? (
              <div className="flex flex-col h-full">
                <h4 className="text-[#00bfa5] font-bold text-xl mb-4">Flight Details: {selectedFlight.flight_no}</h4>
                <div className="text-[#e2e8f0] mb-2"><strong>Route:</strong> {selectedFlight.dep_icao} ➔ {selectedFlight.arr_icao}</div>
                <div className="text-[#e2e8f0] mb-2"><strong>Aircraft:</strong> {selectedFlight.aircraft_reg} ({selectedFlight.aircraft_type})</div>
                <div className="text-[#e2e8f0] mb-6"><strong>Version:</strong> V{selectedFlight.ofp_version || 1}</div>
                
                <div className="mt-auto">
                  {/* 將點擊的航班 ID 動態帶入 URL，跳轉到 workspace */}
                  <button 
                    onClick={() => router.push(`/workspace?role=${role}&id=${encodeURIComponent(selectedFlight._db_id)}`)}
                    className="w-full py-4 bg-[#00bfa5]/15 border-2 border-[#00bfa5] text-[#00bfa5] rounded-xl font-black text-xl hover:bg-[#00bfa5] hover:text-black transition-colors"
                  >
                    👀 ENTER WORKSPACE
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[#8fa0a6] h-full flex items-center justify-center italic">
                👈 Select a flight from the left column to view details.
              </div>
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
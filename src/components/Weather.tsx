"use client";

export default function Weather({ flightData }: { flightData: any }) {
  return (
    <div className="flex gap-4 h-full w-full">
      {/* 出發地天氣 */}
      <div className="flex-1 bg-[#11161d] border border-[#242f3d] rounded-xl p-6 flex flex-col overflow-hidden">
        <h2 className="text-2xl font-black text-[#00bfa5] mb-6 flex items-center gap-2">
          🛫 DEPARTURE: {flightData?.dep_icao || 'N/A'}
        </h2>
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
          <div>
            <h3 className="text-[#8fa0a6] font-bold text-sm mb-2 border-b border-[#34495e] pb-1">METAR</h3>
            <div className="bg-[#0a0a0a] p-4 rounded-lg text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
              {flightData?.metar_dep || 'NIL'}
            </div>
          </div>
          <div>
            <h3 className="text-[#8fa0a6] font-bold text-sm mb-2 border-b border-[#34495e] pb-1">TAF</h3>
            <div className="bg-[#0a0a0a] p-4 rounded-lg text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
              {flightData?.taf_dep || 'NIL'}
            </div>
          </div>
        </div>
      </div>

      {/* 目的地天氣 */}
      <div className="flex-1 bg-[#11161d] border border-[#242f3d] rounded-xl p-6 flex flex-col overflow-hidden">
        <h2 className="text-2xl font-black text-[#00bfa5] mb-6 flex items-center gap-2">
          🛬 ARRIVAL: {flightData?.arr_icao || 'N/A'}
        </h2>
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
          <div>
            <h3 className="text-[#8fa0a6] font-bold text-sm mb-2 border-b border-[#34495e] pb-1">METAR</h3>
            <div className="bg-[#0a0a0a] p-4 rounded-lg text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
              {flightData?.metar_arr || 'NIL'}
            </div>
          </div>
          <div>
            <h3 className="text-[#8fa0a6] font-bold text-sm mb-2 border-b border-[#34495e] pb-1">TAF</h3>
            <div className="bg-[#0a0a0a] p-4 rounded-lg text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
              {flightData?.taf_arr || 'NIL'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
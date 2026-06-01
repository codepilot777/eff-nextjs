"use client";

export default function Weather({ flightData }: { flightData: any }) {
  // 提取 SimBrief 原始數據與預設備降場
  const rawSb = flightData?.raw_simbrief || {};
  const alternates = flightData?.alternates || [];

  // 決定天氣顯示的優先順序
  const getWx = (overrideValue: string | undefined, rawValue: string | undefined) => {
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawValue && rawValue !== "NIL") return rawValue;
    return "NO METAR/TAF DATA AVAILABLE";
  };

  const WxCard = ({ title, metar, taf }: { title: string, metar: string, taf: string }) => (
    <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-5 mb-5 shrink-0 shadow-lg">
      <h2 className="text-xl font-black text-[#00bfa5] mb-4 border-b border-[#242f3d] pb-2">{title}</h2>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-[#8fa0a6] font-bold text-xs mb-1 uppercase tracking-wider">METAR</h3>
          <div className="bg-[#0a0a0a] p-3 rounded-lg text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap shadow-inner border border-[#1d2733] leading-relaxed">
            {metar}
          </div>
        </div>
        <div>
          <h3 className="text-[#8fa0a6] font-bold text-xs mb-1 uppercase tracking-wider">TAF</h3>
          <div className="bg-[#0a0a0a] p-3 rounded-lg text-[#e2e8f0] font-mono text-sm whitespace-pre-wrap shadow-inner border border-[#1d2733] leading-relaxed">
            {taf}
          </div>
        </div>
      </div>
    </div>
  );

  // 🌟 過濾重複機場的邏輯 (Deduplication Logic)
  const renderList = [];
  const seenIcaos = new Set<string>();

  // 1. 處理出發地
  if (flightData?.dep_icao) {
    renderList.push({
      id: `dep-${flightData.dep_icao}`,
      title: `🛫 DEPARTURE: ${flightData.dep_icao}`,
      metar: getWx(flightData?.metar_dep, rawSb.origin?.metar),
      taf: getWx(flightData?.taf_dep, rawSb.origin?.taf)
    });
    seenIcaos.add(flightData.dep_icao);
  }

  // 2. 處理目的地 (如果與出發地不同)
  if (flightData?.arr_icao && !seenIcaos.has(flightData.arr_icao)) {
    renderList.push({
      id: `arr-${flightData.arr_icao}`,
      title: `🛬 ARRIVAL: ${flightData.arr_icao}`,
      metar: getWx(flightData?.metar_arr, rawSb.destination?.metar),
      taf: getWx(flightData?.taf_arr, rawSb.destination?.taf)
    });
    seenIcaos.add(flightData.arr_icao);
  }

  // 3. 處理備降場 (如果與起降地都不同)
  const rawAltn = rawSb.alternate;
  const altnArray = Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : alternates);

  altnArray.forEach((altn: any, idx: number) => {
    const icao = altn.icao_code || altn.icao;
    if (icao && !seenIcaos.has(icao)) {
      renderList.push({
        id: `altn-${icao}-${idx}`,
        title: `🔄 ALTERNATE: ${icao}`,
        metar: altn.metar || "NO METAR FILED",
        taf: altn.taf || "NO TAF FILED"
      });
      seenIcaos.add(icao);
    }
  });

  return (
    <div className="h-full w-full overflow-y-auto pr-2 pb-10 animate-fade-in">
      <h2 className="text-2xl font-black text-white mb-6">🌦️ METEOROLOGICAL BRIEFING</h2>
      
      {/* 依序渲染去重後的氣象卡片 */}
      {renderList.map((wx) => (
        <WxCard 
          key={wx.id}
          title={wx.title} 
          metar={wx.metar} 
          taf={wx.taf} 
        />
      ))}
    </div>
  );
}
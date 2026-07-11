"use client";
import { useState, useEffect } from "react"; // 🌟 加咗 useEffect
import { useFlightData } from "@/hooks/useFlightData"; 

export default function ConfigTab() {
  const { flightData, updateFlightData } = useFlightData();

  const [sbUser, setSbUser] = useState("EFFSIM");
  const [isFetchingUpdate, setIsFetchingUpdate] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);

  if (!flightData) return null;

  const unescapeHTML = (str: string) => {
    if (!str) return "<p>No OFP text available.</p>";
    return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  };

  const getOfpHtml = () => {
    const rawHtml = flightData?.raw_simbrief?.text?.plan_html || flightData?.ofp_telex_text;
    if (!rawHtml) return "<p>No OFP text available.</p>";
    if (rawHtml.includes('&lt;')) return unescapeHTML(rawHtml);
    return rawHtml;
  };

  const getSimbriefUrl = () => {
    const parts = (flightData?.flight_no || "CPA 564").split(" ");
    const airline = parts.length > 0 ? parts[0] : "CPA";
    const fltnum = parts.length > 1 ? parts[1] : "564";
    return `https://www.simbrief.com/system/dispatch.php?airline=${airline}&fltnum=${fltnum}&orig=${flightData?.dep_icao}&dest=${flightData?.arr_icao}`;
  };

  const handleFetchUpdate = async () => {
    if (!sbUser) return alert("Please enter Username.");
    setIsFetchingUpdate(true);
    try {
      // 🌟 修正：同 /api/simbrief/route.ts 一樣嘅 bug——冇 encode username 就直接砌入
      // URL，特殊字符（例如 &）會篡改成個 query string
      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(sbUser)}&json=1`);
      const data = await res.json();
      if (data?.fetch?.status !== 'Success') return alert(`Error: ${data?.fetch?.status}`);
      setPendingUpdateData(data);
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsFetchingUpdate(false);
    }
  };

  const handleConfirmUpdate = () => {
    if (!pendingUpdateData) return;
    const sb = pendingUpdateData;
    const formatTime = (unix: number) => unix ? new Date(unix * 1000).toISOString().substring(11, 16).replace(":", "") + "Z" : "0000Z";

    const nextVersion = (flightData.ofp_version || 1) + 1;
    const rawNavlog = sb.navlog?.fix || [];
    const parsedNavlog = (Array.isArray(rawNavlog) ? rawNavlog : [rawNavlog]).map((fix: any) => ({
      ident: fix.ident || "UKN", time_accum: Math.floor(parseInt(fix.time_total || 0) / 60), efob: parseInt(fix.fuel_plan_onboard || 0) / 1000.0
    }));

    const rawAltn = sb.alternate;
    const parsedAlternates = (Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : [])).map((a: any) => ({
      icao: a.icao_code || "N/A", burn: parseInt(a.burn || 0) / 1000.0, time: Math.floor(parseInt(a.time || 0) / 60), notam: "NIL"
    }));

    updateFlightData({
      route_id: sb.general?.route || "DCT",
      std_z: formatTime(parseInt(sb.times?.est_out || 0)), sta_z: formatTime(parseInt(sb.times?.est_in || 0)),
      cruise_alt: sb.general?.initial_altitude || "35000",
      raw_simbrief: sb,
      fuel_trip_ofp: parseInt(sb.fuel?.enroute_burn || 0) / 1000.0,
      weight_zfw_ofp: parseInt(sb.weights?.est_zfw || 0) / 1000.0,
      weight_tow_ofp: parseInt(sb.weights?.est_tow || 0) / 1000.0,
      ofp_telex_text: sb.text?.plan_html,
      ofp_version: nextVersion,
      navlog: parsedNavlog, alternates: parsedAlternates,
      ezfw_sent: true, azf_sent: false, prelim_ls_sent: false, final_ls_sent: false
    });
    setPendingUpdateData(null);
    alert(`✅ Updated to OFP V${nextVersion}!`);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="bg-lido-800 border border-[#333333] rounded-xl p-4">
        <h5 className="text-white font-bold mb-2">📡 Active Flight Plan (V{flightData.ofp_version || 1})</h5>
        <div className="bg-[#0a0a0a] text-text-main p-4 rounded-lg overflow-y-auto max-h-[400px] border border-[#404040]" dangerouslySetInnerHTML={{ __html: getOfpHtml() }} />
      </div>

      <div className="bg-lido-800 border border-[#333333] rounded-xl p-6">
        <h5 className="text-white font-bold mb-4">🔄 Update Flight Plan (SimBrief Integration)</h5>
        <div className="flex flex-col gap-4">
          <input type="text" value={sbUser} onChange={(e) => setSbUser(e.target.value)} className="w-full bg-lido-950 border border-[#404040] rounded-md p-3 text-white outline-none" />
          <a href={getSimbriefUrl()} target="_blank" rel="noreferrer" className="w-full"><button className="w-full bg-lido-800 text-white border border-[#404040] py-3 rounded-lg font-bold">1️⃣ EDIT ON SIMBRIEF</button></a>
          <button onClick={handleFetchUpdate} disabled={isFetchingUpdate} className="w-full bg-[#00bfa5]/20 border-2 border-[#00bfa5] text-status-teal py-3 rounded-lg font-bold">{isFetchingUpdate ? "⏳ FETCHING..." : "2️⃣ FETCH UPDATED PLAN"}</button>
        </div>
      </div>

      {pendingUpdateData && (
        <div className="bg-lido-800 border border-[#00bfa5] rounded-xl p-6">
          <h4 className="text-status-teal font-bold text-xl mb-4">📝 Verify and Upgrade</h4>
          <div className="flex gap-4">
            <button onClick={() => setPendingUpdateData(null)} className="flex-1 py-4 bg-lido-800 text-white rounded-lg font-bold">❌ CANCEL</button>
            <button onClick={handleConfirmUpdate} className="flex-1 py-4 bg-[#C6FF00] text-black font-black rounded-lg">📤 SEND V{(flightData.ofp_version || 1) + 1}</button>
          </div>
        </div>
      )}
    </div>
  );
}
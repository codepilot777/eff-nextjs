"use client";
import { useState, useEffect } from "react"; // 🌟 加咗 useEffect
import { useFlightData } from "@/hooks/useFlightData";
import { buildOfpSnapshot } from "@/lib/flight/ofpHistory";

export default function ConfigTab() {
  const { flightData, sendFlightDirective } = useFlightData();

  const [sbUser, setSbUser] = useState("EFFSIM");
  const [isFetchingUpdate, setIsFetchingUpdate] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
  const [isDispatching, setIsDispatching] = useState(false);

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

  // 🌟 修復：以前呢度用 updateFlightData 直接覆寫成班 top-level 欄位（route_id/
  // std_z/navlog...），trainee 眼前嘅內容會即刻靜靜雞轉晒版，冇任何 accept 步驟。
  // 而家改為 ofpDispatchAppend directive，淨係 append 落 ofp_history——trainee
  // 要自己去 EFB Flight Selection 揀呢個新版本再撳 ACTIVATE，先至會變成佢哋眼前嘅內容
  // （真.commander 接受新 dispatch release 嘅概念）
  const handleConfirmUpdate = async () => {
    if (!pendingUpdateData) return;
    const sb = pendingUpdateData;
    const formatTime = (unix: number) => unix ? new Date(unix * 1000).toISOString().substring(11, 16).replace(":", "") + "Z" : "0000Z";

    const rawNavlog = sb.navlog?.fix || [];
    const parsedNavlog = (Array.isArray(rawNavlog) ? rawNavlog : [rawNavlog]).map((fix: any) => ({
      ident: fix.ident || "UKN", time_accum: Math.floor(parseInt(fix.time_total || 0) / 60), efob: parseInt(fix.fuel_plan_onboard || 0) / 1000.0
    }));

    const rawAltn = sb.alternate;
    const parsedAlternates = (Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : [])).map((a: any) => ({
      icao: a.icao_code || "N/A", burn: parseInt(a.burn || 0) / 1000.0, time: Math.floor(parseInt(a.time || 0) / 60), notam: "NIL"
    }));

    const snapshot = buildOfpSnapshot({
      route_id: sb.general?.route || "DCT",
      std_z: formatTime(parseInt(sb.times?.est_out || 0)), sta_z: formatTime(parseInt(sb.times?.est_in || 0)),
      cruise_alt: sb.general?.initial_altitude || "35000",
      raw_simbrief: sb,
      fuel_trip_ofp: parseInt(sb.fuel?.enroute_burn || 0) / 1000.0,
      weight_zfw_ofp: parseInt(sb.weights?.est_zfw || 0) / 1000.0,
      weight_tow_ofp: parseInt(sb.weights?.est_tow || 0) / 1000.0,
      ofp_telex_text: sb.text?.plan_html,
      navlog: parsedNavlog, alternates: parsedAlternates,
    });

    setIsDispatching(true);
    try {
      await sendFlightDirective({ ofpDispatchAppend: { snapshot } });
      setPendingUpdateData(null);
      alert(`✅ Dispatched OFP V${(flightData.ofp_version || 1) + 1} to trainee — it becomes active once they accept it in EFB Flight Selection.`);
    } catch {
      alert("Failed to dispatch new OFP version.");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="bg-lido-800 border border-[#333333] rounded-xl p-4">
        {/* 🌟 修復：以前呢度成句寫「Active Flight Plan (V{ofp_version})」，但呢個文字下面
            嘅內容其實讀緊 raw_simbrief/ofp_telex_text——即係 trainee 已經 activate 咗嗰個
            版本，唔係 ofp_version（最新 dispatch 咗嘅版本）。兩個數之前一直畀呢個標題混埋一齊 */}
        {/* 🌟 修復 2：flight-select 而家有返可以撳走嘅 toggle switch（ofpDeactivate 會將
            activated_version 清做 0），以前呢度用 `|| 1` 會將「0（trainee 撳走咗）」同
            「1（真係 activate 緊 V1）」混淆，靜靜雞當咗 V1 生效緊 */}
        <h5 className="text-white font-bold mb-2 flex items-center gap-2 flex-wrap">
          📡 OFP Text (Trainee Active: {flightData.activated_version > 0 ? `V${flightData.activated_version}` : "NONE"})
          {(flightData.ofp_version || 1) > (flightData.activated_version || 0) && (
            <span className="text-[0.65rem] text-[#FF9100] font-black uppercase tracking-widest bg-[#FF9100]/15 border border-[#FF9100]/30 px-2 py-0.5 rounded">
              V{flightData.ofp_version} dispatched · awaiting trainee accept
            </span>
          )}
        </h5>
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
            <button onClick={() => setPendingUpdateData(null)} disabled={isDispatching} className="flex-1 py-4 bg-lido-800 text-white rounded-lg font-bold disabled:opacity-50">❌ CANCEL</button>
            <button onClick={handleConfirmUpdate} disabled={isDispatching} className="flex-1 py-4 bg-[#C6FF00] text-black font-black rounded-lg disabled:opacity-50">
              {isDispatching ? "⏳ DISPATCHING..." : `📤 DISPATCH V${(flightData.ofp_version || 1) + 1} TO TRAINEE`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
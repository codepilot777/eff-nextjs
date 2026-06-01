"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function IOSPanelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flightId = searchParams.get("id");
  
  const [flightData, setFlightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Payload");

  const [sbUser, setSbUser] = useState("EFFSIM");
  const [updDep, setUpdDep] = useState("");
  const [updArr, setUpdArr] = useState("");
  const [isFetchingUpdate, setIsFetchingUpdate] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);

  const [localPayload, setLocalPayload] = useState({
    j: 0, y: 0, h1: 0, h2: 0, h3: 0, h4: 0, bulk: 0
  });

  const fetchFlightData = async () => {
    if (!flightId) return;
    try {
      const res = await fetch(`/api/flight?id=${encodeURIComponent(flightId)}`);
      if (res.ok) {
        const data = await res.json();
        setFlightData(data);
      }
    } catch (error) {
      console.error("Failed to fetch flight data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (flightData && localPayload.j === 0 && localPayload.y === 0) {
      setLocalPayload({
        j: flightData.pax_j || 0,
        y: flightData.pax_y || 0,
        h1: flightData.cargo_hold_1 || 0,
        h2: flightData.cargo_hold_2 || 0,
        h3: flightData.cargo_hold_3 || 0,
        h4: flightData.cargo_hold_4 || 0,
        bulk: flightData.cargo_bulk || 0
      });
    }
    
    if (flightData && !updDep && !updArr) {
      setUpdDep(flightData.dep_icao || "VHHH");
      setUpdArr(flightData.arr_icao || "RJBB");
    }
  }, [flightData]);

  useEffect(() => {
    fetchFlightData();
    const interval = setInterval(fetchFlightData, 3000);
    return () => clearInterval(interval);
  }, [flightId]);

  const updateFlightData = async (updates: any) => {
    const updatedData = { ...flightData, ...updates };
    setFlightData(updatedData); 
    try {
      await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flightId, data: updatedData })
      });
    } catch (error) {
      console.error("Failed to update flight data", error);
    }
  };

  const handleAutoPayload = () => {
    if (!flightData) return;
    const targetPayload = (flightData.weight_zfw_ofp * 1000) - flightData.dow;
    let paxTotal = Math.floor(targetPayload / 104);
    if (paxTotal > 438) paxTotal = 438;
    const j = Math.min(42, Math.floor(paxTotal * 0.1));
    const y = paxTotal - j;
    
    let remCargo = targetPayload - (paxTotal * 84);
    if (remCargo < 0) remCargo = 0;
    
    const h1 = Math.floor(remCargo * 0.3);
    const h2 = Math.floor(remCargo * 0.3);
    const h3 = Math.floor(remCargo * 0.2);
    const h4 = Math.floor(remCargo * 0.1);
    const bulk = Math.floor(remCargo - h1 - h2 - h3 - h4);
    
    setLocalPayload({ j, y, h1, h2, h3, h4, bulk });
    updateFlightData({ 
      pax_j: j, pax_y: y, 
      cargo_hold_1: h1, cargo_hold_2: h2, cargo_hold_3: h3, cargo_hold_4: h4, cargo_bulk: bulk 
    });
  };

  const getSimbriefUrl = () => {
    if (!flightData) return "#";
    const parts = (flightData.flight_no || "CPA 564").split(" ");
    const airline = parts.length > 0 ? parts[0] : "CPA";
    const fltnum = parts.length > 1 ? parts[1] : "564";
    return `https://www.simbrief.com/system/dispatch.php?airline=${airline}&fltnum=${fltnum}&orig=${updDep}&dest=${updArr}`;
  };

  const handleFetchUpdate = async () => {
    if (!sbUser) return alert("Please enter a SimBrief Username.");
    setIsFetchingUpdate(true);
    try {
      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${sbUser}&json=1`);
      const data = await res.json();
      
      if (data?.fetch?.status !== 'Success') {
        alert(`SimBrief Error: ${data?.fetch?.status || 'Unknown error'}`);
        return;
      }
      setPendingUpdateData(data);
    } catch (error) {
      console.error("Fetch Simbrief update error:", error);
      alert("Network error fetching SimBrief.");
    } finally {
      setIsFetchingUpdate(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdateData) return;
    const sb = pendingUpdateData;
    
    const formatTime = (unix: number) => {
      if (!unix) return "0000Z";
      const d = new Date(unix * 1000);
      return d.toISOString().substring(11, 16).replace(":", "") + "Z";
    };

    const stdUnix = parseInt(sb.times?.est_out || 0);
    const staUnix = parseInt(sb.times?.est_in || 0);
    const targetPayload = parseInt(sb.weights?.est_zfw || 0) - parseInt(sb.weights?.oew || 161968);
    
    let paxTotal = Math.floor(targetPayload / 104);
    if (paxTotal > 438) paxTotal = 438;
    const paxJ = Math.min(42, Math.floor(paxTotal * 0.1));
    const paxY = paxTotal - paxJ;
    
    let remCargo = targetPayload - (paxTotal * 84);
    if (remCargo < 0) remCargo = 0;
    
    const h1 = Math.floor(remCargo * 0.3);
    const h2 = Math.floor(remCargo * 0.3);
    const h3 = Math.floor(remCargo * 0.2);
    const h4 = Math.floor(remCargo * 0.1);
    const bulk = Math.floor(remCargo - h1 - h2 - h3 - h4);

    const nextVersion = (flightData.ofp_version || 1) + 1;

    // 解析 Navlog 與 Alternates
    const rawNavlog = sb.navlog?.fix || [];
    const fixArray = Array.isArray(rawNavlog) ? rawNavlog : [rawNavlog];
    const parsedNavlog = fixArray.map((fix: any) => ({
      ident: fix.ident || "UKN",
      time_accum: Math.floor(parseInt(fix.time_total || 0) / 60),
      efob: parseInt(fix.fuel_plan_onboard || 0) / 1000.0
    }));

    const rawAltn = sb.alternate;
    const altnArray = Array.isArray(rawAltn) ? rawAltn : (rawAltn ? [rawAltn] : []);
    const parsedAlternates = altnArray.map((a: any) => ({
      icao: a.icao_code || "N/A",
      burn: parseInt(a.burn || 0) / 1000.0,
      time: Math.floor(parseInt(a.time || 0) / 60),
      notam: "NIL"
    }));

    const updates = {
      route_id: sb.general?.route || "DCT",
      dep_icao: sb.origin?.icao_code || updDep,
      arr_icao: sb.destination?.icao_code || updArr,
      std_z: formatTime(stdUnix) || flightData.std_z,
      sta_z: formatTime(staUnix) || flightData.sta_z,
      std_unix: stdUnix,
      sta_unix: staUnix,
      cruise_alt: sb.general?.initial_altitude || "35000",
      avg_wind: sb.general?.avg_wind_comp || "N/A",
      
      fuel_taxi_ofp: parseInt(sb.fuel?.taxi || 0) / 1000.0,
      fuel_trip_ofp: parseInt(sb.fuel?.enroute_burn || 0) / 1000.0,
      fuel_cont_ofp: parseInt(sb.fuel?.contingency || 0) / 1000.0,
      fuel_altn_ofp: parseInt(sb.fuel?.alternate_burn || 0) / 1000.0,
      fuel_reserve_ofp: parseInt(sb.fuel?.reserve || 0) / 1000.0,
      
      weight_zfw_ofp: parseInt(sb.weights?.est_zfw || 0) / 1000.0,
      weight_tow_ofp: parseInt(sb.weights?.est_tow || 0) / 1000.0,
      weight_lw_ofp: parseInt(sb.weights?.est_ldw || 0) / 1000.0,
      dow: parseInt(sb.weights?.oew || 161968),
      eet_seconds: parseInt(sb.times?.est_time_enroute || 0),
      
      metar_dep: sb.weather?.orig_metar || "NIL",
      metar_arr: sb.weather?.dest_metar || "NIL",
      taf_dep: sb.weather?.orig_taf || "NIL",
      taf_arr: sb.weather?.dest_taf || "NIL",
      
      ofp_telex_text: sb.text?.plan_html || "No briefing HTML available.",
      ofp_version: nextVersion,
      
      cost_index: sb.general?.costindex || "CI 85",
      
      pax_y: paxY,
      pax_j: paxJ,
      pax_f: 0,
      pax_w: 0,
      cargo_bulk: bulk,
      cargo_hold_1: h1,
      cargo_hold_2: h2,
      cargo_hold_3: h3,
      cargo_hold_4: h4,
      
      navlog: parsedNavlog,
      alternates: parsedAlternates,
      
      ezfw_sent: true,
      azf_sent: false,
      prelim_ls_sent: false,
      final_ls_sent: false,
      fuel_receipt_sent: false,
      final_fuel_accepted: false,
      pilots_signed_prelim: false,
      pilots_signed_final: false,
      pilots_signed_fuel: false,
      prelim_ls_rejected: false,
      final_ls_rejected: false
    };

    await updateFlightData(updates);
    setPendingUpdateData(null);
    alert(`✅ Successfully generated OFP V${nextVersion}! Loadsheet and fuel progress have been reset.`);
  };

  if (!flightId) return <div className="p-8 text-red-500">Error: Missing flight ID</div>;
  if (isLoading && !flightData) return <div className="p-8 text-[#00bfa5] animate-pulse font-bold text-xl">Loading IOS Panel...</div>;
  if (!flightData) return <div className="p-8 text-red-500">Flight not found in database.</div>;

  const targetPayload = flightData ? ((flightData.weight_zfw_ofp * 1000) - flightData.dow) : 0;
  const calcPaxWt = (localPayload.j + localPayload.y) * 84;
  const calcCgoWt = localPayload.h1 + localPayload.h2 + localPayload.h3 + localPayload.h4 + localPayload.bulk;
  const calcZfw = flightData ? (flightData.dow + calcPaxWt + calcCgoWt) / 1000.0 : 0;

  const tabs = [
    { id: "Config", icon: "✈️", label: "1. Config" },
    { id: "Payload", icon: "⚖️", label: "2. Payload" },
    { id: "WX", icon: "🌦️", label: "3. WX & NOTAMs" },
    { id: "eTechLog", icon: "🔧", label: "4. eTechLog" },
    { id: "Fuel", icon: "⛽", label: "5. Fuel" }
  ];

  return (
    <div className="h-screen bg-[#080a0d] text-slate-300 font-sans p-6 flex flex-col overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex-none flex justify-between items-center bg-[#11151a] p-4 rounded-xl border-b-[3px] border-[#00bfa5] shadow-md mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#00bfa5] m-0">📡 Instructor Control Panel (IOS)</h2>
          <div className="flex items-center text-[#8fa0a6] text-sm mt-1">
            <span>Session: <strong className="text-white">{flightData.flight_no} ({flightData.aircraft_reg})</strong></span>
            <span className="mx-2">|</span>
            <span>Version: <strong className="text-white">V{flightData.ofp_version || 1}</strong></span>
            <span className="mx-2">|</span>
            <span className="flex items-center text-[#00E676] font-bold">
              <span className="inline-block w-2 h-2 bg-[#00E676] rounded-full mr-2 animate-pulse shadow-[0_0_8px_#00E676]"></span>
              Live DB Sync Active
            </span>
          </div>
        </div>
        <button 
          onClick={() => router.push('/instructor')} 
          className="bg-[#17202a] text-white border border-[#34495e] px-6 py-3 rounded-lg font-bold hover:bg-[#34495e] transition-colors"
        >
          🚪 EXIT SESSION
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* 左側：INBOX & TELEMETRY */}
        <div className="flex-[1.4] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          <h4 className="text-[#00bfa5] font-bold text-lg mb-2">📥 INBOX & TELEMETRY</h4>
          
          <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-4 shadow-sm">
            <div className="text-[#8fa0a6] text-xs font-bold mb-3 uppercase">Trainee Progress</div>
            <div className="flex justify-between border-b border-dashed border-[#242f3d] py-2 text-sm">
              <span>Flight Plan:</span>
              {flightData.activated_version > 0 
                ? <span className="text-[#00E676] font-bold">V{flightData.activated_version} Activated</span> 
                : <span className="text-[#FF9100] font-bold">NOT ACTIVATED</span>}
            </div>
            <div className="flex justify-between border-b border-dashed border-[#242f3d] py-2 text-sm">
              <span>Aircraft Accepted:</span>
              {flightData.tl_accept 
                ? <span className="text-[#00E676] font-bold">YES</span> 
                : <span className="text-[#FF9100] font-bold">PENDING</span>}
            </div>
            <div className="flex justify-between border-b border-dashed border-[#242f3d] py-2 text-sm">
              <span>Final Fuel:</span>
              {flightData.final_fuel_accepted 
                ? <span className="text-[#00E676] font-bold">ACCEPTED ({flightData.trainee_input_zfw || 0}T ZFW)</span> 
                : <span className="text-[#FF9100] font-bold">WAITING</span>}
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span>Loadsheet Status:</span>
              {flightData.final_ls_rejected ? <span className="text-[#FF1744] font-bold">❌ REJECTED (FINAL)</span> :
               flightData.pilots_signed_final ? <span className="text-[#00E676] font-bold">SIGNED (FINAL)</span> :
               flightData.prelim_ls_rejected ? <span className="text-[#FF1744] font-bold">❌ REJECTED (PRELIM)</span> :
               flightData.prelim_ls_sent ? <span className="text-[#FF9100] font-bold">SENT (PRELIM)</span> :
               <span className="text-[#FF9100] font-bold">NO</span>}
            </div>
          </div>

          {(flightData.pdc_requests || []).filter((r:any) => r.status === "PENDING CLEARANCE").map((req:any, i:number) => (
            <div key={i} className="bg-[#11161d] border border-[#FF9100] rounded-xl p-4 shadow-[0_0_10px_rgba(255,145,0,0.15)]">
              <div className="text-[#FF9100] font-bold mb-1">⚠️ PDC REQUEST RECEIVED</div>
              <div className="text-xs text-[#e2e8f0] mb-3">Gate {req.gate} | ATIS {req.atis}</div>
              <textarea 
                className="w-full bg-[#080a0d] border border-[#34495e] rounded-lg p-3 text-[#e2e8f0] text-sm h-32 outline-none focus:border-[#00bfa5] resize-none"
                defaultValue={`${flightData.flight_no.replace(' ', '')} CLRD TO ${flightData.arr_icao} VIA ${flightData.pdc_route || '...'} \nINIT CLIMB ${flightData.pdc_climb || '...'} \nSQUAWK ${flightData.pdc_squawk || '...'} \nDEP FREQ ${flightData.pdc_freq || '...'} \nACKNOWLEDGE ATIS ${req.atis} ON DEPARTURE`}
              ></textarea>
              <button 
                onClick={() => {
                  const updatedPdc = [...flightData.pdc_requests];
                  updatedPdc[i].status = "APPROVED";
                  updateFlightData({ pdc_requests: updatedPdc });
                }}
                className="mt-3 w-full bg-[#00E676]/20 border border-[#00E676] text-[#00E676] py-2 rounded-lg font-bold hover:bg-[#00E676] hover:text-black transition-colors"
              >
                🟢 APPROVE & TRANSMIT PDC
              </button>
            </div>
          ))}

          {(flightData.atis_requests || []).filter((r:any) => r.status === "PENDING RESPONSE").map((req:any, i:number) => (
            <div key={i} className="bg-[#11161d] border border-[#00bfa5] rounded-xl p-4 shadow-[0_0_10px_rgba(0,191,165,0.15)]">
              <div className="text-[#00bfa5] font-bold mb-1">⚠️ ATIS REQUEST</div>
              <div className="text-xs text-[#e2e8f0] mb-3">{req.icao} ({req.type})</div>
              <textarea 
                className="w-full bg-[#080a0d] border border-[#34495e] rounded-lg p-3 text-[#e2e8f0] text-sm h-24 outline-none focus:border-[#00bfa5] resize-none"
                defaultValue={req.type === "DEPARTURE" ? flightData.atis_dep_text : flightData.atis_arr_text}
              ></textarea>
              <button 
                onClick={() => {
                  const updatedAtis = [...flightData.atis_requests];
                  updatedAtis[i].status = "DELIVERED";
                  updateFlightData({ atis_requests: updatedAtis });
                }}
                className="mt-3 w-full bg-[#00bfa5]/20 border border-[#00bfa5] text-[#00bfa5] py-2 rounded-lg font-bold hover:bg-[#00bfa5] hover:text-black transition-colors"
              >
                🟢 SEND ATIS TO COCKPIT
              </button>
            </div>
          ))}
          
          {!(flightData.pdc_requests || []).some((r:any) => r.status === "PENDING CLEARANCE") && 
           !(flightData.atis_requests || []).some((r:any) => r.status === "PENDING RESPONSE") && (
             <div className="bg-[#0a0a0a] border border-[#242f3d] rounded-xl p-4 text-center text-[#8fa0a6] text-sm">
               ✅ No pending Datalink requests.
             </div>
          )}

          <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-4 mt-auto">
            <div className="text-[#8fa0a6] text-xs font-bold mb-3 uppercase">ACARS CHAT INBOX</div>
            <div className="flex flex-col gap-2 mb-4 h-32 overflow-y-auto">
              {(flightData.acars_messages || []).length === 0 ? (
                <span className="text-[#8fa0a6] text-xs italic">No messages yet.</span>
              ) : (
                (flightData.acars_messages || []).slice(-5).map((msg:any, i:number) => (
                  <div key={i} className="text-xs bg-[#080a0d] p-2 rounded border border-[#242f3d]">
                    <span className="text-[#8fa0a6]">[{msg.time}]</span>{' '}
                    <strong className={msg.sender === "DISPATCH" ? "text-[#00bfa5]" : "text-[#e2e8f0]"}>{msg.sender}:</strong>{' '}
                    <span className="text-slate-300">{msg.content}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                id="acars_input"
                placeholder="Send Free Text to Cockpit..." 
                className="flex-1 bg-[#080a0d] border border-[#34495e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00bfa5] text-white" 
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('acars_input') as HTMLInputElement;
                  if (input.value) {
                    const newMsg = { time: "NOW", sender: "DISPATCH", content: input.value };
                    updateFlightData({ acars_messages: [...(flightData.acars_messages || []), newMsg] });
                    input.value = "";
                  }
                }}
                className="bg-[#17202a] border border-[#34495e] text-white px-4 rounded-lg text-sm font-bold hover:border-[#00bfa5] hover:text-[#00bfa5] transition-colors"
              >
                SEND
              </button>
            </div>
          </div>
        </div>

        {/* 右側：TIMELINE & WORKSPACE */}
        <div className="flex-[2.6] bg-[#11161d] border border-[#242f3d] rounded-xl p-6 flex flex-col h-full overflow-hidden">
          <h4 className="text-[#00bfa5] font-bold text-lg mb-6">⏱️ WORKFLOW TIMELINE</h4>
          
          <div className="flex border-b border-[#242f3d] mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === t.id ? "border-b-2 border-[#00bfa5] text-[#00bfa5]" : "text-[#8fa0a6] hover:text-white"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            
            {/* ========================================================= */}
            {/* TAB 1: Config                                               */}
            {/* ========================================================= */}
            {activeTab === "Config" && (
              <div className="animate-fade-in flex flex-col gap-6">
                
                <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-4">
                  <h5 className="text-white font-bold mb-2">📡 Active Flight Plan</h5>
                  <p className="text-[#8fa0a6] text-sm mb-4">Current OFP Version: <strong className="text-white">V{flightData.ofp_version || 1}</strong></p>
                  
                  <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#34495e]">
                    <pre 
                      className="text-xs text-[#e2e8f0] overflow-y-auto max-h-[400px]" 
                      style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "1.3" }}
                      dangerouslySetInnerHTML={{ __html: flightData.ofp_telex_text || "No OFP text available." }}
                    />
                  </div>
                </div>

                <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6">
                  <h5 className="text-white font-bold mb-2">🔄 Update Flight Plan (SimBrief Integration)</h5>
                  <p className="text-[#8fa0a6] text-sm mb-4">Generating a new flight plan will update to <strong className="text-white">V{(flightData.ofp_version || 1) + 1}</strong> and reset loadsheet/fuel statuses.</p>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-1">SimBrief Username</label>
                      <input type="text" value={sbUser} onChange={(e) => setSbUser(e.target.value)} className="w-full bg-[#080a0d] border border-[#34495e] rounded-md p-2 text-white outline-none focus:border-[#00bfa5]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-1">Departure</label>
                        <input type="text" value={updDep} onChange={(e) => setUpdDep(e.target.value.toUpperCase())} className="w-full bg-[#080a0d] border border-[#34495e] rounded-md p-2 text-white outline-none focus:border-[#00bfa5] uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#8fa0a6] uppercase mb-1">Arrival</label>
                        <input type="text" value={updArr} onChange={(e) => setUpdArr(e.target.value.toUpperCase())} className="w-full bg-[#080a0d] border border-[#34495e] rounded-md p-2 text-white outline-none focus:border-[#00bfa5] uppercase" />
                      </div>
                    </div>
                    
                    <a href={getSimbriefUrl()} target="_blank" rel="noreferrer" className="w-full mt-2">
                      <button className="w-full bg-[#17202a] text-white border border-[#34495e] py-3 rounded-lg font-bold hover:bg-[#34495e] transition-colors">
                        1️⃣ ADJUST PARAMETERS & GENERATE ON SIMBRIEF
                      </button>
                    </a>
                    
                    <button 
                      onClick={handleFetchUpdate}
                      disabled={isFetchingUpdate}
                      className={`w-full font-black py-3 rounded-lg transition-all ${
                        isFetchingUpdate 
                          ? "bg-[#34495e] text-[#8fa0a6] cursor-not-allowed" 
                          : "bg-[#00bfa5]/20 border-2 border-[#00bfa5] text-[#00bfa5] hover:bg-[#00bfa5] hover:text-black"
                      }`}
                    >
                      {isFetchingUpdate ? "⏳ FETCHING FROM SIMBRIEF..." : "2️⃣ FETCH FLIGHT PLAN"}
                    </button>
                  </div>
                </div>

                {pendingUpdateData && (
                  <div className="bg-[#11161d] border border-[#00bfa5] rounded-xl p-6 shadow-[0_0_15px_rgba(0,191,165,0.2)] animate-fade-in-up">
                    <h4 className="text-[#00bfa5] font-bold text-xl mb-2">📝 Verify and Upgrade to V{(flightData.ofp_version || 1) + 1}</h4>
                    <p className="text-[#8fa0a6] mb-4">Review the fetched flight plan below before confirming.</p>
                    
                    <div 
                      className="bg-[#0a0a0a] text-[#e2e8f0] p-4 rounded-lg overflow-y-auto max-h-[400px] border border-[#34495e]"
                      style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "13px", lineHeight: "1.3" }}
                      dangerouslySetInnerHTML={{ __html: pendingUpdateData.text?.plan_html || "<p>No briefing HTML available.</p>" }}
                    />

                    <div className="flex gap-4 mt-6">
                      <button 
                        onClick={() => setPendingUpdateData(null)} 
                        className="flex-1 py-4 bg-[#17202a] border border-[#34495e] text-white rounded-lg font-bold hover:bg-[#34495e] transition-colors"
                      >
                        ❌ CANCEL
                      </button>
                      <button 
                        onClick={handleConfirmUpdate}
                        className="flex-1 py-4 bg-[#00bfa5] text-black font-black rounded-lg hover:bg-[#00E676] shadow-[0_0_15px_rgba(0,230,118,0.4)] transition-all"
                      >
                        📤 SEND V{(flightData.ofp_version || 1) + 1}
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: Payload                                              */}
            {/* ========================================================= */}
            {activeTab === "Payload" && (
              <div className="animate-fade-in flex flex-col gap-6">
                
                {flightData.prelim_ls_rejected && (
                  <div className="bg-[#FF1744]/15 border border-[#FF1744] rounded-lg p-4">
                    <h5 className="text-[#FF1744] font-bold m-0">🚨 PRELIM REJECTED BY COMMANDER!</h5>
                    <p className="text-[#e2e8f0] text-sm mt-1 italic">"{flightData.prelim_ls_reject_reason}"</p>
                    <button 
                      onClick={() => updateFlightData({ prelim_ls_rejected: false, prelim_ls_sent: false })}
                      className="mt-3 bg-[#FF1744] text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-600 transition-colors"
                    >
                      🔄 CLEAR REJECTION
                    </button>
                  </div>
                )}

                <div>
                  <h5 className="text-white font-bold mb-2">⚖️ Payload Generator</h5>
                  <div className="flex items-center justify-between bg-[#17202a] p-4 rounded-lg border border-[#242f3d] mb-4">
                    <div>
                      <div className="text-[#8fa0a6] text-xs font-bold uppercase mb-1">Target Payload</div>
                      <div className="text-2xl font-black text-white">{(targetPayload / 1000).toFixed(1)} T</div>
                    </div>
                    <button 
                      onClick={handleAutoPayload}
                      className="bg-[#00bfa5]/20 border border-[#00bfa5] text-[#00bfa5] px-6 py-3 rounded-lg font-bold hover:bg-[#00bfa5] hover:text-black transition-colors"
                    >
                      🎲 AUTO-GENERATE PAYLOAD
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-[#0a0a0a] p-5 rounded-lg border border-[#242f3d]">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="flex justify-between text-xs text-[#8fa0a6] mb-1"><span>Zone J Pax (Max 42)</span> <span>{localPayload.j}</span></label>
                        <input type="range" min="0" max="42" value={localPayload.j} onChange={(e) => setLocalPayload({...localPayload, j: parseInt(e.target.value)})} className="w-full accent-[#00bfa5]" />
                      </div>
                      <div>
                        <label className="flex justify-between text-xs text-[#8fa0a6] mb-1"><span>Zone Y Pax (Max 396)</span> <span>{localPayload.y}</span></label>
                        <input type="range" min="0" max="396" value={localPayload.y} onChange={(e) => setLocalPayload({...localPayload, y: parseInt(e.target.value)})} className="w-full accent-[#00bfa5]" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {['h1', 'h2', 'h3', 'h4', 'bulk'].map((h, i) => (
                        <div key={h} className="flex items-center justify-between bg-[#11161d] px-3 py-1 rounded border border-[#242f3d]">
                          <span className="text-xs text-[#8fa0a6]">{h === 'bulk' ? 'Bulk' : `Hold ${i+1}`} (kg)</span>
                          <input 
                            type="number" 
                            value={(localPayload as any)[h]} 
                            onChange={(e) => setLocalPayload({...localPayload, [h]: parseInt(e.target.value) || 0})}
                            className="bg-transparent border-none text-right text-white w-20 outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="text-xl font-bold text-[#00E676]">Calculated ZFW: {calcZfw.toFixed(1)} T</div>
                    <button 
                      onClick={() => updateFlightData({ pax_j: localPayload.j, pax_y: localPayload.y, cargo_hold_1: localPayload.h1, cargo_hold_2: localPayload.h2, cargo_hold_3: localPayload.h3, cargo_hold_4: localPayload.h4, cargo_bulk: localPayload.bulk })}
                      className="bg-[#17202a] border border-[#34495e] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#34495e] transition-colors"
                    >
                      💾 UPDATE PAYLOAD
                    </button>
                  </div>
                </div>

                <hr className="border-[#242f3d]" />

                <div>
                  <h5 className="text-white font-bold mb-4">📤 Document Dispatch</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onClick={() => updateFlightData({ ezfw_sent: true })} className="bg-[#17202a] border border-[#34495e] text-white py-3 rounded-lg font-bold hover:bg-[#00bfa5] hover:border-[#00bfa5] hover:text-black transition-colors">
                      {flightData.ezfw_sent ? "✅ EZFW SENT" : "TRANSMIT EZFW"}
                    </button>
                    <button onClick={() => updateFlightData({ azf_sent: true })} className="bg-[#17202a] border border-[#34495e] text-white py-3 rounded-lg font-bold hover:bg-[#00bfa5] hover:border-[#00bfa5] hover:text-black transition-colors">
                      {flightData.azf_sent ? "✅ AZF SENT" : "TRANSMIT AZF"}
                    </button>
                    <button onClick={() => updateFlightData({ prelim_ls_sent: true })} className="bg-[#17202a] border border-[#FF9100] text-[#FF9100] py-3 rounded-lg font-bold hover:bg-[#FF9100] hover:text-black transition-colors">
                      {flightData.prelim_ls_sent ? "✅ PRELIM SENT" : "TRANSMIT PRELIM"}
                    </button>
                    <button onClick={() => updateFlightData({ final_ls_sent: true })} className="bg-[#17202a] border border-[#2979FF] text-[#2979FF] py-3 rounded-lg font-bold hover:bg-[#2979FF] hover:text-white transition-colors">
                      {flightData.final_ls_sent ? "✅ FINAL SENT" : "TRANSMIT FINAL"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: WX & NOTAMs                                          */}
            {/* ========================================================= */}
            {activeTab === "WX" && (
              <div className="animate-fade-in flex flex-col gap-6">
                <div>
                  <h5 className="text-white font-bold mb-2">🌦️ Active METAR & TAF</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#242f3d]">
                      <h6 className="text-[#8fa0a6] text-xs font-bold mb-2">DEP: {flightData.dep_icao}</h6>
                      <textarea id="wx_mdep" defaultValue={flightData.metar_dep} className="w-full bg-[#11161d] border border-[#34495e] rounded p-2 text-xs text-[#e2e8f0] h-20 outline-none focus:border-[#00bfa5]" />
                      <textarea id="wx_tdep" defaultValue={flightData.taf_dep} className="w-full bg-[#11161d] border border-[#34495e] rounded p-2 text-xs text-[#e2e8f0] h-24 outline-none focus:border-[#00bfa5] mt-2" />
                    </div>
                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#242f3d]">
                      <h6 className="text-[#8fa0a6] text-xs font-bold mb-2">ARR: {flightData.arr_icao}</h6>
                      <textarea id="wx_marr" defaultValue={flightData.metar_arr} className="w-full bg-[#11161d] border border-[#34495e] rounded p-2 text-xs text-[#e2e8f0] h-20 outline-none focus:border-[#00bfa5]" />
                      <textarea id="wx_tarr" defaultValue={flightData.taf_arr} className="w-full bg-[#11161d] border border-[#34495e] rounded p-2 text-xs text-[#e2e8f0] h-24 outline-none focus:border-[#00bfa5] mt-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-white font-bold mb-2">📢 Active NOTAMs</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#242f3d]">
                      <h6 className="text-[#8fa0a6] text-xs font-bold mb-2">DEP NOTAM: {flightData.dep_icao}</h6>
                      <textarea id="notam_dep" defaultValue={flightData.notam_dep} className="w-full bg-[#11161d] border border-[#34495e] rounded p-2 text-xs text-[#e2e8f0] h-32 outline-none focus:border-[#00bfa5]" />
                    </div>
                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#242f3d]">
                      <h6 className="text-[#8fa0a6] text-xs font-bold mb-2">ARR NOTAM: {flightData.arr_icao}</h6>
                      <textarea id="notam_arr" defaultValue={flightData.notam_arr} className="w-full bg-[#11161d] border border-[#34495e] rounded p-2 text-xs text-[#e2e8f0] h-32 outline-none focus:border-[#00bfa5]" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    updateFlightData({
                      metar_dep: (document.getElementById('wx_mdep') as HTMLTextAreaElement).value,
                      taf_dep: (document.getElementById('wx_tdep') as HTMLTextAreaElement).value,
                      metar_arr: (document.getElementById('wx_marr') as HTMLTextAreaElement).value,
                      taf_arr: (document.getElementById('wx_tarr') as HTMLTextAreaElement).value,
                      notam_dep: (document.getElementById('notam_dep') as HTMLTextAreaElement).value,
                      notam_arr: (document.getElementById('notam_arr') as HTMLTextAreaElement).value,
                    });
                    alert("Weather and NOTAMs saved to EFB!");
                  }}
                  className="w-full bg-[#00bfa5]/20 border-2 border-[#00bfa5] text-[#00bfa5] py-3 rounded-lg font-bold hover:bg-[#00bfa5] hover:text-black transition-all"
                >
                  💾 SAVE & PUBLISH TO EFB
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: eTechLog                                             */}
            {/* ========================================================= */}
            {activeTab === "eTechLog" && (
              <div className="animate-fade-in flex flex-col gap-6">
                
                <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6">
                  <h5 className="text-white font-bold mb-4 flex items-center gap-2">🔧 Maintenance Release Control</h5>
                  
                  <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded border border-[#34495e] mb-4">
                    <div>
                      <div className="text-[#8fa0a6] text-xs font-bold uppercase">Aircraft Status</div>
                      <div className={`text-xl font-black ${flightData.tl_release ? 'text-[#00E676]' : 'text-[#FF1744]'}`}>
                        {flightData.tl_release ? "RELEASED FOR FLIGHT" : "GROUNDED (UNRELEASED)"}
                      </div>
                    </div>
                    <button 
                      onClick={() => updateFlightData({ tl_release: !flightData.tl_release })}
                      className={`px-6 py-3 font-black rounded-lg transition-colors ${
                        flightData.tl_release 
                          ? "bg-[#17202a] text-[#8fa0a6] border border-[#34495e] hover:bg-[#FF1744] hover:text-white" 
                          : "bg-[#00E676] text-black hover:bg-[#00c853] shadow-[0_4px_10px_rgba(0,230,118,0.4)]"
                      }`}
                    >
                      {flightData.tl_release ? "REVOKE RELEASE" : "✅ SIGN RELEASE"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between bg-[#17202a] p-3 rounded">
                      <span className="text-[#8fa0a6]">Crew Acceptance:</span>
                      {flightData.tl_accept ? <span className="text-[#00E676] font-bold">ACCEPTED</span> : <span className="text-[#FF9100] font-bold">WAITING</span>}
                    </div>
                    <div className="flex justify-between bg-[#17202a] p-3 rounded">
                      <span className="text-[#8fa0a6]">Flight Sector:</span>
                      {flightData.tl_flight_started ? <span className="text-[#00bfa5] font-bold">STARTED</span> : <span className="text-[#8fa0a6] font-bold">NOT STARTED</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6">
                  <h5 className="text-[#FF9100] font-bold mb-4">⚠️ Inject Defects (ADD/PMA)</h5>
                  
                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      id="ios_defect_input"
                      placeholder="e.g., ENG 1 BLEED FAULT..." 
                      className="flex-1 bg-[#0a0a0a] border border-[#34495e] rounded-lg p-3 text-white outline-none focus:border-[#FF9100] font-mono text-sm"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('ios_defect_input') as HTMLInputElement;
                        if (input.value.trim()) {
                          const newDefect = {
                            id: `ADD-${Math.floor(Math.random() * 10000)}`,
                            description: input.value.trim(),
                            status: "OPEN",
                            time: new Date().toISOString().substring(11, 16) + "Z"
                          };
                          updateFlightData({ defects: [...(flightData.defects || []), newDefect] });
                          input.value = "";
                        }
                      }}
                      className="bg-[#FF9100] text-black font-black px-6 py-3 rounded-lg hover:bg-[#ffA000] transition-colors"
                    >
                      INJECT
                    </button>
                  </div>

                  <h6 className="text-[#8fa0a6] text-xs font-bold uppercase mb-2">Active Defects</h6>
                  <div className="flex flex-col gap-2">
                    {(!flightData.defects || flightData.defects.length === 0) ? (
                      <div className="text-center text-[#8fa0a6] text-sm italic py-4 bg-[#0a0a0a] rounded border border-[#34495e]">No active defects.</div>
                    ) : (
                      flightData.defects.map((d: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-[#0a0a0a] border border-[#FF9100] rounded p-3">
                          <div>
                            <div className="text-[#FF9100] text-xs font-bold">{d.id} • {d.time}</div>
                            <div className="text-[#e2e8f0] font-mono text-sm">{d.description}</div>
                          </div>
                          <button 
                            onClick={() => {
                              const newDefects = flightData.defects.filter((_:any, index:number) => index !== i);
                              updateFlightData({ defects: newDefects });
                            }}
                            className="bg-[#17202a] text-[#FF1744] border border-[#FF1744] px-3 py-1 rounded text-xs font-bold hover:bg-[#FF1744] hover:text-white transition-colors"
                          >
                            CLEAR
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 5: Fuel                                                 */}
            {/* ========================================================= */}
            {activeTab === "Fuel" && (
              <div className="animate-fade-in">
                <h5 className="text-white font-bold mb-4">⛽ Fuel Supplier Interface</h5>
                
                {!flightData.final_fuel_accepted ? (
                  <div className="bg-[#FF9100]/15 border border-[#FF9100] rounded-xl p-6 text-center">
                    <div className="text-xl mb-2">⏳</div>
                    <h5 className="text-[#FF9100] font-bold">Waiting for Trainee</h5>
                    <p className="text-[#e2e8f0] text-sm">Trainee has not accepted the Final Fuel figure based on AZF yet.</p>
                  </div>
                ) : (
                  <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6">
                    <div className="bg-[#17202a] border-l-4 border-[#FF9100] p-4 rounded mb-6">
                      <span className="text-[#8fa0a6] text-sm font-bold uppercase">Trainee Final Fuel Request</span>
                      <div className="text-3xl font-black text-[#FF9100] mt-1">{flightData.final_fuel_request?.toFixed(1)} T</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-xs text-[#8fa0a6] mb-1">Flight Number</label>
                        <input type="text" disabled value={flightData.flight_no} className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-[#e2e8f0] opacity-70" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#8fa0a6] mb-1">Supplier Code</label>
                        <input type="text" defaultValue="AFSC (HKIA)" className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-[#e2e8f0] outline-none focus:border-[#00bfa5]" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#8fa0a6] mb-1">Fuel Uplifted (Tons)</label>
                        <input id="fuel_uplift" type="number" step="0.1" defaultValue={Math.max(0, flightData.final_fuel_request - 5.0).toFixed(1)} className="w-full bg-[#080a0d] border border-[#34495e] p-2 rounded text-[#e2e8f0] outline-none focus:border-[#00bfa5]" />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const uplift = parseFloat((document.getElementById('fuel_uplift') as HTMLInputElement).value);
                        updateFlightData({ fuel_receipt_sent: true, actual_uplift: uplift });
                      }}
                      className="w-full bg-[#FF9100] text-black font-black py-4 rounded-lg hover:bg-[#ffA000] shadow-[0_4px_10px_rgba(255,145,0,0.3)] transition-all"
                    >
                      🚚 ISSUE FUEL RECEIPT TO COCKPIT
                    </button>
                    
                    {flightData.pilots_signed_fuel && (
                      <div className="mt-4 bg-[#00E676]/20 border border-[#00E676] text-[#00E676] p-4 rounded-lg text-center font-bold">
                        ✅ Captain has digitally signed the Fuel Receipt.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default function IOSPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a0d]"></div>}>
      <IOSPanelContent />
    </Suspense>
  );
}
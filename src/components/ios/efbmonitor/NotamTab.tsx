"use client";
import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦
import { parseNotamPaste } from "@/lib/flight/briefingPaste";

// 🌟 Props 大清洗：剷走晒 flightData 同 updateFlightData
export default function NotamTab() {
  
  // 🌟 從天上直接抽取 Data 同 Update Function (自帶樂觀更新！)
  const { flightData, updateFlightData, updateFlightDataAsync } = useFlightData();

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState("");
  const [notamPaste, setNotamPaste] = useState("");
  const [pasteFeedback, setPasteFeedback] = useState("");

  // 🌟 Enroute Stations 可以成十幾個機場，同 trainee 側 Notam.tsx 一樣預設收埋，
  // 教官想編輯先展開
  const [enrouteExpanded, setEnrouteExpanded] = useState(false);

  // 🌟 防呆保護：未 Load 到 Data 就唔好 Render
  if (!flightData) return null;

  const rawAlternates = flightData?.raw_simbrief?.alternate ? (Array.isArray(flightData.raw_simbrief.alternate) ? flightData.raw_simbrief.alternate : [flightData.raw_simbrief.alternate]) : (flightData?.alternates || []);
  const toffAltn = flightData?.raw_simbrief?.takeoff_altn;
  const rawEnrouteAltn = flightData?.raw_simbrief?.enroute_altn;
  const enrouteAltns = Array.isArray(rawEnrouteAltn) ? rawEnrouteAltn : (rawEnrouteAltn?.icao_code ? [rawEnrouteAltn] : []);
  const enrouteStations = Array.isArray(flightData?.raw_simbrief?.enroute_station) ? flightData.raw_simbrief.enroute_station : [];

  const getNotam = (overrideValue: string | undefined, rawSbArray: any) => {
    if (flightData.notam_source_mode === "INSTRUCTOR") return overrideValue || "";
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawSbArray && Array.isArray(rawSbArray) && rawSbArray.length > 0) {
      return rawSbArray.map((n: any) => n.notam_raw || n.notam_text || String(n)).join('\n\n------------------------------------------------------------\n\n');
    }
    return "";
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setGeneratedResult(""); // 清除舊結果
    
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptType: "NOTAM", 
          plainText: aiPrompt, 
          stdZ: flightData?.std_z || "0000Z", 
          staZ: flightData?.sta_z || "0000Z" 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP Error ${res.status}`);
      }

      setGeneratedResult(data.text);
    } catch (e: any) {
      console.error("AI Generation Failed:", e);
      setGeneratedResult(`❌ ERROR: ${e.message || "Failed to generate NOTAM. Please check API Key or backend logs."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const newAlternates = rawAlternates.map((a: any, i: number) => {
      const existingAlt = (flightData.alternates || [])[i] || { icao: a.icao_code || a.icao, burn: (parseFloat(a.burn) || 0) / 1000.0, time: Math.floor((parseInt(a.time) || 0) / 60) };
      return { ...existingAlt, notam: (document.getElementById(`notam_altn_${i}`) as HTMLTextAreaElement)?.value || "" };
    });

    // 🌟 修復：一定要用 {...existing, notam} 咁樣先寫，唔可以起個全新 object——
    // WxTab.tsx 都會寫緊同一個 enroute_altns/enroute_stations 陣列嘅 metar/taf
    // 欄位，如果呢度淨係起個 {icao, notam} 就save，會靜靜雞抹走 WxTab.tsx 之前
    // 寫低嘅 metar/taf override（同 alternates 已有嘅寫法一致）
    const newEnrouteAltns = enrouteAltns.map((ea: any, i: number) => {
      const existing = (flightData.enroute_altns || [])[i] || { icao: ea.icao_code || ea.icao };
      return { ...existing, notam: (document.getElementById(`notam_enraltn_${i}`) as HTMLTextAreaElement)?.value || "" };
    });

    const newEnrouteStations = enrouteStations.map((s: any, i: number) => {
      const existing = (flightData.enroute_stations || [])[i] || { icao: s.icao_code || s.icao };
      return { ...existing, notam: (document.getElementById(`notam_enr_${i}`) as HTMLTextAreaElement)?.value || "" };
    });

    updateFlightData({
      notam_source_mode: "INSTRUCTOR",
      notam_dep: (document.getElementById('notam_dep') as HTMLTextAreaElement).value || "",
      notam_arr: (document.getElementById('notam_arr') as HTMLTextAreaElement).value || "",
      alternates: newAlternates,
      ...(toffAltn?.icao_code ? {
        notam_toff_altn: (document.getElementById('notam_toffaltn') as HTMLTextAreaElement)?.value || "",
      } : {}),
      enroute_altns: newEnrouteAltns,
      enroute_stations: newEnrouteStations,
    });
    alert("NOTAMs saved and published to EFB!");
  };

  const handleClearAll = () => {
    const clearedAlternates = rawAlternates.map((a: any, i: number) => {
      const existing = (flightData.alternates || [])[i] || { icao: a.icao_code || a.icao };
      return { ...existing, notam: "" };
    });
    const clearedEnrouteAltns = enrouteAltns.map((a: any, i: number) => ({
      ...((flightData.enroute_altns || [])[i] || { icao: a.icao_code || a.icao }),
      notam: "",
    }));
    const clearedEnrouteStations = enrouteStations.map((a: any, i: number) => ({
      ...((flightData.enroute_stations || [])[i] || { icao: a.icao_code || a.icao }),
      notam: "",
    }));
    document.querySelectorAll<HTMLTextAreaElement>('textarea[id^="notam_"]').forEach((el) => { el.value = ""; });
    setNotamPaste("");
    setPasteFeedback("");
    updateFlightData({
      notam_source_mode: "INSTRUCTOR",
      notam_dep: "",
      notam_arr: "",
      alternates: clearedAlternates,
      notam_toff_altn: "",
      enroute_altns: clearedEnrouteAltns,
      enroute_stations: clearedEnrouteStations,
    });
  };

  const handleRestoreSimbrief = async () => {
    setNotamPaste("");
    setPasteFeedback("");
    await updateFlightDataAsync({ notam_source_mode: "SIMBRIEF" });
  };

  const handlePasteImport = () => {
    let blocks;
    try {
      blocks = parseNotamPaste(notamPaste);
    } catch (error) {
      setPasteFeedback(error instanceof Error ? error.message : "Could not parse NOTAM paste.");
      return;
    }

    const sameIcao = (value: unknown, icao: string) => String(value || "").trim().toUpperCase() === icao;
    const fields: Record<string, string> = {};
    const unmatched: string[] = [];
    for (const block of blocks) {
      let id: string | null = null;
      if (block.scope === "dep" && sameIcao(flightData.dep_icao, block.icao)) id = "notam_dep";
      else if (block.scope === "arr" && sameIcao(flightData.arr_icao, block.icao)) id = "notam_arr";
      else if (block.scope === "alt") {
        const index = rawAlternates.findIndex((a: any) => sameIcao(a.icao_code || a.icao, block.icao));
        if (index >= 0) id = "notam_altn_" + index;
      } else if (block.scope === "toff_alt" && sameIcao(toffAltn?.icao_code || toffAltn?.icao, block.icao)) id = "notam_toffaltn";
      else if (block.scope === "enroute_alt") {
        const index = enrouteAltns.findIndex((a: any) => sameIcao(a.icao_code || a.icao, block.icao));
        if (index >= 0) id = "notam_enraltn_" + index;
      } else if (block.scope === "enroute") {
        const index = enrouteStations.findIndex((a: any) => sameIcao(a.icao_code || a.icao, block.icao));
        if (index >= 0) id = "notam_enr_" + index;
      }
      if (!id) {
        unmatched.push(block.scope.toUpperCase() + " " + block.icao);
        continue;
      }
      if (id in fields) {
        setPasteFeedback("Duplicate NOTAM section for " + block.icao + ". Keep one section per airport row.");
        return;
      }
      fields[id] = block.content;
    }

    if (unmatched.length) {
      setPasteFeedback("Airport/category not found in this flight: " + unmatched.join(", "));
      return;
    }

    for (const [id, value] of Object.entries(fields)) {
      const input = document.getElementById(id) as HTMLTextAreaElement | null;
      if (!input) {
        setPasteFeedback("Could not find the matching airport row for " + id + ".");
        return;
      }
      input.value = value;
    }
    setPasteFeedback("Filled " + Object.keys(fields).length + " NOTAM row(s). Review them, then save and publish.");
    setNotamPaste("");
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* AI NOTAM Generator Box */}
      <div className="bg-[#1a1a1a] border-2 border-[#FF9100]/50 rounded-xl p-5 shadow-lg">
        <h5 className="text-[#FF9100] font-black tracking-widest mb-3 uppercase flex items-center gap-2">
          <span>🤖 AI NOTAM Generator</span>
          {isGenerating && <span className="inline-block w-2 h-2 bg-[#FF9100] rounded-full animate-pulse shadow-[0_0_8px_#FF9100]"></span>}
        </h5>
        
        <textarea 
          value={aiPrompt} 
          onChange={e => setAiPrompt(e.target.value)} 
          className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg p-3 text-sm text-white h-20 outline-none focus:border-[#FF9100] mb-3 transition-colors resize-none" 
          placeholder="e.g. RWY 07R closed 0600Z to 1200Z due to maintenance..." 
        />
        
        <button 
          onClick={handleGenerate} 
          disabled={isGenerating} 
          className={`w-full py-3 rounded-lg font-black tracking-widest uppercase transition-all ${
            isGenerating 
              ? "bg-[#FF9100]/20 text-[#FF9100] border border-[#FF9100]/50 cursor-not-allowed" 
              : "bg-[#FF9100] text-black hover:bg-[#FFA000] shadow-[0_0_15px_rgba(255,145,0,0.3)]"
          }`}
        >
          {isGenerating ? "⏳ GENERATING FROM GEMINI..." : "✨ GENERATE ICAO NOTAM"}
        </button>
        
        {generatedResult && (
          <textarea 
            readOnly 
            value={generatedResult} 
            className={`w-full bg-[#0a0a0a] border rounded-lg p-3 text-sm font-mono h-28 mt-4 resize-none ${
              generatedResult.startsWith('❌') ? 'border-[#FF1744] text-[#FF1744]' : 'border-[#00bfa5] text-[#00bfa5]'
            }`} 
          />
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-[#404040] rounded-xl p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={handleClearAll} className="bg-[#FF1744]/20 border border-[#FF1744]/60 text-[#FF6B6B] px-3 py-2 rounded-lg text-xs font-bold">CLEAR ALL & USE INSTRUCTOR NOTAMs</button>
          <button onClick={handleRestoreSimbrief} className="bg-[#333] border border-[#555] text-white px-3 py-2 rounded-lg text-xs font-bold">RESTORE SIMBRIEF NOTAMs</button>
        </div>
        <textarea value={notamPaste} onChange={(e) => setNotamPaste(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg p-3 text-xs text-white h-36 font-mono outline-none focus:border-[#00bfa5]" placeholder={"Paste labeled blocks, e.g. notam_dep (RCTP): ... / notam_arr (VHHH): ... / alt RCKH: ..."} />
        <button onClick={handlePasteImport} className="w-full mt-2 bg-[#00bfa5]/20 border border-[#00bfa5] text-[#00bfa5] py-2 rounded-lg text-xs font-bold">PARSE & FILL NOTAM ROWS</button>
        {pasteFeedback && <div className="text-xs text-[#8fa0a6] mt-2">{pasteFeedback}</div>}
      </div>

      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
        <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Departure: {flightData.dep_icao}</h6>
        <textarea key={flightData.notam_source_mode || "SIMBRIEF"} id="notam_dep" defaultValue={getNotam(flightData.notam_dep, flightData.raw_simbrief?.origin?.notam)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-32 font-mono whitespace-pre-wrap outline-none focus:border-[#00bfa5]" />
      </div>
      
      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
        <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Arrival: {flightData.arr_icao}</h6>
        <textarea key={flightData.notam_source_mode || "SIMBRIEF"} id="notam_arr" defaultValue={getNotam(flightData.notam_arr, flightData.raw_simbrief?.destination?.notam)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-32 font-mono whitespace-pre-wrap outline-none focus:border-[#00bfa5]" />
      </div>

      {rawAlternates.map((a: any, i: number) => (
        <div key={i} className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
          <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Alternate: {a.icao_code || a.icao}</h6>
          <textarea key={flightData.notam_source_mode || "SIMBRIEF"} id={`notam_altn_${i}`} defaultValue={getNotam((flightData.alternates || [])[i]?.notam, a.notam)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-32 font-mono whitespace-pre-wrap outline-none focus:border-[#00bfa5]" />
        </div>
      ))}

      {/* ✈️ Takeoff Alternate NOTAM — 同目的地備降場係唔同概念 */}
      {toffAltn?.icao_code && (
        <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
          <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Takeoff Alternate: {toffAltn.icao_code}</h6>
          <textarea key={flightData.notam_source_mode || "SIMBRIEF"} id="notam_toffaltn" defaultValue={getNotam(flightData.notam_toff_altn, toffAltn.notam)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-32 font-mono whitespace-pre-wrap outline-none focus:border-[#00bfa5]" />
        </div>
      )}

      {/* 🌐 Enroute Alternate NOTAM — ETOPS/EDTO 先會有 */}
      {enrouteAltns.map((ea: any, i: number) => (
        <div key={`enraltn-${i}`} className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
          <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Enroute Alternate: {ea.icao_code || ea.icao}</h6>
          <textarea key={flightData.notam_source_mode || "SIMBRIEF"} id={`notam_enraltn_${i}`} defaultValue={getNotam((flightData.enroute_altns || [])[i]?.notam, ea.notam)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-32 font-mono whitespace-pre-wrap outline-none focus:border-[#00bfa5]" />
        </div>
      ))}

      {/* 🌍 Enroute Stations NOTAM — 可以成十幾個機場，同 trainee 側一樣預設收埋 */}
      {enrouteStations.length > 0 && (
        <div className="bg-[#2a2a2a] rounded-lg border border-[#333333] shadow-md overflow-hidden">
          <button
            onClick={() => setEnrouteExpanded((v) => !v)}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-[#333333] transition-colors outline-none"
          >
            <span className="text-[#00bfa5] text-xs font-black uppercase tracking-widest">
              Enroute Stations ({enrouteStations.length})
            </span>
            <span className={`text-[#8fa0a6] text-xl font-light transform transition-transform duration-200 ${enrouteExpanded ? 'rotate-180' : ''}`}>›</span>
          </button>
          {enrouteExpanded && (
            <div className="p-4 pt-0 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
              {enrouteStations.map((s: any, i: number) => (
                <div key={`enr-${i}`} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]">
                  <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">{s.icao_code || s.icao}</h6>
                  <textarea key={flightData.notam_source_mode || "SIMBRIEF"} id={`notam_enr_${i}`} defaultValue={getNotam((flightData.enroute_stations || [])[i]?.notam, s.notam)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-32 font-mono whitespace-pre-wrap outline-none focus:border-[#00bfa5]" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={handleSave} className="w-full bg-[#C6FF00] text-black py-4 rounded-lg font-black tracking-widest hover:bg-[#00c853] mt-2 shadow-lg">
        💾 SAVE & PUBLISH NOTAMs TO EFB
      </button>
    </div>
  );
}
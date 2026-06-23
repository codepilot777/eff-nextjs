"use client";
import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";

export default function WxTab() {
  const { flightData, updateFlightData } = useFlightData();

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 🌟 升級 1：將單一 Result 拆分做 METAR, TAF 同 Error State
  const [generatedMetar, setGeneratedMetar] = useState("");
  const [generatedTaf, setGeneratedTaf] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // 🌟 升級 2：加入 Copy 狀態管理
  const [copyStatus, setCopyStatus] = useState<"METAR" | "TAF" | null>(null);

  if (!flightData) return null;

  const rawAlternates = flightData?.raw_simbrief?.alternate ? (Array.isArray(flightData.raw_simbrief.alternate) ? flightData.raw_simbrief.alternate : [flightData.raw_simbrief.alternate]) : (flightData?.alternates || []);
  const dateObj = flightData?.std_unix ? new Date(flightData.std_unix * 1000) : new Date();
  const dayStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit' });

  const getWx = (overrideValue: string | undefined, rawValue: string | undefined) => {
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawValue && rawValue !== "NIL") return rawValue;
    return "";
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setErrorMsg("");
    setGeneratedMetar(""); 
    setGeneratedTaf("");
    
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptType: "WX", 
          plainText: aiPrompt, 
          stdZ: flightData?.std_z || "0000Z", 
          staZ: flightData?.sta_z || "0000Z",
          dayStr: dayStr || "01"
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP Error ${res.status}`);
      }
      
      // 🌟 智能分拆器：自動識別 TAF 關鍵字，將生肉完美劏開兩截
      const rawText = data.text || "";
      if (rawText.includes("TAF")) {
        // 利用正則表達式，在 "TAF" 前面切開
        const parts = rawText.split(/(?=TAF\s)/);
        // 清理 METAR 前面的多餘標籤 (如果有)
        setGeneratedMetar(parts[0].replace(/^METAR\s*[:\-]*\s*/i, '').trim());
        setGeneratedTaf(parts[1].trim());
      } else {
        // 如果 AI 只嘔出 METAR
        setGeneratedMetar(rawText.replace(/^METAR\s*[:\-]*\s*/i, '').trim());
      }
      
    } catch (e: any) {
      console.error("AI WX Generation Failed:", e);
      setErrorMsg(`❌ ERROR: ${e.message || "Failed to generate Weather. Please check API Key or backend logs."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 🌟 升級 3：一鍵 Copy 核心邏輯
  const handleCopy = (type: "METAR" | "TAF", text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(null), 2000); // 2 秒後回復原本 icon
  };

  const handleSave = () => {
    const newAlternates = rawAlternates.map((a: any, i: number) => {
      const existingAlt = (flightData.alternates || [])[i] || { icao: a.icao_code || a.icao, burn: (parseFloat(a.burn) || 0) / 1000.0, time: Math.floor((parseInt(a.time) || 0) / 60) };
      return {
        ...existingAlt,
        metar: (document.getElementById(`wx_maltn_${i}`) as HTMLTextAreaElement)?.value || "NIL",
        taf: (document.getElementById(`wx_taltn_${i}`) as HTMLTextAreaElement)?.value || "NIL"
      };
    });
    
    updateFlightData({
      metar_dep: (document.getElementById('wx_mdep') as HTMLTextAreaElement).value || "NIL",
      taf_dep: (document.getElementById('wx_tdep') as HTMLTextAreaElement).value || "NIL",
      metar_arr: (document.getElementById('wx_marr') as HTMLTextAreaElement).value || "NIL",
      taf_arr: (document.getElementById('wx_tarr') as HTMLTextAreaElement).value || "NIL",
      alternates: newAlternates
    });
    alert("Weather saved and published to EFB!");
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      
      {/* 🤖 AI Weather Generator Box */}
      <div className="bg-[#1a1a1a] border-2 border-[#00bfa5]/50 rounded-xl p-5 shadow-lg">
        <h5 className="text-[#00bfa5] font-black tracking-widest mb-3 uppercase flex items-center gap-2">
          <span>🤖 AI Weather Generator</span>
          {isGenerating && <span className="inline-block w-2 h-2 bg-[#00bfa5] rounded-full animate-pulse shadow-[0_0_8px_#00bfa5]"></span>}
        </h5>
        
        <textarea 
          value={aiPrompt} 
          onChange={e => setAiPrompt(e.target.value)} 
          className="w-full bg-[#0a0a0a] border border-[#404040] rounded-lg p-3 text-sm text-white h-20 outline-none focus:border-[#00bfa5] mb-3 transition-colors resize-none" 
          placeholder="e.g. Heavy thunderstorms, visibility 800m, wind 270 at 25 knots gusting 40..." 
        />
        
        <button 
          onClick={handleGenerate} 
          disabled={isGenerating} 
          className={`w-full py-3 rounded-lg font-black tracking-widest uppercase transition-all mb-4 ${
            isGenerating 
              ? "bg-[#00bfa5]/20 text-[#00bfa5] border border-[#00bfa5]/50 cursor-not-allowed" 
              : "bg-[#00bfa5] text-black hover:bg-[#00E676] shadow-[0_0_15px_rgba(0,191,165,0.3)]"
          }`}
        >
          {isGenerating ? "⏳ GENERATING FROM GEMINI..." : "✨ GENERATE METAR & TAF"}
        </button>
        
        {/* ❌ 錯誤信息顯示 */}
        {errorMsg && (
          <div className="w-full bg-[#FF1744]/10 border border-[#FF1744] text-[#FF1744] rounded-lg p-3 text-sm font-mono mt-2">
            {errorMsg}
          </div>
        )}

        {/* 🌟 分拆後的 METAR & TAF 面板 */}
        {(generatedMetar || generatedTaf) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            
            {/* METAR Block */}
            <div className="relative group">
              <span className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1.5 text-[0.65rem] font-bold text-[#00bfa5] tracking-widest uppercase z-10">Generated METAR</span>
              <textarea 
                readOnly 
                value={generatedMetar} 
                className="w-full bg-[#0a0a0a] border border-[#00E676] text-[#00E676] rounded-lg p-4 pt-5 text-xs font-mono h-32 resize-none shadow-inner" 
              />
              <button 
                onClick={() => handleCopy("METAR", generatedMetar)}
                className={`absolute bottom-3 right-3 p-2 rounded-md font-bold text-[0.65rem] uppercase tracking-wider transition-all backdrop-blur-sm border ${
                  copyStatus === "METAR" ? "bg-[#00E676] text-black border-[#00E676]" : "bg-black/60 text-[#00E676] border-[#00E676]/40 hover:bg-[#00E676]/20"
                }`}
              >
                {copyStatus === "METAR" ? "✓ COPIED" : "📋 COPY"}
              </button>
            </div>

            {/* TAF Block */}
            <div className="relative group">
              <span className="absolute -top-2.5 left-3 bg-[#1a1a1a] px-1.5 text-[0.65rem] font-bold text-[#00bfa5] tracking-widest uppercase z-10">Generated TAF</span>
              <textarea 
                readOnly 
                value={generatedTaf} 
                className="w-full bg-[#0a0a0a] border border-[#00E676] text-[#00E676] rounded-lg p-4 pt-5 text-xs font-mono h-32 resize-none shadow-inner" 
              />
              <button 
                onClick={() => handleCopy("TAF", generatedTaf)}
                className={`absolute bottom-3 right-3 p-2 rounded-md font-bold text-[0.65rem] uppercase tracking-wider transition-all backdrop-blur-sm border ${
                  copyStatus === "TAF" ? "bg-[#00E676] text-black border-[#00E676]" : "bg-black/60 text-[#00E676] border-[#00E676]/40 hover:bg-[#00E676]/20"
                }`}
              >
                {copyStatus === "TAF" ? "✓ COPIED" : "📋 COPY"}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* 🛫 Departure WX */}
      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
        <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Departure: {flightData.dep_icao}</h6>
        <textarea id="wx_mdep" defaultValue={getWx(flightData.metar_dep, flightData.raw_simbrief?.origin?.metar)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-20 mb-3 font-mono outline-none focus:border-[#00bfa5] resize-none" placeholder="METAR" />
        <textarea id="wx_tdep" defaultValue={getWx(flightData.taf_dep, flightData.raw_simbrief?.origin?.taf)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-28 font-mono outline-none focus:border-[#00bfa5] resize-none" placeholder="TAF" />
      </div>
      
      {/* 🛬 Arrival WX */}
      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
        <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Arrival: {flightData.arr_icao}</h6>
        <textarea id="wx_marr" defaultValue={getWx(flightData.metar_arr, flightData.raw_simbrief?.destination?.metar)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-20 mb-3 font-mono outline-none focus:border-[#00bfa5] resize-none" placeholder="METAR" />
        <textarea id="wx_tarr" defaultValue={getWx(flightData.taf_arr, flightData.raw_simbrief?.destination?.taf)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-28 font-mono outline-none focus:border-[#00bfa5] resize-none" placeholder="TAF" />
      </div>

      {/* 🔀 Alternates WX */}
      {rawAlternates.map((a: any, i: number) => (
        <div key={i} className="bg-[#2a2a2a] p-4 rounded-lg border border-[#333333] shadow-md">
          <h6 className="text-[#00bfa5] text-xs font-black mb-2 uppercase tracking-widest">Alternate: {a.icao_code || a.icao}</h6>
          <textarea id={`wx_maltn_${i}`} defaultValue={getWx((flightData.alternates || [])[i]?.metar, a.metar)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-20 mb-3 font-mono outline-none focus:border-[#00bfa5] resize-none" placeholder="METAR" />
          <textarea id={`wx_taltn_${i}`} defaultValue={getWx((flightData.alternates || [])[i]?.taf, a.taf)} className="w-full bg-[#0a0a0a] border border-[#404040] rounded p-3 text-xs text-[#e2e8f0] h-28 font-mono outline-none focus:border-[#00bfa5] resize-none" placeholder="TAF" />
        </div>
      ))}

      {/* 💾 Save Button */}
      <button onClick={handleSave} className="w-full bg-[#C6FF00] text-black py-4 rounded-lg font-black tracking-widest hover:bg-[#00c853] mt-2 shadow-lg transition-colors">
        💾 SAVE & PUBLISH WX TO EFB
      </button>
      
    </div>
  );
}
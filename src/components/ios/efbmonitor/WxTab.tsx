"use client";
import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦

// 🌟 Props 大清洗：剷走晒 flightData 同 updateFlightData
export default function WxTab() {
  
  // 🌟 從天上直接抽取 Data 同 Update Function (自帶樂觀更新！)
  const { flightData, updateFlightData } = useFlightData();

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState("");

  // 🌟 防呆保護：未 Load 到 Data 就唔好 Render
  if (!flightData) return null;

  const rawAlternates = flightData?.raw_simbrief?.alternate ? (Array.isArray(flightData.raw_simbrief.alternate) ? flightData.raw_simbrief.alternate : [flightData.raw_simbrief.alternate]) : (flightData?.alternates || []);

  const getWx = (overrideValue: string | undefined, rawValue: string | undefined) => {
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawValue && rawValue !== "NIL") return rawValue;
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
        // 🌟 對應後端的 "WX" promptType
        body: JSON.stringify({ 
          promptType: "WX", 
          plainText: aiPrompt, 
          stdZ: flightData?.std_z || "0000Z", 
          staZ: flightData?.sta_z || "0000Z" 
        })
      });
      
      const data = await res.json();
      
      // 🌟 主動捕捉 HTTP Error
      if (!res.ok) {
        throw new Error(data.error || `HTTP Error ${res.status}`);
      }
      
      setGeneratedResult(data.text);
    } catch (e: any) {
      console.error("AI WX Generation Failed:", e);
      setGeneratedResult(`❌ ERROR: ${e.message || "Failed to generate Weather. Please check API Key or backend logs."}`);
    } finally {
      setIsGenerating(false);
    }
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
          className={`w-full py-3 rounded-lg font-black tracking-widest uppercase transition-all ${
            isGenerating 
              ? "bg-[#00bfa5]/20 text-[#00bfa5] border border-[#00bfa5]/50 cursor-not-allowed" 
              : "bg-[#00bfa5] text-black hover:bg-[#00E676] shadow-[0_0_15px_rgba(0,191,165,0.3)]"
          }`}
        >
          {isGenerating ? "⏳ GENERATING FROM GEMINI..." : "✨ GENERATE METAR & TAF"}
        </button>
        
        {generatedResult && (
          <textarea 
            readOnly 
            value={generatedResult} 
            className={`w-full bg-[#0a0a0a] border rounded-lg p-3 text-sm font-mono h-28 mt-4 resize-none ${
              generatedResult.startsWith('❌') ? 'border-[#FF1744] text-[#FF1744]' : 'border-[#00E676] text-[#00E676]'
            }`} 
          />
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
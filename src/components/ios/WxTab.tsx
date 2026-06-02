"use client";
import { useState } from "react";

export default function WxTab({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState("");

  const rawAlternates = flightData?.raw_simbrief?.alternate ? (Array.isArray(flightData.raw_simbrief.alternate) ? flightData.raw_simbrief.alternate : [flightData.raw_simbrief.alternate]) : (flightData?.alternates || []);

  const getWx = (overrideValue: string | undefined, rawValue: string | undefined) => {
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawValue && rawValue !== "NIL") return rawValue;
    return "";
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: "METAR", plainText: aiPrompt, stdZ: flightData?.std_z || "0000Z", staZ: flightData?.sta_z || "0000Z" })
      });
      const data = await res.json();
      setGeneratedResult(data.text);
    } catch (e) {
      alert("AI Generation Error");
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
      <div className="bg-lido-800 border border-[#333333] rounded-xl p-5 shadow-lg">
        <h5 className="text-status-teal font-bold mb-3">🤖 AI Weather Generator</h5>
        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-lido-950 border border-[#404040] rounded-lg p-3 text-sm text-white h-20 outline-none focus:border-[#00bfa5] mb-3" placeholder="Heavy thunderstorms, visibility 800m..." />
        <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-[#00bfa5]/20 border border-[#00bfa5] text-status-teal py-2 rounded-lg font-bold">{isGenerating ? "⏳ GENERATING..." : "✨ GENERATE METAR / TAF"}</button>
        {generatedResult && <textarea readOnly value={generatedResult} className="w-full bg-[#0a0a0a] border border-[#00bfa5] text-status-teal rounded-lg p-3 text-sm font-mono h-24 mt-4" />}
      </div>

      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
        <h6 className="text-text-muted text-xs font-bold mb-2 uppercase">Departure: {flightData.dep_icao}</h6>
        <textarea id="wx_mdep" defaultValue={getWx(flightData.metar_dep, flightData.raw_simbrief?.origin?.metar)} className="w-full bg-lido-800 border border-[#404040] rounded p-2 text-xs text-white h-20 mb-2 font-mono" placeholder="METAR" />
        <textarea id="wx_tdep" defaultValue={getWx(flightData.taf_dep, flightData.raw_simbrief?.origin?.taf)} className="w-full bg-lido-800 border border-[#404040] rounded p-2 text-xs text-white h-24 font-mono" placeholder="TAF" />
      </div>
      
      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
        <h6 className="text-text-muted text-xs font-bold mb-2 uppercase">Arrival: {flightData.arr_icao}</h6>
        <textarea id="wx_marr" defaultValue={getWx(flightData.metar_arr, flightData.raw_simbrief?.destination?.metar)} className="w-full bg-lido-800 border border-[#404040] rounded p-2 text-xs text-white h-20 mb-2 font-mono" placeholder="METAR" />
        <textarea id="wx_tarr" defaultValue={getWx(flightData.taf_arr, flightData.raw_simbrief?.destination?.taf)} className="w-full bg-lido-800 border border-[#404040] rounded p-2 text-xs text-white h-24 font-mono" placeholder="TAF" />
      </div>

      {rawAlternates.map((a: any, i: number) => (
        <div key={i} className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
          <h6 className="text-text-muted text-xs font-bold mb-2 uppercase">Alternate: {a.icao_code || a.icao}</h6>
          <textarea id={`wx_maltn_${i}`} defaultValue={getWx((flightData.alternates || [])[i]?.metar, a.metar)} className="w-full bg-lido-800 border border-[#404040] rounded p-2 text-xs text-white h-20 mb-2 font-mono" placeholder="METAR" />
          <textarea id={`wx_taltn_${i}`} defaultValue={getWx((flightData.alternates || [])[i]?.taf, a.taf)} className="w-full bg-lido-800 border border-[#404040] rounded p-2 text-xs text-white h-24 font-mono" placeholder="TAF" />
        </div>
      ))}

      <button onClick={handleSave} className="w-full bg-[#00bfa5]/20 border-2 border-[#00bfa5] text-status-teal py-4 rounded-lg font-bold hover:bg-[#00bfa5] hover:text-black">💾 SAVE & PUBLISH WX TO EFB</button>
    </div>
  );
}
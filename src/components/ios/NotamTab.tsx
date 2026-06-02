"use client";
import { useState } from "react";

export default function NotamTab({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState("");

  const rawAlternates = flightData?.raw_simbrief?.alternate ? (Array.isArray(flightData.raw_simbrief.alternate) ? flightData.raw_simbrief.alternate : [flightData.raw_simbrief.alternate]) : (flightData?.alternates || []);

  const getNotam = (overrideValue: string | undefined, rawSbArray: any) => {
    if (overrideValue && overrideValue !== "NIL") return overrideValue;
    if (rawSbArray && Array.isArray(rawSbArray) && rawSbArray.length > 0) {
      return rawSbArray.map((n: any) => n.notam_raw || n.notam_text || String(n)).join('\n\n------------------------------------------------------------\n\n');
    }
    return "";
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: "NOTAM", plainText: aiPrompt, stdZ: flightData?.std_z || "0000Z", staZ: flightData?.sta_z || "0000Z" })
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
      return { ...existingAlt, notam: (document.getElementById(`notam_altn_${i}`) as HTMLTextAreaElement)?.value || "NIL" };
    });

    updateFlightData({
      notam_dep: (document.getElementById('notam_dep') as HTMLTextAreaElement).value || "NIL",
      notam_arr: (document.getElementById('notam_arr') as HTMLTextAreaElement).value || "NIL",
      alternates: newAlternates
    });
    alert("NOTAMs saved and published to EFB!");
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="bg-lido-800 border border-[#333333] rounded-xl p-5 shadow-lg">
        <h5 className="text-[#FF9100] font-bold mb-3">🤖 AI NOTAM Generator</h5>
        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-lido-950 border border-[#404040] rounded-lg p-3 text-sm text-white h-20 outline-none focus:border-[#FF9100] mb-3" placeholder="RWY 07R closed 0600Z to 1200Z..." />
        <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-[#FF9100]/20 border border-[#FF9100] text-[#FF9100] py-2 rounded-lg font-bold">{isGenerating ? "⏳ GENERATING..." : "✨ GENERATE ICAO NOTAM"}</button>
        {generatedResult && <textarea readOnly value={generatedResult} className="w-full bg-[#0a0a0a] border border-[#FF9100] text-[#FF9100] rounded-lg p-3 text-sm font-mono h-24 mt-4" />}
      </div>

      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
        <h6 className="text-text-muted text-xs font-bold mb-2 uppercase">Departure: {flightData.dep_icao}</h6>
        <textarea id="notam_dep" defaultValue={getNotam(flightData.notam_dep, flightData.raw_simbrief?.origin?.notam)} className="w-full bg-lido-800 border border-[#404040] rounded p-3 text-xs text-white h-32 font-mono whitespace-pre-wrap" />
      </div>
      
      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
        <h6 className="text-text-muted text-xs font-bold mb-2 uppercase">Arrival: {flightData.arr_icao}</h6>
        <textarea id="notam_arr" defaultValue={getNotam(flightData.notam_arr, flightData.raw_simbrief?.destination?.notam)} className="w-full bg-lido-800 border border-[#404040] rounded p-3 text-xs text-white h-32 font-mono whitespace-pre-wrap" />
      </div>

      {rawAlternates.map((a: any, i: number) => (
        <div key={i} className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333333]">
          <h6 className="text-text-muted text-xs font-bold mb-2 uppercase">Alternate: {a.icao_code || a.icao}</h6>
          <textarea id={`notam_altn_${i}`} defaultValue={getNotam((flightData.alternates || [])[i]?.notam, a.notam)} className="w-full bg-lido-800 border border-[#404040] rounded p-3 text-xs text-white h-32 font-mono whitespace-pre-wrap" />
        </div>
      ))}

      <button onClick={handleSave} className="w-full bg-[#00bfa5]/20 border-2 border-[#00bfa5] text-status-teal py-4 rounded-lg font-bold hover:bg-[#00bfa5] hover:text-black mt-4">💾 SAVE & PUBLISH NOTAMs TO EFB</button>
    </div>
  );
}
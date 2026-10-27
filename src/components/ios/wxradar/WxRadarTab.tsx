"use client";

import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import { parseSigmetBulletin } from "@/lib/weather/sigmetParser";
import SigmetChart from "@/components/weather/SigmetChart";

// 🌟 教官（或者 Claude 傾好劇本之後）將原始 ICAO SIGMET 電報 paste 落呢度，save
// 落 flightData.scenario_sigmets_raw（受保護欄位，睇 validation.ts）。剩低嗰份
// polygon/時間/移動向量全部即時用 parseSigmetBulletin() 解析，唔使教官手打一次
// 座標；張 schematic chart 都係由呢份解析出嚟嘅資料直接畫，保證永遠同電報文字
// 一致
function SigmetPanel() {
  const { flightData, updateFlightDataAsync } = useFlightData();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  if (!flightData) return null;

  const rawText: string = flightData.scenario_sigmets_raw || "";
  const parsed = parseSigmetBulletin(rawText);

  const startEditing = () => {
    setDraft(rawText);
    setError("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setError("");
    try {
      await updateFlightDataAsync({ scenario_sigmets_raw: draft });
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const draftParsed = isEditing ? parseSigmetBulletin(draft) : parsed;

  return (
    <div className="flex-1 min-w-0 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden flex flex-col">
      <div className="flex-none px-4 py-2 border-b border-[#333] flex items-center justify-between">
        <span className="text-[#00bfa5] font-black text-xs tracking-widest uppercase">⛈️ Scenario SIGMETs</span>
        {!isEditing && (
          <button onClick={startEditing} className="text-[#8fa0a6] hover:text-white text-xs font-bold border border-[#444] rounded-lg px-3 py-1 transition-colors">
            Edit
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <div className="flex-1 min-w-0 p-3 flex flex-col gap-2 overflow-y-auto">
          {error && (
            <div className="bg-[#FF1744]/10 border border-[#FF1744]/50 text-[#FF1744] text-[0.72rem] font-bold rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}

          {isEditing ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={"VHHK SIGMET 4 VALID 270300/270900 VHHK-\nVHHK HONG KONG FIR EMBD TS OBS AT 0230Z\nWI N2054 E11230 - N2212 E11548 - ...\nTOP FL450 MOV WNW 15KT INTSF="}
                className="flex-1 min-h-[180px] bg-[#0a0a0a] border border-[#333] rounded-lg p-3 text-[0.72rem] font-mono text-white resize-none outline-none focus:border-[#00bfa5] transition-colors"
              />
              <div className="text-[#8fa0a6] text-[0.65rem] font-mono">
                {draftParsed.length} SIGMET{draftParsed.length === 1 ? "" : "s"} parsed
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-[0.65rem] font-bold uppercase tracking-widest border border-[#444] rounded-lg text-[#8fa0a6] hover:text-white hover:border-[#666] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-2 text-[0.65rem] font-black uppercase tracking-widest rounded-lg bg-[#00bfa5] text-black hover:bg-[#00a892] transition-colors">
                  Save
                </button>
              </div>
            </>
          ) : parsed.length === 0 ? (
            <div className="text-center text-[#555] text-[0.7rem] font-bold uppercase tracking-widest py-10 leading-relaxed">
              No SIGMETs yet.<br />Tap Edit to paste an ICAO bulletin.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {parsed.map((s) => (
                <div key={`${s.firCode}-${s.sigmetNumber}`} className="bg-[#0a0a0a] border border-[#333] rounded-lg p-2.5">
                  <div className="text-[#00bfa5] font-bold text-[0.7rem] font-mono mb-1">
                    {s.firCode} SIGMET {s.sigmetNumber} · {s.hazard}
                  </div>
                  <pre className="text-[#8fa0a6] text-[0.62rem] font-mono whitespace-pre-wrap leading-snug m-0">{s.rawText}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 border-t md:border-t-0 md:border-l border-[#333] min-h-[260px]">
          <SigmetChart sigmets={draftParsed} />
        </div>
      </div>
    </div>
  );
}

// 🌟 Phase 1：原封不動嵌入 weather_nd_standalone.html（public/weather-nd/index.html）
// 做個 iframe——呢個工具本身純 client-side canvas render，完全唔靠連接任何 sim
// （P3D/PMDG 定係公司 sim 都好），所以無論個 session 用邊種 sim 都用得。Observer
// 自己喺 iframe 入面嘅 Airborne time / typhoon pace 輸入操作，同而家開獨立瀏覽器
// 分頁冇分別，淨係搬咗入 IOS panel 度，唔使再開多個 window。
// Phase 2（之後先做）先會將 core.js 啲 hard-coded constant 换成讀 flightData 嘅
// scenario_sigmets_raw/scenario_airborne_time_z/scenario_aircraft_override，
// 等教官喺 IOS 度做嘅嘢可以直接反映落呢個 iframe，而唔使 Observer 自己手動對齊
export default function WxRadarTab() {
  return (
    <div className="h-full flex flex-col gap-4 md:flex-row">
      <SigmetPanel />

      <div className="flex-1 min-w-0 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden flex flex-col">
        <div className="flex-none px-4 py-2 border-b border-[#333] flex items-center justify-between">
          <span className="text-[#00bfa5] font-black text-xs tracking-widest uppercase">🌩️ Observer Weather Radar (ND)</span>
          <span className="text-[#8fa0a6] text-[0.65rem] font-mono">Phase 1 · standalone, not yet scenario-linked</span>
        </div>
        <iframe
          src="/weather-nd/index.html"
          title="Observer Weather Radar ND"
          className="flex-1 w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}

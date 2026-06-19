"use client";
import { useState } from "react";
import { injectMETAR } from "@/services/weatherService";

export default function EnvironmentalsView({ isConnected, sendToFSUIPC }: any) {
  // 預設一條帶有 CB 雲同雷暴嘅 METAR 字串，GLOB 代表全球覆蓋
  const [customMetar, setCustomMetar] = useState("GLOB 191000Z 09040G60KT 0500 +TSRA BKN010CB 25/24 Q0990");

  // 天氣情景預設庫
  const weatherPresets = [
    { id: "clear", name: "Clear Skies (CAVOK)", icon: "☀️", desc: "Perfect flying conditions", metar: "GLOB 000000Z 00000KT 9999 CAVOK 15/10 Q1013" },
    { id: "fog", name: "CAT III Low Vis (Fog)", icon: "🌫️", desc: "0150 FG VV001", metar: "GLOB 000000Z 00000KT 0150 FG VV001 10/10 Q1013" },
    { id: "storm", name: "Severe TSRA & CB", icon: "🌩️", desc: "Wind 40G60, +TSRA BKN010CB", metar: "GLOB 000000Z 09040G60KT 0500 +TSRA BKN010CB 25/24 Q0990" },
    { id: "crosswind", name: "Gale Crosswind", icon: "💨", desc: "Wind 35G50", metar: "GLOB 000000Z 09035G50KT 9999 SCT030 15/10 Q1013" },
  ];

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      
      {/* 上半部：預設天氣情景 */}
      <div className="flex flex-col gap-3">
        <h4 className="text-[#00bfa5] font-bold font-mono tracking-widest text-sm">WEATHER SCENARIOS</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weatherPresets.map((preset) => (
            <button
              key={preset.id}
              disabled={!isConnected}
              onClick={() => {
                injectMETAR(sendToFSUIPC, preset.metar);
                alert(`🌩️ Injected: ${preset.name}`);
              }}
              className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all active:scale-95 shadow-md ${
                !isConnected 
                  ? "bg-[#222]/30 border-[#333] opacity-30 cursor-not-allowed"
                  : "bg-[#252525] border-[#444] hover:bg-[#333] hover:border-[#00bfa5]"
              }`}
            >
              <span className="text-3xl mb-1">{preset.icon}</span>
              <span className="text-xs font-black uppercase tracking-wider text-white">{preset.name}</span>
              <span className="text-[0.65rem] font-mono text-gray-500">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 下半部：自訂 METAR 注入器 */}
      <div className="flex flex-col gap-3 flex-1">
        <h4 className="text-[#2979FF] font-bold font-mono tracking-widest text-sm">CUSTOM METAR INJECTION</h4>
        <div className="bg-[#151515] p-4 rounded-xl border border-[#2a2a2a] flex flex-col gap-4">
          <p className="text-xs text-gray-400 font-mono">
            Use 'GLOB' for global coverage, or specify ICAO (e.g., 'VHHH'). <br/>
            Include 'CB' in cloud layers to spawn cumulonimbus clouds.
          </p>
          
          <div className="flex gap-3">
            <input 
              type="text" 
              value={customMetar}
              onChange={(e) => setCustomMetar(e.target.value)}
              placeholder="Enter METAR string..."
              className="bg-[#222] border border-[#444] text-white text-sm font-mono p-3 rounded-lg flex-1 focus:outline-none focus:border-[#2979FF] uppercase tracking-wider"
            />
            <button
              disabled={!isConnected || !customMetar}
              onClick={() => {
                injectMETAR(sendToFSUIPC, customMetar);
                alert(`📡 Custom METAR Sent!\n${customMetar}`);
              }}
              className={`px-6 py-3 rounded-lg font-black text-xs tracking-widest uppercase transition-all shadow-md ${
                !isConnected || !customMetar
                  ? "bg-[#333] text-gray-500 cursor-not-allowed"
                  : "bg-[#2979FF] hover:bg-[#2979FF]/80 text-white active:scale-95"
              }`}
            >
              SEND METAR
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
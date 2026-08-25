"use client";

import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";

export default function AtisController() {
  const { flightData, sendFlightDirective } = useFlightData();

  const [atisApt, setAtisApt] = useState(flightData?.dep_icao || "");
  const [atisType, setAtisType] = useState("DEPARTURE");

  if (!flightData) return null;

  const pendingAtis = (flightData?.atis_requests || []).filter((r: any) => r.status !== "DELIVERED");
  // 🌟 Inbox 而家顯示晒 pending + delivered（唔再淨係得 delivered），並且新到舊排（以前
  // 淨係 filter 冇 reverse，最舊嘅喺頂、最新嘅要 scroll 落底先見到，對「比較過往幾份
  // ATIS」嚟講好唔方便）
  const inboxAtis = [...(flightData?.atis_requests || [])].reverse();

  const handleSendAtisReq = async () => {
    try {
      await sendFlightDirective({ atisRequestAppend: { icao: atisApt.toUpperCase(), type: atisType } });
    } catch {
      alert("Failed to send ATIS request");
    }
  };

  return (
    <div className="flex gap-5">
      {/* 左：ATIS Request */}
      <div className="flex-[1] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 shadow-lg flex flex-col">
        <h3 className="text-[#2979FF] text-sm font-black mb-5 uppercase tracking-widest">Request ATIS</h3>
        
        {pendingAtis.length > 0 && (
          <div className="mb-5 bg-[#2979FF]/15 border border-[#2979FF]/30 p-3 rounded-xl flex items-center gap-3">
            <div className="animate-spin text-lg text-[#2979FF]">⏳</div>
            <div className="text-[#2979FF] font-bold text-xs">Requesting D-ATIS...</div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">AIRPORT</label>
              <input type="text" maxLength={4} value={atisApt} onChange={(e) => setAtisApt(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 rounded-lg font-bold uppercase outline-none focus:border-[#2979FF] text-sm transition-colors" />
            </div>
            <div>
              <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">TYPE</label>
              <select value={atisType} onChange={(e) => setAtisType(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 rounded-lg font-bold outline-none focus:border-[#2979FF] appearance-none text-sm cursor-pointer transition-colors">
                <option value="DEPARTURE">DEPARTURE</option>
                <option value="ARRIVAL">ARRIVAL</option>
              </select>
            </div>
          </div>
          <button onClick={handleSendAtisReq} className="w-full py-3 mt-2 bg-[#2979FF] text-white font-black rounded-lg hover:bg-blue-600 shadow-md transition-colors text-xs uppercase tracking-widest">
            Send ATIS Req
          </button>
        </div>
      </div>

      {/* 右：ATIS Inbox */}
      <div className="flex-[1.2] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 shadow-lg flex flex-col">
        <h3 className="text-[#8fa0a6] text-sm font-black mb-5 uppercase tracking-widest">ATIS Inbox</h3>
        
        {inboxAtis.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#555] italic text-sm">No ATIS received</div>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-2">
            {inboxAtis.map((req: any, i: number) => {
              const isDelivered = req.status === "DELIVERED";
              return (
                <div key={i} className={`bg-[#0a0a0a] border rounded-xl p-4 shadow-sm ${isDelivered ? 'border-[#333]' : 'border-[#2979FF]/40'}`}>
                  <div className="text-white font-bold mb-2 flex justify-between text-xs border-b border-[#333] pb-2">
                    <span className="text-[#2979FF]">{req.icao} {req.type}</span>
                    <span className="text-[#8fa0a6]">{req.time}</span>
                  </div>
                  {isDelivered ? (
                    <div className="font-mono text-xs text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                      {req.response || "NO DATA RECEIVED"}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[#2979FF] font-bold">
                      <span className="animate-spin">⏳</span> Awaiting ATIS response...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
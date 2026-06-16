"use client";

import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";

export default function PdcController() {
  const { flightData, updateFlightData } = useFlightData();
  
  const [fac, setFac] = useState("");
  const [atisCd, setAtisCd] = useState("");
  const [gate, setGate] = useState(flightData?.bay_no || "");

  if (!flightData) return null;

  const approvedPdcs = (flightData?.pdc_requests || []).filter((r: any) => r.status === "APPROVED");
  const latestPdc = approvedPdcs.length > 0 ? approvedPdcs[approvedPdcs.length - 1] : null;
  const isPdcAccepted = flightData?.pilots_accepted_pdc || false;
  const hasPendingPdc = (flightData?.pdc_requests || []).some((r: any) => r.status === "PENDING CLEARANCE");

  const handleSendPdcReq = () => {
    if (fac.length !== 4 || atisCd.length !== 1) return alert("Facility must be 4 chars, ATIS must be 1 char.");
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
    const newReq = { time: timeStr, status: "PENDING CLEARANCE", atis: atisCd.toUpperCase(), gate: gate };
    updateFlightData({ pdc_requests: [...(flightData?.pdc_requests || []), newReq] });
  };

  return (
    <div className="flex gap-5">
      {/* 左：PDC 請求 */}
      <div className="flex-[1] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 shadow-lg flex flex-col">
        <h3 className="text-[#FF9100] text-sm font-black mb-5 uppercase tracking-widest">Request PDC</h3>
        
        {hasPendingPdc ? (
          <div className="flex-1 bg-[#FF9100]/15 border border-[#FF9100]/30 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="text-3xl mb-3 animate-spin text-[#FF9100]">⏳</div>
            <h4 className="text-[#FF9100] font-bold text-sm">TRANSMITTED</h4>
            <p className="text-[#8fa0a6] text-xs mt-2">Waiting for ATC...</p>
          </div>
        ) : latestPdc ? (
          <div className="flex-1 bg-[#00E676]/15 border border-[#00E676]/30 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#00E676] flex items-center justify-center text-black font-black mb-3">✓</div>
            <h4 className="text-[#00E676] font-bold text-sm">PDC ACQUIRED</h4>
            <p className="text-[#8fa0a6] text-xs mt-2">Check inbox.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">DEP</label>
                <input type="text" disabled value={flightData?.dep_icao || ''} className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 rounded-lg font-bold text-[#666] text-sm" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">ARR</label>
                <input type="text" disabled value={flightData?.arr_icao || ''} className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 rounded-lg font-bold text-[#666] text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">FACILITY</label>
                <input type="text" maxLength={4} value={fac} onChange={(e) => setFac(e.target.value.toUpperCase())} placeholder="VHHH" className="w-full bg-[#0a0a0a] border border-[#FF9100] text-white px-3 py-2 rounded-lg font-bold uppercase outline-none text-sm transition-colors focus:border-white" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">FLIGHT NO</label>
                <input type="text" disabled value={flightData?.flight_no || ''} className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 rounded-lg font-bold text-[#666] text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">ATIS IDENT</label>
                <input type="text" maxLength={1} value={atisCd} onChange={(e) => setAtisCd(e.target.value.toUpperCase())} placeholder="C" className="w-full bg-[#0a0a0a] border border-[#FF9100] text-white px-3 py-2 rounded-lg font-bold uppercase outline-none text-sm transition-colors focus:border-white" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-[#8fa0a6] font-bold mb-1.5 uppercase">GATE</label>
                <input type="text" value={gate} onChange={(e) => setGate(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 rounded-lg font-bold outline-none focus:border-[#C6FF00] text-sm transition-colors" />
              </div>
            </div>
            <button onClick={handleSendPdcReq} className="w-full py-3 mt-2 bg-[#FF9100] text-black font-black rounded-lg hover:bg-[#ffA000] shadow-md transition-colors text-xs uppercase tracking-widest">
              Send PDC Req
            </button>
          </div>
        )}
      </div>

      {/* 右：PDC Inbox */}
      <div className="flex-[1.2] bg-[#1E1E1E] border border-[#333333] rounded-2xl p-5 shadow-lg flex flex-col">
        <h3 className="text-[#8fa0a6] text-sm font-black mb-5 uppercase tracking-widest">Clearance Inbox</h3>
        {!latestPdc ? (
          <div className="flex-1 flex items-center justify-center text-[#555] italic text-sm">No Clearance Data</div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-[#0a0a0a] p-3 rounded-lg border border-[#333]">
                <div className="text-[#8fa0a6] text-[0.6rem] uppercase font-bold mb-1">Status</div>
                <div className={`font-black text-xs ${isPdcAccepted ? 'text-[#00E676]' : 'text-[#FF9100]'}`}>
                  {isPdcAccepted ? "CLEARED" : "WAITING"}
                </div>
              </div>
              <div className="flex-1 bg-[#0a0a0a] p-3 rounded-lg border border-[#333]">
                <div className="text-[#8fa0a6] text-[0.6rem] uppercase font-bold mb-1">Squawk</div>
                <div className="text-[#00E676] font-mono font-black text-lg leading-none">{flightData?.pdc_squawk || '----'}</div>
              </div>
            </div>
            
            <div className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg p-4 relative overflow-y-auto">
              <div className="text-white font-bold mb-2 text-xs border-b border-[#333] pb-2">PDC @ {latestPdc.time}</div>
              <div className="font-mono text-xs text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {latestPdc.clearance_payload || "NO PAYLOAD DATA"}
              </div>
            </div>

            {!isPdcAccepted && (
              <button 
                onClick={() => updateFlightData({ pilots_accepted_pdc: true })}
                className="w-full py-3 mt-3 bg-[#C6FF00] text-black font-black rounded-lg text-xs uppercase tracking-widest shadow-md hover:bg-[#b0e600] transition-colors"
              >
                Accept Clearance
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
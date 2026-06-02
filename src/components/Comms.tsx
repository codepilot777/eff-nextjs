"use client";

import { useState, useRef, useEffect } from "react";

export default function Comms({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  // ==========================================
  // ACARS 狀態
  // ==========================================
  const [msgInput, setMsgInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messages = flightData?.acars_messages || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTransmitAcars = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
    const newMsg = { time: timeStr, sender: "COCKPIT", content: msgInput.trim() };
    updateFlightData({ acars_messages: [...messages, newMsg] });
    setMsgInput("");
  };

  // ==========================================
  // ATC Datalink 狀態
  // ==========================================
  const [atisApt, setAtisApt] = useState(flightData?.dep_icao || "");
  const [atisType, setAtisType] = useState("DEPARTURE");
  const [fac, setFac] = useState("");
  const [atisCd, setAtisCd] = useState("");
  const [gate, setGate] = useState(flightData?.bay_no || "");

  const approvedPdcs = (flightData?.pdc_requests || []).filter((r: any) => r.status === "APPROVED");
  const latestPdc = approvedPdcs.length > 0 ? approvedPdcs[approvedPdcs.length - 1] : null;
  const isPdcAccepted = flightData?.pilots_accepted_pdc || false;

  const handleSendAtisReq = () => {
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
    const newReq = { id: (flightData?.atis_requests || []).length + 1, icao: atisApt.toUpperCase(), type: atisType, time: timeStr, status: "PENDING RESPONSE" };
    updateFlightData({ atis_requests: [...(flightData?.atis_requests || []), newReq] });
  };

  const handleSendPdcReq = () => {
    if (fac.length !== 4 || atisCd.length !== 1) return alert("Facility must be 4 chars, ATIS must be 1 char.");
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
    const newReq = { time: timeStr, status: "PENDING CLEARANCE", atis: atisCd.toUpperCase(), gate: gate };
    updateFlightData({ pdc_requests: [...(flightData?.pdc_requests || []), newReq] });
  };

  const deliveredAtis = (flightData?.atis_requests || []).filter((r: any) => r.status === "DELIVERED");
  const pendingAtis = (flightData?.atis_requests || []).filter((r: any) => r.status !== "DELIVERED");
  const hasPendingPdc = (flightData?.pdc_requests || []).some((r: any) => r.status === "PENDING CLEARANCE");

  return (
    <div className="h-full w-full flex gap-4 overflow-hidden animate-fade-in">
      
      {/* ========================================== */}
      {/* 欄位 1: ACARS TERMINAL (寬度比例 1.1)        */}
      {/* ========================================== */}
      <div className="flex-[1.1] flex flex-col bg-lido-800 border border-[#333333] rounded-xl overflow-hidden p-5 shrink-0 shadow-lg">
        <h2 className="text-xl font-black text-status-teal mb-4 pb-4 border-b border-[#333333] shrink-0">📟 ACARS TERMINAL</h2>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-muted italic text-sm">No ACARS messages.</div>
          ) : (
            messages.map((msg: any, i: number) => {
              const isCockpit = msg.sender === "COCKPIT";
              return (
                <div key={i} className={`flex flex-col max-w-[85%] ${isCockpit ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-[0.65rem] text-text-muted mb-1 px-1">{msg.time} • {msg.sender}</span>
                  <div className={`px-4 py-2 rounded-lg text-sm ${isCockpit ? 'bg-[#005a54] text-white rounded-br-none' : 'bg-[#1e2a38] text-text-main rounded-bl-none border border-[#404040]'}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="shrink-0 bg-[#0a0a0a] border border-[#404040] rounded-lg p-2 flex flex-col gap-2">
          <input 
            type="text" 
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTransmitAcars()}
            maxLength={160}
            placeholder="Enter free text..." 
            className="w-full bg-transparent text-white border-none outline-none px-2 font-mono text-sm"
          />
          <button 
            onClick={handleTransmitAcars}
            className="bg-[#00bfa5]/20 text-status-teal border border-[#00bfa5] hover:bg-[#00bfa5] hover:text-black font-black w-full py-2 rounded transition-colors text-sm"
          >
            TRANSMIT
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 欄位 2: DATALINK INBOX (寬度比例 1)          */}
      {/* ========================================== */}
      <div className="flex-[1] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
        
        {/* PDC 狀態卡片 */}
        <div className="bg-lido-800 border border-[#333333] rounded-xl p-5 shrink-0 shadow-lg">
          <h3 className="text-text-muted text-xs font-bold uppercase mb-4 border-b border-[#333333] pb-2">ATC Clearance Inbox</h3>
          {!latestPdc ? (
            <div className="text-center text-text-muted italic py-4 text-sm">No ATC Clearance received.</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded border border-[#404040]">
                <span className="text-text-muted font-bold text-sm">PDC Status</span>
                <span className={`font-black px-2 py-1 rounded text-xs ${isPdcAccepted ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]' : 'bg-[#FF9100]/20 text-[#FF9100] border border-[#FF9100]'}`}>
                  {isPdcAccepted ? "CLEARED" : "WAITING CONFIRMATION"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded border border-[#404040]">
                <span className="text-text-muted font-bold text-sm">Squawk Code</span>
                <span className="text-[#00E676] font-mono font-black text-lg tracking-widest">{flightData?.pdc_squawk || '----'}</span>
              </div>
              
              <div className="bg-[#0a0a0a] border border-[#00bfa5] rounded p-4 mt-1 shadow-inner relative">
                <div className="absolute top-0 right-0 bg-[#00bfa5] text-black text-[0.6rem] font-bold px-2 py-0.5 rounded-bl">PRINTOUT</div>
                <h4 className="text-status-teal font-bold mb-3 text-xs border-b border-[#404040] pb-1">📥 PDC RECEIVED AT {latestPdc.time}</h4>
                <div className="font-mono text-xs text-text-main whitespace-pre-wrap leading-relaxed">
                  {latestPdc.clearance_payload || "NO PAYLOAD DATA RECEIVED"}
                </div>
              </div>

              {!isPdcAccepted && (
                <button 
                  onClick={() => updateFlightData({ pilots_accepted_pdc: true })}
                  className="w-full py-3 mt-2 bg-[#00E676] text-black font-black rounded-lg text-sm shadow-[0_4px_10px_rgba(0,230,118,0.4)] hover:bg-[#00c853] transition-colors"
                >
                  ✅ ACCEPT CLEARANCE
                </button>
              )}
            </div>
          )}
        </div>

        {/* ATIS 收件匣 */}
        {deliveredAtis.length > 0 && (
          <div className="bg-lido-800 border border-[#333333] rounded-xl p-5 shrink-0 shadow-lg">
            <h3 className="text-text-muted text-xs font-bold uppercase mb-4 border-b border-[#333333] pb-2">ATIS Inbox</h3>
            <div className="flex flex-col gap-3">
              {deliveredAtis.map((req: any, i: number) => (
                <div key={i} className="bg-[#0a0a0a] border border-[#00bfa5] rounded p-4 shadow-inner relative">
                  <div className="absolute top-0 right-0 bg-[#00bfa5] text-black text-[0.6rem] font-bold px-2 py-0.5 rounded-bl">PRINTOUT</div>
                  <div className="text-status-teal font-bold mb-3 flex justify-between text-xs border-b border-[#404040] pb-1">
                    <span>📥 {req.icao} {req.type}</span>
                    <span className="text-text-muted">{req.time}</span>
                  </div>
                  <div className="font-mono text-xs text-text-main whitespace-pre-wrap leading-relaxed">
                    {req.response || "NO DATA RECEIVED"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 欄位 3: DATALINK REQUESTS (寬度比例 1)       */}
      {/* ========================================== */}
      <div className="flex-[1] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
        
        {/* PDC 請求表單 */}
        <div className="bg-lido-800 border border-[#333333] rounded-xl p-5 shrink-0 shadow-lg">
          <h3 className="text-[#FF9100] text-lg font-black mb-4 flex items-center gap-2">🛫 Request PDC</h3>
          
          {hasPendingPdc ? (
             <div className="bg-[#FF9100]/15 border border-[#FF9100] p-4 rounded-lg text-center">
               <div className="text-2xl mb-2 animate-bounce">⏳</div>
               <h4 className="text-[#FF9100] font-bold text-sm">PDC REQUEST TRANSMITTED</h4>
               <p className="text-text-main text-xs mt-1">Waiting for ATC response...</p>
             </div>
          ) : latestPdc ? (
             <div className="bg-[#00E676]/15 border border-[#00E676] p-4 rounded-lg text-center">
               <div className="text-2xl mb-2">✅</div>
               <h4 className="text-[#00E676] font-bold text-sm">PDC ACQUIRED</h4>
               <p className="text-text-main text-xs mt-1">Check inbox for details.</p>
             </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[0.65rem] text-text-muted font-bold mb-1">DEP</label><input type="text" disabled value={flightData?.dep_icao || ''} className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-text-muted text-sm" /></div>
                <div><label className="block text-[0.65rem] text-text-muted font-bold mb-1">ARR</label><input type="text" disabled value={flightData?.arr_icao || ''} className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-text-muted text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[0.65rem] text-text-muted font-bold mb-1">FACILITY</label><input type="text" maxLength={4} value={fac} onChange={(e) => setFac(e.target.value.toUpperCase())} placeholder="VHHH" className="w-full bg-lido-950 border border-[#FF9100] text-white p-2 rounded font-bold uppercase outline-none text-sm" /></div>
                <div><label className="block text-[0.65rem] text-text-muted font-bold mb-1">FLIGHT NO</label><input type="text" disabled value={flightData?.flight_no || ''} className="w-full bg-[#0a0a0a] border border-[#404040] p-2 rounded font-bold text-text-muted text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[0.65rem] text-text-muted font-bold mb-1">ATIS IDENT</label><input type="text" maxLength={1} value={atisCd} onChange={(e) => setAtisCd(e.target.value.toUpperCase())} placeholder="C" className="w-full bg-lido-950 border border-[#FF9100] text-white p-2 rounded font-bold uppercase outline-none text-sm" /></div>
                <div><label className="block text-[0.65rem] text-text-muted font-bold mb-1">GATE</label><input type="text" value={gate} onChange={(e) => setGate(e.target.value)} className="w-full bg-lido-950 border border-[#404040] text-white p-2 rounded font-bold outline-none focus:border-[#00bfa5] text-sm" /></div>
              </div>
              <button onClick={handleSendPdcReq} className="w-full py-3 mt-1 bg-[#FF9100] text-black font-black rounded-lg hover:bg-[#ffA000] shadow-[0_4px_10px_rgba(255,145,0,0.3)] transition-colors text-sm">
                📡 SEND PDC REQUEST
              </button>
            </div>
          )}
        </div>

        {/* ATIS 請求表單 */}
        <div className="bg-lido-800 border border-[#333333] rounded-xl p-5 shrink-0 shadow-lg">
          <h3 className="text-status-teal text-lg font-black mb-4 flex items-center gap-2">📻 Request ATIS</h3>
          
          {pendingAtis.length > 0 && (
             <div className="mb-4 bg-[#00bfa5]/15 border border-[#00bfa5] p-3 rounded-lg flex items-center gap-3">
               <div className="animate-spin text-lg">⏳</div>
               <div className="text-status-teal font-bold text-xs">Requesting ATIS...</div>
             </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.65rem] text-text-muted font-bold mb-1">AIRPORT</label>
                <input type="text" maxLength={4} value={atisApt} onChange={(e) => setAtisApt(e.target.value.toUpperCase())} className="w-full bg-lido-950 border border-[#404040] text-white p-2 rounded font-bold uppercase outline-none focus:border-[#00bfa5] text-sm" />
              </div>
              <div>
                <label className="block text-[0.65rem] text-text-muted font-bold mb-1">TYPE</label>
                <select value={atisType} onChange={(e) => setAtisType(e.target.value)} className="w-full bg-lido-950 border border-[#404040] text-white p-2 rounded font-bold outline-none focus:border-[#00bfa5] appearance-none text-sm">
                  <option value="DEPARTURE">DEPARTURE</option>
                  <option value="ARRIVAL">ARRIVAL</option>
                </select>
              </div>
            </div>
            <button onClick={handleSendAtisReq} className="w-full py-3 bg-[#00bfa5]/20 text-status-teal border-2 border-[#00bfa5] font-black rounded hover:bg-[#00bfa5] hover:text-black transition-colors text-sm mt-1">
              SEND REQUEST
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
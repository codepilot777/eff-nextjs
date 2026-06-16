"use client";

import { useState, useRef, useEffect } from "react";
import { useFlightData } from "@/hooks/useFlightData"; // 🌟 引入神級大腦

// 🌟 Props 大清洗：唔使再收 flightData 同 updateFlightData
export default function Comms() {
  
  // 🌟 從天上直接抽取 Data 同 Update Function
  const { flightData, updateFlightData } = useFlightData();

  // ==========================================
  // ACARS 狀態
  // ==========================================
  const [msgInput, setMsgInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // ==========================================
  // ATC Datalink 狀態
  // ==========================================
  const [atisApt, setAtisApt] = useState(flightData?.dep_icao || "");
  const [atisType, setAtisType] = useState("DEPARTURE");
  const [fac, setFac] = useState("");
  const [atisCd, setAtisCd] = useState("");
  const [gate, setGate] = useState(flightData?.bay_no || "");

  const messages = flightData?.acars_messages || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 防呆保護：必須放喺所有 Hooks 之後
  if (!flightData) return null;

  const handleTransmitAcars = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
    const newMsg = { time: timeStr, sender: "COCKPIT", content: msgInput.trim() };
    updateFlightData({ acars_messages: [...messages, newMsg] });
    setMsgInput("");
  };

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
    <div className="h-full w-full flex gap-5 overflow-hidden animate-fade-in font-sans p-1">
      
      {/* ========================================== */}
      {/* 欄位 1: ACARS TERMINAL (左側聊天區)          */}
      {/* ========================================== */}
      <div className="flex-[1.1] flex flex-col bg-[#1E1E1E] border border-[#333333] rounded-2xl overflow-hidden p-5 shrink-0 shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#444] flex items-center justify-center text-white">
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
             </div>
             <h2 className="text-xl font-black text-white tracking-widest">ACARS</h2>
          </div>
        </div>
        
        {/* 對話區 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#8fa0a6] italic text-sm">No active company messages.</div>
          ) : (
            messages.map((msg: any, i: number) => {
              const isCockpit = msg.sender === "COCKPIT";
              return (
                <div key={i} className={`flex flex-col max-w-[85%] ${isCockpit ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-[0.65rem] text-[#8fa0a6] mb-1.5 px-1 tracking-wider">{msg.time} • {msg.sender}</span>
                  <div className={`px-4 py-2.5 rounded-xl text-sm font-mono leading-relaxed shadow-sm ${isCockpit ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30 rounded-br-none' : 'bg-[#0a0a0a] text-white rounded-bl-none border border-[#333]'}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 輸入區 */}
        <div className="shrink-0 bg-[#0a0a0a] border border-[#333] rounded-xl p-2 flex flex-col gap-2 shadow-inner">
          <textarea 
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTransmitAcars();
              }
            }}
            maxLength={160}
            rows={2}
            placeholder="Type company message..." 
            className="w-full bg-transparent text-white border-none outline-none px-3 py-2 font-mono text-sm resize-none"
          />
          <button 
            onClick={handleTransmitAcars}
            disabled={!msgInput.trim()}
            className={`w-full py-2.5 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${msgInput.trim() ? 'bg-[#C6FF00] text-black shadow-md hover:bg-[#b0e600]' : 'bg-[#333] text-[#666] cursor-not-allowed'}`}
          >
            Transmit
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 欄位 2 & 3: DATALINK INBOX / REQUESTS      */}
      {/* ========================================== */}
      <div className="flex-[1.5] flex flex-col gap-5 overflow-y-auto pr-2 pb-10">
        
        {/* 上半部：PDC 請求與收件匣並排 */}
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

        {/* 下半部：ATIS 請求與收件匣並排 */}
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
            
            {deliveredAtis.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[#555] italic text-sm">No ATIS received</div>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-2">
                {deliveredAtis.map((req: any, i: number) => (
                  <div key={i} className="bg-[#0a0a0a] border border-[#333] rounded-xl p-4 shadow-sm">
                    <div className="text-white font-bold mb-2 flex justify-between text-xs border-b border-[#333] pb-2">
                      <span className="text-[#2979FF]">{req.icao} {req.type}</span>
                      <span className="text-[#8fa0a6]">{req.time}</span>
                    </div>
                    <div className="font-mono text-xs text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                      {req.response || "NO DATA RECEIVED"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
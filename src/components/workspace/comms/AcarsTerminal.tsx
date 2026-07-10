"use client";

import { useState, useRef, useEffect } from "react";
import { useFlightData } from "@/hooks/useFlightData";

export default function AcarsTerminal() {
  const { flightData, sendFlightDirective } = useFlightData();
  const [msgInput, setMsgInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  if (!flightData) return null;

  const messages = flightData?.acars_messages || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTransmitAcars = async () => {
    const content = msgInput.trim();
    if (!content) return;
    setMsgInput("");
    try {
      await sendFlightDirective({ acarsCockpitAppend: { content } });
    } catch {
      alert("Failed to transmit ACARS message");
    }
  };

  return (
    <div className="flex-[#1.1] flex flex-col bg-[#1E1E1E] border border-[#333333] rounded-2xl overflow-hidden p-5 shrink-0 shadow-xl">
      <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#444] flex items-center justify-center text-white">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
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
  );
}
"use client";

import { useState, useRef, useEffect } from "react";

export default function Acars({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  const [msgInput, setMsgInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const messages = flightData?.acars_messages || [];

  // 自動捲動到最新訊息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTransmit = () => {
    if (!msgInput.trim()) return;
    const now = new Date();
    const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
    
    const newMsg = { time: timeStr, sender: "COCKPIT", content: msgInput.trim() };
    updateFlightData({ acars_messages: [...messages, newMsg] });
    setMsgInput("");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#11161d] border border-[#242f3d] rounded-xl overflow-hidden p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-black text-[#00bfa5] mb-4 pb-4 border-b border-[#242f3d] shrink-0">📟 ACARS COMMUNICATIONS TERMINAL</h2>
      
      {/* 訊息顯示區 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#8fa0a6] italic">No ACARS messages.</div>
        ) : (
          messages.map((msg: any, i: number) => {
            const isCockpit = msg.sender === "COCKPIT";
            return (
              <div key={i} className={`flex flex-col max-w-[80%] ${isCockpit ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-[0.65rem] text-[#8fa0a6] mb-1 px-1">{msg.time} • {msg.sender}</span>
                <div className={`px-4 py-3 rounded-lg text-sm ${isCockpit ? 'bg-[#005a54] text-white rounded-br-none' : 'bg-[#1e2a38] text-[#e2e8f0] rounded-bl-none border border-[#34495e]'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="shrink-0 bg-[#0a0a0a] border border-[#34495e] rounded-lg p-2 flex items-center gap-2">
        <input 
          type="text" 
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTransmit()}
          maxLength={160}
          placeholder="Enter free text message..." 
          className="flex-1 bg-transparent text-white border-none outline-none px-3 font-mono"
        />
        <button 
          onClick={handleTransmit}
          className="bg-[#00bfa5]/20 text-[#00bfa5] border border-[#00bfa5] hover:bg-[#00bfa5] hover:text-black font-black px-6 py-3 rounded transition-colors"
        >
          TRANSMIT
        </button>
      </div>
    </div>
  );
}
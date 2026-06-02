"use client";
import { useState } from "react";

export default function InboxPanel({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  const [isGeneratingAtis, setIsGeneratingAtis] = useState<number | null>(null);

  const generateAtis = async (idx: number, req: any) => {
    setIsGeneratingAtis(idx);
    try {
      const plainText = `Create a realistic ${req.type} ATIS for ${req.icao}. Flight ${flightData?.flight_no || 'CPA564'}.`;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: "ATIS", plainText, stdZ: flightData?.std_z || "0000Z", staZ: flightData?.sta_z || "0000Z" })
      });
      const data = await res.json();
      if (res.ok) {
        const input = document.getElementById(`ios_atis_input_${idx}`) as HTMLTextAreaElement;
        if (input) input.value = data.text;
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("AI Service Error");
    } finally {
      setIsGeneratingAtis(null);
    }
  };

  return (
    <div className="flex-[1.4] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
      <h4 className="text-status-teal font-bold text-lg mb-2">📥 INBOX & TELEMETRY</h4>
      
      <div className="bg-lido-800 border border-[#333333] rounded-xl p-4 shadow-sm">
        <div className="text-text-muted text-xs font-bold mb-3 uppercase">Trainee Progress</div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Flight Plan:</span>
          {flightData.activated_version > 0 ? <span className="text-[#00E676] font-bold">V{flightData.activated_version} Activated</span> : <span className="text-[#FF9100] font-bold">NOT ACTIVATED</span>}
        </div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Aircraft Accepted:</span>
          {flightData.tl_accept ? <span className="text-[#00E676] font-bold">YES</span> : <span className="text-[#FF9100] font-bold">PENDING</span>}
        </div>
        <div className="flex justify-between border-b border-dashed border-[#333333] py-2 text-sm">
          <span>Final Fuel:</span>
          {flightData.final_fuel_accepted ? <span className="text-[#00E676] font-bold">ACCEPTED ({flightData.trainee_input_zfw || 0}T ZFW)</span> : <span className="text-[#FF9100] font-bold">WAITING</span>}
        </div>
        <div className="flex justify-between py-2 text-sm">
          <span>Loadsheet Status:</span>
          {flightData.final_ls_rejected ? <span className="text-[#FF1744] font-bold">❌ REJECTED (FINAL)</span> :
           flightData.pilots_signed_final ? <span className="text-[#00E676] font-bold">SIGNED (FINAL)</span> :
           flightData.prelim_ls_rejected ? <span className="text-[#FF1744] font-bold">❌ REJECTED (PRELIM)</span> :
           flightData.prelim_ls_sent ? <span className="text-[#FF9100] font-bold">SENT (PRELIM)</span> :
           <span className="text-[#FF9100] font-bold">NO</span>}
        </div>
      </div>

      {(flightData.pdc_requests || []).filter((r:any) => r.status === "PENDING CLEARANCE").map((req:any, idx:number) => (
        <div key={`pdc-${idx}`} className="bg-lido-800 border border-[#FF9100] rounded-xl p-4 shadow-[0_0_10px_rgba(255,145,0,0.15)]">
          <div className="text-[#FF9100] font-bold mb-1">⚠️ PDC REQUEST RECEIVED</div>
          <div className="text-xs text-text-main mb-3">Gate {req.gate} | ATIS {req.atis}</div>
          <textarea 
            id={`ios_pdc_input_${idx}`}
            className="w-full bg-lido-950 border border-[#404040] rounded-lg p-3 text-[#00E676] font-mono text-sm h-32 outline-none focus:border-[#00bfa5] resize-none"
            defaultValue={`${flightData.flight_no.replace(' ', '')} CLRD TO ${flightData.arr_icao} VIA ${flightData.pdc_route || '...'}\nINIT CLIMB ${flightData.pdc_climb || '...'}\nSQUAWK ${flightData.pdc_squawk || '...'}\nDEP FREQ ${flightData.pdc_freq || '...'}\nACKNOWLEDGE ATIS ${req.atis} ON DEPARTURE`}
          ></textarea>
          <button 
            onClick={() => {
              const input = document.getElementById(`ios_pdc_input_${idx}`) as HTMLTextAreaElement;
              const updatedPdc = [...flightData.pdc_requests];
              const realIndex = flightData.pdc_requests.findIndex((r:any) => r.time === req.time);
              if(realIndex >= 0) {
                updatedPdc[realIndex].status = "APPROVED";
                updatedPdc[realIndex].clearance_payload = input.value; 
                updateFlightData({ pdc_requests: updatedPdc });
              }
            }}
            className="mt-3 w-full bg-[#00E676]/20 border border-[#00E676] text-[#00E676] py-2 rounded-lg font-bold hover:bg-[#00E676] hover:text-black transition-colors"
          >
            🟢 APPROVE & TRANSMIT PDC
          </button>
        </div>
      ))}

      {(flightData.atis_requests || []).filter((r:any) => r.status === "PENDING RESPONSE").map((req:any, idx:number) => (
        <div key={`atis-${idx}`} className="bg-lido-800 border border-[#00bfa5] rounded-xl p-4 shadow-[0_0_10px_rgba(0,191,165,0.15)]">
          <div className="text-status-teal font-bold mb-1 flex justify-between items-center">
            <span>⚠️ ATIS REQUEST</span>
            <button onClick={() => generateAtis(idx, req)} disabled={isGeneratingAtis === idx} className="text-[0.65rem] bg-[#00bfa5]/20 px-2 py-1 rounded text-status-teal hover:bg-[#00bfa5] hover:text-black transition-colors">
              {isGeneratingAtis === idx ? "⏳" : "✨ AI DRAFT"}
            </button>
          </div>
          <div className="text-xs text-text-main mb-3">{req.icao} ({req.type})</div>
          <textarea 
            id={`ios_atis_input_${idx}`}
            className="w-full bg-lido-950 border border-[#404040] rounded-lg p-3 text-status-teal font-mono text-sm h-24 outline-none focus:border-[#00bfa5] resize-none"
          ></textarea>
          <button 
            onClick={() => {
              const input = document.getElementById(`ios_atis_input_${idx}`) as HTMLTextAreaElement;
              const updatedAtis = [...flightData.atis_requests];
              const realIndex = flightData.atis_requests.findIndex((r:any) => r.time === req.time);
              if(realIndex >= 0) {
                updatedAtis[realIndex].status = "DELIVERED";
                updatedAtis[realIndex].response = input.value;
                updateFlightData({ atis_requests: updatedAtis });
              }
            }}
            className="mt-3 w-full bg-[#00bfa5]/20 border border-[#00bfa5] text-status-teal py-2 rounded-lg font-bold hover:bg-[#00bfa5] hover:text-black transition-colors"
          >
            🟢 SEND ATIS TO COCKPIT
          </button>
        </div>
      ))}

      <div className="bg-lido-800 border border-[#333333] rounded-xl p-4 mt-auto">
        <div className="text-text-muted text-xs font-bold mb-3 uppercase">ACARS CHAT INBOX</div>
        <div className="flex flex-col gap-2 mb-4 h-32 overflow-y-auto">
          {(flightData.acars_messages || []).length === 0 ? (
            <span className="text-text-muted text-xs italic">No messages yet.</span>
          ) : (
            (flightData.acars_messages || []).slice(-5).map((msg:any, i:number) => (
              <div key={i} className="text-xs bg-lido-950 p-2 rounded border border-[#333333]">
                <span className="text-text-muted">[{msg.time}]</span> <strong className={msg.sender === "DISPATCH" ? "text-status-teal" : "text-text-main"}>{msg.sender}:</strong> <span className="text-slate-300">{msg.content}</span>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" id="acars_input" placeholder="Send Free Text..." 
            className="flex-1 bg-lido-950 border border-[#404040] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00bfa5] text-white" 
          />
          <button 
            onClick={() => {
              const input = document.getElementById('acars_input') as HTMLInputElement;
              if (input.value) {
                const newMsg = { time: "NOW", sender: "DISPATCH", content: input.value };
                updateFlightData({ acars_messages: [...(flightData.acars_messages || []), newMsg] });
                input.value = "";
              }
            }}
            className="bg-lido-800 border border-[#404040] text-white px-4 rounded-lg text-sm font-bold hover:border-[#00bfa5] hover:text-status-teal transition-colors"
          >SEND</button>
        </div>
      </div>
    </div>
  );
}
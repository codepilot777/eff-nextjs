"use client";
import { useState, useEffect } from "react";

export default function PayloadTab({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  const [localPayload, setLocalPayload] = useState({ j: 0, y: 0, h1: 0, h2: 0, h3: 0, h4: 0, bulk: 0 });

  useEffect(() => {
    if (flightData && localPayload.j === 0 && localPayload.y === 0) {
      setLocalPayload({
        j: flightData.pax_j || 0, y: flightData.pax_y || 0,
        h1: flightData.cargo_hold_1 || 0, h2: flightData.cargo_hold_2 || 0,
        h3: flightData.cargo_hold_3 || 0, h4: flightData.cargo_hold_4 || 0, bulk: flightData.cargo_bulk || 0
      });
    }
  }, [flightData]);

  const targetPayload = flightData ? ((flightData.weight_zfw_ofp * 1000) - flightData.dow) : 0;
  const calcPaxWt = (localPayload.j + localPayload.y) * 84;
  const calcCgoWt = localPayload.h1 + localPayload.h2 + localPayload.h3 + localPayload.h4 + localPayload.bulk;
  const calcZfw = flightData ? (flightData.dow + calcPaxWt + calcCgoWt) / 1000.0 : 0;

  const handleAutoPayload = () => {
    let paxTotal = Math.floor(targetPayload / 104);
    if (paxTotal > 438) paxTotal = 438;
    const j = Math.min(42, Math.floor(paxTotal * 0.1));
    const y = paxTotal - j;
    
    let remCargo = targetPayload - (paxTotal * 84);
    if (remCargo < 0) remCargo = 0;
    
    const h1 = Math.floor(remCargo * 0.3);
    const h2 = Math.floor(remCargo * 0.3);
    const h3 = Math.floor(remCargo * 0.2);
    const h4 = Math.floor(remCargo * 0.1);
    const bulk = Math.floor(remCargo - h1 - h2 - h3 - h4);
    
    setLocalPayload({ j, y, h1, h2, h3, h4, bulk });
    updateFlightData({ pax_j: j, pax_y: y, cargo_hold_1: h1, cargo_hold_2: h2, cargo_hold_3: h3, cargo_hold_4: h4, cargo_bulk: bulk });
  };

  const handleTransmitLoadsheet = (docType: string) => {
    const updates: any = {
      pax_j: localPayload.j, pax_y: localPayload.y,
      cargo_hold_1: localPayload.h1, cargo_hold_2: localPayload.h2,
      cargo_hold_3: localPayload.h3, cargo_hold_4: localPayload.h4, cargo_bulk: localPayload.bulk
    };
    if (docType === "EZFW") updates.ezfw_sent = true;
    if (docType === "AZF") updates.azf_sent = true;
    if (docType === "PRELIM") updates.prelim_ls_sent = true;
    if (docType === "FINAL") updates.final_ls_sent = true;
    updateFlightData(updates);
    alert(`${docType} transmitted!`);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {flightData.prelim_ls_rejected && (
        <div className="bg-[#FF1744]/15 border border-[#FF1744] rounded-lg p-4">
          <h5 className="text-[#FF1744] font-bold m-0">🚨 PRELIM REJECTED BY COMMANDER!</h5>
          <p className="text-text-main text-sm mt-1">"{flightData.prelim_ls_reject_reason}"</p>
          <button onClick={() => updateFlightData({ prelim_ls_rejected: false, prelim_ls_sent: false })} className="mt-3 bg-[#FF1744] text-white px-4 py-2 rounded font-bold text-sm">🔄 CLEAR REJECTION</button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between bg-lido-800 p-4 rounded-lg border border-[#333333] mb-4">
          <div><div className="text-text-muted text-xs font-bold uppercase mb-1">Target Payload</div><div className="text-2xl font-black text-white">{(targetPayload / 1000).toFixed(1)} T</div></div>
          <button onClick={handleAutoPayload} className="bg-[#00bfa5]/20 border border-[#00bfa5] text-status-teal px-6 py-3 rounded-lg font-bold">🎲 AUTO-GENERATE</button>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-[#0a0a0a] p-5 rounded-lg border border-[#333333]">
          <div className="flex flex-col gap-4">
            <div><label className="flex justify-between text-xs text-text-muted mb-1"><span>Zone J Pax (Max 42)</span> <span>{localPayload.j}</span></label><input type="range" min="0" max="42" value={localPayload.j} onChange={(e) => setLocalPayload({...localPayload, j: parseInt(e.target.value)})} className="w-full accent-[#00bfa5]" /></div>
            <div><label className="flex justify-between text-xs text-text-muted mb-1"><span>Zone Y Pax (Max 396)</span> <span>{localPayload.y}</span></label><input type="range" min="0" max="396" value={localPayload.y} onChange={(e) => setLocalPayload({...localPayload, y: parseInt(e.target.value)})} className="w-full accent-[#00bfa5]" /></div>
          </div>
          <div className="flex flex-col gap-3">
            {['h1', 'h2', 'h3', 'h4', 'bulk'].map((h, i) => (
              <div key={h} className="flex items-center justify-between bg-lido-800 px-3 py-1 rounded border border-[#333333]">
                <span className="text-xs text-text-muted">{h === 'bulk' ? 'Bulk' : `Hold ${i+1}`} (kg)</span>
                <input type="number" value={(localPayload as any)[h]} onChange={(e) => setLocalPayload({...localPayload, [h]: parseInt(e.target.value) || 0})} className="bg-transparent border-none text-right text-white w-20 outline-none text-sm" />
              </div>
            ))}
          </div>
        </div>
        <div className="text-xl font-bold text-[#00E676] mt-4 text-right">Calculated ZFW: {calcZfw.toFixed(1)} T</div>
      </div>

      <div>
        <h5 className="text-white font-bold mb-4">📤 Document Dispatch</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => handleTransmitLoadsheet("EZFW")} className="bg-lido-800 border border-[#404040] text-white py-3 rounded-lg font-bold">TRANSMIT EZFW</button>
          <button onClick={() => handleTransmitLoadsheet("AZF")} className="bg-lido-800 border border-[#404040] text-white py-3 rounded-lg font-bold">TRANSMIT AZF</button>
          <button onClick={() => handleTransmitLoadsheet("PRELIM")} className="bg-lido-800 border border-[#FF9100] text-[#FF9100] py-3 rounded-lg font-bold">TRANSMIT PRELIM</button>
          <button onClick={() => handleTransmitLoadsheet("FINAL")} className="bg-lido-800 border border-[#2979FF] text-[#2979FF] py-3 rounded-lg font-bold">TRANSMIT FINAL</button>
        </div>
      </div>
    </div>
  );
}
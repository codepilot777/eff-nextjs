"use client";

import { useState } from "react";

export default function TechLogHistory() {
  const [selectedHist, setSelectedHist] = useState<number | null>(1);

  const historyRecords = [
    { id: 1, date: "20-MAY-2026", flt: "CX881", route: "LAX ➔ HKG", cmdr: "HO W S", fuelArr: "10.5", fuelUp: "85.0", checks: ["Transit Check"], serv: ["Toilet serviced"], def: [{sys: "CABIN", desc: "Toilet F INOP.", status: "OPEN"}] },
    { id: 2, date: "21-MAY-2026", flt: "CX880", route: "HKG ➔ LAX", cmdr: "HO W S", fuelArr: "13.0", fuelUp: "95.0", checks: ["Weekly Check"], serv: ["Hydraulic C +0.5 Qts"], def: [] },
    { id: 3, date: "22-MAY-2026", flt: "CX714", route: "SIN ➔ HKG", cmdr: "LEE C K", fuelArr: "6.8", fuelUp: "25.0", checks: ["Transit Check"], serv: [], def: [] },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-[3] bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 shadow-lg overflow-y-auto flex flex-col gap-2">
          {historyRecords.map(r => (
            <button key={r.id} onClick={() => setSelectedHist(r.id)} className={`text-left p-3 rounded-lg border transition-colors ${selectedHist === r.id ? 'bg-[#1a1a1a] border-[#00bfa5]' : 'bg-[#0a0a0a] border-[#333333]'}`}>
              <div className="text-xs text-[#8fa0a6] font-bold">{r.date}</div>
              <div className="text-[#00E676] font-black">{r.flt}</div>
              <div className="text-xs text-white">{r.route}</div>
            </button>
          ))}
        </div>
        <div className="flex-[7] bg-[#2a2a2a] border border-[#333333] rounded-xl p-6 shadow-lg overflow-y-auto">
          {selectedHist && historyRecords.filter(r => r.id === selectedHist).map(detail => (
            <div key={detail.id}>
              <h3 className="text-3xl font-black text-[#00bfa5] border-b border-[#333333] pb-4 mb-6">Flight {detail.flt} Details</h3>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-[#0a0a0a] p-4 rounded-lg"><h4 className="text-[#00bfa5] font-bold mb-2">👨‍✈️ Commander</h4><div className="text-white font-bold">{detail.cmdr}</div></div>
                <div className="bg-[#0a0a0a] p-4 rounded-lg"><h4 className="text-[#00bfa5] font-bold mb-2">⛽ Fuel Records</h4><div className="text-[#00E676] font-bold text-xs">Arrival: {detail.fuelArr} T | Uplift: {detail.fuelUp} T</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
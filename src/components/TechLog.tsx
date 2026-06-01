"use client";

import { useState } from "react";

export default function TechLog({ flightData, updateFlightData }: { flightData: any, updateFlightData: any }) {
  const [newDefect, setNewDefect] = useState("");

  const isReleased = flightData?.tl_release || false;
  const isAccepted = flightData?.tl_accept || false;
  const isStarted = flightData?.tl_flight_started || false;
  const defects = flightData?.defects || [];

  const handleAddDefect = () => {
    if (!newDefect.trim()) return;
    const defectObj = {
      id: `ADD-${Math.floor(Math.random() * 10000)}`,
      description: newDefect,
      status: "OPEN",
      time: new Date().toISOString().substring(11, 16) + "Z"
    };
    updateFlightData({ defects: [...defects, defectObj] });
    setNewDefect("");
  };

  return (
    <div className="h-full w-full flex gap-4 overflow-hidden">
      
      {/* 左側：狀態與簽收動作 */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
        
        {/* 飛機狀態卡片 */}
        <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6 shrink-0 shadow-lg">
          <h2 className="text-2xl font-black text-[#00bfa5] mb-2 border-b border-[#242f3d] pb-4">📋 eTechLog Status</h2>
          
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-between items-center bg-[#0a0a0a] p-4 rounded border border-[#34495e]">
              <span className="text-[#8fa0a6] font-bold">Maintenance Release</span>
              <span className={`font-black px-3 py-1 rounded ${isReleased ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]' : 'bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]'}`}>
                {isReleased ? "RELEASED" : "AWAITING RELEASE"}
              </span>
            </div>
            
            <div className="flex justify-between items-center bg-[#0a0a0a] p-4 rounded border border-[#34495e]">
              <span className="text-[#8fa0a6] font-bold">Commander Acceptance</span>
              <span className={`font-black px-3 py-1 rounded ${isAccepted ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]' : 'bg-[#FF9100]/20 text-[#FF9100] border border-[#FF9100]'}`}>
                {isAccepted ? "ACCEPTED" : "PENDING SIGNATURE"}
              </span>
            </div>
          </div>
        </div>

        {/* 簽收與流程按鈕 */}
        <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6 shrink-0">
          <h3 className="text-[#8fa0a6] text-xs font-bold uppercase mb-4">Actions</h3>
          
          <div className="flex flex-col gap-4">
            <button 
              disabled={!isReleased || isAccepted}
              onClick={() => updateFlightData({ tl_accept: true })}
              className={`w-full py-4 font-black rounded-lg transition-colors ${
                isAccepted 
                  ? "bg-[#34495e] text-[#8fa0a6] cursor-not-allowed" 
                  : !isReleased 
                    ? "bg-[#17202a] text-[#8fa0a6] border border-[#34495e] cursor-not-allowed" 
                    : "bg-[#00E676] text-black hover:bg-[#00c853] shadow-[0_4px_10px_rgba(0,230,118,0.4)]"
              }`}
            >
              {isAccepted ? "✅ AIRCRAFT ACCEPTED" : "🖊️ ACCEPT AIRCRAFT"}
            </button>

            <button 
              disabled={!isAccepted || isStarted}
              onClick={() => updateFlightData({ tl_flight_started: true })}
              className={`w-full py-4 font-black rounded-lg transition-colors ${
                isStarted 
                  ? "bg-[#00bfa5]/20 text-[#00bfa5] border border-[#00bfa5]" 
                  : !isAccepted 
                    ? "bg-[#17202a] text-[#8fa0a6] border border-[#34495e] cursor-not-allowed" 
                    : "bg-[#00bfa5] text-black hover:bg-[#00a896] shadow-[0_4px_10px_rgba(0,191,165,0.4)]"
              }`}
            >
              {isStarted ? "✈️ SECTOR STARTED" : "▶️ START FLIGHT SECTOR"}
            </button>
            
            {(!isReleased) && (
               <div className="text-center text-[#FF1744] text-xs font-bold animate-pulse mt-2">
                 Waiting for Maintenance (IOS) to release the aircraft.
               </div>
            )}
          </div>
        </div>
      </div>

      {/* 右側：Defects (壞件紀錄) */}
      <div className="flex-[1.5] flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
        <div className="bg-[#11161d] border border-[#242f3d] rounded-xl p-6 h-full flex flex-col">
          <h3 className="text-[#FF9100] text-xl font-black mb-4 flex items-center gap-2 border-b border-[#242f3d] pb-4">
            <span className="text-2xl">🔧</span> Acceptable Deferred Defects (ADD)
          </h3>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 mb-4">
            {defects.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#00E676] font-bold text-lg border-2 border-dashed border-[#00E676] rounded-xl bg-[#00E676]/5">
                ✅ NIL DEFECTS. AIRCRAFT SERVICEABLE.
              </div>
            ) : (
              defects.map((d: any, i: number) => (
                <div key={i} className="bg-[#0a0a0a] border border-[#FF9100] rounded-lg p-4 relative">
                  <div className="absolute top-0 right-0 bg-[#FF9100] text-black text-[0.6rem] font-black px-2 py-1 rounded-bl-lg rounded-tr-lg">
                    {d.status}
                  </div>
                  <div className="text-[#FF9100] font-bold text-sm mb-1">{d.id} • {d.time}</div>
                  <div className="text-[#e2e8f0] font-mono text-sm">{d.description}</div>
                </div>
              ))
            )}
          </div>

          {/* 新增 Defect 表單 */}
          <div className="shrink-0 bg-[#0a0a0a] border border-[#34495e] rounded-lg p-2 flex items-center gap-2">
            <input 
              type="text" 
              value={newDefect}
              onChange={(e) => setNewDefect(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDefect()}
              placeholder="Log new defect or observation..." 
              className="flex-1 bg-transparent text-white border-none outline-none px-3 font-mono text-sm"
            />
            <button 
              onClick={handleAddDefect}
              className="bg-[#17202a] text-[#e2e8f0] border border-[#34495e] hover:border-[#00bfa5] hover:text-[#00bfa5] font-bold px-4 py-2 rounded transition-colors text-sm"
            >
              LOG DEFECT
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
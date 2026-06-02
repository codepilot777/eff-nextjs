"use client";

export default function TechLogLeftPanel({ tlData, roleMode, setActiveTask, setSelectedEntry, updateTechLogData, defects }: any) {
  const {
    tl_prepared: isPrepared,
    tl_fuel_record_completed: isFuelDone,
    tl_accept: isAccepted,
    tl_flight_started: isStarted,
    tl_fluids: isFluids,
    tl_checks: isChecks,
    tl_defects: isDefects,
    tl_release: isReleased,
  } = tlData;

  const openEntries = defects.filter((d: any) => d.status === "OPEN");
  const paddEntries = defects.filter((d: any) => d.deferral_type === "PADD" || (d.status === "DEFERRED" && d.deferral_type === "PADD"));
  const saddEntries = defects.filter((d: any) => d.deferral_type === "SADD" || (d.status === "DEFERRED" && d.deferral_type === "SADD"));
  const addEntries = defects.filter((d: any) => d.deferral_type === "ADD" || (d.status === "DEFERRED" && d.deferral_type === "ADD"));

  return (
    <div className="flex-[4] flex flex-col gap-4 overflow-y-auto pr-2">
      <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 shadow-lg">
        <h4 className="text-[#00bfa5] font-bold mb-3 border-b border-[#333333] pb-2">Servicing Summary</h4>
        <div className="text-sm mb-2"><span className="text-[#8fa0a6] font-bold">EDTO transit:</span> <span className={`font-bold ${isChecks ? 'text-[#00E676]' : 'text-[#FF9100]'}`}>{isChecks ? 'Completed' : 'Required'}</span></div>
        <div className="text-sm mb-2"><span className="text-[#8fa0a6] font-bold">Daily Check:</span> <span className="text-white font-bold">{isChecks ? '24h 00m remaining' : '0h 45m remaining'}</span></div>
        <div className="text-sm mb-4"><span className="text-[#8fa0a6] font-bold">Weekly Check:</span> <span className="text-white font-bold">{isChecks ? '7d 00m remaining' : '4d 12h remaining'}</span></div>
        
        {roleMode === "ENGINEER" && !isChecks && (
          <button onClick={() => setActiveTask("maint_check")} className="w-full py-2 bg-[#2a2a2a] border border-[#404040] text-white rounded font-bold hover:bg-[#404040] text-sm">🔧 Maintenance Check</button>
        )}
        <div className="mt-4 bg-[#1a1a1a] border border-[#FF9100] rounded p-2 text-xs text-[#e2e8f0]">
          <strong className="text-[#FF9100]">Notices to Crew:</strong><br/>
          ⚠️ [MSG 01] EXTRA POTABLE WATER UPLIFT REQUIRED.
        </div>
      </div>

      {(!isStarted || roleMode === "ENGINEER") && (
        <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-4 shadow-lg">
          <h4 className="text-[#00bfa5] font-bold mb-3 border-b border-[#333333] pb-2">Tasks</h4>
          {roleMode === "FLIGHT CREW" ? (
            !isPrepared ? (
              <button onClick={() => setActiveTask("prepare")} className="w-full py-3 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040]">Prepare flight</button>
            ) : !isFuelDone ? (
              <button onClick={() => setActiveTask("fuel_record")} className="w-full py-3 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040]">Fuel Record</button>
            ) : !isAccepted ? (
              <>
                <button onClick={() => setActiveTask("acceptance")} className="w-full py-3 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040] mb-2">Commander's Acceptance</button>
                <button onClick={() => { updateTechLogData({tl_prepared: false, tl_fuel_record_completed: false, tl_accept: false}); setActiveTask(null); }} className="w-full py-2 bg-[#FF1744]/10 border border-[#FF1744] text-[#FF1744] text-xs font-bold rounded">Cancel Prepared Flight</button>
              </>
            ) : (
              <div className="text-center text-status-green font-bold text-xs p-2 border border-dashed border-status-green rounded">AWAITING ENGINE START</div>
            )
          ) : (
            <>
              {!isFluids && <button onClick={() => setActiveTask("fluids_uplift")} className="w-full py-2 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040] mb-2">💧 Fluids Uplift</button>}
              {openEntries.length === 0 && !isDefects && <button onClick={() => updateTechLogData({tl_defects: true})} className="w-full py-2 bg-[#2a2a2a] border border-[#404040] text-white font-bold rounded hover:bg-[#404040] mb-2">✅ Sign Off Defects Log</button>}
              {isFluids && isChecks && isDefects && !isReleased && (
                <button onClick={() => setActiveTask("release_aircraft")} className="w-full py-3 bg-[#00E676] text-black font-black rounded shadow-[0_4px_10px_rgba(0,230,118,0.4)]">✈️ Release Aircraft</button>
              )}
              {isReleased && <div className="text-center text-status-green text-xs font-bold p-2 border border-dashed border-status-green rounded">🔧 COMPLETED SIGN-OFF</div>}
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer" open>
          <summary className="font-bold text-[#00bfa5] outline-none">Open TL Entries ({openEntries.length})</summary>
          <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#333333]">
            {openEntries.length === 0 ? <div className="text-xs text-[#8fa0a6]">No open entries.</div> : openEntries.map((e:any) => (
              <button key={e.id} onClick={() => {setSelectedEntry(e.id); setActiveTask("view_entry");}} className="text-left text-xs bg-[#0a0a0a] border border-[#404040] p-2 rounded text-white hover:border-[#00bfa5] truncate">{`[${e.id}] ${e.description}`}</button>
            ))}
          </div>
        </details>
        <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer">
          <summary className="font-bold text-[#00bfa5] outline-none">PADD ({paddEntries.length})</summary>
          <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#333333]">
            {paddEntries.length === 0 ? <div className="text-xs text-[#8fa0a6]">No PADD entries.</div> : paddEntries.map((e:any) => (
              <button key={e.id} onClick={() => {setSelectedEntry(e.id); setActiveTask("view_entry");}} className="text-left text-xs bg-[#0a0a0a] border border-[#404040] p-2 rounded text-white hover:border-[#00bfa5] truncate">{`[${e.id}] ${e.description}`}</button>
            ))}
          </div>
        </details>
        <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer">
          <summary className="font-bold text-[#00bfa5] outline-none">SADD ({saddEntries.length})</summary>
          <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#333333]">
            {saddEntries.length === 0 ? <div className="text-xs text-[#8fa0a6]">No SADD entries.</div> : saddEntries.map((e:any) => (
              <button key={e.id} onClick={() => {setSelectedEntry(e.id); setActiveTask("view_entry");}} className="text-left text-xs bg-[#0a0a0a] border border-[#404040] p-2 rounded text-white hover:border-[#00bfa5] truncate">{`[${e.id}] ${e.description}`}</button>
            ))}
          </div>
        </details>
        <details className="bg-[#2a2a2a] border border-[#333333] rounded-lg p-3 group cursor-pointer">
          <summary className="font-bold text-[#00bfa5] outline-none">ADD - MEL/CDL ({addEntries.length})</summary>
          <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#333333]">
            {addEntries.length === 0 ? <div className="text-xs text-[#8fa0a6]">No ADD entries.</div> : addEntries.map((e:any) => (
              <button key={e.id} onClick={() => {setSelectedEntry(e.id); setActiveTask("view_entry");}} className="text-left text-xs bg-[#0a0a0a] border border-[#404040] p-2 rounded text-white hover:border-[#00bfa5] truncate">{`[${e.id}] ${e.description}`}</button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
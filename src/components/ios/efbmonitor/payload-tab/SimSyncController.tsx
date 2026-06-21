export default function SimSyncController({ useRealTimeFuel, setUseRealTimeFuel, isSimSyncing, simCurrentFuel, targetTotalFuel, handleSyncToPmdgSim }: any) {
  return (
    <div className="bg-lido-800 p-6 rounded-xl border border-[#00E676]/40 shadow-[0_0_20px_rgba(0,230,118,0.1)] relative">
      <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2 border-b border-[#333333] pb-3 mb-4">
        <span className="text-[#00E676]">3.</span> PMDG Sim Connection
      </h4>
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 bg-[#111] p-4 rounded-lg border border-[#222] cursor-pointer group hover:border-[#00E676]/40">
          <input type="checkbox" checked={useRealTimeFuel} onChange={(e) => setUseRealTimeFuel(e.target.checked)} disabled={isSimSyncing} className="w-4 h-4 accent-[#00E676]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide group-hover:text-[#00E676]">Simulate Real-Time Refuelling</span>
            <span className="text-[0.65rem] text-[#8fa0a6] font-mono mt-0.5">Pumps fuel progressively into tanks</span>
          </div>
        </label>
        
        {isSimSyncing && useRealTimeFuel && (
          <div className="bg-[#0a0a0a] border border-[#FFD600]/30 rounded-xl p-4 font-mono text-xs animate-fade-in">
            <div className="flex justify-between font-bold text-[#FFD600] mb-2">
              <span>HIGH PRESSURE FUEL FLOWING...</span>
              <span>{((simCurrentFuel / (targetTotalFuel || 1)) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden mb-3">
              <div className="bg-gradient-to-r from-[#FF9100] to-[#FFD600] h-full transition-all duration-200" style={{ width: `${(simCurrentFuel / (targetTotalFuel || 1)) * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-[#8fa0a6] text-[0.7rem]">
              <div>CURRENT INSIM:</div><div className="text-white text-right font-bold">{simCurrentFuel.toLocaleString()} KG</div>
              <div>TARGET REQUEST:</div><div className="text-[#00E676] text-right font-bold">{targetTotalFuel.toLocaleString()} KG</div>
            </div>
          </div>
        )}

        <button onClick={handleSyncToPmdgSim} disabled={isSimSyncing} className={`w-full py-4 rounded-lg font-black tracking-widest text-xs uppercase shadow-md transition-all ${isSimSyncing ? 'bg-[#111] border border-[#555] text-[#555] cursor-not-allowed animate-pulse' : 'bg-gradient-to-r from-[#00E676] to-[#00bfa5] text-black hover:scale-[1.01]'}`}>
          {isSimSyncing ? "⏳ Synchronizing Link Active..." : "🚀 Sync Data & Load to PMDG Simulator"}
        </button>
      </div>
    </div>
  );
}
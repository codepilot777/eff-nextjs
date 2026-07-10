export default function SimSyncController({ isConnected, isSimSyncing, handleSyncToPmdgSim }: any) {
  return (
    <div className="bg-lido-800 p-6 rounded-xl border border-[#00E676]/40 shadow-[0_0_20px_rgba(0,230,118,0.1)] relative">
      <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2 border-b border-[#333333] pb-3 mb-4">
        <span className="text-[#00E676]">3.</span> PMDG Sim Connection
      </h4>
      <div className="flex flex-col gap-4">
        <div className={`flex items-center gap-2 text-xs font-bold tracking-widest bg-[#111] p-3 rounded-lg border border-[#222] ${isConnected ? 'text-[#C6FF00]' : 'text-[#FF1744]'}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-[#C6FF00] animate-pulse shadow-[0_0_8px_#C6FF00]' : 'bg-[#FF1744] shadow-[0_0_8px_#FF1744]'}`} />
          {isConnected ? 'P3D LINKED — READY TO SYNC' : 'P3D OFFLINE — CONNECT VIA SIM CONTROL FIRST'}
        </div>

        <p className="text-[0.65rem] text-[#8fa0a6] font-mono leading-relaxed">
          Sends the current payload/cargo weights and total fuel directly into the PMDG FMC
          (FS ACTIONS → PAYLOAD, then FS ACTIONS → FUEL).
        </p>

        <button
          onClick={handleSyncToPmdgSim}
          disabled={isSimSyncing || !isConnected}
          className={`w-full py-4 rounded-lg font-black tracking-widest text-xs uppercase shadow-md transition-all ${
            isSimSyncing || !isConnected
              ? 'bg-[#111] border border-[#555] text-[#555] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#00E676] to-[#00bfa5] text-black hover:scale-[1.01]'
          } ${isSimSyncing ? 'animate-pulse' : ''}`}
        >
          {isSimSyncing ? "⏳ Synchronizing..." : "🚀 Sync Payload & Fuel to PMDG"}
        </button>
      </div>
    </div>
  );
}

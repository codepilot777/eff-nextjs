import { PayloadState } from "./types";

export default function AircraftVisualizer({ ahm, payload, targetZFW, limits, safeZFW, safeLIZFW, safeMACZFW, safeMACTOW }: any) {
  return (
    <div className="sticky top-6 flex flex-col gap-4">
      <div className="bg-[#0a0a0a] border border-[#333333] rounded-xl p-6 flex flex-col items-center shadow-inner relative">
        <h4 className="text-[#00bfa5] font-black tracking-widest uppercase w-full text-center border-b border-[#333333] pb-3 mb-6">Aircraft Global State ({ahm.acType} - {ahm.reg})</h4>
        <div className="absolute top-4 left-4 text-[0.65rem] font-bold text-[#8fa0a6]">OFP TARGET ZFW<br/><span className="text-white text-lg">{(targetZFW / 1000).toFixed(1)} T</span></div>
        
        <div className="relative w-48 bg-[#1a1a1a] border-4 border-[#404040] rounded-t-full rounded-b-[50px] flex flex-col items-center py-6 shadow-2xl mt-4">
          <div className="w-16 h-8 border-b-2 border-dashed border-[#555] mb-6 flex justify-center items-center text-[0.6rem] text-[#8fa0a6] font-bold tracking-widest">COCKPIT</div>
          
          <div className="w-full px-4 flex flex-col gap-2 mb-8">
            {Object.keys(ahm.stations.pax).map(zoneKey => {
              const displayLabel = zoneKey.replace("zone", "ZONE ");
              return (
                <div key={zoneKey} className="bg-[#00E676]/10 border border-[#00E676]/50 rounded p-2 text-center shadow-inner">
                  <div className="text-[0.6rem] text-[#00E676] font-bold tracking-widest mb-1">{displayLabel}</div>
                  <div className="text-white font-black">{payload.pax[zoneKey] || 0} <span className="text-[#8fa0a6] text-xs font-normal">PAX</span></div>
                </div>
              );
            })}
          </div>

          <div className="relative w-full my-4 flex justify-center items-center z-10">
            <div className="absolute right-[100%] w-24 h-12 bg-[#2979FF]/20 border-y-2 border-l-2 border-[#2979FF] rounded-l-full flex flex-col justify-center items-center"><span className="text-[0.6rem] text-[#2979FF] font-black tracking-widest">L MAIN</span><span className="text-white font-mono text-xs">{(payload.fuel.left/1000).toFixed(1)}T</span></div>
            <div className="w-[90%] bg-[#2979FF]/30 border-2 border-[#2979FF] rounded p-2 text-center shadow-[0_0_15px_rgba(41,121,255,0.3)]"><div className="text-[0.6rem] text-[#2979FF] font-black tracking-widest">CTR TANK</div><div className="text-white font-mono text-sm">{(payload.fuel.center/1000).toFixed(1)}T</div></div>
            <div className="absolute left-[100%] w-24 h-12 bg-[#2979FF]/20 border-y-2 border-r-2 border-[#2979FF] rounded-r-full flex flex-col justify-center items-center"><span className="text-[0.6rem] text-[#2979FF] font-black tracking-widest">R MAIN</span><span className="text-white font-mono text-xs">{(payload.fuel.right/1000).toFixed(1)}T</span></div>
          </div>

          <div className="w-full px-4 flex flex-col gap-2 mt-4">
            <div className="bg-[#FF9100]/10 border border-[#FF9100]/50 rounded p-2 text-center shadow-inner"><div className="text-[0.6rem] text-[#FF9100] font-bold tracking-widest mb-1">HOLD 1 / 2</div><div className="text-white font-mono text-xs">{(payload.cargo.h1 + payload.cargo.h2).toLocaleString()} KG</div></div>
            <div className="bg-[#FF9100]/10 border border-[#FF9100]/50 rounded p-2 text-center shadow-inner"><div className="text-[0.6rem] text-[#FF9100] font-bold tracking-widest mb-1">HOLD 3 / 4</div><div className="text-white font-mono text-xs">{(payload.cargo.h3 + payload.cargo.h4).toLocaleString()} KG</div></div>
            <div className="bg-[#FF9100]/10 border border-[#FF9100]/50 rounded p-2 text-center shadow-inner"><div className="text-[0.6rem] text-[#FF9100] font-bold tracking-widest mb-1">BULK</div><div className="text-white font-mono text-xs">{payload.cargo.bulk.toLocaleString()} KG</div></div>
          </div>
        </div>
      </div>
      
      <div className={`p-4 rounded-xl border ${limits.isValid ? 'bg-[#00E676]/10 border-[#00E676]' : 'bg-[#FF1744]/15 border-[#FF1744]'} grid grid-cols-2 gap-4 shadow-lg transition-colors`}>
        <div><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">Act ZFW</div><div className={`text-xl font-black ${limits.errors.isZFWExceeded ? 'text-[#FF1744]' : 'text-white'}`}>{safeZFW} T</div></div>
        <div className="text-right"><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">LIZFW</div><div className="text-xl font-mono font-black text-[#00bfa5]">{safeLIZFW}</div></div>
        <div><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">MAC ZFW</div><div className="text-xl font-mono font-black text-white">{safeMACZFW} %</div></div>
        <div className="text-right"><div className="text-[0.65rem] text-[#8fa0a6] uppercase tracking-widest font-bold">MAC TOW</div><div className="text-xl font-mono font-black text-[#2979FF]">{safeMACTOW} %</div></div>
      </div>
    </div>
  );
}
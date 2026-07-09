export default function PaxCargoEditor({ ahm, payload, setPayload, targetZFW, generateExactPayload, handleTransmit, isUpdating }: any) {
  return (
    <div className="bg-lido-800 p-6 rounded-xl border border-[#3333333] shadow-lg">
      <div className="flex justify-between items-center border-b border-[#333333] pb-3 mb-4">
        <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2"><span className="text-[#00E676]">1.</span> Payload & ZFW</h4>
        <button onClick={() => {const g = generateExactPayload(targetZFW); setPayload({...payload, pax: g.pax, cargo: g.cargo});}} className="bg-[#00E676]/20 border border-[#00E676] text-[#00E676] px-4 py-1.5 rounded font-bold text-xs tracking-widest hover:bg-[#00E676] hover:text-black transition-colors">🔄 RE-LOAD</button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <div className="col-span-2 text-[#00E676] text-xs font-black tracking-widest uppercase">Passengers</div>
        {Object.keys(ahm.stations.pax).map((zoneKey) => {
          const zoneInfo = ahm.stations.pax[zoneKey]; const currentCount = payload.pax[zoneKey] || 0;
          return (
            <div key={zoneKey}>
              <label className="flex justify-between text-xs text-[#8fa0a6] mb-1"><span>{zoneKey.replace("zone", "Zone ")}</span><span className={currentCount > zoneInfo.maxPax ? "text-[#FF1744] font-bold" : "text-white"}>{currentCount} / {zoneInfo.maxPax}</span></label>
              <input type="range" max={zoneInfo.maxPax} value={currentCount} onChange={(e) => setPayload({...payload, pax: { ...payload.pax, [zoneKey]: parseInt(e.target.value) || 0 }})} className="w-full accent-[#00E676]" />
            </div>
          );
        })}
        <div className="col-span-2 text-[#FF9100] text-xs font-black tracking-widest uppercase mt-2">Cargo (KG)</div>
        {['h1', 'h2', 'h3', 'h4', 'bulk'].map((h, i) => (
          <div key={h} className="flex items-center justify-between bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]"><span className="text-xs text-[#8fa0a6] uppercase">{h === 'bulk' ? 'Bulk' : `Hold ${i+1}`}</span><input type="number" value={payload.cargo[h]} onChange={(e) => setPayload({...payload, cargo: {...payload.cargo, [h]: parseInt(e.target.value) || 0}})} className="bg-transparent border-none text-right text-white w-20 outline-none font-mono text-sm" /></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-[#333333] pt-4">
        <button onClick={() => handleTransmit("EZFW")} disabled={isUpdating} className="bg-[#404040] text-white py-3 rounded-lg font-black tracking-widest text-xs hover:bg-[#555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#404040]">TRANSMIT EZFW</button>
        <button onClick={() => handleTransmit("AZF")} disabled={isUpdating} className="bg-[#404040] text-white py-3 rounded-lg font-black tracking-widest text-xs hover:bg-[#555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#404040]">TRANSMIT AZF</button>
      </div>
    </div>
  );
}
"use client";

export default function FuelManager({ payload, setPayload, flightData, ofpTotalFuelKg, standbyFuelKg, fobKg, traineeFinalFuelKg, handleTransmit, isUpdating }: any) {
  return (
    <div className="bg-lido-800 p-6 rounded-xl border border-[#333333] shadow-lg">
      <h4 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-2 border-b border-[#333333] pb-3 mb-4">
        <span className="text-[#2979FF]">2.</span> Fuel Control
      </h4>
      
      {/* 基礎油量資訊 */}
      {/* 🌟 修復：以前恆定 3 欄，冇 responsive fallback，喺 iPad 分到嘅窄欄位
          入面會逼到好緊。而家窄過 sm:（640px）就 stack 做 1 欄 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1a1a1a] border border-[#404040] p-4 rounded-lg mb-4">
        <div>
          <div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest">OFP Block Fuel</div>
          <div className="text-sm font-mono font-black text-white">{(ofpTotalFuelKg / 1000).toFixed(1)} T</div>
        </div>
        <div className="text-center">
          <div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest">Standby Fuel</div>
          <div className="text-sm font-mono font-black text-[#8fa0a6]">{(standbyFuelKg / 1000).toFixed(1)} T</div>
        </div>
        <div className="text-right">
          <div className="text-[0.55rem] text-[#8fa0a6] font-bold uppercase tracking-widest">FOB</div>
          <div className="text-sm font-mono font-black text-[#2979FF]">{(fobKg / 1000).toFixed(1)} T</div>
        </div>
      </div>

      {/* 🌟 核心新增：Trainee 實時油量請求提示橫幅 */}
      {traineeFinalFuelKg > 0 && (
        <div className="bg-[#FF9100]/10 border border-[#FF9100]/50 p-3 rounded-lg mb-4 flex justify-between items-center shadow-inner">
          <span className="text-[#FF9100] font-bold text-[0.65rem] uppercase tracking-widest flex items-center gap-2">
             <span className="animate-pulse text-base">🔔</span> Trainee Requested Fuel
          </span>
          <span className="text-white font-black font-mono text-lg">
            {(traineeFinalFuelKg / 1000).toFixed(1)} T
          </span>
        </div>
      )}

      {/* 加油輸入區 */}
      <div className="space-y-4">
        <div className="bg-[#111] p-4 rounded-lg border border-[#222]">
          <div className="text-xs font-bold text-[#8fa0a6] uppercase tracking-widest mb-2">
            <span className="text-[#00E676]">Step 1:</span> Fuel Receipt Uplift (KG)
          </div>
          <input
            type="number"
            min={0}
            value={payload.fuel.uplift}
            onChange={(e) => setPayload({ ...payload, fuel: { ...payload.fuel, uplift: Math.max(0, parseInt(e.target.value) || 0) }})}
            className="w-full bg-[#1a1a1a] border border-[#404040] focus:border-[#2979FF] rounded p-3 text-white outline-none font-mono text-sm"
          />
        </div>
        
        <div className="bg-[#111] p-4 rounded-lg border border-[#222]">
          <div className="text-xs font-bold text-[#8fa0a6] uppercase tracking-widest mb-3">
            <span className="text-[#00E676]">Step 2:</span> Final Fuel in Tanks (KG)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]">
              <div className="text-[0.6rem] text-[#8fa0a6] uppercase mb-1">L Main</div>
              <input type="number" min={0} value={payload.fuel.left} onChange={(e) => setPayload({...payload, fuel: {...payload.fuel, left: Math.max(0, parseInt(e.target.value) || 0)}})} className="bg-transparent text-[#2979FF] w-full outline-none font-mono text-sm font-bold" />
            </div>
            <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]">
              <div className="text-[0.6rem] text-[#8fa0a6] uppercase mb-1">Center</div>
              <input type="number" min={0} value={payload.fuel.center} onChange={(e) => setPayload({...payload, fuel: {...payload.fuel, center: Math.max(0, parseInt(e.target.value) || 0)}})} className="bg-transparent text-[#2979FF] w-full outline-none font-mono text-sm font-bold" />
            </div>
            <div className="bg-[#1a1a1a] px-3 py-2 rounded border border-[#404040]">
              <div className="text-[0.6rem] text-[#8fa0a6] uppercase mb-1">R Main</div>
              <input type="number" min={0} value={payload.fuel.right} onChange={(e) => setPayload({...payload, fuel: {...payload.fuel, right: Math.max(0, parseInt(e.target.value) || 0)}})} className="bg-transparent text-[#2979FF] w-full outline-none font-mono text-sm font-bold" />
            </div>
          </div>
        </div>
      </div>
      
      {/* 派發按鈕 */}
      {/* 🌟 修復：以前送咗一次就永久 disabled，冇任何辦法補發——依家 trainee 可以拒收
          張 receipt（fuel_receipt_rejected），呢個掣一定要喺拒收咗之後重新啟用，
          等教官補發一張改正嘅 receipt，先可以清返個 rejected 狀態 */}
      <button
        onClick={() => handleTransmit("FUEL_RECEIPT")}
        disabled={(flightData?.fuel_receipt_sent && !flightData?.fuel_receipt_rejected) || isUpdating}
        className={`w-full py-3 mt-4 rounded-lg font-black tracking-widest text-xs transition-colors ${
          flightData?.fuel_receipt_rejected
            ? 'bg-[#FF1744] text-white hover:bg-[#D50000] shadow-md'
            : flightData?.fuel_receipt_sent
              ? 'bg-[#2979FF]/20 border border-[#2979FF] text-[#2979FF] cursor-not-allowed'
              : isUpdating
                ? 'bg-[#2979FF]/50 text-white/60 cursor-not-allowed'
                : 'bg-[#2979FF] text-white hover:bg-blue-600 shadow-md'
        }`}
      >
        {flightData?.fuel_receipt_rejected ? '⚠️ RESEND CORRECTED FUEL RECEIPT' : flightData?.fuel_receipt_sent ? '✅ FUEL RECEIPT DISPATCHED' : 'DISPATCH FUEL RECEIPT'}
      </button>
    </div>
  );
}
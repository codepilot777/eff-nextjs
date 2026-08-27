"use client";

// 🌟 抽出嚟畀 Commander's Acceptance（即場，讀 tlData 真數）同 History 個 sector
// 詳情（由 fuelUp/fuelArr 呢類已存低嘅欄位推返出嚟，睇 TechLogHistory.tsx）共用

export interface FuelRecordData {
  fobBefore: number;
  totalDeparture: number;
  actualUplift: number;
  expectedUplift: number;
  discrepancy: number;
  doorCyclingConfirmed: boolean;
}

export function FuelRecordCard({ title, data }: { title: string; data: FuelRecordData }) {
  const { fobBefore, totalDeparture, actualUplift, expectedUplift, discrepancy, doorCyclingConfirmed } = data;
  return (
    <div className="bg-[#00E676]/[0.07] border border-[#00E676]/30 p-5 rounded-xl shadow-inner">
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-[#00E676]/20">
        <h4 className="text-white font-bold text-[0.65rem] uppercase tracking-widest flex items-center gap-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#00E676]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          {title}
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="col-span-2">
          <div className="text-[#8fa0a6] text-[0.62rem] font-bold uppercase tracking-widest">Total Departure Fuel</div>
          <div className="text-white font-mono font-bold text-base mt-0.5">{totalDeparture.toFixed(1)} T</div>
        </div>
        <div>
          <div className="text-[#8fa0a6] text-[0.62rem] font-bold uppercase tracking-widest">FOB Before Uplift</div>
          <div className="text-white font-mono font-bold text-sm mt-0.5">{fobBefore.toFixed(1)} T</div>
        </div>
        <div>
          <div className="text-[#8fa0a6] text-[0.62rem] font-bold uppercase tracking-widest">Expected Uplift</div>
          <div className="text-white font-mono font-bold text-sm mt-0.5">{expectedUplift.toFixed(1)} T</div>
        </div>
        <div>
          <div className="text-[#8fa0a6] text-[0.62rem] font-bold uppercase tracking-widest">Actual Uplift</div>
          <div className="text-[#00E676] font-mono font-bold text-sm mt-0.5">{actualUplift.toFixed(1)} T</div>
        </div>
        <div>
          <div className="text-[#8fa0a6] text-[0.62rem] font-bold uppercase tracking-widest">Discrepancy</div>
          <div className={`font-mono font-bold text-sm mt-0.5 ${Math.abs(discrepancy) > 1.0 ? 'text-[#FF1744]' : 'text-white'}`}>
            {discrepancy > 0 ? `+${discrepancy.toFixed(1)}` : discrepancy.toFixed(1)} T
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-dashed border-[#00E676]/25 text-[0.68rem] text-[#8fa0a6] leading-relaxed">
        <span className="text-[#e2e8f0] font-bold">Refuelling Station Door Cycling Procedure Performed:</span>{' '}
        {doorCyclingConfirmed ? (
          <span className="text-[#00E676] font-bold">Yes (Ref AD 2020-11-11)</span>
        ) : (
          <span className="text-[#FF9100] font-bold">Not Confirmed</span>
        )}
      </div>
    </div>
  );
}

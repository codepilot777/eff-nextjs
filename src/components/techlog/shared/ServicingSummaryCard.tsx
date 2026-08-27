"use client";
import { useMemo } from "react";
import { generateServicingQuantities } from "@/lib/techlog/servicingSummary";

// 🌟 抽出嚟畀 Commander's Acceptance（即場，冇 seed）同 History 個 sector 詳情
// （用返 sector id 做 seed，等揀返同一個 sector 個數字唔會跳嚟跳去）共用。
// EDTO/Daily/Weekly 讀真數據，其餘 uplift 數量純粹裝飾（睇 servicingSummary.ts）
//
// 🌟 注意：呢個組件本身冇 overflow-hidden——試過一次真係喺瀏覽器度撞到
// overflow:hidden 令個 block 塌成 2px 高（child 明明報返正常高度），刪咗先解決，
// 所以呢度用返最後一行加 rounded-b-xl 保住圓角，唔好加返 overflow-hidden
export function ServicingSummaryCard({ checksCompleted, seed }: { checksCompleted: boolean; seed?: string }) {
  const q = useMemo(() => generateServicingQuantities(seed), [seed]);

  const checkChip = (
    <span className={`text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 rounded ${checksCompleted ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30' : 'bg-[#FF9100]/10 text-[#FF9100] border border-[#FF9100]/30'}`}>
      {checksCompleted ? 'Completed' : 'Required'}
    </span>
  );

  return (
    <div className="bg-[#0a0a0a] border border-[#333] rounded-xl shadow-inner">
      <h4 className="text-white font-bold text-[0.65rem] uppercase tracking-widest px-5 pt-5 pb-3 border-b border-[#333] flex items-center gap-2">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#8fa0a6]"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        Servicing Summary
      </h4>
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">EDTO Transit Check</span>
          {checkChip}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">Daily Check</span>
          {checkChip}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">Weekly Check</span>
          {checkChip}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">Engine Oil Uplift</span>
          <span className="text-[#8fa0a6] font-mono font-bold text-[0.75rem]">+{q.engineOil} QT</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">Hydraulic Fluid Uplift</span>
          <span className="text-[#8fa0a6] font-mono font-bold text-[0.75rem]">+{q.hydFluid} QT</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">IDG Oil Uplift</span>
          <span className="text-[#8fa0a6] font-mono font-bold text-[0.75rem]">{q.idgOil > 0 ? `+${q.idgOil} QT` : 'Nil Uplift'}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">APU Oil Uplift</span>
          <span className="text-[#8fa0a6] font-mono font-bold text-[0.75rem]">{q.apuOil > 0 ? `+${q.apuOil} QT` : 'Nil Uplift'}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3 rounded-b-xl">
          <span className="text-[#e2e8f0] text-[0.75rem] font-bold">Potable Water Qty. (%)</span>
          <span className="text-[#8fa0a6] font-mono font-bold text-[0.75rem]">{q.potableWater}%</span>
        </div>
      </div>
    </div>
  );
}

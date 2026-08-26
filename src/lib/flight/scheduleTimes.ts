// src/lib/flight/scheduleTimes.ts

// 🌟 STA 一定要係 STD + Block Time，先可以保證 header 顯示嘅 BLOCK TIME 同
// STA 減 STD 呢條數啱得返——以前 STA 直接用 SimBrief 自己嘅 times.est_in，
// BLOCK TIME 就用另一條完全獨立、粗略嘅「flight time + 40 分鐘」公式計，
// 兩個數冇保證一致（甚至成日唔一致）

export interface SimbriefTimesLike {
  sched_block?: string | number;
  est_block?: string | number;
}

// 🌟 優先用 SimBrief 真正嘅 scheduled block time（sched_block），退而求其次用
// est_block；兩個都冇（舊資料/罕見 edge case）先跌落舊有嘅粗略估算公式
export function resolveBlockTimeSeconds(times: SimbriefTimesLike, eetSeconds: number): number {
  const schedBlock = parseInt(String(times.sched_block || 0), 10);
  if (schedBlock > 0) return schedBlock;
  const estBlock = parseInt(String(times.est_block || 0), 10);
  if (estBlock > 0) return estBlock;
  return eetSeconds > 0 ? eetSeconds + 2400 : 0;
}

export function computeStaUnix(stdUnix: number, blockTimeSeconds: number): number {
  if (!stdUnix || !blockTimeSeconds) return 0;
  return stdUnix + blockTimeSeconds;
}

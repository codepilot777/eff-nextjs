// 🌟 Engineer release 唔可以淨係睇 tl_defects 呢個 sign-off flag。
// 個 flag 可以同真正嘅 OPEN defect 脫節（sector close 用咗舊 snapshot、
// sign-off 同新 defect 打交叉、或者直接寫 tl_release: true）。
// 「Open TL Entries」同左邊 dashboard 一樣：defects 入面 status === "OPEN"。
// DEFERRED（PADD/SADD/ADD）同 CLEARED 唔擋 release。

export interface OpenTlReleaseBlock {
  openCount: number;
  reason: string;
}

export function countOpenTlEntries(defects: unknown): number {
  if (!Array.isArray(defects)) return 0;
  let count = 0;
  for (const entry of defects) {
    if (entry && typeof entry === 'object' && (entry as { status?: unknown }).status === 'OPEN') {
      count += 1;
    }
  }
  return count;
}

export function openTlReleaseReason(openCount: number): string {
  const noun = openCount === 1 ? 'entry' : 'entries';
  return `Cannot release: ${openCount} open TL ${noun}. Defects must be cleared or deferred before the aircraft can be released.`;
}

/** null = 冇 open TL，可以 release。 */
export function openTlReleaseBlock(defects: unknown): OpenTlReleaseBlock | null {
  const openCount = countOpenTlEntries(defects);
  if (openCount === 0) return null;
  return { openCount, reason: openTlReleaseReason(openCount) };
}

/**
 * 淨係擋「而家呢個 patch 想簽 release」（tl_release === true）。
 * 用 merge 之後嘅 defects，等同一筆寫入入面清走最後一條 OPEN 嘅 release 通過。
 * 機組 reset（tl_release: false）同普通 defect 寫入唔受影響。
 */
export function releaseAttemptBlocked(
  merged: { defects?: unknown },
  patch: { data?: Record<string, unknown> },
): OpenTlReleaseBlock | null {
  if (patch.data?.tl_release !== true) return null;
  return openTlReleaseBlock(merged.defects);
}

// src/lib/loadsheet/autoEzfw.ts

import { distributeFuelKg } from "./loadsheetHelpers";
import type { AircraftAHM560 } from "./types";

// 🌟 起機（SimBrief import）嗰刻自動生成「第一個 EZFW」——現實入面一定係先有
// dispatch 派出嚟嗰個 EZFW，先至 based on 佢整出成份 OFP，唔會有「淨係得
// flight plan 但完全冇任何 EZFW」嘅狀態。SimBrief 淨係俾總 pax/cargo（唔分
// class/hold），所以按 AHM 各 zone/hold 嘅載客量/載重量比例分攤，唔係亂噏數；
// ramp fuel 直接用 OFP 嘅 fuel.plan_ramp，跟返 PayloadTab.tsx 派油嗰套
// distributeFuelKg 邏輯分落三個油缸。

// 🌟 現實入面 EZFW 一定喺 STD 之前一段時間（唔係起機嗰一刻）已經由 dispatch
// 拍出嚟，用返 STD-120 分鐘做呢個「第一個 EZFW」嘅 timestamp
export function computeEzfwTimeZ(stdUnix: number): string {
  if (!stdUnix) return "0000Z";
  const ezfwUnix = stdUnix - 120 * 60;
  const d = new Date(ezfwUnix * 1000);
  return d.toISOString().substring(11, 16).replace(":", "") + "Z";
}

// 🌟 按各 zone 嘅 maxPax 比例分攤總人數，最後一個 zone 用總數減返之前已分配
// 嘅數，確保個總和啱啱好等於（clamp 咗上限之後嘅）totalPax，唔會因為
// 四捨五入差一兩個人
export function distributePaxAcrossZones(ahm: AircraftAHM560, totalPax: number): Record<string, number> {
  const zoneKeys = Object.keys(ahm.stations.pax);
  const totalCapacity = zoneKeys.reduce((sum, k) => sum + (ahm.stations.pax[k].maxPax || 0), 0);
  const clampedTotal = Math.max(0, Math.min(Math.round(totalPax), totalCapacity));

  const result: Record<string, number> = {};
  let assigned = 0;
  zoneKeys.forEach((key, idx) => {
    if (idx === zoneKeys.length - 1) {
      result[key] = clampedTotal - assigned;
      return;
    }
    const cap = ahm.stations.pax[key].maxPax || 0;
    const share = totalCapacity > 0 ? Math.round((cap / totalCapacity) * clampedTotal) : 0;
    result[key] = share;
    assigned += share;
  });

  return result;
}

// 🌟 snapshot 嘅 cargo 一定要用 h1/h2/h3/h4/bulk 呢套短 key（同 PayloadTab.tsx
// 嘅 payload.cargo state、buildEnginePayload 讀緊嘅 snapshot.cargo?.h1 一致）——
// AHM stations.cargo 本身先係用 hold1/hold2/hold3/hold4/bulk 嗰套長 key，兩套
// 唔可以撈亂，撈亂咗 LoadsheetEngine 計 totalCargoWeight 就會靜靜雞漏晒得返
// bulk 嗰份重量（曾經喺呢度發生過，已經用 regression test 鎖死）
export interface AutoEzfwCargo {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  bulk: number;
}

const CARGO_HOLD_TO_SNAPSHOT_KEY = { hold1: "h1", hold2: "h2", hold3: "h3", hold4: "h4", bulk: "bulk" } as const;

// 🌟 按各 hold（連 bulk）嘅 maxWeight 比例分攤總貨重
export function distributeCargoAcrossHolds(ahm: AircraftAHM560, totalCargoKg: number): AutoEzfwCargo {
  const ahmHoldKeys = Object.keys(CARGO_HOLD_TO_SNAPSHOT_KEY) as Array<keyof typeof CARGO_HOLD_TO_SNAPSHOT_KEY>;
  const totalCapacity = ahmHoldKeys.reduce((sum, h) => sum + (ahm.stations.cargo[h].maxWeight || 0), 0);
  const clampedTotal = Math.max(0, Math.min(Math.round(totalCargoKg), totalCapacity));

  const result: AutoEzfwCargo = { h1: 0, h2: 0, h3: 0, h4: 0, bulk: 0 };
  let assigned = 0;
  ahmHoldKeys.forEach((ahmKey, idx) => {
    const snapshotKey = CARGO_HOLD_TO_SNAPSHOT_KEY[ahmKey];
    if (idx === ahmHoldKeys.length - 1) {
      result[snapshotKey] = clampedTotal - assigned;
      return;
    }
    const cap = ahm.stations.cargo[ahmKey].maxWeight || 0;
    const share = totalCapacity > 0 ? Math.round((cap / totalCapacity) * clampedTotal) : 0;
    result[snapshotKey] = share;
    assigned += share;
  });

  return result;
}

export interface AutoEzfwSnapshot {
  pax: Record<string, number>;
  cargo: AutoEzfwCargo;
  fuel: { left: number; center: number; right: number };
}

export function buildAutoEzfwSnapshot(
  ahm: AircraftAHM560,
  totalPax: number,
  totalCargoKg: number,
  rampFuelKg: number
): AutoEzfwSnapshot {
  return {
    pax: distributePaxAcrossZones(ahm, totalPax),
    cargo: distributeCargoAcrossHolds(ahm, totalCargoKg),
    fuel: distributeFuelKg(ahm, Math.max(0, Math.round(rampFuelKg))),
  };
}

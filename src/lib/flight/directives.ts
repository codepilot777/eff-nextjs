// 🌟 單一嘅 Flight patch 合併邏輯，同 techlog/directives.ts 一樣嘅諗法：
// pdc_requests/atis_requests/acars_messages 呢幾個 array 唔再由 client 本地砌好成個
// array 覆寫（舊寫法會用 local 可能已過時嘅 flightData 做 base，同 techlog 修正前
// 一樣有並發覆寫風險），改為由 server 對住自己啱啱讀到嘅最新一份 row 逐個 directive 咁 apply。

import { getOfpHistory, type OfpHistoryEntry } from './ofpHistory';

export interface FlightPatch {
  data?: Record<string, unknown>;
  pdcRequestAppend?: { atis: string; facility?: string; gate?: string };
  pdcApprove?: { time: string; clearance_payload: string };
  atisRequestAppend?: { icao: string; type: string };
  atisDeliver?: { time: string; response: string };
  acarsCockpitAppend?: { content: string };
  acarsDispatchAppend?: { content: string };
  // 🌟 教官：dispatch 新 OFP 版本落歷史（唔會即刻改 trainee 眼前嘅 live 內容）
  ofpDispatchAppend?: { snapshot: Record<string, unknown> };
  // 🌟 Trainee/commander：接受一個已經 dispatch 咗嘅版本，令佢正式成為 live 內容
  ofpActivate?: { version: number };
  // 🌟 Trainee：撳走個 toggle switch，清返做「冇任何版本生效」，唔改 live 欄位
  ofpDeactivate?: true;
}

type FlightRow = Record<string, unknown>;
type RowArray = Array<Record<string, unknown>>;

function nowUtcZ(): string {
  const now = new Date();
  return `${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}Z`;
}

export function applyFlightDirectives(current: FlightRow, patch: FlightPatch): FlightRow {
  const merged: FlightRow = { ...current, ...(patch.data || {}) };

  if (patch.pdcRequestAppend) {
    const pdcRequests = (current.pdc_requests as RowArray | undefined) || [];
    merged.pdc_requests = [
      ...pdcRequests,
      {
        time: nowUtcZ(),
        status: 'PENDING CLEARANCE',
        atis: patch.pdcRequestAppend.atis.toUpperCase(),
        facility: (patch.pdcRequestAppend.facility || '').toUpperCase(),
        gate: patch.pdcRequestAppend.gate || '',
      },
    ];
  }

  if (patch.pdcApprove) {
    const { time, clearance_payload } = patch.pdcApprove;
    const pdcRequests = (current.pdc_requests as RowArray | undefined) || [];
    merged.pdc_requests = pdcRequests.map((r) =>
      r.time === time ? { ...r, status: 'APPROVED', clearance_payload } : r
    );
  }

  if (patch.atisRequestAppend) {
    const atisRequests = (current.atis_requests as RowArray | undefined) || [];
    merged.atis_requests = [
      ...atisRequests,
      {
        id: atisRequests.length + 1,
        icao: patch.atisRequestAppend.icao.toUpperCase(),
        type: patch.atisRequestAppend.type,
        time: nowUtcZ(),
        status: 'PENDING RESPONSE',
      },
    ];
  }

  if (patch.atisDeliver) {
    const { time, response } = patch.atisDeliver;
    const atisRequests = (current.atis_requests as RowArray | undefined) || [];
    merged.atis_requests = atisRequests.map((r) =>
      r.time === time ? { ...r, status: 'DELIVERED', response } : r
    );
  }

  if (patch.acarsCockpitAppend) {
    const messages = (current.acars_messages as RowArray | undefined) || [];
    merged.acars_messages = [...messages, { time: nowUtcZ(), sender: 'COCKPIT', content: patch.acarsCockpitAppend.content }];
  }

  if (patch.acarsDispatchAppend) {
    const messages = (merged.acars_messages as RowArray | undefined) || (current.acars_messages as RowArray | undefined) || [];
    merged.acars_messages = [...messages, { time: nowUtcZ(), sender: 'DISPATCH', content: patch.acarsDispatchAppend.content }];
  }

  if (patch.ofpDispatchAppend) {
    // 🌟 nextVersion 喺 server 度對住自己啱啱讀到嘅最新 row 計，唔信 client 送嚟嘅
    // 版本號——兩個教官幾乎同時 dispatch 都唔會撞版本號
    const history = getOfpHistory(current);
    const latestVersion = history.reduce((max, e) => Math.max(max, e.version), 0);
    const nextVersion = Math.max(latestVersion, Number(current.ofp_version) || 1) + 1;
    merged.ofp_history = [
      ...history,
      { version: nextVersion, dispatched_at: new Date().toISOString(), snapshot: patch.ofpDispatchAppend.snapshot },
    ];
    merged.ofp_version = nextVersion;
  }

  if (patch.ofpActivate) {
    const { version } = patch.ofpActivate;
    const history = (merged.ofp_history as OfpHistoryEntry[] | undefined) || getOfpHistory(current);
    const entry = history.find((e) => e.version === version);
    if (!entry) {
      throw new Error(`Cannot activate OFP version ${version}: it was never dispatched for this flight`);
    }
    Object.assign(merged, entry.snapshot);
    merged.activated_version = version;
    // 🌟 Trainee 真正接受咗新版本先算「新一輪」——之前嗰輪 EZFW/prelim/final loadsheet
    // 嘅 sign-off 狀態要重置，等佢哋要就住新版本嘅數重新走一次 loadsheet workflow
    merged.ezfw_sent = true;
    merged.azf_sent = false;
    merged.prelim_ls_sent = false;
    merged.final_ls_sent = false;
  }

  if (patch.ofpDeactivate) {
    // 🌟 淨係清返個 flag——冇任何版本生效嘅時候，live 欄位保持原狀（同舊時個 toggle
    // 一樣，撳走個掣都唔會夾硬變返做邊個版本嘅內容）
    merged.activated_version = 0;
  }

  return merged;
}

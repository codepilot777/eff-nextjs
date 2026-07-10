// 🌟 單一嘅 Flight patch 合併邏輯，同 techlog/directives.ts 一樣嘅諗法：
// pdc_requests/atis_requests/acars_messages 呢幾個 array 唔再由 client 本地砌好成個
// array 覆寫（舊寫法會用 local 可能已過時嘅 flightData 做 base，同 techlog 修正前
// 一樣有並發覆寫風險），改為由 server 對住自己啱啱讀到嘅最新一份 row 逐個 directive 咁 apply。

export interface FlightPatch {
  data?: Record<string, unknown>;
  pdcRequestAppend?: { atis: string; facility?: string; gate?: string };
  pdcApprove?: { time: string; clearance_payload: string };
  atisRequestAppend?: { icao: string; type: string };
  atisDeliver?: { time: string; response: string };
  acarsCockpitAppend?: { content: string };
  acarsDispatchAppend?: { content: string };
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

  return merged;
}

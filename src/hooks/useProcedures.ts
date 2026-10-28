import { useQuery } from "@tanstack/react-query";
import { parseAirportProcedures, type AirportProcedures } from "@/lib/nav/procedures";

// 🌟 攞一個機場嘅 SID/STAR/fix/hold 程序庫（/api/procedures/[icao]）——
// RouteOverridePanel（揀 SID/STAR）同 WxRadarTab（砌最終 route fixes 送落
// iframe、同埋傳俾 Observer map 做 snap-to-fix）都要用，抽做共用 hook
// 等 react-query 用同一個 queryKey 自然 dedupe 埋，唔使兩邊各自 fetch 一次
export async function fetchProcedures(icao: string | undefined): Promise<AirportProcedures | null> {
  if (!icao) return null;
  const res = await fetch(`/api/procedures/${encodeURIComponent(icao)}`);
  if (!res.ok) return null;
  const body = await res.json();
  return body.data ? parseAirportProcedures(body.data) : null;
}

export function useProcedures(icao: string | undefined) {
  return useQuery({
    queryKey: ["procedures", icao],
    queryFn: () => fetchProcedures(icao),
    enabled: !!icao,
  });
}

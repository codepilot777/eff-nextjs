import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

// 🌟 修復：以前用 flightData.aircraft_reg 做 techlog key，同一機牌嘅唔同 session
// 會共用/互相蓋走 techlog（睇 db.ts migrateTechlogsTable 嘅 comment）。而家同
// useFlightData.ts 一致，直接由 URL 攞真正嘅 session id 做 key
export function useTechlogData(flightData: any) {
  const searchParams = useSearchParams();
  const flightId = searchParams.get("id");
  return useQuery({
    queryKey: ["techlog", flightId],
    queryFn: async () => {
      const res = await fetch(`/api/techlog?id=${encodeURIComponent(flightId || "")}`);
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!flightId && !!flightData,
  });
}

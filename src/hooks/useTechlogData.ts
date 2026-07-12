import { useQuery } from "@tanstack/react-query";

export function useTechlogData(flightData: any) {
  const reg = flightData?.aircraft_reg || flightData?.raw_simbrief?.general?.aircraft_reg || 'B-HNQ';
  return useQuery({
    queryKey: ["techlog", reg],
    queryFn: async () => {
      const res = await fetch(`/api/techlog?reg=${reg}`);
      if (!res.ok) throw new Error("Network error");
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !!reg && !!flightData,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { calculateFuelEngine } from "@/lib/fuelCalculator"; // 🌟 引入燃油引擎

export function useFlightData() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const flightId = searchParams.get("id"); // 🌟 自己去 URL 搵 ID，唔使人哋餵！

  // 1. 讀取資料
  const { data: flightData, isLoading, isFetching } = useQuery({
    queryKey: ["flight", flightId],
    queryFn: async () => {
      const res = await fetch(`/api/flight?id=${encodeURIComponent(flightId || "")}`);
      if (!res.ok) throw new Error("Failed to fetch flight data");
      return res.json();
    },
    enabled: !!flightId,
    refetchInterval: 3000,
  });

  // 2. 更新資料
  const { mutate: rqUpdateFlightData, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: any) => {
      const updatedData = { ...flightData, ...updates };
      const res = await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flightId, data: updatedData })
      });
      if (!res.ok) throw new Error("Failed to update flight data");
      return res.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["flight", flightId] });
      const previousData = queryClient.getQueryData(["flight", flightId]);
      queryClient.setQueryData(["flight", flightId], { ...previousData, ...updates });
      return { previousData };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["flight", flightId] });
    },
  });

  // 🌟 3. 智能緩存燃油引擎計算結果 (useMemo 確保只在 flightData 改變時才重新計算)
  const calc = useMemo(() => {
    if (!flightData) return null;
    return calculateFuelEngine(flightData);
  }, [flightData]);

  // 🌟 4. 集中管理所有 Handlers
  const handlers = useMemo(() => {
    if (!calc) return null;
    return {
      handleManualToggle: () => {
        const newMode = !calc.isManual;
        if (newMode) {
          rqUpdateFlightData({ fuel_manual_mode: newMode, manual_fuel: { taxi: Number(calc.autoTaxi.toFixed(1)), trip: Number(calc.autoTrip.toFixed(1)), cont: Number(calc.autoCont.toFixed(1)), tankering: 0.0, extra: 0.0, total: Number(calc.autoTotal.toFixed(1)) } });
        } else rqUpdateFlightData({ fuel_manual_mode: newMode });
      },
      handleFuelInput: (field: string, val: string) => {
        const num = parseFloat(val) || 0.0;
        const newMf = { ...calc.mf, [field]: num };
        if (field !== 'total') {
          newMf.total = Number((newMf.taxi + newMf.trip + newMf.cont + calc.currAltnOfp + calc.ofpRes + newMf.tankering + newMf.extra).toFixed(1));
        } else {
          let calcExtra = num - (newMf.taxi + newMf.trip + newMf.cont + calc.currAltnOfp + calc.ofpRes + newMf.tankering);
          newMf.extra = calcExtra < 0 ? 0.0 : Number(calcExtra.toFixed(1));
          newMf.total = calcExtra < 0 ? Number((newMf.taxi + newMf.trip + newMf.cont + calc.currAltnOfp + calc.ofpRes + newMf.tankering).toFixed(1)) : num;
        }
        rqUpdateFlightData({ manual_fuel: newMf, final_fuel_accepted: false });
      },
      handleZfwInput: (val: string) => {
        const num = parseFloat(val) || 0.0;
        if (num !== flightData?.trainee_input_zfw) rqUpdateFlightData({ trainee_input_zfw: num, final_fuel_accepted: false });
      },
      handleAcceptFuel: () => { rqUpdateFlightData({ final_fuel_accepted: true, final_fuel_request: calc.currTotal }); },
    };
  }, [flightData, calc, rqUpdateFlightData]);

  return { 
    flightId, 
    flightData, 
    updateFlightData: rqUpdateFlightData, 
    calc, 
    handlers, 
    isLoading, 
    isFetching, 
    isUpdating 
  };
}
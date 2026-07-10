import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { calculateFuelEngine } from "@/lib/fuelCalculator"; // 🌟 引入燃油引擎

// 🌟 修復：以前個 ALTN dropdown 借用 handleFuelInput，parseFloat 一個 ICAO 代碼會變 NaN→0，
// 寫錯落 manual_fuel.selected_altn（一個冇任何地方會讀嘅欄位），真正俾 fuelCalculator.ts
// 讀嘅 flightData.selected_altn 完全冇更新過。抽出嚟做純 function 方便獨立測試。
export function buildAltnSelectUpdate(icao: string) {
  return { selected_altn: icao, final_fuel_accepted: false };
}

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
  const { mutate: rqUpdateFlightData, mutateAsync: rqUpdateFlightDataAsync, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: any) => {
      // 🌟 淨係送個 diff 去 server，由 server 同最新一份 row merge
      // (唔好用本地嘅 flightData 做 base 再蓋走成個 blob，
      // 否則會用 stale snapshot 蓋走教官/機師另一邊啱啱寫低嘅欄位)
      const res = await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flightId, data: updates })
      });
      if (!res.ok) throw new Error("Failed to update flight data");
      return res.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["flight", flightId] });
      const previousData = queryClient.getQueryData(["flight", flightId]) as any;
queryClient.setQueryData(["flight", flightId], { ...(previousData || {}), ...updates });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["flight", flightId] });
    },
  });

  // 🌟 2.5 送 directive（pdcRequestAppend/pdcApprove/atisRequestAppend/atisDeliver/
  // acarsCockpitAppend/acarsDispatchAppend）—— PDC/ATIS/ACARS 呢啲 array 唔再由
  // client 本地砌好成個 array 覆寫，改由 server 對住自己啱啱讀到嘅最新一份 row apply，
  // 同時 pdcApprove/atisDeliver/acarsDispatchAppend 呢類「扮 ATC/DISPATCH」嘅動作
  // 會喺 server 端要求教官登入（睇 src/lib/validation.ts requiresInstructorAuthForFlight）
  const { mutateAsync: rqSendDirectiveAsync } = useMutation({
    mutationFn: async (directive: Record<string, unknown>) => {
      const res = await fetch('/api/flight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flightId, ...directive })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send directive");
      }
      return res.json();
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
      handleAltnSelect: (icao: string) => {
        if (icao !== flightData?.selected_altn) rqUpdateFlightData(buildAltnSelectUpdate(icao));
      },
      handleAcceptFuel: () => { rqUpdateFlightData({ final_fuel_accepted: true, final_fuel_request: calc.currTotal }); },
    };
  }, [flightData, calc, rqUpdateFlightData]);

  return {
    flightId,
    flightData,
    updateFlightData: rqUpdateFlightData,
    updateFlightDataAsync: rqUpdateFlightDataAsync,
    sendFlightDirective: rqSendDirectiveAsync,
    calc,
    handlers,
    isLoading,
    isFetching,
    isUpdating
  };
}
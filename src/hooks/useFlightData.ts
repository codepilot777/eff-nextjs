import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef } from "react";
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

  // 🌟 修復：3 秒背景 poll 同 fire-and-forget 嘅 update mutation 冇協調——如果
  // poll 啱啱好喺 optimistic update 之後、server 個 write 仲未寫完嗰陣觸發，
  // 攞返嚟嗰份係「寫入之前」嘅舊 snapshot，會直接覆晒個 optimistic 顯示，令
  // trainee 啱啱打完 blur 咗嘅數（例如 Revised ZFW）睇落「回潮」消失咗，
  // 要等落一輪 poll 先追返上嚟。
  // 🌟 淨係暫停 poll（refetchInterval 回傳 false）唔夠：react-query 淨係喺
  // reschedule 嗰刻先讀呢個 function 嘅返回值，一個已經排咗程嘅 timer 唔會理
  // pendingWritesRef 中途轉咗值，照樣會喺原定嗰刻 fire——實測真係會撞到。
  // 真正靠得住嘅做法係喺 queryFn 度：淨係跟蹤緊未 settle 嘅欄位（pendingFieldsRef），
  // 每次 poll 攞完 server response 都無條件用呢份 diff 蓋返上去先至存入 cache，
  // 咁唔理個 poll 幾時啱啱好撞入嚟，都唔會蓋走仲未寫完嗰個欄位
  const pendingWritesRef = useRef(0);
  const pendingFieldsRef = useRef<Record<string, unknown>>({});

  // 1. 讀取資料
  const { data: flightData, isLoading, isFetching } = useQuery({
    queryKey: ["flight", flightId],
    queryFn: async () => {
      const res = await fetch(`/api/flight?id=${encodeURIComponent(flightId || "")}`);
      if (!res.ok) throw new Error("Failed to fetch flight data");
      const json = await res.json();
      return { ...json, ...pendingFieldsRef.current };
    },
    enabled: !!flightId,
    refetchInterval: () => (pendingWritesRef.current > 0 ? false : 3000),
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update flight data");
      }
      return res.json();
    },
    onMutate: async (updates) => {
      pendingWritesRef.current += 1;
      Object.assign(pendingFieldsRef.current, updates);
      await queryClient.cancelQueries({ queryKey: ["flight", flightId] });
      const previousData = queryClient.getQueryData(["flight", flightId]) as any;
      queryClient.setQueryData(["flight", flightId], { ...(previousData || {}), ...updates });
      return { previousData };
    },
    // 🌟 server 個 transaction 一 commit 就即刻喺 response 度連埋權威嘅 merge
    // 咗嘅 row 一齊送返嚟（睇 /api/flight/update/route.ts 嘅 `data: merged`），
    // 直接寫呢份落 cache，唔使淨係靠落面 onSettled 嘅 invalidate 先再等多一
    // round GET 先至 confirm——減少多一個可以撞到 poll 嘅 race window
    onSuccess: (result: { data?: Record<string, unknown> }) => {
      if (result?.data) {
        queryClient.setQueryData(["flight", flightId], (old: Record<string, unknown> | undefined) => ({ ...(old || {}), ...result.data }));
      }
    },
    onError: (_err, _updates, context) => {
      if (context?.previousData) queryClient.setQueryData(["flight", flightId], context.previousData);
    },
    onSettled: (_data, _error, updates) => {
      pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      // 🌟 淨係清返呢次 mutation 自己啱啱加落 pendingFieldsRef 嘅欄位——如果
      // 中途另一個 mutation 又啱啱好改緊同一個欄位，唔好連人哋仲未 settle 嗰個都
      // 一齊清咗
      for (const key of Object.keys(updates || {})) {
        delete pendingFieldsRef.current[key];
      }
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
    // 🌟 directive 都要計落 pendingWritesRef——同上面個 update mutation 一樣嘅
    // POST /api/flight/update，一樣會撞落背景 poll 嗰個 race window
    onMutate: () => {
      pendingWritesRef.current += 1;
    },
    onSuccess: (result: { data?: Record<string, unknown> }) => {
      if (result?.data) {
        queryClient.setQueryData(["flight", flightId], (old: Record<string, unknown> | undefined) => ({ ...(old || {}), ...result.data }));
      }
    },
    onSettled: () => {
      pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
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
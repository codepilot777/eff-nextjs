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

// 🌟 修復：呢份 pending-write 追蹤本來擺喺 useFlightData() 入面用 useRef 做，
// 但成個 dashboard 有成十幾個唔同 component（FuelWeightColumn/LoadsheetAirportColumn/
// RefuelAircraftColumn/FmcCrewColumn……）各自獨立 call useFlightData()——每個 call
// 都攞自己嗰份全新嘅 useRef，完全唔共享。結果就係：A component 啱啱寫緊個 ZFW，
// B component 嗰個 useQuery 完全唔知道，佢自己嗰份 pendingWrites 恆定 0，
// 到時到候照 poll，攞返嚟嘅 stale snapshot 一樣會寫入*同一份*共用 cache（大家
// query key 一樣），將 A 岡岡優化寫低嘅嘢蓋走。實測就係咁：淨係測緊 FuelWeightColumn
// 個 input 都會見到回潮，因為隔離 Dashboard 仲有第啲 sibling 都掛住同一個 flightId
// poll 緊。真正要共享嘅狀態一定要擺出 React tree 之外，用返 flightId 做 key
// 嘅 module-level registry，等所有 useFlightData() call 都指向同一份
type PendingState = { writes: number; fields: Record<string, unknown> };
const pendingStateByFlight = new Map<string, PendingState>();
function getPendingState(flightId: string | null): PendingState {
  if (!flightId) return { writes: 0, fields: {} };
  let state = pendingStateByFlight.get(flightId);
  if (!state) {
    state = { writes: 0, fields: {} };
    pendingStateByFlight.set(flightId, state);
  }
  return state;
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
  // pendingWrites 中途轉咗值，照樣會喺原定嗰刻 fire——實測真係會撞到。
  // 真正靠得住嘅做法係喺 queryFn 度：淨係跟蹤緊未 settle 嘅欄位（pendingFields），
  // 每次 poll 攞完 server response 都無條件用呢份 diff 蓋返上去先至存入 cache，
  // 咁唔理個 poll 幾時啱啱好撞入嚟（包括其他 component 觸發嘅 poll），都唔會
  // 蓋走仲未寫完嗰個欄位——用 getPendingState(flightId) 令呢份狀態喺全部
  // useFlightData() call 之間共享
  const pending = getPendingState(flightId);

  // 1. 讀取資料
  const { data: flightData, isLoading, isFetching } = useQuery({
    queryKey: ["flight", flightId],
    queryFn: async () => {
      const res = await fetch(`/api/flight?id=${encodeURIComponent(flightId || "")}`);
      if (!res.ok) throw new Error("Failed to fetch flight data");
      const json = await res.json();
      return { ...json, ...pending.fields };
    },
    enabled: !!flightId,
    refetchInterval: () => (pending.writes > 0 ? false : 3000),
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
    // 🌟 修復：以前呢度 await 咗 cancelQueries() 先至讀 previousData/寫 optimistic
    // patch——如果一個 handler 連環打兩次 updateFlightData()（例如 Accept Fuel
    // 舊版咁），兩個 onMutate 嘅 continuation 唔一定跟得切 call 嗰陣嘅次序，遲手
    // 嗰個好可能用住執行早咗嗰刻嘅 snapshot 蓋走前一個啱啱寫低嘅欄位。而家刻意
    // 唔用 async/await——onMutate 呢個 function 本身唔再係 async，一 call 就會
    // 一路行晒（讀 previousData → 寫 optimistic patch）先至讓出，等幾多個
    // updateFlightData() 連環打埋一齊都好，寫入次序實跟得切 call 嗰陣嘅次序，
    // 唔會再互相蓋走。
    // 🌟 索性連 cancelQueries() 都唔叫——佢本來想防「poll 啱啱好喺 write 中途
    // 撞入嚟」嗰種舊 snapshot 蓋走 optimistic update，而家呢個情況已經由上面
    // queryFn 個 pending.fields overlay 徹底兜底（唔理個 poll 幾時攞到、邊個
    // component 觸發，攞完都會用 pending 緊嘅 diff 蓋返上去），完全唔使再靠
    // cancelQueries() 呢步，仲可以避免佢個 await 拖長 onMutate（睇下面）
    onMutate: (updates: Record<string, unknown>) => {
      pending.writes += 1;
      Object.assign(pending.fields, updates);
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
      pending.writes = Math.max(0, pending.writes - 1);
      // 🌟 淨係清返呢次 mutation 自己啱啱加落 pending.fields 嘅欄位——如果
      // 中途另一個 mutation 又啱啱好改緊同一個欄位，唔好連人哋仲未 settle 嗰個都
      // 一齊清咗
      for (const key of Object.keys(updates || {})) {
        delete pending.fields[key];
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
    // 🌟 directive 都要計落 pending.writes——同上面個 update mutation 一樣嘅
    // POST /api/flight/update，一樣會撞落背景 poll 嗰個 race window
    onMutate: () => {
      pending.writes += 1;
    },
    onSuccess: (result: { data?: Record<string, unknown> }) => {
      if (result?.data) {
        queryClient.setQueryData(["flight", flightId], (old: Record<string, unknown> | undefined) => ({ ...(old || {}), ...result.data }));
      }
    },
    onSettled: () => {
      pending.writes = Math.max(0, pending.writes - 1);
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
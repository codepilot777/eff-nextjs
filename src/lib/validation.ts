import { z } from 'zod';

// 🌟 Flight/TechLog 個 data blob 本身係一個不斷加欄位嘅彈性 bag
// (fuel/loadsheet/tech-log 業務邏輯經常加新 flag)，所以淨係要求
// 「係一個 plain object（唔係 array/null/string 等）」，唔會逐個欄位鎖死
const patchObjectSchema = z.record(z.string(), z.unknown());

const nonEmptyString = (label: string) => z.string().trim().min(1, `${label} is required`);

export const flightIdSchema = nonEmptyString('flight id');
export const aircraftRegSchema = nonEmptyString('aircraft reg').max(20);

// 🌟 pdc_requests/atis_requests/acars_messages 一定要行 directive 路徑，唔可以再喺
// `data` 度直接塞成個 array 落嚟覆寫——否則任何人都可以送一個「status: APPROVED」
// 嘅 pdc_requests patch，自己扮教官批准自己嘅 ATC clearance
// 🌟 ofp_history/activated_version 同一道理：activated_version 一定要行
// ofpActivate directive（server 會核實個 version 真係存在喺 ofp_history 先接受），
// 唔可以再直接喺 data 度寫個任意數字落去扮咗已經 activate 咗一個根本冇 dispatch 過嘅版本
const flightDataSchema = patchObjectSchema.refine(
  (d) => !('pdc_requests' in d) && !('atis_requests' in d) && !('acars_messages' in d)
    && !('ofp_history' in d) && !('activated_version' in d),
  { message: 'pdc_requests/atis_requests/acars_messages/ofp_history/activated_version must go through the directive fields, not data' }
);

export const pdcRequestAppendSchema = z.object({
  atis: nonEmptyString('pdcRequestAppend.atis').max(1),
  facility: z.string().trim().max(10).optional().default(''),
  gate: z.string().trim().max(20).optional().default(''),
});

// 🌟 教官專屬：核准 PDC clearance，睇 requiresInstructorAuthForFlight
export const pdcApproveSchema = z.object({
  time: nonEmptyString('pdcApprove.time'),
  clearance_payload: nonEmptyString('pdcApprove.clearance_payload'),
});

export const atisRequestAppendSchema = z.object({
  icao: nonEmptyString('atisRequestAppend.icao').max(10),
  type: z.enum(['DEPARTURE', 'ARRIVAL']),
});

// 🌟 教官專屬：送出 ATIS 內容，睇 requiresInstructorAuthForFlight
export const atisDeliverSchema = z.object({
  time: nonEmptyString('atisDeliver.time'),
  response: nonEmptyString('atisDeliver.response'),
});

export const acarsCockpitAppendSchema = z.object({
  content: nonEmptyString('acarsCockpitAppend.content').max(500),
});

// 🌟 教官專屬：扮 DISPATCH 送 ACARS 訊息，睇 requiresInstructorAuthForFlight
export const acarsDispatchAppendSchema = z.object({
  content: nonEmptyString('acarsDispatchAppend.content').max(500),
});

// 🌟 教官專屬：dispatch 一個新嘅 OFP 版本落 ofp_history，睇 requiresInstructorAuthForFlight。
// 淨係 append 落歷史入面，唔會即刻覆寫 trainee 眼前嘅 live 欄位——trainee 要自己
// 送 ofpActivate 先至真正切換去嗰個版本（真.commander accept 新 flight plan）
export const ofpDispatchAppendSchema = z.object({
  snapshot: z.record(z.string(), z.unknown()),
});

// 🌟 Trainee 專屬（唔使教官登入）：commander 接受一個已經 dispatch 咗嘅版本，
// server 會核實呢個 version 真係存在喺 ofp_history 先至接受，唔可以話 activate
// 一個從未 dispatch 過嘅版本
export const ofpActivateSchema = z.object({
  version: z.number().int().positive(),
});

// 🌟 Trainee 專屬：撳走 flight-select 個 toggle switch，淨係清返 activated_version
// 做返 0（冇任何版本生效），唔會改動任何 live 欄位——同舊時個 toggle 一樣咁單純
export const ofpDeactivateSchema = z.literal(true);

// 🌟 Trainee 專屬：request ATIS 之後 15 秒，前端自己觸發呢個 directive，叫 server
// 由教官預先上傳嘅 atis_library 度攞返「而家嗰個版本」出嚟——trainee 冇辦法自己
// 指定內容（server 完全唔理會 client 送嚟嘅任何文字），所以唔使教官登入
export const atisAutoDeliverSchema = z.object({
  icao: nonEmptyString('atisAutoDeliver.icao').max(10),
  type: z.enum(['DEPARTURE', 'ARRIVAL']),
});

export const flightUpdateBodySchema = z.object({
  id: flightIdSchema,
  data: flightDataSchema.optional().default({}),
  pdcRequestAppend: pdcRequestAppendSchema.optional(),
  pdcApprove: pdcApproveSchema.optional(),
  atisRequestAppend: atisRequestAppendSchema.optional(),
  atisDeliver: atisDeliverSchema.optional(),
  acarsCockpitAppend: acarsCockpitAppendSchema.optional(),
  acarsDispatchAppend: acarsDispatchAppendSchema.optional(),
  ofpDispatchAppend: ofpDispatchAppendSchema.optional(),
  ofpActivate: ofpActivateSchema.optional(),
  ofpDeactivate: ofpDeactivateSchema.optional(),
  atisAutoDeliver: atisAutoDeliverSchema.optional(),
});

export const flightDeleteBodySchema = z.object({
  id: flightIdSchema,
});

// 🌟 defects/tl_entries/flights 呢啲 array 欄位一定要行 directive 路徑（睇
// src/lib/techlog/directives.ts），唔可以再喺 `data` 度直接塞成個 array 落嚟覆寫，
// 否則會繞過 server 端嘅 array merge，重新引入舊時嘅並發覆寫 bug
const techlogDataSchema = patchObjectSchema.refine(
  (d) => !('defects' in d) && !('tl_entries' in d) && !('flights' in d),
  { message: 'defects/tl_entries/flights must go through the directive fields, not data' }
);

export const techlogPostBodySchema = z.object({
  reg: aircraftRegSchema,
  data: techlogDataSchema.optional().default({}),
  defectUpdate: z.object({
    id: nonEmptyString('defectUpdate.id'),
    changes: z.record(z.string(), z.unknown()),
  }).optional(),
  defectAppend: z.record(z.string(), z.unknown()).optional(),
  tlEntryAppend: z.record(z.string(), z.unknown()).optional(),
  tlEntriesReset: z.literal(true).optional(),
  flightsPrepend: z.record(z.string(), z.unknown()).optional(),
  signOffDefects: z.literal(true).optional(),
});

// 🌟 邊啲 techlog patch 一定要教官登入先可以送——淨係睇「意圖」（directive/明確值），
// 唔淨係睇欄位存唔存在，因為 finalizeSector（機組動作）都會寫 tl_release/tl_checks 等
// 欄位落 false 做重置，呢啲重置動作唔應該被擋
export function requiresInstructorAuth(patch: {
  data?: Record<string, unknown>;
  defectUpdate?: { changes: Record<string, unknown> };
  signOffDefects?: true;
}): boolean {
  const d = patch.data || {};
  if (d.tl_release === true || d.tl_checks === true || d.tl_fluids === true) return true;
  if (typeof d.crs_id === 'string' && d.crs_id.length > 0) return true;
  if (patch.signOffDefects) return true;
  if (patch.defectUpdate && ['CLEARED', 'DEFERRED'].includes(String(patch.defectUpdate.changes?.status))) return true;
  return false;
}

export const simbriefBodySchema = z.object({
  // SimBrief usernames are alphanumeric (plus . _ -), matches SimBrief's own account rules
  username: z
    .string()
    .trim()
    .min(1, 'SimBrief username is required')
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'SimBrief username contains invalid characters'),
  flightNo: z.string().trim().max(20).optional(),
  // 🌟 修復：instructor/page.tsx 嘅建立航班表單以前送埋呢啲欄位，但呢個 schema
  // 冇宣告過，zod 靜靜雞剝走晒，令 is_published/created_by/commander_override 從來
  // 冇寫入過（PUBLISH 掣話你成功但實際上冇 publish）
  created_by: z.string().trim().max(100).optional(),
  is_published: z.boolean().optional(),
  commander_override: z.string().trim().max(100).optional(),
  // 🌟 教官喺建立航班表單度可以覆寫嘅機組人數（唔再永遠 hardcode 2/14），
  // 同埋 random NOTOC 危險品訓練演習開關
  crew_fd_override: z.number().int().positive().max(10).optional(),
  crew_cc_override: z.number().int().positive().max(30).optional(),
  include_notoc: z.boolean().optional(),
});

export const loginBodySchema = z.object({
  password: nonEmptyString('password').max(200),
});

// 🌟 Flight-list/is_published patch 欄位受保護（教官專屬）：睇 route 層點用
// 🌟 修復：metar_dep/taf_dep/metar_arr/taf_arr/notam_dep/notam_arr/alternates
// 淨係 WxTab.tsx/NotamTab.tsx/ConfigTab.tsx（全部喺教官專屬嘅 /instructor/ios 底下）
// 會寫，但 /api/flight/update 以前對呢啲欄位完全冇 auth check——任何人都可以直接
// POST 偽造天氣/NOTAM，同之前修好嘅 pdcApprove/atisDeliver/acarsDispatchAppend
// 係同一類「扮教官」漏洞，呢次補返
// 🌟 notoc：NOTOCTab.tsx（教官專屬）可以直接編輯/發布 NOTOC 危險品清單，同一類
// 「扮教官」漏洞，一齊保護埋
// 🌟 activated_version 冇再喺呢個 list——佢而家連喺 data 度出現都會俾 zod 擋
// 晒（睇 flightDataSchema 個 refine），一定要行已核實嘅 ofpActivate directive
// 🌟 metar_toff_altn/taf_toff_altn/notam_toff_altn/enroute_altns/enroute_stations：
// WxTab.tsx/NotamTab.tsx 新增嘅 Takeoff Alternate / Enroute Alternate / Enroute
// Stations 編輯功能寫入嘅欄位，同 metar_dep/notam_dep 等一樣要受保護
// 🌟 atis_library：教官預先上傳嘅 ATIS 內容庫（keyed by icao+type），
// atisAutoDeliver directive 會直接讀呢個欄位嚟決定送咩落 cockpit——如果 trainee
// 都可以寫呢個欄位，就等於可以自己作 ATIS 內容扮 ATC，同其餘「扮 ATC/DISPATCH」
// 類欄位一樣要保護
export const PROTECTED_FLIGHT_PATCH_FIELDS = [
  'is_published',
  'metar_dep',
  'taf_dep',
  'metar_arr',
  'taf_arr',
  'notam_dep',
  'notam_arr',
  'alternates',
  'notoc',
  // 🌟 notoc_draft：教官編緊、未 publish 落 EFB 嘅 NOTOC 草稿（睇 NOTOCTab.tsx）——
  // 雖然仲未去到 trainee 見到嘅 notoc，但內容一樣係教官專屬嘅資料，一樣唔可以
  // 俾 trainee 直接寫呢個欄位扮教官打緊 DG 資料
  'notoc_draft',
  'metar_toff_altn',
  'taf_toff_altn',
  'notam_toff_altn',
  'enroute_altns',
  'enroute_stations',
  'atis_library',
] as const;

export function hasProtectedFlightFields(patch: Record<string, unknown>): boolean {
  return PROTECTED_FLIGHT_PATCH_FIELDS.some((field) => field in patch);
}

// 🌟 pdcApprove/atisDeliver/acarsDispatchAppend 係「扮 ATC/DISPATCH 回覆」嘅動作，
// 一定要教官登入先做得，唔淨係靠前端隱藏返個掣（同 pdcRequestAppend/atisRequestAppend/
// acarsCockpitAppend 呢啲學員送出 request 嘅動作分開，後者任何人都做得）
export function requiresInstructorAuthForFlight(patch: {
  data?: Record<string, unknown>;
  pdcApprove?: unknown;
  atisDeliver?: unknown;
  acarsDispatchAppend?: unknown;
  ofpDispatchAppend?: unknown;
} & Record<string, unknown>): boolean {
  if (hasProtectedFlightFields(patch.data || {})) return true;
  // 🌟 ofpActivate 特登唔喺呢度——嗰個係 trainee/commander 自己接受新 flight plan
  // 嘅動作，唔應該要教官登入（同 pdcRequestAppend/atisRequestAppend 呢啲 trainee
  // 動作一樣，靠 server 驗證 version 存唔存在嚟防偽造，唔靠登入）
  if (patch.pdcApprove || patch.atisDeliver || patch.acarsDispatchAppend || patch.ofpDispatchAppend) return true;
  return false;
}

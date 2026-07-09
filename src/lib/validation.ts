import { z } from 'zod';

// 🌟 Flight/TechLog 個 data blob 本身係一個不斷加欄位嘅彈性 bag
// (fuel/loadsheet/tech-log 業務邏輯經常加新 flag)，所以淨係要求
// 「係一個 plain object（唔係 array/null/string 等）」，唔會逐個欄位鎖死
const patchObjectSchema = z.record(z.string(), z.unknown());

const nonEmptyString = (label: string) => z.string().trim().min(1, `${label} is required`);

export const flightIdSchema = nonEmptyString('flight id');
export const aircraftRegSchema = nonEmptyString('aircraft reg').max(20);

export const flightUpdateBodySchema = z.object({
  id: flightIdSchema,
  data: patchObjectSchema,
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
});

export const loginBodySchema = z.object({
  password: nonEmptyString('password').max(200),
});

// 🌟 Flight-list/is_published patch 欄位受保護（教官專屬）：睇 route 層點用
export const PROTECTED_FLIGHT_PATCH_FIELDS = ['is_published', 'activated_version'] as const;

export function hasProtectedFlightFields(patch: Record<string, unknown>): boolean {
  return PROTECTED_FLIGHT_PATCH_FIELDS.some((field) => field in patch);
}

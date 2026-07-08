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

export const techlogPostBodySchema = z.object({
  reg: aircraftRegSchema,
  data: patchObjectSchema,
});

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

import { describe, expect, it } from 'vitest';
import {
  flightDeleteBodySchema,
  flightUpdateBodySchema,
  hasProtectedFlightFields,
  loginBodySchema,
  requiresInstructorAuth,
  requiresInstructorAuthForFlight,
  simbriefBodySchema,
  techlogPostBodySchema,
} from './validation';

describe('flightUpdateBodySchema', () => {
  it('accepts a valid id + partial patch', () => {
    const result = flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: { fuel_manual_mode: true } });
    expect(result.success).toBe(true);
  });

  it('rejects a missing id', () => {
    expect(flightUpdateBodySchema.safeParse({ data: { a: 1 } }).success).toBe(false);
  });

  it('rejects an empty id', () => {
    expect(flightUpdateBodySchema.safeParse({ id: '  ', data: { a: 1 } }).success).toBe(false);
  });

  it('rejects a non-object data payload (the old whole-blob-overwrite footgun)', () => {
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: 'not-an-object' }).success).toBe(false);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: null }).success).toBe(false);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: [1, 2, 3] }).success).toBe(false);
  });

  it('defaults data to {} so a directive-only patch is valid on its own', () => {
    const result = flightUpdateBodySchema.safeParse({ id: 'CPA 564', acarsCockpitAppend: { content: 'wilco' } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.data).toEqual({});
  });

  it('rejects pdc_requests/atis_requests/acars_messages smuggled inside data (the array-replacement bypass)', () => {
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: { pdc_requests: [] } }).success).toBe(false);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: { atis_requests: [] } }).success).toBe(false);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', data: { acars_messages: [] } }).success).toBe(false);
  });

  it('accepts each directive shape', () => {
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', pdcRequestAppend: { atis: 'A' } }).success).toBe(true);
    expect(flightUpdateBodySchema.safeParse({
      id: 'CPA 564', pdcApprove: { time: '0100Z', clearance_payload: 'CLRD...' },
    }).success).toBe(true);
    expect(flightUpdateBodySchema.safeParse({
      id: 'CPA 564', atisRequestAppend: { icao: 'VHHH', type: 'DEPARTURE' },
    }).success).toBe(true);
    expect(flightUpdateBodySchema.safeParse({
      id: 'CPA 564', atisDeliver: { time: '0100Z', response: 'INFO A' },
    }).success).toBe(true);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', acarsCockpitAppend: { content: 'wilco' } }).success).toBe(true);
    expect(flightUpdateBodySchema.safeParse({ id: 'CPA 564', acarsDispatchAppend: { content: 'roger' } }).success).toBe(true);
  });

  it('rejects an invalid atisRequestAppend type', () => {
    expect(flightUpdateBodySchema.safeParse({
      id: 'CPA 564', atisRequestAppend: { icao: 'VHHH', type: 'BOGUS' },
    }).success).toBe(false);
  });
});

describe('requiresInstructorAuthForFlight', () => {
  it('gates the protected flat fields', () => {
    expect(requiresInstructorAuthForFlight({ data: { is_published: true } })).toBe(true);
    expect(requiresInstructorAuthForFlight({ data: { activated_version: 2 } })).toBe(true);
  });

  it('gates pdcApprove/atisDeliver/acarsDispatchAppend ("pretend to be ATC/DISPATCH" actions)', () => {
    expect(requiresInstructorAuthForFlight({ pdcApprove: { time: '0100Z', clearance_payload: 'x' } })).toBe(true);
    expect(requiresInstructorAuthForFlight({ atisDeliver: { time: '0100Z', response: 'x' } })).toBe(true);
    expect(requiresInstructorAuthForFlight({ acarsDispatchAppend: { content: 'x' } })).toBe(true);
  });

  it('does NOT gate trainee-initiated request/append directives or ordinary field writes', () => {
    expect(requiresInstructorAuthForFlight({ pdcRequestAppend: { atis: 'A' } })).toBe(false);
    expect(requiresInstructorAuthForFlight({ atisRequestAppend: { icao: 'VHHH', type: 'DEPARTURE' } })).toBe(false);
    expect(requiresInstructorAuthForFlight({ acarsCockpitAppend: { content: 'wilco' } })).toBe(false);
    expect(requiresInstructorAuthForFlight({ data: { trainee_input_zfw: 180 } })).toBe(false);
    expect(requiresInstructorAuthForFlight({})).toBe(false);
  });
});

describe('flightDeleteBodySchema', () => {
  it('requires a non-empty id', () => {
    expect(flightDeleteBodySchema.safeParse({ id: 'CPA 564' }).success).toBe(true);
    expect(flightDeleteBodySchema.safeParse({ id: '' }).success).toBe(false);
    expect(flightDeleteBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('techlogPostBodySchema', () => {
  it('requires reg + object patch', () => {
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', data: { tl_prepared: true } }).success).toBe(true);
    expect(techlogPostBodySchema.safeParse({ reg: '', data: {} }).success).toBe(false);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', data: 'nope' }).success).toBe(false);
  });

  it('defaults data to {} so a directive-only patch is valid on its own', () => {
    const result = techlogPostBodySchema.safeParse({ reg: 'B-HNQ', signOffDefects: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.data).toEqual({});
  });

  it('accepts each directive shape', () => {
    expect(techlogPostBodySchema.safeParse({
      reg: 'B-HNQ',
      defectUpdate: { id: 'A1', changes: { status: 'CLEARED' } },
    }).success).toBe(true);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', defectAppend: { id: 'A2' } }).success).toBe(true);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', tlEntryAppend: { id: 'ENT-1' } }).success).toBe(true);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', tlEntriesReset: true }).success).toBe(true);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', flightsPrepend: { id: 'SEC-1' } }).success).toBe(true);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', signOffDefects: true }).success).toBe(true);
  });

  it('rejects tlEntriesReset/signOffDefects set to false (must be the true literal or absent)', () => {
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', tlEntriesReset: false }).success).toBe(false);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', signOffDefects: false }).success).toBe(false);
  });

  it('rejects defects/tl_entries/flights smuggled inside data (the array-replacement bypass)', () => {
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', data: { defects: [] } }).success).toBe(false);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', data: { tl_entries: [] } }).success).toBe(false);
    expect(techlogPostBodySchema.safeParse({ reg: 'B-HNQ', data: { flights: [] } }).success).toBe(false);
  });
});

describe('requiresInstructorAuth', () => {
  it('gates release/checks/fluids/CRS writes', () => {
    expect(requiresInstructorAuth({ data: { tl_release: true } })).toBe(true);
    expect(requiresInstructorAuth({ data: { tl_checks: true } })).toBe(true);
    expect(requiresInstructorAuth({ data: { tl_fluids: true } })).toBe(true);
    expect(requiresInstructorAuth({ data: { crs_id: 'CRS-1234-X' } })).toBe(true);
  });

  it('gates the signOffDefects directive', () => {
    expect(requiresInstructorAuth({ signOffDefects: true })).toBe(true);
  });

  it('gates clearing or deferring a defect via defectUpdate', () => {
    expect(requiresInstructorAuth({ defectUpdate: { changes: { status: 'CLEARED' } } })).toBe(true);
    expect(requiresInstructorAuth({ defectUpdate: { changes: { status: 'DEFERRED' } } })).toBe(true);
  });

  it('does not gate an open-status defectUpdate (e.g. reporting) or unrelated field writes', () => {
    expect(requiresInstructorAuth({ defectUpdate: { changes: { status: 'OPEN' } } })).toBe(false);
    expect(requiresInstructorAuth({ data: { tl_prepared: true } })).toBe(false);
  });

  it('does NOT gate the flight-crew finalizeSector reset, even though it writes tl_defects/crs_id: ""', () => {
    // this is the exact shape sharedUtils.ts's finalizeSector sends after every sector close
    expect(requiresInstructorAuth({
      data: { tl_defects: true, tl_release: false, tl_checks: false, tl_fluids: false, crs_id: '' },
    })).toBe(false);
  });
});

describe('simbriefBodySchema', () => {
  it('accepts alphanumeric usernames', () => {
    expect(simbriefBodySchema.safeParse({ username: 'EFFSIM' }).success).toBe(true);
    expect(simbriefBodySchema.safeParse({ username: 'eff.sim-01' }).success).toBe(true);
  });

  it('rejects usernames with characters that would break the SimBrief query string', () => {
    expect(simbriefBodySchema.safeParse({ username: 'eff&admin=1' }).success).toBe(false);
    expect(simbriefBodySchema.safeParse({ username: 'a b' }).success).toBe(false);
    expect(simbriefBodySchema.safeParse({ username: '' }).success).toBe(false);
  });

  it('accepts the create-flight form fields (created_by/is_published/commander_override/zfw_override) instead of silently stripping them', () => {
    const result = simbriefBodySchema.safeParse({
      username: 'EFFSIM',
      flightNo: 'CPA 564',
      created_by: 'Capt. Chan',
      is_published: true,
      commander_override: 'CAPT. YEUNG',
      zfw_override: 210.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.created_by).toBe('Capt. Chan');
      expect(result.data.is_published).toBe(true);
      expect(result.data.commander_override).toBe('CAPT. YEUNG');
      expect(result.data.zfw_override).toBe(210.5);
    }
  });

  it('still works without any of the optional create-flight fields', () => {
    expect(simbriefBodySchema.safeParse({ username: 'EFFSIM' }).success).toBe(true);
  });

  it('rejects a non-positive zfw_override', () => {
    expect(simbriefBodySchema.safeParse({ username: 'EFFSIM', zfw_override: 0 }).success).toBe(false);
    expect(simbriefBodySchema.safeParse({ username: 'EFFSIM', zfw_override: -5 }).success).toBe(false);
  });
});

describe('loginBodySchema', () => {
  it('requires a non-empty password', () => {
    expect(loginBodySchema.safeParse({ password: 'x' }).success).toBe(true);
    expect(loginBodySchema.safeParse({ password: '' }).success).toBe(false);
    expect(loginBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('hasProtectedFlightFields', () => {
  it('flags instructor-only fields and lets everything else through', () => {
    expect(hasProtectedFlightFields({ is_published: true })).toBe(true);
    expect(hasProtectedFlightFields({ activated_version: 2 })).toBe(true);
    expect(hasProtectedFlightFields({ fuel_manual_mode: true, trainee_input_zfw: 180 })).toBe(false);
    expect(hasProtectedFlightFields({})).toBe(false);
  });
});

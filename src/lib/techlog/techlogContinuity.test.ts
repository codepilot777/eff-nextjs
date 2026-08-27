import { describe, expect, it } from 'vitest';
import { DEFAULT_TECHLOG, syncTechlogForNewFlight } from './techlogContinuity';

describe('syncTechlogForNewFlight', () => {
  it('always syncs tl_prep_flt/dep/arr to the new flight, regardless of continuity', () => {
    const result = syncTechlogForNewFlight(null, { flightNo: 'CX888', depIata: 'HKG', arrIata: 'SIN' });
    expect(result.tl_prep_flt).toBe('CX888');
    expect(result.tl_prep_dep).toBe('HKG');
    expect(result.tl_prep_arr).toBe('SIN');
  });

  it('always inserts a 10-sector history chain, even when the new departure already matches the known current location', () => {
    // DEFAULT_TECHLOG.tl_prev_arr === 'HKG', 起機由 HKG 出發，本身已經夾得返，
    // 但依然要無條件生成成條 10 程歷史鏈，唔可以因為冇 continuity gap 就乜都唔做
    const before = (DEFAULT_TECHLOG.flights as unknown[]).length;
    const result = syncTechlogForNewFlight(null, { flightNo: 'CX500', depIata: 'HKG', arrIata: 'NRT' });
    const flights = result.flights as Array<Record<string, unknown>>;

    expect(flights.length).toBe(before + 10);
    expect(String(flights[0].route).endsWith('➔ HKG')).toBe(true);
    expect(result.tl_prev_arr).toBe('HKG');
  });

  it('inserts a 10-sector history chain when the new departure does not match the known current location', () => {
    // 模擬「外地飛返香港」：existing techlog 話架機仲留喺 HKG，但新 flight plan 由 NRT 出發
    const existing: Record<string, unknown> = { ...DEFAULT_TECHLOG, tl_prev_arr: 'HKG' };
    const before = (existing.flights as unknown[]).length;
    const result = syncTechlogForNewFlight(existing, { flightNo: 'CX501', depIata: 'NRT', arrIata: 'HKG' });

    const flights = result.flights as Array<Record<string, unknown>>;
    expect(flights.length).toBe(before + 10);
    // 最新一條（index 0）嘅 arrival 一定係新 flight plan 嘅出發機場
    expect(String(flights[0].route).endsWith('➔ NRT')).toBe(true);
    // 🌟 regression: startStation（HKG）同交替 pattern 行到最舊一條時嘅 arrival
    // 啱啱好都係 HKG，以前個「夾硬逼 departure = startStation」嘅邏輯會撞出一條
    // 「HKG ➔ HKG」自己飛去自己嘅假 sector。而家淨係要求呢條 sector 唔會自己飛
    // 去自己（departure !== arrival），仍然要沾到 HKG
    const [oldestDep, oldestArr] = String(flights[9].route).split(' ➔ ');
    expect(oldestDep).not.toBe(oldestArr);
    expect(oldestArr).toBe('HKG');
    expect(result.tl_prev_arr).toBe('NRT');
    expect(result.tl_prep_dep).toBe('NRT');
  });

  it('the newest chain sector is always a closed ("Normal Close") sector', () => {
    const result = syncTechlogForNewFlight(null, { flightNo: 'CX501', depIata: 'NRT', arrIata: 'HKG' });
    const chain = (result.flights as Array<Record<string, unknown>>).slice(0, 10);
    for (const sector of chain) {
      expect(sector.action).toBe('Normal Close');
    }
  });

  it('the bridging chain is internally consistent: each sector connects to the next, times in order', () => {
    const existing = { ...DEFAULT_TECHLOG, tl_prev_arr: 'BKK' };
    const result = syncTechlogForNewFlight(existing, { flightNo: 'CX123', depIata: 'KIX', arrIata: 'HKG' });
    const chain = (result.flights as Array<Record<string, unknown>>).slice(0, 10);

    for (let i = 0; i < chain.length - 1; i++) {
      const dep = String(chain[i].route).split(' ➔ ')[0];
      const olderArr = String(chain[i + 1].route).split(' ➔ ')[1];
      expect(dep).toBe(olderArr);
    }
    expect(String(chain[chain.length - 1].route).split(' ➔ ')[0]).toBe('BKK');
    expect(String(chain[0].route).split(' ➔ ')[1]).toBe('KIX');

    const toMin = (s: string) => parseInt(String(s).slice(0, 2), 10) * 60 + parseInt(String(s).slice(2, 4), 10);
    for (const sector of chain) {
      expect(toMin(sector.takeOff as string)).toBeGreaterThan(toMin(sector.blocksOff as string));
      expect(toMin(sector.blocksOn as string)).toBeGreaterThan(toMin(sector.landing as string));
    }
  });

  it('repeated syncs keep growing the history by 10 sectors each time', () => {
    let techlog: Record<string, unknown> | null = null;
    for (let i = 0; i < 3; i++) {
      techlog = syncTechlogForNewFlight(techlog, { flightNo: `CX${i}`, depIata: 'HKG', arrIata: 'NRT' });
      techlog = { ...techlog, tl_prev_arr: 'HKG' }; // 模擬呢程完咗返返 HKG
    }
    const finalFlights = (techlog!.flights as unknown[]).length;
    expect(finalFlights).toBe((DEFAULT_TECHLOG.flights as unknown[]).length + 30);
  });

  it('defaults a missing depIata/arrIata to HKG/N-A instead of throwing', () => {
    expect(() => syncTechlogForNewFlight(null, { flightNo: 'CX1', depIata: '', arrIata: '' })).not.toThrow();
    const result = syncTechlogForNewFlight(null, { flightNo: 'CX1', depIata: '', arrIata: '' });
    expect(result.tl_prep_dep).toBe('HKG');
  });

  it('forces the engineer release checklist to true on every sync, regardless of leftover state', () => {
    const existing = { ...DEFAULT_TECHLOG, tl_fluids: false, tl_checks: false, tl_defects: false, tl_release: false };
    const result = syncTechlogForNewFlight(existing, { flightNo: 'CX900', depIata: 'HKG', arrIata: 'SIN' });
    expect(result.tl_fluids).toBe(true);
    expect(result.tl_checks).toBe(true);
    expect(result.tl_defects).toBe(true);
    expect(result.tl_release).toBe(true);
  });

  it('every generated bridging sector touches HKG and never departs/arrives at the same airport (HKG-based fleet, no outstation-to-outstation legs, no self-loops)', () => {
    // regression: departure used to be picked with randomStationExcluding(arrival), which only
    // avoided repeating the previous station -- it could freely chain outstation-to-outstation
    // legs (e.g. SIN -> KIX) that a HKG-based fleet would never actually fly
    // 🌟 regression: startStation===HKG (好常見，新機/上一程啱啱好落返 HKG) 加上新
    // flight plan 由非 HKG 機場出發，以前個「最舊一條夾硬逼 departure=startStation」
    // 嘅邏輯會同交替 pattern 天然行到嘅 arrival（都係 HKG）撞埋，生成一條
    // 「HKG ➔ HKG」自己飛去自己嘅假 sector（用戶回報：create CTS→HKG 嘅 flight，
    // 歷史 anchor 咗喺 HKG，同嚟緊個 sector 嘅 origin 對唔上）
    const scenarios: Array<{ existing: Record<string, unknown> | null; depIata: string; arrIata: string }> = [
      { existing: null, depIata: 'HKG', arrIata: 'NRT' },
      { existing: { ...DEFAULT_TECHLOG, tl_prev_arr: 'HKG' }, depIata: 'NRT', arrIata: 'HKG' },
      { existing: { ...DEFAULT_TECHLOG, tl_prev_arr: 'BKK' }, depIata: 'KIX', arrIata: 'HKG' },
      { existing: { ...DEFAULT_TECHLOG, tl_prev_arr: 'SIN' }, depIata: 'TPE', arrIata: 'HKG' },
      // 用戶實際回報嘅場景：新機（existing=null，即係 startStation 預設 HKG）由 CTS 出發
      { existing: null, depIata: 'CTS', arrIata: 'HKG' },
    ];

    for (const scenario of scenarios) {
      // run several times -- the chain uses randomStationExcluding, so a single run wouldn't
      // catch a fix that only works for one lucky roll
      for (let run = 0; run < 20; run++) {
        const result = syncTechlogForNewFlight(scenario.existing, { flightNo: 'CX999', depIata: scenario.depIata, arrIata: scenario.arrIata });
        const chain = (result.flights as Array<Record<string, unknown>>).slice(0, 10);
        for (const sector of chain) {
          const [dep, arr] = String(sector.route).split(' ➔ ');
          expect(dep).not.toBe(arr);
          expect(dep === 'HKG' || arr === 'HKG').toBe(true);
        }
      }
    }
  });

  it('resets the trainee workflow state to "ready to Prepare Flight" on every sync, regardless of leftover state', () => {
    // 模擬上一個 session 遺留低嘅「已經 prepared/accepted 緊」狀態
    const existing = { ...DEFAULT_TECHLOG, tl_prepared: true, tl_accept: true, tl_flight_started: true, tl_flight_status: 'IN_FLIGHT' };
    const result = syncTechlogForNewFlight(existing, { flightNo: 'CX901', depIata: 'HKG', arrIata: 'SIN' });
    expect(result.tl_prepared).toBe(false);
    expect(result.tl_accept).toBe(false);
    expect(result.tl_flight_started).toBe(false);
    expect(result.tl_flight_status).toBe('SCHEDULED');
  });

  it('regression: resets tl_fuel_record_completed too, so a new flight does not inherit a previous flight\'s completed Fuel Record and skip straight from Prepare Flight to Commander\'s Acceptance', () => {
    // 模擬上一程已經填咗 Fuel Record（tl_fuel_record_completed: true）先起新一程
    const existing = { ...DEFAULT_TECHLOG, tl_fuel_record_completed: true };
    const result = syncTechlogForNewFlight(existing, { flightNo: 'CX902', depIata: 'HKG', arrIata: 'SIN' });
    expect(result.tl_fuel_record_completed).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { CABIN_CREW_NAME_POOL, FLIGHT_DECK_NAME_POOL, generateCrewRoster } from './crewRoster';

describe('generateCrewRoster', () => {
  it('flight_deck count is crew_fd - 1 (commander has its own slot)', () => {
    for (let i = 0; i < 100; i++) {
      const roster = generateCrewRoster({ crew_fd: 3, crew_cc: 10 });
      expect(roster.flight_deck).toHaveLength(2);
    }
  });

  it('cabin_crew count matches crew_cc', () => {
    for (let i = 0; i < 100; i++) {
      const roster = generateCrewRoster({ crew_fd: 2, crew_cc: 12 });
      expect(roster.cabin_crew).toHaveLength(12);
    }
  });

  it('defaults to crew_fd=2/crew_cc=14 when flightData has no override', () => {
    const roster = generateCrewRoster({});
    expect(roster.flight_deck).toHaveLength(1);
    expect(roster.cabin_crew).toHaveLength(14);
  });

  it('never produces a negative flight_deck count when crew_fd is 1', () => {
    // 🌟 crew_cc: 0 同呢個 codebase 成日用嘅 `|| 14` fallback pattern一致，
    // 會當「未設定」處理（0 個 cabin crew 喺客機唔係一個真實情況）
    const roster = generateCrewRoster({ crew_fd: 1, crew_cc: 5 });
    expect(roster.flight_deck).toHaveLength(0);
    expect(roster.cabin_crew).toHaveLength(5);
  });

  it('every name comes from the known pools', () => {
    const roster = generateCrewRoster({ crew_fd: 4, crew_cc: 15 });
    for (const member of roster.flight_deck) {
      expect(FLIGHT_DECK_NAME_POOL).toContain(member.name);
    }
    for (const member of roster.cabin_crew) {
      expect(CABIN_CREW_NAME_POOL).toContain(member.name);
    }
  });

  it('no duplicate names within flight_deck or cabin_crew when count is within pool size', () => {
    const roster = generateCrewRoster({ crew_fd: 5, crew_cc: 20 });
    const fdNames = roster.flight_deck.map((m) => m.name);
    const ccNames = roster.cabin_crew.map((m) => m.name);
    expect(new Set(fdNames).size).toBe(fdNames.length);
    expect(new Set(ccNames).size).toBe(ccNames.length);
  });

  it('the first flight_deck member is T-FO, the rest are T-RP', () => {
    const roster = generateCrewRoster({ crew_fd: 3, crew_cc: 0 });
    expect(roster.flight_deck[0].role).toBe('T-FO');
    expect(roster.flight_deck[1].role).toBe('T-RP');
  });

  it('the first cabin crew member is IC, the rest are CC', () => {
    const roster = generateCrewRoster({ crew_fd: 2, crew_cc: 3 });
    expect(roster.cabin_crew[0].role).toBe('IC');
    expect(roster.cabin_crew[1].role).toBe('CC');
    expect(roster.cabin_crew[2].role).toBe('CC');
  });

  it('most cabin crew are on_duty (only a minority off duty)', () => {
    const roster = generateCrewRoster({ crew_fd: 2, crew_cc: 30 });
    const offDutyCount = roster.cabin_crew.filter((m) => !m.on_duty).length;
    expect(offDutyCount).toBeLessThan(roster.cabin_crew.length / 2);
  });
});

export interface CrewMember {
  name: string;
  role: string;
  on_duty: boolean;
}

export interface CrewRoster {
  flight_deck: CrewMember[];
  cabin_crew: CrewMember[];
}

// 🌟 機長唔喺呢兩個 pool 度——機長用返 commander_override 獨立顯示，
// 呢度淨係生成機長以外嘅機組人員
export const FLIGHT_DECK_NAME_POOL = [
  "MARTIN LEE", "DAVID CHOW", "RAYMOND NG", "KENNETH TSANG", "PHILIP YIP",
  "SIMON HO", "ANDREW FUNG", "BENJAMIN LAU", "ERIC MAK", "JASON YUEN",
];

export const CABIN_CREW_NAME_POOL = [
  "ALEX WONG", "GRACE CHAN", "VIVIAN LAM", "CANDY CHEUNG", "JOYCE TANG",
  "WINNIE HO", "FIONA LEUNG", "STEPHANIE MA", "KAREN CHOI", "IVY SO",
  "MICHELLE KWAN", "SAMANTHA YIP", "ANGELA POON", "CRYSTAL LUI", "NICOLE FONG",
  "TIFFANY CHIU", "PRISCILLA MOK", "REBECCA SIN", "OLIVIA TAM", "HANNAH YEUNG",
  "CHLOE WAN", "ELAINE HUI", "BONNIE KWOK", "SHIRLEY LO", "PAMELA CHU",
  "MELODY SZE", "DORIS AU", "CONNIE CHOW", "JENNY TSUI", "PATRICIA WU",
];

// 🌟 Pool 大細已經 >= zod schema 嘅上限（crew_fd max 10 / crew_cc max 30），
// 正常情況下 shuffle+slice 就已經唔會撞名；modulo cycling 淨係做防呆
function pickNames(pool: string[], count: number): string[] {
  if (count <= 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

export function generateCrewRoster(flightData?: unknown): CrewRoster {
  const fd = flightData as { crew_fd?: number; crew_cc?: number } | undefined;
  const crewFd = fd?.crew_fd || 2;
  const crewCc = fd?.crew_cc || 14;

  // 機長已經有專屬欄位（commander_override）獨立顯示，呢度嘅 flight_deck 淨係
  // 生成機長以外嘅人數（crew_fd - 1）
  const fdCount = Math.max(0, crewFd - 1);
  const ccCount = Math.max(0, crewCc);

  const flight_deck: CrewMember[] = pickNames(FLIGHT_DECK_NAME_POOL, fdCount).map((name, idx) => ({
    name,
    role: idx === 0 ? "T-FO" : "T-RP",
    on_duty: true,
  }));

  // 🌟 現實入面 cabin crew 有輪值休息，唔會全部人同一時間 on duty
  const cabin_crew: CrewMember[] = pickNames(CABIN_CREW_NAME_POOL, ccCount).map((name, idx) => ({
    name,
    role: idx === 0 ? "IC" : "CC",
    on_duty: Math.random() > 0.15,
  }));

  return { flight_deck, cabin_crew };
}

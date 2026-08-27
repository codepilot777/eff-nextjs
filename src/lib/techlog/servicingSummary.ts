// 🌟 Servicing Summary 嘅 uplift 數量未有對應嘅 data model 欄位，純粹裝飾用——
// 隨機生成一啲合理範圍嘅整數（唔可以有小數位）。畀 Commander's Acceptance
// （即場任務，冇 seed，每次打開先生成一次）同 History 個 sector 詳情
// （用返 sector 嘅 id 做 seed）共用同一套邏輯：有 seed 就用確定性 PRNG，
// 揀返同一個 sector 個數字唔會跳嚟跳去；冇 seed 就用真正嘅 Math.random()

// mulberry32：一個好簡單嘅確定性 PRNG
function mulberry32(seed: number) {
  let state = seed | 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export interface ServicingQuantities {
  engineOil: number;
  hydFluid: number;
  idgOil: number;
  apuOil: number;
  potableWater: number;
}

export function generateServicingQuantities(seed?: string): ServicingQuantities {
  const rand = seed ? mulberry32(hashString(seed)) : Math.random;
  const randInt = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));
  return {
    engineOil: randInt(1, 3),
    hydFluid: randInt(1, 2),
    idgOil: randInt(0, 2),
    apuOil: randInt(0, 2),
    potableWater: randInt(85, 100),
  };
}

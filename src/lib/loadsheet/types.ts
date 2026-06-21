// src/lib/loadsheet/types.ts

export interface AircraftAHM560 {
  acType: string;
  reg: string;
  config: string;
  limits: {
    MZFW: number;
    MTOW: number;
    MLAW: number;
  };
  basicData: {
    BW: number;
    BI: number;
  };
  macConstants: {
    refArm: number;
    constant: number;
    lemac: number;
    macLength: number;
  };
  stations: {
    // 🌟 核心升級：加入 primaryClass 屬性，定義該區主要坐咩人
    pax: Record<string, { indexFactor: number; maxPax: number; primaryClass: "J" | "W" | "Y" }>;
    
    cargo: {
      hold1: { indexFactor: number; maxWeight: number };
      hold2: { indexFactor: number; maxWeight: number };
      hold3: { indexFactor: number; maxWeight: number };
      hold4: { indexFactor: number; maxWeight: number };
      bulk: { indexFactor: number; maxWeight: number };
    };
  };
  potableWaterTable: Array<{ fraction: number; weight: number; index: number }>;
  individualFuelTables: {
    mainLeftRight: Array<{ weight: number; index: number }>;
    center: Array<{ weight: number; index: number }>;
  };
  fuelTable: Array<{ weight: number; index: number }>;
}

export interface FlightPayload {
  pax: Record<string, number>; // 頭先已經改咗嘅動態人數
  paxWeights: { J: number; Y: number };
  cargo: { hold1: number; hold2: number; hold3: number; hold4: number; bulk: number };
  waterFraction: number;
  fuel: {
    takeoff: number;
    trip: number;
    isStandard: boolean;
    tanks?: { leftMain: number; center: number; rightMain: number };
  };
}
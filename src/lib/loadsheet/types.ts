// src/lib/loadsheet/types.ts

export interface AircraftAHM560 {
  acType: string;
  reg: string;
  config: string;
  limits: { MZFW: number; MTOW: number; MLAW: number };
  basicData: { BW: number; BI: number };
  macConstants: { refArm: number; constant: number; lemac: number; macLength: number };
  
  stations: {
    pax: { zoneOA: any; zoneOB: any; zoneOC: any; zoneOD: any; };
    cargo: { hold1: any; hold2: any; hold3: any; hold4: any; bulk: any; };
  };
  
  // 🚰 動態食水表 (From Image 7)
  potableWaterTable: Array<{ fraction: number; weight: number; index: number }>;
  
  // ⛽ 燃油重心表
  fuelTable: Array<{ weight: number; index: number }>; // Standard Table (Image 3)
  individualFuelTables: {
    mainLeftRight: Array<{ weight: number; index: number }>; // Main Tank L or R (Image 5)
    center: Array<{ weight: number; index: number }>;        // Center Tank (Image 1)
  };
}

export interface FlightPayload {
  pax: { zoneOA: number; zoneOB: number; zoneOC: number; zoneOD: number };
  paxWeights: { J: number; Y: number };
  cargo: { hold1: number; hold2: number; hold3: number; hold4: number; bulk: number };
  
  // 🚰 食水設定 (0 到 16)
  waterFraction: number; 

  // ⛽ 燃油設定 (支援 Standard 與 Non-Standard)
  fuel: {
    takeoff: number;
    trip: number;
    isStandard: boolean;
    // 如果 isStandard = false，就必須提供個別油箱嘅油量
    tanks?: {
      leftMain: number;
      rightMain: number;
      center: number;
    };
  };
}
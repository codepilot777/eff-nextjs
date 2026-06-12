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
  potableWaterTable: Array<{ fraction: number; weight: number; index: number }>;
  fuelTable: Array<{ weight: number; index: number }>;
  individualFuelTables: {
    mainLeftRight: Array<{ weight: number; index: number }>;
    center: Array<{ weight: number; index: number }>;
  };
}

export interface FlightPayload {
  pax: { zoneOA: number; zoneOB: number; zoneOC: number; zoneOD: number };
  paxWeights: { J: number; Y: number };
  cargo: { hold1: number; hold2: number; hold3: number; hold4: number; bulk: number };
  waterFraction: number; 
  fuel: {
    takeoff: number;
    trip: number;
    isStandard: boolean;
    tanks?: { leftMain: number; rightMain: number; center: number; };
  };
}
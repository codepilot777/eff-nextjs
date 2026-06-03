import { AircraftAHM560 } from './types';

export const B773_BHNQ: AircraftAHM560 = {
  acType: "B773",
  reg: "B-HNQ",
  config: "J42Y396", // 77P Config
  
  limits: { MZFW: 224528, MTOW: 263083, MLAW: 237682 }, // 假設標準限制
  
  // 🌟 來自 Image 4
  basicData: { BW: 152511, BI: 745 },
  
  // B777 MAC 常數 (假設值, 用於將 Index 轉返做 %MAC)
  // 🌟 修正 2：Constant 改為 100，配合精準嘅 B777 RefArm 及 LEMAC
  macConstants: { 
    refArm: 33.15,   // 基準點大約喺機身 33 米位置
    constant: 100,   // 每 100kg 計 1 IU
    lemac: 31.5,     // MAC 起點大約喺 31.5 米
    macLength: 8.2   // MAC 弦長約 8.2 米
  },
  
  // 🌟 來自 Image 6 & 8
  // 左邊 (-) 負數, 右邊 (+) 正數
  stations: {
    pax: {
      zoneOA: { indexFactor: -5, maxPax: 42 },   // Row 11-18
      zoneOB: { indexFactor: -2, maxPax: 60 },   // Row 39-53
      zoneOC: { indexFactor: 1,  maxPax: 150 },  // Row 54-67
      zoneOD: { indexFactor: 4,  maxPax: 186 }   // Row 68-80
    },
    cargo: {
      hold1: { indexFactor: -6, maxWeight: 15105 },
      hold2: { indexFactor: -3, maxWeight: 25400 },
      hold3: { indexFactor: 3,  maxWeight: 20140 },
      hold4: { indexFactor: 5,  maxWeight: 11611 },
      bulk:  { indexFactor: 6,  maxWeight: 4082 }
    }
  },

  potableWaterTable: [
    { fraction: 0, weight: 0, index: 0 },
    { fraction: 1, weight: 54, index: 4 },
    { fraction: 15, weight: 805, index: 53 },
    { fraction: 16, weight: 859, index: 57 }
    // ... 照抄圖 7 填晒佢
  ],

  // ⛽ Individual Fuel Tanks
  individualFuelTables: {
    // Image 5: Main Tank Left or Right (S.G. 0.80 列)
    mainLeftRight: [
      { weight: 0, index: 0 },
      { weight: 500, index: 0 },
      { weight: 1000, index: -1 },
      { weight: 20000, index: 19 },
      { weight: 29674, index: 97 } // Max Left/Right
    ],
    // Image 1: Center Tank (S.G. 0.80 列)
    center: [
      { weight: 0, index: 0 },
      { weight: 1000, index: -7 },
      { weight: 10000, index: -72 },
      { weight: 50000, index: -363 },
      { weight: 81708, index: -607 } // Max Center
    ]
  },
  
  // 🌟 來自 Image 3 (擷取部分關鍵點，S.G. 0.80 列)
  fuelTable: [
    { weight: 0, index: 0 },
    { weight: 10000, index: -5 },
    { weight: 20000, index: -3 },
    { weight: 30000, index: 7 },
    { weight: 42000, index: 46 }, // 你的 Loadsheet 通常 42T
    { weight: 50000, index: 102 },
    { weight: 80000, index: 26 },
    { weight: 100000, index: -118 },
    { weight: 140364, index: -409 }
  ]
};
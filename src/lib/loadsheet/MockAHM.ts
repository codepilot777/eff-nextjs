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
      // 🌟 定義 B-HNQ 的艙等映射
      zoneOA: { indexFactor: -5, maxPax: 42, primaryClass: "J" },  // 42 個 Business
      zoneOB: { indexFactor: -2, maxPax: 60, primaryClass: "Y" },  // 經濟艙開始
      zoneOC: { indexFactor: 1,  maxPax: 150, primaryClass: "Y" }, 
      zoneOD: { indexFactor: 4,  maxPax: 186, primaryClass: "Y" }  
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

export const B77W_BKPA: AircraftAHM560 = {
    "acType": "B77W",
    "reg": "B-KPA",
    "config": "J45W48Y268",
    "limits": {
      "MTOW": 351470,
      "MLAW": 251290,
      "MZFW": 237682
    },
    "basicData": {
      "BW": 169612,
      "BI": 544.0
    },
    "macConstants": {
      "refArm": 33.15,
      "constant": 100,
      "lemac": 31.5,
      "macLength": 8.2
    },
    "stations": {
      pax: {
      // 🌟 定義 B-KPA 的艙等映射 (微調了人數以符合 361 總和)
      zoneOA: { indexFactor: -5.0, maxPax: 45, primaryClass: "J" }, // 45 個 Business
      zoneOB: { indexFactor: -3.0, maxPax: 48, primaryClass: "W" }, // 48 個 PEY
      zoneOC: { indexFactor: -2.0, maxPax: 78, primaryClass: "Y" }, // 經濟艙開始
      zoneOD: { indexFactor: 1.0,  maxPax: 100, primaryClass: "Y" },
      zoneOE: { indexFactor: 4.0,  maxPax: 90, primaryClass: "Y" }
    },
      "cargo": {
        "hold1": {
          "indexFactor": -6.0,
          "maxWeight": 15105
        },
        "hold2": {
          "indexFactor": 0,
          "maxWeight": 25400
        },
        "hold3": {
          "indexFactor": 3.0,
          "maxWeight": 20140
        },
        "hold4": {
          "indexFactor": 0,
          "maxWeight": 12700
        },
        "bulk": {
          "indexFactor": 0,
          "maxWeight": 4082
        }
      }
    },
    "potableWaterTable": [
      {
        "fraction": 1,
        "weight": 84,
        "index": 6.0
      },
      {
        "fraction": 2,
        "weight": 167,
        "index": 11.0
      },
      {
        "fraction": 3,
        "weight": 251,
        "index": 17.0
      },
      {
        "fraction": 4,
        "weight": 335,
        "index": 22.0
      },
      {
        "fraction": 5,
        "weight": 418,
        "index": 28.0
      },
      {
        "fraction": 6,
        "weight": 502,
        "index": 33.0
      },
      {
        "fraction": 7,
        "weight": 586,
        "index": 39.0
      },
      {
        "fraction": 8,
        "weight": 670,
        "index": 44.0
      },
      {
        "fraction": 9,
        "weight": 753,
        "index": 50.0
      },
      {
        "fraction": 10,
        "weight": 837,
        "index": 56.0
      },
      {
        "fraction": 11,
        "weight": 921,
        "index": 61.0
      },
      {
        "fraction": 12,
        "weight": 1004,
        "index": 67.0
      },
      {
        "fraction": 13,
        "weight": 1088,
        "index": 72.0
      },
      {
        "fraction": 14,
        "weight": 1172,
        "index": 78.0
      },
      {
        "fraction": 15,
        "weight": 1255,
        "index": 83.0
      },
      {
        "fraction": 16,
        "weight": 1339,
        "index": 89.0
      }
    ],
    "individualFuelTables": {
      "mainLeftRight": [
        {
          "weight": 500,
          "index": 0.0
        },
        {
          "weight": 1000,
          "index": -1.0
        },
        {
          "weight": 1500,
          "index": -1.0
        },
        {
          "weight": 2000,
          "index": -1.0
        },
        {
          "weight": 2500,
          "index": -2.0
        },
        {
          "weight": 3000,
          "index": -2.0
        },
        {
          "weight": 3500,
          "index": -2.0
        },
        {
          "weight": 4000,
          "index": -2.0
        },
        {
          "weight": 4500,
          "index": -2.0
        },
        {
          "weight": 5000,
          "index": -2.0
        },
        {
          "weight": 5500,
          "index": -2.0
        },
        {
          "weight": 6000,
          "index": -2.0
        },
        {
          "weight": 6500,
          "index": -2.0
        },
        {
          "weight": 7000,
          "index": -2.0
        },
        {
          "weight": 7500,
          "index": -2.0
        },
        {
          "weight": 8000,
          "index": -2.0
        },
        {
          "weight": 8500,
          "index": -2.0
        },
        {
          "weight": 9000,
          "index": -2.0
        },
        {
          "weight": 9500,
          "index": -2.0
        },
        {
          "weight": 10000,
          "index": -2.0
        },
        {
          "weight": 10500,
          "index": -2.0
        },
        {
          "weight": 11000,
          "index": -2.0
        },
        {
          "weight": 11500,
          "index": -2.0
        },
        {
          "weight": 12000,
          "index": -1.0
        },
        {
          "weight": 12500,
          "index": -1.0
        },
        {
          "weight": 13000,
          "index": 0.0
        },
        {
          "weight": 13500,
          "index": 0.0
        },
        {
          "weight": 14000,
          "index": 1.0
        },
        {
          "weight": 14500,
          "index": 2.0
        },
        {
          "weight": 15000,
          "index": 3.0
        },
        {
          "weight": 15500,
          "index": 3.0
        },
        {
          "weight": 16000,
          "index": 4.0
        },
        {
          "weight": 16500,
          "index": 6.0
        },
        {
          "weight": 17000,
          "index": 7.0
        },
        {
          "weight": 17500,
          "index": 8.0
        },
        {
          "weight": 18000,
          "index": 10.0
        },
        {
          "weight": 18500,
          "index": 11.0
        },
        {
          "weight": 19000,
          "index": 13.0
        },
        {
          "weight": 19500,
          "index": 15.0
        },
        {
          "weight": 20000,
          "index": 18.0
        },
        {
          "weight": 20500,
          "index": 20.0
        },
        {
          "weight": 21000,
          "index": 22.0
        },
        {
          "weight": 21500,
          "index": 25.0
        },
        {
          "weight": 22000,
          "index": 28.0
        },
        {
          "weight": 22500,
          "index": 31.0
        },
        {
          "weight": 23000,
          "index": 35.0
        },
        {
          "weight": 23500,
          "index": 39.0
        },
        {
          "weight": 24000,
          "index": 43.0
        },
        {
          "weight": 24500,
          "index": 47.0
        },
        {
          "weight": 25000,
          "index": 51.0
        },
        {
          "weight": 25500,
          "index": 56.0
        },
        {
          "weight": 26000,
          "index": 61.0
        },
        {
          "weight": 26500,
          "index": 66.0
        },
        {
          "weight": 27000,
          "index": 71.0
        },
        {
          "weight": 27500,
          "index": 77.0
        },
        {
          "weight": 28000,
          "index": 83.0
        },
        {
          "weight": 28226,
          "index": 91.0
        },
        {
          "weight": 28500,
          "index": 90.0
        },
        {
          "weight": 28950,
          "index": 94.0
        },
        {
          "weight": 29000,
          "index": 0.0
        },
        {
          "weight": 29500,
          "index": 0.0
        },
        {
          "weight": 29674,
          "index": 0.0
        },
        {
          "weight": 30000,
          "index": 111.0
        },
        {
          "weight": 30412,
          "index": 120.0
        },
        {
          "weight": 30500,
          "index": 120.0
        },
        {
          "weight": 31000,
          "index": 128.0
        },
        {
          "weight": 31500,
          "index": 0.0
        }
      ],
      "center": [
        {
          "weight": 1000,
          "index": -7.0
        },
        {
          "weight": 2000,
          "index": -14.0
        },
        {
          "weight": 3000,
          "index": -21.0
        },
        {
          "weight": 4000,
          "index": -28.0
        },
        {
          "weight": 5000,
          "index": -35.0
        },
        {
          "weight": 6000,
          "index": -42.0
        },
        {
          "weight": 7000,
          "index": -50.0
        },
        {
          "weight": 8000,
          "index": -58.0
        },
        {
          "weight": 9000,
          "index": -66.0
        },
        {
          "weight": 10000,
          "index": -73.0
        },
        {
          "weight": 11000,
          "index": -81.0
        },
        {
          "weight": 12000,
          "index": -89.0
        },
        {
          "weight": 13000,
          "index": -96.0
        },
        {
          "weight": 14000,
          "index": -104.0
        },
        {
          "weight": 15000,
          "index": -112.0
        },
        {
          "weight": 16000,
          "index": -119.0
        },
        {
          "weight": 17000,
          "index": -127.0
        },
        {
          "weight": 18000,
          "index": -134.0
        },
        {
          "weight": 19000,
          "index": -142.0
        },
        {
          "weight": 20000,
          "index": -149.0
        },
        {
          "weight": 21000,
          "index": -156.0
        },
        {
          "weight": 22000,
          "index": -164.0
        },
        {
          "weight": 23000,
          "index": -171.0
        },
        {
          "weight": 24000,
          "index": -178.0
        },
        {
          "weight": 25000,
          "index": -186.0
        },
        {
          "weight": 26000,
          "index": -193.0
        },
        {
          "weight": 27000,
          "index": -200.0
        },
        {
          "weight": 28000,
          "index": -207.0
        },
        {
          "weight": 29000,
          "index": -214.0
        },
        {
          "weight": 30000,
          "index": -222.0
        },
        {
          "weight": 31000,
          "index": -228.0
        },
        {
          "weight": 32000,
          "index": -236.0
        },
        {
          "weight": 33000,
          "index": -243.0
        },
        {
          "weight": 34000,
          "index": -250.0
        },
        {
          "weight": 35000,
          "index": -257.0
        },
        {
          "weight": 36000,
          "index": -264.0
        },
        {
          "weight": 37000,
          "index": -271.0
        },
        {
          "weight": 38000,
          "index": -279.0
        },
        {
          "weight": 39000,
          "index": -286.0
        },
        {
          "weight": 40000,
          "index": -293.0
        },
        {
          "weight": 41000,
          "index": -300.0
        },
        {
          "weight": 42000,
          "index": -307.0
        },
        {
          "weight": 43000,
          "index": -315.0
        },
        {
          "weight": 44000,
          "index": -322.0
        },
        {
          "weight": 45000,
          "index": -329.0
        },
        {
          "weight": 46000,
          "index": -336.0
        },
        {
          "weight": 47000,
          "index": -343.0
        },
        {
          "weight": 48000,
          "index": -351.0
        },
        {
          "weight": 49000,
          "index": -358.0
        },
        {
          "weight": 50000,
          "index": -365.0
        },
        {
          "weight": 51000,
          "index": -372.0
        },
        {
          "weight": 52000,
          "index": -379.0
        },
        {
          "weight": 53000,
          "index": -386.0
        },
        {
          "weight": 54000,
          "index": -394.0
        },
        {
          "weight": 55000,
          "index": -401.0
        },
        {
          "weight": 56000,
          "index": -408.0
        },
        {
          "weight": 57000,
          "index": -415.0
        },
        {
          "weight": 58000,
          "index": -422.0
        },
        {
          "weight": 59000,
          "index": -430.0
        },
        {
          "weight": 60000,
          "index": -437.0
        },
        {
          "weight": 61000,
          "index": -444.0
        },
        {
          "weight": 62000,
          "index": -451.0
        },
        {
          "weight": 63000,
          "index": -458.0
        },
        {
          "weight": 64000,
          "index": -466.0
        },
        {
          "weight": 65000,
          "index": -473.0
        },
        {
          "weight": 66000,
          "index": -480.0
        },
        {
          "weight": 67000,
          "index": -488.0
        },
        {
          "weight": 68000,
          "index": -495.0
        },
        {
          "weight": 69000,
          "index": -503.0
        },
        {
          "weight": 70000,
          "index": -511.0
        },
        {
          "weight": 71000,
          "index": -519.0
        },
        {
          "weight": 72000,
          "index": -527.0
        },
        {
          "weight": 73000,
          "index": -535.0
        },
        {
          "weight": 74000,
          "index": -543.0
        },
        {
          "weight": 75000,
          "index": -551.0
        },
        {
          "weight": 76000,
          "index": -560.0
        },
        {
          "weight": 77000,
          "index": -568.0
        },
        {
          "weight": 78000,
          "index": -577.0
        },
        {
          "weight": 79000,
          "index": -586.0
        },
        {
          "weight": 80000,
          "index": -595.0
        },
        {
          "weight": 81000,
          "index": -602.0
        },
        {
          "weight": 82000,
          "index": -610.0
        },
        {
          "weight": 83000,
          "index": -615.0
        },
        {
          "weight": 84000,
          "index": 0.0
        },
        {
          "weight": 84100,
          "index": 0.0
        }
      ]
    },
    "fuelTable": [
      {
        "weight": 1000,
        "index": -1.0
      },
      {
        "weight": 2000,
        "index": -1.0
      },
      {
        "weight": 3000,
        "index": -2.0
      },
      {
        "weight": 4000,
        "index": -3.0
      },
      {
        "weight": 5000,
        "index": -3.0
      },
      {
        "weight": 6000,
        "index": -4.0
      },
      {
        "weight": 7000,
        "index": -4.0
      },
      {
        "weight": 8000,
        "index": -4.0
      },
      {
        "weight": 9000,
        "index": -4.0
      },
      {
        "weight": 10000,
        "index": -5.0
      },
      {
        "weight": 11000,
        "index": -5.0
      },
      {
        "weight": 12000,
        "index": -5.0
      },
      {
        "weight": 13000,
        "index": -4.0
      },
      {
        "weight": 14000,
        "index": -4.0
      },
      {
        "weight": 15000,
        "index": -4.0
      },
      {
        "weight": 16000,
        "index": -4.0
      },
      {
        "weight": 17000,
        "index": -4.0
      },
      {
        "weight": 18000,
        "index": -3.0
      },
      {
        "weight": 19000,
        "index": -3.0
      },
      {
        "weight": 20000,
        "index": -3.0
      },
      {
        "weight": 21000,
        "index": -2.0
      },
      {
        "weight": 22000,
        "index": -2.0
      },
      {
        "weight": 23000,
        "index": -1.0
      },
      {
        "weight": 24000,
        "index": 0.0
      },
      {
        "weight": 25000,
        "index": 1.0
      },
      {
        "weight": 26000,
        "index": 2.0
      },
      {
        "weight": 27000,
        "index": 3.0
      },
      {
        "weight": 28000,
        "index": 4.0
      },
      {
        "weight": 29000,
        "index": 5.0
      },
      {
        "weight": 30000,
        "index": 7.0
      },
      {
        "weight": 31000,
        "index": 9.0
      },
      {
        "weight": 32000,
        "index": 11.0
      },
      {
        "weight": 33000,
        "index": 13.0
      },
      {
        "weight": 34000,
        "index": 15.0
      },
      {
        "weight": 35000,
        "index": 18.0
      },
      {
        "weight": 36000,
        "index": 21.0
      },
      {
        "weight": 37000,
        "index": 24.0
      },
      {
        "weight": 38000,
        "index": 28.0
      },
      {
        "weight": 39000,
        "index": 32.0
      },
      {
        "weight": 40000,
        "index": 36.0
      },
      {
        "weight": 41000,
        "index": 41.0
      },
      {
        "weight": 42000,
        "index": 46.0
      },
      {
        "weight": 43000,
        "index": 51.0
      },
      {
        "weight": 44000,
        "index": 57.0
      },
      {
        "weight": 45000,
        "index": 64.0
      },
      {
        "weight": 46000,
        "index": 70.0
      },
      {
        "weight": 47000,
        "index": 77.0
      },
      {
        "weight": 48000,
        "index": 85.0
      },
      {
        "weight": 49000,
        "index": 93.0
      },
      {
        "weight": 50000,
        "index": 102.0
      },
      {
        "weight": 51000,
        "index": 111.0
      },
      {
        "weight": 52000,
        "index": 120.0
      },
      {
        "weight": 53000,
        "index": 130.0
      },
      {
        "weight": 54000,
        "index": 141.0
      },
      {
        "weight": 55000,
        "index": 152.0
      },
      {
        "weight": 56000,
        "index": 164.0
      },
      {
        "weight": 57000,
        "index": 177.0
      },
      {
        "weight": 58000,
        "index": 188.0
      },
      {
        "weight": 59000,
        "index": 181.0
      },
      {
        "weight": 60000,
        "index": 175.0
      },
      {
        "weight": 61000,
        "index": 168.0
      },
      {
        "weight": 62000,
        "index": 161.0
      },
      {
        "weight": 63000,
        "index": 154.0
      },
      {
        "weight": 64000,
        "index": 146.0
      },
      {
        "weight": 65000,
        "index": 139.0
      },
      {
        "weight": 66000,
        "index": 131.0
      },
      {
        "weight": 67000,
        "index": 124.0
      },
      {
        "weight": 68000,
        "index": 116.0
      },
      {
        "weight": 69000,
        "index": 108.0
      },
      {
        "weight": 70000,
        "index": 101.0
      },
      {
        "weight": 71000,
        "index": 93.0
      },
      {
        "weight": 72000,
        "index": 85.0
      },
      {
        "weight": 73000,
        "index": 78.0
      },
      {
        "weight": 74000,
        "index": 70.0
      },
      {
        "weight": 75000,
        "index": 63.0
      },
      {
        "weight": 76000,
        "index": 55.0
      },
      {
        "weight": 77000,
        "index": 48.0
      },
      {
        "weight": 78000,
        "index": 41.0
      },
      {
        "weight": 79000,
        "index": 33.0
      },
      {
        "weight": 80000,
        "index": 26.0
      },
      {
        "weight": 81000,
        "index": 19.0
      },
      {
        "weight": 82000,
        "index": 11.0
      },
      {
        "weight": 83000,
        "index": 4.0
      },
      {
        "weight": 84000,
        "index": -3.0
      },
      {
        "weight": 85000,
        "index": -10.0
      },
      {
        "weight": 86000,
        "index": -17.0
      },
      {
        "weight": 87000,
        "index": -25.0
      },
      {
        "weight": 88000,
        "index": -32.0
      },
      {
        "weight": 89000,
        "index": -39.0
      },
      {
        "weight": 90000,
        "index": -46.0
      },
      {
        "weight": 91000,
        "index": -53.0
      },
      {
        "weight": 92000,
        "index": -60.0
      },
      {
        "weight": 93000,
        "index": -68.0
      },
      {
        "weight": 94000,
        "index": -75.0
      },
      {
        "weight": 95000,
        "index": -82.0
      },
      {
        "weight": 96000,
        "index": -89.0
      },
      {
        "weight": 97000,
        "index": -96.0
      },
      {
        "weight": 98000,
        "index": -104.0
      },
      {
        "weight": 99000,
        "index": -111.0
      },
      {
        "weight": 100000,
        "index": -118.0
      },
      {
        "weight": 101000,
        "index": -125.0
      },
      {
        "weight": 102000,
        "index": -132.0
      },
      {
        "weight": 103000,
        "index": -140.0
      },
      {
        "weight": 104000,
        "index": -147.0
      },
      {
        "weight": 105000,
        "index": -154.0
      },
      {
        "weight": 106000,
        "index": -161.0
      },
      {
        "weight": 107000,
        "index": -169.0
      },
      {
        "weight": 108000,
        "index": -176.0
      },
      {
        "weight": 109000,
        "index": -183.0
      },
      {
        "weight": 110000,
        "index": -190.0
      },
      {
        "weight": 111000,
        "index": -197.0
      },
      {
        "weight": 112000,
        "index": -205.0
      },
      {
        "weight": 113000,
        "index": -212.0
      },
      {
        "weight": 114000,
        "index": -219.0
      },
      {
        "weight": 115000,
        "index": -226.0
      },
      {
        "weight": 116000,
        "index": -234.0
      },
      {
        "weight": 117000,
        "index": -241.0
      },
      {
        "weight": 118000,
        "index": -248.0
      },
      {
        "weight": 119000,
        "index": -255.0
      },
      {
        "weight": 120000,
        "index": -263.0
      },
      {
        "weight": 121000,
        "index": -270.0
      },
      {
        "weight": 122000,
        "index": -278.0
      },
      {
        "weight": 123000,
        "index": -285.0
      },
      {
        "weight": 124000,
        "index": -293.0
      },
      {
        "weight": 125000,
        "index": -300.0
      },
      {
        "weight": 126000,
        "index": -308.0
      },
      {
        "weight": 127000,
        "index": -316.0
      },
      {
        "weight": 128000,
        "index": -323.0
      },
      {
        "weight": 129000,
        "index": -331.0
      },
      {
        "weight": 130000,
        "index": -339.0
      },
      {
        "weight": 131000,
        "index": -348.0
      },
      {
        "weight": 132000,
        "index": -356.0
      },
      {
        "weight": 133000,
        "index": -364.0
      },
      {
        "weight": 133517,
        "index": -369.0
      },
      {
        "weight": 134000,
        "index": -373.0
      },
      {
        "weight": 135000,
        "index": -382.0
      },
      {
        "weight": 136000,
        "index": -391.0
      },
      {
        "weight": 136940,
        "index": -399.0
      },
      {
        "weight": 138000,
        "index": 0.0
      },
      {
        "weight": 139000,
        "index": 0.0
      },
      {
        "weight": 140000,
        "index": 0.0
      },
      {
        "weight": 140364,
        "index": 0.0
      }
    ]
  }

export const AIRCRAFT_REGISTRY: Record<string, AircraftAHM560> = {
  "B-HNQ": B773_BHNQ,
  "B-KPA": B77W_BKPA, // 👈 遲啲新機復活，直接喺度塞入嚟，成個系統完全唔使大改！
};
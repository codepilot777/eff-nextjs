// 🌟 完整 NOTOC 欄位（跟返教官手動輸入表格個格式一致）：
// STATION of Unloading / Air Waybill Number / UN or ID No. / Proper Shipping Name /
// Class or Division / Sub Hazard / Net Quantity / Radio-active Mat. Categ. / PG /
// Emergency Phone Number / IMP Code / ERG / CAO / Loaded ULD/IOD / POS
export interface NotocEntry {
  station_of_unloading: string;
  awb_number: string;
  un_number: string;
  proper_shipping_name: string;
  class_division: string;
  sub_hazard: string;
  net_quantity: string;
  radioactive_category: string;
  packing_group: string;
  emergency_phone: string;
  imp_code: string;
  erg: string;
  cao: string; // "Y" / "N"
  loaded_uld: string;
  position: string;
}

export interface Notoc {
  hasDg: boolean;
  items: NotocEntry[];
  generated_at: string;
}

// 🌟 隨機演習用嘅樣本 DG pool——編號/品名/危險品分類跟返真實 IATA DGR 慣例嘅格式，
// 但 IMP Code/ERG 呢啲細節係訓練用嘅示範值，唔係逐一核實過嘅正式規例對照表
interface RandomDgTemplate {
  un_number: string;
  proper_shipping_name: string;
  class_division: string;
  sub_hazard: string;
  net_quantity: string;
  radioactive_category: string;
  packing_group: string;
  imp_code: string;
  erg: string;
  cao: string;
}

export const DG_ITEM_POOL: RandomDgTemplate[] = [
  {
    un_number: "UN3480",
    proper_shipping_name: "Lithium Ion Batteries",
    class_division: "9",
    sub_hazard: "—",
    net_quantity: "32 KG",
    radioactive_category: "N/A",
    packing_group: "II",
    imp_code: "RLI",
    erg: "9L",
    cao: "Y",
  },
  {
    un_number: "UN1845",
    proper_shipping_name: "Dry Ice (Carbon Dioxide, Solid)",
    class_division: "9",
    sub_hazard: "—",
    net_quantity: "10 KG",
    radioactive_category: "N/A",
    packing_group: "III",
    imp_code: "ICE",
    erg: "9L",
    cao: "N",
  },
  {
    un_number: "UN2794",
    proper_shipping_name: "Batteries, Wet, Filled With Acid",
    class_division: "8",
    sub_hazard: "—",
    net_quantity: "180 KG",
    radioactive_category: "N/A",
    packing_group: "III",
    imp_code: "EBA",
    erg: "8L",
    cao: "N",
  },
  {
    un_number: "UN1044",
    proper_shipping_name: "Fire Extinguishers",
    class_division: "2.2",
    sub_hazard: "—",
    net_quantity: "72 KG",
    radioactive_category: "N/A",
    packing_group: "N/A",
    imp_code: "RCM",
    erg: "2L",
    cao: "N",
  },
  {
    un_number: "UN3373",
    proper_shipping_name: "Biological Substance, Category B",
    class_division: "6.2",
    sub_hazard: "—",
    net_quantity: "3 KG",
    radioactive_category: "N/A",
    packing_group: "N/A",
    imp_code: "RBI",
    erg: "6L",
    cao: "N",
  },
];

const HOLD_POSITIONS = ["H1", "H2", "H3", "H4", "BULK"];

// 🌟 教官手動編輯／隨機生成都會用嘅假想 24 小時緊急聯絡電話——特登標明 fictional，
// 唔會同任何真實電話號碼撞名
const FICTIONAL_EMERGENCY_PHONE = "+XX XXXX XXXX (fictional 24hr contact)";

function randomAwbNumber(): string {
  const prefix = 100 + Math.floor(Math.random() * 800);
  const serial = 10000000 + Math.floor(Math.random() * 90000000);
  return `${prefix}-${serial}`;
}

// 🌟 現實入面大部分航班都冇夾帶危險品——0 件先係最常見嘅結果，唔可以將
// 「有 DG」設做預設/高機率結果，否則呢個 random exercise 會脫離現實訓練場景
export function generateRandomNotoc(flightData?: { arr_icao?: string }): Notoc {
  const arrIcao = flightData?.arr_icao || "N/A";
  const roll = Math.random();
  let itemCount = 0;
  if (roll > 0.9) itemCount = 2;
  else if (roll > 0.6) itemCount = 1;

  const shuffled = [...DG_ITEM_POOL].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, itemCount);
  const shuffledPositions = [...HOLD_POSITIONS].sort(() => Math.random() - 0.5);
  const shuffledUlds = HOLD_POSITIONS.map(() => `AKE${10000 + Math.floor(Math.random() * 89999)}CX`);

  const items: NotocEntry[] = picked.map((item, idx) => ({
    ...item,
    station_of_unloading: arrIcao,
    awb_number: randomAwbNumber(),
    emergency_phone: FICTIONAL_EMERGENCY_PHONE,
    loaded_uld: shuffledUlds[idx % shuffledUlds.length],
    position: shuffledPositions[idx % shuffledPositions.length],
  }));

  return {
    hasDg: items.length > 0,
    items,
    generated_at: new Date().toISOString(),
  };
}

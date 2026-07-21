export interface DgItem {
  un_number: string;
  proper_shipping_name: string;
  class_division: string;
  packing_group: string;
  quantity: string;
  handling_note: string;
}

export const DG_ITEM_POOL: DgItem[] = [
  {
    un_number: "UN3480",
    proper_shipping_name: "Lithium Ion Batteries",
    class_division: "9",
    packing_group: "II",
    quantity: "4 x Cartons, 32kg gross",
    handling_note: "CAO - Cargo Aircraft Only. Not permitted on passenger aircraft per current variant.",
  },
  {
    un_number: "UN1845",
    proper_shipping_name: "Dry Ice (Carbon Dioxide, Solid)",
    class_division: "9",
    packing_group: "III",
    quantity: "2 x Cartons, 5kg net each",
    handling_note: "Ventilated area only. Max 200kg per aircraft, position must allow venting.",
  },
  {
    un_number: "UN2794",
    proper_shipping_name: "Batteries, Wet, Filled With Acid",
    class_division: "8",
    packing_group: "III",
    quantity: "1 x Pallet, 180kg gross",
    handling_note: "Load upright only. Keep segregated from oxidizers and foodstuffs.",
  },
  {
    un_number: "UN1044",
    proper_shipping_name: "Fire Extinguishers",
    class_division: "2.2",
    packing_group: "N/A",
    quantity: "6 x Units, 12kg each",
    handling_note: "Protect valves from damage. No cargo stacked on top.",
  },
  {
    un_number: "UN3373",
    proper_shipping_name: "Biological Substance, Category B",
    class_division: "6.2",
    packing_group: "N/A",
    quantity: "1 x Carton, 3kg net",
    handling_note: "Keep away from heat. Notify crew of position for temperature monitoring.",
  },
];

const HOLD_POSITIONS = ["H1", "H2", "H3", "H4", "BULK"];

export interface NotocEntry extends DgItem {
  position: string;
}

export interface Notoc {
  hasDg: boolean;
  items: NotocEntry[];
  generated_at: string;
}

// 🌟 現實入面大部分航班都冇夾帶危險品——0 件先係最常見嘅結果，唔可以將
// 「有 DG」設做預設/高機率結果，否則呢個 random exercise 會脫離現實訓練場景
export function generateRandomNotoc(flightData?: unknown): Notoc {
  void flightData;
  const roll = Math.random();
  let itemCount = 0;
  if (roll > 0.9) itemCount = 2;
  else if (roll > 0.6) itemCount = 1;

  const shuffled = [...DG_ITEM_POOL].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, itemCount);
  const shuffledPositions = [...HOLD_POSITIONS].sort(() => Math.random() - 0.5);

  const items: NotocEntry[] = picked.map((item, idx) => ({
    ...item,
    position: shuffledPositions[idx % shuffledPositions.length],
  }));

  return {
    hasDg: items.length > 0,
    items,
    generated_at: new Date().toISOString(),
  };
}

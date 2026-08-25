"use client";
import { useState } from "react";
import { useFlightData } from "@/hooks/useFlightData";
import type { NotocEntry } from "@/lib/dg/dgRegistry";

const BLANK_ITEM: NotocEntry = {
  station_of_unloading: "",
  awb_number: "",
  un_number: "",
  proper_shipping_name: "",
  class_division: "",
  sub_hazard: "",
  net_quantity: "",
  radioactive_category: "",
  packing_group: "",
  emergency_phone: "",
  imp_code: "",
  erg: "",
  cao: "",
  loaded_uld: "",
  position: "",
};

// 🌟 表格欄位一一對應教官手動輸入嘅真實 NOTOC 格式：
// STATION of Unloading / Air Waybill Number / UN or ID No. / Proper Shipping Name /
// Class or Division / Sub Hazard / Net Quantity / Radio-active Mat. Categ. / PG /
// Emergency Phone Number / IMP Code / ERG / CAO / Loaded ULD/IOD / POS
const FIELDS: Array<{ key: keyof NotocEntry; label: string; placeholder: string }> = [
  { key: "station_of_unloading", label: "Station of Unloading", placeholder: "HKG" },
  { key: "awb_number", label: "Air Waybill Number", placeholder: "160-12345678" },
  { key: "un_number", label: "UN or ID No.", placeholder: "UN1993" },
  { key: "proper_shipping_name", label: "Proper Shipping Name", placeholder: "Flammable liquid, n.o.s. (contains Xylene)" },
  { key: "class_division", label: "Class/Div", placeholder: "3" },
  { key: "sub_hazard", label: "Sub Hazard", placeholder: "—" },
  { key: "net_quantity", label: "Net Quantity", placeholder: "10 KG" },
  { key: "radioactive_category", label: "Radio-active Mat. Categ.", placeholder: "N/A" },
  { key: "packing_group", label: "PG", placeholder: "II" },
  { key: "emergency_phone", label: "Emergency Phone Number", placeholder: "+XX XXXX XXXX (fictional 24hr contact)" },
  { key: "imp_code", label: "IMP Code", placeholder: "FLS" },
  { key: "erg", label: "ERG", placeholder: "3H" },
  { key: "cao", label: "CAO", placeholder: "N" },
  { key: "loaded_uld", label: "Loaded ULD/IOD", placeholder: "AKE12345CX" },
  { key: "position", label: "POS", placeholder: "1L" },
];

export default function NOTOCTab() {
  const { flightData, updateFlightData } = useFlightData();

  const [items, setItems] = useState<NotocEntry[]>(() => flightData?.notoc?.items || []);
  const [draft, setDraft] = useState<NotocEntry>({ ...BLANK_ITEM });
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 教官成份 NOTOC 通常係喺 Excel/Sheets 度整定，逐格拷貝落嚟太慢——呢個 textarea
  // 收成段 tab-分隔嘅內容（一行一件 item，欄位順序同 FIELDS 一致），一次過拆晒落 items
  const [pasteText, setPasteText] = useState("");

  if (!flightData) return null;

  const updateDraft = (key: keyof NotocEntry, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddItem = () => {
    if (!draft.un_number.trim() || !draft.proper_shipping_name.trim()) {
      alert("UN or ID No. and Proper Shipping Name are required.");
      return;
    }
    setItems((prev) => [...prev, draft]);
    setDraft({ ...BLANK_ITEM });
  };

  // 🌟 由 Excel/Sheets 拷貝落嚟嘅內容一定係 tab 分隔——一行一件 item，15 個欄位順序
  // 同 FIELDS 一致（可以連埋標題行一齊 paste，會自動識別跳過）
  const handleParsePaste = () => {
    const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;

    const parsed: NotocEntry[] = [];
    const skippedLines: number[] = [];

    lines.forEach((line, idx) => {
      const cols = line.split('\t').map((c) => c.trim());
      // 標題行（"STATION of Unloading" 嗰行）唔係真正 data，跳過
      if (idx === 0 && /station.*unload/i.test(cols[0] || '')) return;
      if (cols.length < FIELDS.length) {
        skippedLines.push(idx + 1);
        return;
      }
      const entry: NotocEntry = { ...BLANK_ITEM };
      FIELDS.forEach((f, i) => {
        entry[f.key] = cols[i] ?? "";
      });
      if (!entry.un_number.trim() || !entry.proper_shipping_name.trim()) {
        skippedLines.push(idx + 1);
        return;
      }
      parsed.push(entry);
    });

    if (parsed.length > 0) {
      setItems((prev) => [...prev, ...parsed]);
    }
    setPasteText("");

    if (skippedLines.length > 0) {
      alert(`Parsed ${parsed.length} item(s). Skipped line(s) ${skippedLines.join(', ')} — wrong column count or missing UN No./Proper Shipping Name.`);
    } else if (parsed.length > 0) {
      alert(`Parsed and added ${parsed.length} item(s) from pasted data.`);
    } else {
      alert("No valid rows found to parse. Make sure columns are tab-separated in the STATION of Unloading → POS order.");
    }
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setIsSaving(true);
    updateFlightData({
      notoc: {
        hasDg: items.length > 0,
        items,
        generated_at: new Date().toISOString(),
      },
    });
    setIsSaving(false);
    alert(items.length > 0 ? "NOTOC saved and published to EFB!" : "NOTOC cleared (NIL) and published to EFB!");
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="bg-lido-800 border-2 border-[#00bfa5]/50 rounded-xl p-6">
        <h5 className="text-[#00bfa5] font-black tracking-widest mb-2 uppercase">📋 Paste from Spreadsheet</h5>
        <p className="text-[#8fa0a6] text-xs mb-3">
          Copy rows straight from Excel/Sheets (header row optional) — 15 tab-separated columns in
          STATION of Unloading → POS order — and paste below. Each line becomes one item.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"HKG\t160-12345678\tUN1993\tFlammable liquid, n.o.s. (contains Xylene)\t3\t—\t10 KG\tN/A\tII\t+XX XXXX XXXX (fictional 24hr contact)\tFLS\t3H\tN\tAKE12345CX\t1L"}
          className="w-full bg-lido-950 border border-[#404040] rounded-md p-3 text-white text-xs font-mono h-28 outline-none focus:border-[#00bfa5] transition-colors resize-none"
        />
        <button
          onClick={handleParsePaste}
          disabled={!pasteText.trim()}
          className="w-full mt-3 bg-[#00bfa5] text-black py-3 rounded-lg font-black tracking-widest uppercase hover:bg-[#00E676] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⚡ Parse & Add All Rows
        </button>
      </div>

      <div className="bg-lido-800 border border-[#333333] rounded-xl p-6">
        <h5 className="text-white font-bold mb-4">☣️ Add Dangerous Goods Item</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-[#8fa0a6] text-[0.65rem] font-bold uppercase tracking-widest">{f.label}</label>
              <input
                type="text"
                value={draft[f.key]}
                onChange={(e) => updateDraft(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="bg-lido-950 border border-[#404040] rounded-md p-2.5 text-white text-sm outline-none focus:border-[#00bfa5] transition-colors"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleAddItem}
          className="w-full mt-4 bg-[#2979FF]/20 border-2 border-[#2979FF] text-[#2979FF] py-3 rounded-lg font-black tracking-widest uppercase hover:bg-[#2979FF]/30 transition-colors"
        >
          ➕ Add Item to NOTOC
        </button>
      </div>

      <div className="bg-lido-800 border border-[#333333] rounded-xl p-6">
        <h5 className="text-white font-bold mb-4">📋 Current NOTOC ({items.length} item{items.length === 1 ? "" : "s"})</h5>
        {items.length === 0 ? (
          <div className="text-[#8fa0a6] text-sm italic font-mono">NIL — no dangerous goods items added.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[0.7rem] whitespace-nowrap">
              <thead>
                <tr className="text-[#8fa0a6] text-[0.6rem] uppercase tracking-widest border-b border-[#333]">
                  <th className="pb-2 pr-3">UN No.</th>
                  <th className="pb-2 pr-3">Proper Shipping Name</th>
                  <th className="pb-2 pr-3">Class</th>
                  <th className="pb-2 pr-3">PG</th>
                  <th className="pb-2 pr-3">Net Qty</th>
                  <th className="pb-2 pr-3">ULD</th>
                  <th className="pb-2 pr-3">POS</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#222]">
                    <td className="py-2 pr-3 text-[#FF9100] font-bold">{item.un_number}</td>
                    <td className="py-2 pr-3 text-white whitespace-normal min-w-[10rem]">{item.proper_shipping_name}</td>
                    <td className="py-2 pr-3">{item.class_division}</td>
                    <td className="py-2 pr-3">{item.packing_group}</td>
                    <td className="py-2 pr-3">{item.net_quantity}</td>
                    <td className="py-2 pr-3 text-[#00bfa5]">{item.loaded_uld}</td>
                    <td className="py-2 pr-3 text-[#00bfa5] font-bold">{item.position}</td>
                    <td className="py-2">
                      <button onClick={() => handleRemoveItem(idx)} className="text-[#FF1744] hover:text-white font-bold px-2">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-[#C6FF00] text-black py-4 rounded-lg font-black tracking-widest hover:bg-[#00c853] mt-2 shadow-lg disabled:opacity-50"
      >
        {isSaving ? "⏳ SAVING..." : "💾 SAVE & PUBLISH NOTOC TO EFB"}
      </button>
    </div>
  );
}

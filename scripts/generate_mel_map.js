// scripts/generate_mel_map.js
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../src/lib/mel/mel_map_pmdg.csv'); 
const tsPath = path.join(__dirname, '../src/data/melToPmdgMap.ts');

try {
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);

  let startIndex = lines[0].toUpperCase().includes('PMDG_ID') ? 1 : 0;
  
  // 🧠 核心防護：用一個臨時物件在記憶體儲存不重複的結果
  const memoryMap = {};
  let duplicateCount = 0;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 3) continue;

    const pmdgId = parts[0].trim();
    const pmdgTitle = parts[1].trim();

    for (let j = 2; j < parts.length; j++) {
      const mel = parts[j].trim();
      if (!mel) continue;

      // 🚨 檢查是否已經存在此 MEL Code
      if (memoryMap[mel]) {
        console.warn(`⚠️ [CSV 數據重複警告]: MEL [${mel}] 同時映射了 [${memoryMap[mel].pmdgId}] 與 [${pmdgId}]。腳本將自動保留第一筆，跳過此行重複項。`);
        duplicateCount++;
        continue; // 跳過，不寫入
      }

      // 順利登錄記憶體
      memoryMap[mel] = { pmdgId, pmdgTitle };
    }
  }

  // 📝 開始組裝 TypeScript 內容
  let tsContent = `// 🚀 自動生成的反向映射字典 (Auto-generated from CSV)
// 請勿手動修改此檔案，更新映射請修改 mel_map_pmdg.csv 並重新執行腳本

export interface MappingValue {
  pmdgId: string;
  pmdgTitle: string;
}

export const MEL_TO_PMDG_MAP: Record<string, MappingValue> = {\n`;

  // 將記憶體去重後的乾淨數據寫入
  Object.keys(memoryMap).forEach(mel => {
    const { pmdgId, pmdgTitle } = memoryMap[mel];
    tsContent += `  "${mel}": { pmdgId: "${pmdgId}", pmdgTitle: "${pmdgTitle}" },\n`;
  });

  tsContent += `};\n`;

  fs.writeFileSync(tsPath, tsContent);
  console.log(`\n==================================================`);
  console.log(`✅ [大腦字典去重成功]！`);
  console.log(`📦 成功導出 ${Object.keys(memoryMap).length} 條核心不重複 MEL 條款`);
  if (duplicateCount > 0) {
    console.log(`🛑 已自動攔截並粉碎 ${duplicateCount} 條 CSV 重複衝突項（請看上方警告）`);
  }
  console.log(`==================================================\n`);

} catch (error) {
  console.error("❌ 發生錯誤，請確保 mel_map_pmdg.csv 存在！", error);
}
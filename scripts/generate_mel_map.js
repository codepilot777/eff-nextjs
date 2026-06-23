// scripts/generate_mel_map.js
const fs = require('fs');
const path = require('path');

// 設定檔案路徑 (假設 CSV 喺專案根目錄)
const csvPath = path.join(__dirname, '../src/lib/mel/mel_map_pmdg.csv'); 
const tsPath = path.join(__dirname, '../src/data/melToPmdgMap.ts');

try {
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  // 按行分割，並過濾掉空行
  const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);

  let tsContent = `// 🚀 自動生成的反向映射字典 (Auto-generated from CSV)
// 請勿手動修改此檔案，更新映射請修改 mel_map_pmdg.csv 並重新執行腳本

export interface MappingValue {
  pmdgId: string;
  pmdgTitle: string;
}

export const MEL_TO_PMDG_MAP: Record<string, MappingValue> = {\n`;

  // 判斷第一行是否有 Header，有的話從 index 1 開始
  let startIndex = lines[0].toUpperCase().includes('PMDG_ID') ? 1 : 0;
  let mapCount = 0;

  for (let i = startIndex; i < lines.length; i++) {
    // 假設格式：PMDG_ID,PMDG_TITLE,MEL_1,MEL_2,MEL_3...
    const parts = lines[i].split(',');
    if (parts.length < 3) continue;

    const pmdgId = parts[0].trim();
    const pmdgTitle = parts[1].trim();

    // 迴圈讀取後面所有的 MEL Code (因為一對多)
    for (let j = 2; j < parts.length; j++) {
      const mel = parts[j].trim();
      if (mel) {
        tsContent += `  "${mel}": { pmdgId: "${pmdgId}", pmdgTitle: "${pmdgTitle}" },\n`;
        mapCount++;
      }
    }
  }

  tsContent += `};\n`;

  fs.writeFileSync(tsPath, tsContent);
  console.log(`✅ 大功告成！成功映射 ${mapCount} 條 MEL，已生成檔案：${tsPath}`);

} catch (error) {
  console.error("❌ 發生錯誤，請確保 mel_map_pmdg.csv 存在！", error);
}
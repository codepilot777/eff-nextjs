// 🌟 已經打咗落嚟嘅機場程序庫——加新機場就加個 <ICAO>.json(同 VHHH.json
// 一樣嘅形狀，睇 lib/nav/procedures.ts)，再喺呢度加一行 import/export。
// db.ts 嘅 seedBundledProcedures() 會喺呢度嘅機場喺 DB 入面仲未有紀錄嗰陣,
// 自動幫手 seed 一次做起始數據——之後教官喺 IOS 編輯過,DB 入面嗰份就會
// 蓋過呢度嘅 bundled 版本，唔會畀呢份檔案嘅內容覆寫返教官嘅修改
import vhhh from "./VHHH.json";
import rckh from "./RCKH.json";
import rctp from "./RCTP.json";
import rjaa from "./RJAA.json";
import rjbb from "./RJBB.json";
import rjff from "./RJFF.json";
import rjtt from "./RJTT.json";
import vmmc from "./VMMC.json";

export const BUNDLED_PROCEDURES: Record<string, unknown> = {
  VHHH: vhhh,
  RCKH: rckh,
  RCTP: rctp,
  RJAA: rjaa,
  RJBB: rjbb,
  RJFF: rjff,
  RJTT: rjtt,
  VMMC: vmmc,
};

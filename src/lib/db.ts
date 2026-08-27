import { createClient } from '@libsql/client';

// 🌟 全局單一 DB Client：避免每個 request 都重新建立連線
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let schemaReady: Promise<unknown> | null = null;

// 🌟 修復：舊 schema 用 flight_no 本身做 PRIMARY KEY，令教官起第二個同 flight number
// 嘅 session 會直接 REPLACE 咗（=刪走）第一個。而家改用一個真正嘅 UUID（見
// /api/simbrief/route.ts）做 id，flight_no 淨係普通欄位，容許重複。
// SQLite 冇得直接改一個已存在 table 嘅 PRIMARY KEY，所以要 rename→重新起→搬資料→
// 刪舊 table；用 PRAGMA table_info 檢查 id 欄位係咪已經係 PK，等呢個 migration
// 淨係行一次
async function migrateFlightsTable() {
  const tableCheck = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='flights'`
  );

  if (tableCheck.rows.length === 0) {
    // 全新 DB：直接用新 schema 起，唔使 migrate
    await db.execute(`CREATE TABLE flights (id TEXT PRIMARY KEY, flight_no TEXT, data JSON)`);
  } else {
    const cols = await db.execute(`PRAGMA table_info(flights)`);
    const hasIdPk = cols.rows.some((r) => r.name === 'id' && Number(r.pk) === 1);

    if (!hasIdPk) {
      // 舊資料冇 id 就用返佢哋原本嘅 flight_no 頂替，等舊已分享/書籤咗嘅
      // ?id= 連結唔會斷（以前 _db_id 一直都係 flight_no）
      await db.batch(
        [
          `ALTER TABLE flights RENAME TO flights_old`,
          `CREATE TABLE flights (id TEXT PRIMARY KEY, flight_no TEXT, data JSON)`,
          `INSERT INTO flights (id, flight_no, data) SELECT flight_no, flight_no, data FROM flights_old`,
          `DROP TABLE flights_old`,
        ],
        'write'
      );
    }
  }

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_flights_flight_no ON flights(flight_no)`);
}

// 🌟 只喺 process 第一次用到 DB 時執行一次 migration，唔使每個 request 都 CREATE TABLE IF NOT EXISTS
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = Promise.all([
      migrateFlightsTable(),
      db.execute(`CREATE TABLE IF NOT EXISTS techlogs (reg TEXT PRIMARY KEY, data TEXT)`),
    ]).catch((err) => {
      // 如果失敗，下次 request 要俾機會再試一次
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export default db;

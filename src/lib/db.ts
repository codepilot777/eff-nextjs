import { createClient } from '@libsql/client';

// 🌟 全局單一 DB Client：避免每個 request 都重新建立連線
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:eff_database.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let schemaReady: Promise<unknown> | null = null;

// 🌟 只喺 process 第一次用到 DB 時執行一次 migration，唔使每個 request 都 CREATE TABLE IF NOT EXISTS
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = db.batch(
      [
        `CREATE TABLE IF NOT EXISTS flights (flight_no TEXT PRIMARY KEY, data JSON)`,
        `CREATE TABLE IF NOT EXISTS techlogs (reg TEXT PRIMARY KEY, data TEXT)`,
      ],
      'write'
    ).catch((err) => {
      // 如果失敗，下次 request 要俾機會再試一次
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export default db;

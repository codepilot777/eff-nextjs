import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await ensureSchema();

    // 🌟 非同步執行 SQL 查詢，取得所有航班記錄
    const result = await db.execute('SELECT id, data FROM flights');

    // Turso 的多筆資料會放在 result.rows 陣列裡
    let flights = result.rows.map((r) => {
      // 確保 data 轉換回 JSON，並補上 _db_id 供前端辨識
      // 🌟 _db_id 而家係真正嘅 UUID（睇 db.ts 嘅 migration），唔再係 flight_no——
      // 兩個教官起嘅 session 可以同一個 flight number 都唔會互相 overwrite
      const parsed = JSON.parse(r.data as string);
      parsed._db_id = r.id;
      return parsed;
    });

    // 🌟 修復：以前淨係睇 client 傳嚟嘅 ?role=Trainee 先過濾——但兩個真正 call 呢個
    // route 嘅地方（flight-select/page.tsx、instructor/page.tsx）都冇帶呢個參數，
    // 過濾從來冇運作過，任何人都見到晒所有未 publish 嘅草稿。改為由 server 判斷
    // 「教官登入咗未」，未登入一律淨係見到已 publish 嘅航班。
    if (!isInstructorAuthed(request)) {
      flights = flights.filter((f: any) => f.is_published === true);
    }

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Database fetch all error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
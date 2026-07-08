import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 可能是 "Trainee" 或 "Instructor"

    await ensureSchema();

    // 🌟 非同步執行 SQL 查詢，取得所有航班記錄
    const result = await db.execute('SELECT flight_no, data FROM flights');
    
    // Turso 的多筆資料會放在 result.rows 陣列裡
    let flights = result.rows.map((r) => {
      // 確保 data 轉換回 JSON，並補上 _db_id 供前端辨識
      const parsed = JSON.parse(r.data as string);
      parsed._db_id = r.flight_no; 
      return parsed;
    });

    // 🌟 權限過濾：學員 (Trainee) 只能看到已發佈 (Published) 的航班
    if (role === 'Trainee') {
      flights = flights.filter((f: any) => f.is_published === true);
    }

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Database fetch all error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';

export async function GET(request: Request) {
  // 從 URL 獲取 flight id，例如 /api/flight?id=CPA%20564
  const { searchParams } = new URL(request.url);
  const flightKey = searchParams.get('id') || 'CPA 564';

  try {
    await ensureSchema();

    // 🌟 非同步執行 SQL 查詢——id 而家係真正嘅 UUID（睇 db.ts 嘅 migration），
    // 唔再係 flight_no，等兩個 flight number 相同嘅 session 可以並存
    // 🌟 raw_simbrief 而家係獨立欄（睇 db.ts 嘅 comment），呢度攞埋佢，
    // 砌返落 flightData 度——前端一直讀開嘅 flightData.raw_simbrief.xxx 唔使改
    const result = await db.execute({
      sql: 'SELECT data, raw_simbrief FROM flights WHERE id = ?',
      args: [flightKey]
    });

    // Turso 的結果會放在 rows 陣列中，我們取第一筆
    const row = result.rows[0];

    if (row && row.data) {
      // 將字串解析回 JSON Object (加上 as string 確保 TypeScript 不會報錯)
      const flightData = JSON.parse(row.data as string);
      flightData.raw_simbrief = row.raw_simbrief ? JSON.parse(row.raw_simbrief as string) : null;

      // 🌟 修復：同 /api/flights 一樣嘅缺口——未 publish 嘅草稿唔應該畀未登入嘅人
      // 靠估/enumerate flight_no 直接讀到。教官喺 /instructor/ios 準備緊嘅草稿
      // 仍然睇到（有 session cookie）；未登入嘅一律當唔存在，唔洩露有呢個 flight。
      if (!flightData.is_published && !isInstructorAuthed(request)) {
        return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
      }

      return NextResponse.json(flightData);
    } else {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
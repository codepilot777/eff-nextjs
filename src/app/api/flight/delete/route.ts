import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';
import { flightDeleteBodySchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    if (!isInstructorAuthed(request)) {
      return NextResponse.json({ error: 'Instructor login required' }, { status: 401 });
    }

    const parsed = flightDeleteBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing flight id' }, { status: 400 });
    }
    const { id } = parsed.data;

    await ensureSchema();

    // 🌟 修復：刪 flight 以前唔會清埋佢自己嗰條 techlog row（techlogs.flight_id
    // 而家同 flights.id 一一對應），會留低一條永遠冇 flight 再會揾返嚟嘅孤兒
    // row。SQLite 冇辦法幫一個已存在嘅 table 追加 FOREIGN KEY ... ON DELETE
    // CASCADE（要成個 table 重建，而且舊資料嘅 techlog row 係用 reg 頂替
    // flight_id，未必真係對應到任何 flights.id，追溯性咁加真正嘅 FK constraint
    // 反而會炸），所以喺 application 層一齊刪——用 batch 保持兩個 DELETE 同一個
    // transaction，唔會出現「flight 冇咗但 techlog 仲喺度」嘅中間狀態
    const [flightInfo] = await db.batch(
      [
        { sql: 'DELETE FROM flights WHERE id = ?', args: [id] },
        { sql: 'DELETE FROM techlogs WHERE flight_id = ?', args: [id] },
      ],
      'write'
    );

    // 🌟 Turso 傳回的變更行數名稱叫 rowsAffected
    if (flightInfo.rowsAffected > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete flight:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
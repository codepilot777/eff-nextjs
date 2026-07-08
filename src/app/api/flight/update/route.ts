import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';
import { flightUpdateBodySchema, hasProtectedFlightFields } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    // 1. 從前端獲取傳遞過來嘅 JSON Payload
    // 🌟 `data` 而家係一份「部分更新」(patch)，唔再係成個 flight object
    // 咁樣先可以喺 server 端做 merge，避免教官/機師兩個人同時寫，
    // 一方用返舊(stale) snapshot 蓋走咗另一方啱啱寫低嘅欄位
    const parsed = flightUpdateBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
    }
    const { id, data } = parsed.data;

    // 🌟 is_published/activated_version 呢類欄位淨係教官先可以改，
    // 其餘 fuel/loadsheet 等欄位保持開放俾機師 workspace 寫入
    if (hasProtectedFlightFields(data) && !isInstructorAuthed(request)) {
      return NextResponse.json({ error: 'Instructor login required' }, { status: 401 });
    }

    await ensureSchema();

    // 2. 用 interactive transaction 讀最新一份 row，喺 server 端 merge patch,
    //    再寫返去，收窄 read-modify-write 嘅 race window
    const tx = await db.transaction('write');
    try {
      const result = await tx.execute({
        sql: 'SELECT data FROM flights WHERE flight_no = ?',
        args: [id],
      });
      const row = result.rows[0];

      if (!row || !row.data) {
        await tx.rollback();
        return NextResponse.json({ error: 'Flight not found in database' }, { status: 404 });
      }

      const current = JSON.parse(row.data as string);
      const merged = { ...current, ...data };

      await tx.execute({
        sql: 'UPDATE flights SET data = ? WHERE flight_no = ?',
        args: [JSON.stringify(merged), id],
      });

      await tx.commit();
      return NextResponse.json({ success: true, message: 'Flight updated successfully', data: merged });
    } catch (err) {
      await tx.rollback();
      throw err;
    } finally {
      tx.close();
    }
  } catch (error) {
    console.error('Failed to update flight data:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

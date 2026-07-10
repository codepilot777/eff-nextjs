import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';
import { flightUpdateBodySchema, requiresInstructorAuthForFlight } from '@/lib/validation';
import { applyFlightDirectives } from '@/lib/flight/directives';

export async function POST(request: Request) {
  try {
    // 1. 從前端獲取傳遞過來嘅 JSON Payload
    // 🌟 `data` + directive 欄位（pdcApprove/atisDeliver/acarsDispatchAppend/...）
    // 喺 server 端同最新一份 row merge，避免教官/機師兩個人同時寫，
    // 一方用返舊(stale) snapshot 蓋走咗另一方啱啱寫低嘅欄位（包括 pdc_requests/
    // atis_requests/acars_messages 呢啲 array）
    const parsed = flightUpdateBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
    }
    const { id, ...patch } = parsed.data;

    // 🌟 is_published/activated_version 呢類欄位、同埋 pdcApprove/atisDeliver/
    // acarsDispatchAppend 呢啲「扮 ATC/DISPATCH 回覆」嘅動作，淨係教官先可以做，
    // 其餘 fuel/loadsheet/送 PDC-ATIS-ACARS request 等動作保持開放俾機師 workspace 寫入
    if (requiresInstructorAuthForFlight(patch) && !isInstructorAuthed(request)) {
      return NextResponse.json({ error: 'Instructor login required' }, { status: 401 });
    }

    await ensureSchema();

    // 2. 用 interactive transaction 讀最新一份 row，喺 server 端 apply directives,
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
      const merged = applyFlightDirectives(current, patch);

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

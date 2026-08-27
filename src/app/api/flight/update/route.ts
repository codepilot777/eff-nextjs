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
    // 🌟 raw_simbrief（起機嗰刻嘅完整 SimBrief 原始回應）而家係獨立欄，唔再喺
    // `data` JSON 入面——CPA 880 呢類 flight 嘅 data 曾經去到 ~2MB，99.7% 都係
    // 呢個欄，但呢度嘅日常 patch（fuel/PDC/ATIS/ACARS/checklist...）從來冇改過
    // 佢，淨係 ofpActivate 會（Object.assign 咗個歷史版本嘅 snapshot 落 merged）。
    // 用 reference 唔同咗嚟判斷使唔使連埋呢個欄一齊寫，避免日常寫入都要無辜
    // 搬呢 2MB
    const tx = await db.transaction('write');
    try {
      const result = await tx.execute({
        sql: 'SELECT data, raw_simbrief FROM flights WHERE id = ?',
        args: [id],
      });
      const row = result.rows[0];

      if (!row || !row.data) {
        await tx.rollback();
        return NextResponse.json({ error: 'Flight not found in database' }, { status: 404 });
      }

      const current = JSON.parse(row.data as string);
      current.raw_simbrief = row.raw_simbrief ? JSON.parse(row.raw_simbrief as string) : null;

      const merged = applyFlightDirectives(current, patch);

      const rawSimbriefChanged = merged.raw_simbrief !== current.raw_simbrief;
      const { raw_simbrief: mergedRawSimbrief, ...dataToStore } = merged;

      if (rawSimbriefChanged) {
        await tx.execute({
          sql: 'UPDATE flights SET data = ?, raw_simbrief = ? WHERE id = ?',
          args: [JSON.stringify(dataToStore), JSON.stringify(mergedRawSimbrief ?? null), id],
        });
      } else {
        await tx.execute({
          sql: 'UPDATE flights SET data = ? WHERE id = ?',
          args: [JSON.stringify(dataToStore), id],
        });
      }

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

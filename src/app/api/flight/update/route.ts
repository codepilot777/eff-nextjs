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
    // 🌟 raw_simbrief（起機嗰刻嘅完整 SimBrief 原始回應）同 ofp_history（歷史 OFP
    // 版本，每個版本入面又帶多一份自己嘅 raw_simbrief）而家都係獨立欄，唔再喺
    // `data` JSON 入面——CPA 880 呢類 flight 嘅 data 曾經去到 ~2MB，99.7% 都係
    // raw_simbrief。但呢度嘅日常 patch（fuel/PDC/ATIS/ACARS/checklist...）從來
    // 冇改過呢兩個欄，淨係 ofpActivate 會覆寫 raw_simbrief（Object.assign 咗個
    // 歷史版本嘅 snapshot），ofpDispatchAppend 先會加新版本落 ofp_history。用
    // reference 唔同咗嚟判斷使唔使連埋邊個欄一齊寫，避免日常寫入都要無辜搬呢啲
    // 大 blob——version 數量本身好少（好少超過 3 個），總儲存量唔係問題，
    // 問題係唔可以每次 read/write 都要郁晒所有版本
    const tx = await db.transaction('write');
    try {
      const result = await tx.execute({
        sql: 'SELECT data, raw_simbrief, ofp_history FROM flights WHERE id = ?',
        args: [id],
      });
      const row = result.rows[0];

      if (!row || !row.data) {
        await tx.rollback();
        return NextResponse.json({ error: 'Flight not found in database' }, { status: 404 });
      }

      const current = JSON.parse(row.data as string);
      current.raw_simbrief = row.raw_simbrief ? JSON.parse(row.raw_simbrief as string) : null;
      current.ofp_history = row.ofp_history ? JSON.parse(row.ofp_history as string) : [];

      const merged = applyFlightDirectives(current, patch);

      const rawSimbriefChanged = merged.raw_simbrief !== current.raw_simbrief;
      const ofpHistoryChanged = merged.ofp_history !== current.ofp_history;
      const { raw_simbrief: mergedRawSimbrief, ofp_history: mergedOfpHistory, ...dataToStore } = merged;

      const setClauses = ['data = ?'];
      const updateArgs: unknown[] = [JSON.stringify(dataToStore)];
      if (rawSimbriefChanged) {
        setClauses.push('raw_simbrief = ?');
        updateArgs.push(JSON.stringify(mergedRawSimbrief ?? null));
      }
      if (ofpHistoryChanged) {
        setClauses.push('ofp_history = ?');
        updateArgs.push(JSON.stringify(mergedOfpHistory ?? null));
      }
      updateArgs.push(id);

      await tx.execute({
        sql: `UPDATE flights SET ${setClauses.join(', ')} WHERE id = ?`,
        args: updateArgs as (string | number | null)[],
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

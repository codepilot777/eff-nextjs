import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { aircraftRegSchema, requiresInstructorAuth, techlogPostBodySchema } from '@/lib/validation';
import { isInstructorAuthed } from '@/lib/auth';
import { applyTechLogDirectives } from '@/lib/techlog/directives';
import { DEFAULT_TECHLOG } from '@/lib/techlog/techlogContinuity';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regParam = aircraftRegSchema.safeParse(searchParams.get('reg'));

    if (!regParam.success) {
      return NextResponse.json({ error: 'Missing reg parameter' }, { status: 400 });
    }
    const reg = regParam.data;

    await ensureSchema();

    const result = await db.execute({
      sql: 'SELECT data FROM techlogs WHERE reg = ?',
      args: [reg]
    });

    const row = result.rows[0];
    if (row && row.data) {
      return NextResponse.json(JSON.parse(row.data as string));
    } else {
      return NextResponse.json(DEFAULT_TECHLOG);
    }
  } catch (error) {
    // 🌟 加強 Error Log，等你在 Terminal 睇得清清楚楚
    console.error('Techlog GET DB Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 🌟 `data` + directive 欄位（defectUpdate/defectAppend/tlEntryAppend/...）
    // 喺 server 端同最新一份 row merge，避免教官/機師兩邊同時寫，一方用舊 snapshot
    // 蓋走另一方啱啱寫低嘅欄位（包括 defects/tl_entries/flights 呢啲 array）
    const parsed = techlogPostBodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing reg or data payload', details: parsed.error.issues }, { status: 400 });
    }
    const { reg, ...patch } = parsed.data;

    // 🌟 ENGINEER 專屬動作（release/checks/fluids/CRS/sign-off/clear-defer defect）
    // 一定要教官登入先做得，唔再淨係靠前端隱藏返啲掣
    if (requiresInstructorAuth(patch) && !isInstructorAuthed(request)) {
      return NextResponse.json({ error: 'Instructor login required' }, { status: 401 });
    }

    await ensureSchema();

    const tx = await db.transaction('write');
    try {
      const result = await tx.execute({
        sql: 'SELECT data FROM techlogs WHERE reg = ?',
        args: [reg],
      });
      const row = result.rows[0];
      const current = row && row.data ? JSON.parse(row.data as string) : {};
      const merged = applyTechLogDirectives(current, patch);

      await tx.execute({
        sql: 'REPLACE INTO techlogs (reg, data) VALUES (?, ?)',
        args: [reg, JSON.stringify(merged)],
      });

      await tx.commit();
      return NextResponse.json({ success: true, message: 'TechLog data synchronized', data: merged });
    } catch (err) {
      await tx.rollback();
      throw err;
    } finally {
      tx.close();
    }
  } catch (error) {
    console.error('Techlog POST DB Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

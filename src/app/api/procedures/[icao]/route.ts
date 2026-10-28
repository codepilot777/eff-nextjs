import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';
import { isInstructorAuthed } from '@/lib/auth';
import { airportProceduresSchema } from '@/lib/nav/procedures';

// 🌟 機場 SID/STAR/fix/hold 程序庫嘅 CRUD——GET 俾任何人讀(IOS 教官畫面要
// 用嚟揀 STAR/SID、ND iframe 要用嚟 snap-to-fix，trainee 睇到都冇所謂，呢度
// 冇任何「扮教官」嘅劇本資料，純粹係地理參考)，PUT 先要教官登入(同
// scenario_sigmets_raw 果類欄位一樣嘅保護理由——呢份係教官自己打落嚟嘅內容)
export async function GET(_request: Request, { params }: { params: Promise<{ icao: string }> }) {
  const { icao: icaoRaw } = await params;
  const icao = icaoRaw.trim().toUpperCase();
  if (!icao) return NextResponse.json({ error: 'icao is required' }, { status: 400 });

  await ensureSchema();
  const result = await db.execute({ sql: 'SELECT data FROM procedures WHERE icao = ?', args: [icao] });
  const row = result.rows[0];
  if (!row) return NextResponse.json({ data: null });
  return NextResponse.json({ data: JSON.parse(row.data as string) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ icao: string }> }) {
  const { icao: icaoRaw } = await params;
  const icao = icaoRaw.trim().toUpperCase();
  if (!icao) return NextResponse.json({ error: 'icao is required' }, { status: 400 });

  if (!isInstructorAuthed(request)) {
    return NextResponse.json({ error: 'Instructor login required' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = airportProceduresSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid procedures payload', details: parsed.error.issues }, { status: 400 });
  }

  await ensureSchema();
  await db.execute({
    sql: `INSERT INTO procedures (icao, data) VALUES (?, ?)
          ON CONFLICT(icao) DO UPDATE SET data = excluded.data`,
    args: [icao, JSON.stringify(parsed.data)],
  });

  return NextResponse.json({ success: true, data: parsed.data });
}

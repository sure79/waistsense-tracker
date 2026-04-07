import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSlot, sendPushToAll } from '@/lib/webpush';

// cron-job.org에서 10분마다 호출
// Authorization: Bearer CRON_SECRET 헤더 필요
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slot = getCurrentSlot();
  if (!slot) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Not a scheduled time' });
  }

  const result = await sendPushToAll(slot.title, slot.body);
  console.log(`Push sent [${slot.id}]: ${JSON.stringify(result)}`);

  return NextResponse.json({ ok: true, slot: slot.id, ...result });
}

// 헬스체크
export async function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}

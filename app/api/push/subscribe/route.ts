import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription, deleteSubscription } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys } = body;
    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }
    await saveSubscription({ endpoint, auth: keys.auth, p256dh: keys.p256dh });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Subscribe error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    await deleteSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Unsubscribe error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

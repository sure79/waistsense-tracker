import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/webpush';

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}

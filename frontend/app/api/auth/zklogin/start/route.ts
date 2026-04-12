import { NextResponse } from 'next/server';
import { generateLoginUrl } from '@/lib/zklogin';

export async function POST() {
  try {
    const loginUrl = await generateLoginUrl();
    return NextResponse.json({ url: loginUrl });
  } catch (error) {
    console.error('zkLogin start error:', error);
    return NextResponse.json(
      { error: 'Failed to generate login URL' },
      { status: 500 },
    );
  }
}

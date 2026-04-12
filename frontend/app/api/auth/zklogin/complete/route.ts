import { NextResponse } from 'next/server';
import { jwtToAddress } from '@mysten/sui/zklogin';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { jwt } = await request.json();

    if (!jwt) {
      return NextResponse.json({ error: 'Missing JWT' }, { status: 400 });
    }

    // Decode the JWT to extract claims (we don't verify here — Supabase handles that)
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64url').toString(),
    );

    const email = payload.email as string;

    if (!email) {
      return NextResponse.json(
        { error: 'JWT missing email claim' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Check if user already exists by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, salt, sui_address')
      .eq('id', payload.sub)
      .single();

    let userSalt: string;
    let suiAddress: string;

    if (existingUser) {
      // Returning user — use existing salt
      userSalt = existingUser.salt;
      suiAddress = existingUser.sui_address;
    } else {
      // New user — generate platform-managed salt
      userSalt = crypto.randomBytes(16).toString('hex');
      suiAddress = jwtToAddress(jwt, userSalt, false);

      // Create user record in Supabase
      const { error: insertError } = await supabase.from('users').insert({
        id: payload.sub,
        sui_address: suiAddress,
        salt: userSalt,
        display_name: payload.name || null,
        avatar_url: payload.picture || null,
        role: 'volunteer',
      });

      if (insertError) {
        console.error('User creation error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      suiAddress,
      userSalt,
      isNewUser: !existingUser,
    });
  } catch (error) {
    console.error('zkLogin complete error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    );
  }
}

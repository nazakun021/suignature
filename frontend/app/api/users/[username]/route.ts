import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { username } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { data, error } = await supabase
      .from('users')
      .select(
        'username, display_name, bio, avatar_url, social_links, sui_address, created_at',
      )
      .eq('username', username)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

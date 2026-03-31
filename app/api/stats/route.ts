import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 20; // ISR: revalidate every 20 seconds

export async function GET() {
  try {
    // ── Online now: discover_sessions active in last 3 minutes ──────────────
    const stale = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { count: onlineNow } = await supabaseAdmin
      .from('discover_sessions')
      .select('*', { count: 'exact', head: true })
      .gt('last_seen_at', stale);

    // ── Chats today: room_participants joined in the last 24h ────────────────
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: chatsToday } = await supabaseAdmin
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .gte('joined_at', since24h);

    // ── Total profiles (all-time users) ────────────────────────────────────
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // ── Active rooms ────────────────────────────────────────────────────────
    const { count: activeRooms } = await supabaseAdmin
      .from('room_participants')
      .select('room_id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('last_seen_at', stale);

    return NextResponse.json({
      ok: true,
      data: {
        onlineNow:   onlineNow  ?? 0,
        chatsToday:  chatsToday ?? 0,
        totalUsers:  totalUsers ?? 0,
        activeRooms: activeRooms ?? 0,
      },
    });
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json({
      ok: true,
      data: { onlineNow: 0, chatsToday: 0, totalUsers: 0, activeRooms: 0 },
    });
  }
}

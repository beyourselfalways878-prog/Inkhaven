import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STALE_THRESHOLD_MINUTES = 3;

// ─── GET: List currently discoverable users ────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let myUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      myUserId = user?.id ?? null;
    }

    const staleThreshold = new Date(
      Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000
    ).toISOString();

    let query = supabaseAdmin
      .from('discover_sessions')
      .select('user_id, ink_id, display_name, comfort_level, last_seen_at')
      .gt('last_seen_at', staleThreshold)
      .order('last_seen_at', { ascending: false })
      .limit(50);

    // Exclude self
    if (myUserId) {
      query = query.neq('user_id', myUserId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Count total (including self) for "X souls online" display
    const { count } = await supabaseAdmin
      .from('discover_sessions')
      .select('*', { count: 'exact', head: true })
      .gt('last_seen_at', staleThreshold);

    return NextResponse.json({
      ok:    true,
      data:  data ?? [],
      total: count ?? 0,
    });
  } catch (err) {
    console.error('Discover GET error:', err);
    return NextResponse.json({ ok: true, data: [], total: 0 });
  }
}

// ─── POST: Join / leave / resonate ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── Leave ──
    if (action === 'leave') {
      await supabaseAdmin.from('discover_sessions').delete().eq('user_id', user.id);
      return NextResponse.json({ ok: true });
    }

    // ── Resonate (send invite to target user) ──
    if (action === 'resonate') {
      const { targetUserId, inviterName, roomId } = body;
      if (!targetUserId || !roomId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
      }

      // Broadcast invite on target's personal channel
      const channel = supabaseAdmin.channel(`user_${targetUserId}`);
      await channel.send({
        type:    'broadcast',
        event:   'invite',
        payload: { roomId, inviterName: inviterName ?? 'Anonymous' },
      });
      await supabaseAdmin.removeChannel(channel);

      return NextResponse.json({ ok: true });
    }

    // ── Join (heartbeat upsert) ──
    // Fetch profile for ink_id / display_name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('ink_id, display_name, comfort_level')
      .eq('id', user.id)
      .single();

    const inkId = profile?.ink_id ?? `ink_${user.id.replace(/-/g, '').slice(0, 8)}`;

    // Ensure profile row exists (anonymous users may not have one)
    if (!profile) {
      await supabaseAdmin.from('profiles').upsert(
        { id: user.id, ink_id: inkId, is_ephemeral: true },
        { onConflict: 'id' }
      );
    }

    // Upsert discover session — last_seen_at keeps refreshing (heartbeat)
    await supabaseAdmin.from('discover_sessions').upsert({
      user_id:       user.id,
      ink_id:        inkId,
      display_name:  profile?.display_name ?? null,
      comfort_level: profile?.comfort_level ?? 'balanced',
      last_seen_at:  new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return NextResponse.json({ ok: true, data: { inkId } });
  } catch (err) {
    console.error('Discover POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

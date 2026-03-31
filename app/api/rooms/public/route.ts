import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Seeded public rooms — always available
const SEED_ROOMS = [
  { id: 'room_vibes',       name: '🌊 Vibes Only',       topic: 'vibes',       description: 'No agenda. Just good energy and good people.' },
  { id: 'room_music',       name: '🎵 Music Minds',      topic: 'music',       description: 'Share what you are listening to right now.' },
  { id: 'room_gaming',      name: '🎮 Gaming Lounge',    topic: 'gaming',      description: 'Games, memes, and no gatekeeping.' },
  { id: 'room_latenight',   name: '🌙 Late Night',       topic: 'latenight',   description: 'When you cannot sleep and need someone to talk to.' },
  { id: 'room_confessions', name: '🖊️ Ink Confessions', topic: 'confessions', description: 'Say what you cannot say anywhere else. Judged by no one.' },
  { id: 'room_random',      name: '🎲 Chaos Room',       topic: 'random',      description: 'Anything goes. Total randomness.' },
  { id: 'room_india',       name: '🇮🇳 India Talks',     topic: 'india',       description: 'Desi gossip, news, and random conversations.' },
];

export async function GET() {
  try {
    // Get active user counts per room using room_participants
    const { data: participants } = await supabaseAdmin
      .from('room_participants')
      .select('room_id')
      .eq('is_active', true)
      .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // active in last 5 min

    // Count participants per room
    const counts: Record<string, number> = {};
    for (const p of participants ?? []) {
      counts[p.room_id] = (counts[p.room_id] ?? 0) + 1;
    }

    const rooms = SEED_ROOMS.map((r) => ({
      ...r,
      onlineCount: counts[r.id] ?? 0,
    }));

    return NextResponse.json({ ok: true, data: rooms });
  } catch (error) {
    console.error('Failed to fetch public rooms:', error);
    // Return seed rooms without counts as fallback
    return NextResponse.json({ ok: true, data: SEED_ROOMS.map(r => ({ ...r, onlineCount: 0 })) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = await req.json();
    if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

    // Ensure profile exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      const inkId = `ink_${user.id.replace(/-/g, '').slice(0, 8)}`;
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        ink_id: inkId,
        display_name: 'Anonymous',
        is_ephemeral: true,
      });
    }

    // Upsert participant as active
    await supabaseAdmin.from('room_participants').upsert({
      room_id: roomId,
      user_id: user.id,
      last_seen_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'room_id,user_id' });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Join public room failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

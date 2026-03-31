import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob | null;
    const roomSlug = formData.get('roomId') as string | null;

    if (!audioBlob || !roomSlug) {
      return NextResponse.json({ error: 'Missing audio or roomId' }, { status: 400 });
    }

    if (audioBlob.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json({ error: 'Audio exceeds 5MB limit' }, { status: 400 });
    }

    const type = audioBlob.type;
    if (!type.startsWith('audio/webm') && !type.startsWith('audio/mp4') && !type.startsWith('audio/ogg')) {
        return NextResponse.json({ error: 'Invalid audio format' }, { status: 400 });
    }

    const filename = `rooms/${roomSlug}/${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
    
    // Upload to 'room-audio' bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from('room-audio')
      .upload(filename, audioBlob, { contentType: type, cacheControl: '31536000' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage.from('room-audio').getPublicUrl(filename);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('ink_id')
      .eq('id', user.id)
      .single();

    const inkId = profile?.ink_id ?? `ink_${user.id.replace(/-/g, '').slice(0, 8)}`;

    // Save as message in group_messages table
    const { error: msgError } = await supabaseAdmin.from('group_messages').insert({
      room_slug: roomSlug,
      content: `[audio]:${publicUrl}`,
      sender_id: user.id,
      sender_ink: inkId,
      is_system: false
    });

    if (msgError) throw msgError;

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Voice note upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

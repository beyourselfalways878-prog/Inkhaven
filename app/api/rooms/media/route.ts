import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const roomSlug = formData.get('roomSlug') as string | null;

    if (!file || !roomSlug) {
      return NextResponse.json({ error: 'Missing file or roomSlug' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF and WebP are allowed' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `Max file size is ${MAX_SIZE_MB}MB` }, { status: 400 });
    }

    // Upload to Supabase Storage bucket "room-media"
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `rooms/${roomSlug}/${user.id}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('room-media')
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL (bucket must be set to public in Supabase dashboard)
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('room-media')
      .getPublicUrl(path);

    // Also persist as a group_messages entry with the image URL
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('ink_id')
      .eq('id', user.id)
      .single();

    const inkId = profile?.ink_id ?? `ink_${user.id.replace(/-/g, '').slice(0, 8)}`;

    await supabaseAdmin.from('group_messages').insert({
      room_slug:  roomSlug,
      sender_id:  user.id,
      sender_ink: inkId,
      content:    `[image]:${publicUrl}`,
      is_system:  false,
    });

    return NextResponse.json({ ok: true, data: { url: publicUrl } });
  } catch (err) {
    console.error('Room media upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

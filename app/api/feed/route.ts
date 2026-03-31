import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: Fetch active feed posts with reaction counts ────────────────────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sort = url.searchParams.get('sort') || 'recent';
    const authHeader = req.headers.get('authorization');
    let viewerUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      viewerUserId = user?.id ?? null;
    }

    // Fetch posts that haven't expired, newest first
    const { data: posts, error } = await supabaseAdmin
      .from('feed_posts')
      .select('id, author_id, author_ink, content, expires_at, created_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!posts || posts.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    // Batch-fetch reaction counts for all posts
    const postIds = posts.map(p => p.id);

    const { data: reactions } = await supabaseAdmin
      .from('feed_reactions')
      .select('post_id, reaction, user_id')
      .in('post_id', postIds);

    // Build reaction maps
    const resonateCounts: Record<string, number> = {};
    const dismissCounts: Record<string, number> = {};
    const myReactions: Record<string, 'resonate' | 'dismiss' | null> = {};

    for (const r of reactions ?? []) {
      if (r.reaction === 'resonate') resonateCounts[r.post_id] = (resonateCounts[r.post_id] ?? 0) + 1;
      if (r.reaction === 'dismiss')  dismissCounts[r.post_id]  = (dismissCounts[r.post_id]  ?? 0) + 1;
      if (viewerUserId && r.user_id === viewerUserId) myReactions[r.post_id] = r.reaction;
    }

    const enriched = posts.map(p => ({
      id:             p.id,
      authorInkId:    p.author_ink,
      content:        p.content,
      resonateCount:  resonateCounts[p.id] ?? 0,
      dismissCount:   dismissCounts[p.id]  ?? 0,
      myReaction:     myReactions[p.id]    ?? null,
      createdAt:      new Date(p.created_at).getTime(),
      expiresAt:      new Date(p.expires_at).getTime(),
    }));

    if (sort === 'trending') {
      enriched.sort((a, b) => {
        const scoreA = a.resonateCount - a.dismissCount;
        const scoreB = b.resonateCount - b.dismissCount;
        if (scoreA === scoreB) return b.createdAt - a.createdAt;
        return scoreB - scoreA;
      });
    }

    return NextResponse.json({ ok: true, data: enriched });
  } catch (err) {
    console.error('Feed GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── POST: Create post or react ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, postId, content } = body;

    // ── React ──
    if (action === 'resonate' || action === 'dismiss') {
      if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

      // Check if post exists and isn't expired
      const { data: post } = await supabaseAdmin
        .from('feed_posts')
        .select('id')
        .eq('id', postId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!post) return NextResponse.json({ error: 'Post not found or expired' }, { status: 404 });

      // Check existing reaction
      const { data: existing } = await supabaseAdmin
        .from('feed_reactions')
        .select('reaction')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existing?.reaction === action) {
        // Toggle off — DELETE
        await supabaseAdmin.from('feed_reactions').delete()
          .eq('post_id', postId).eq('user_id', user.id);
        return NextResponse.json({ ok: true, toggled: false });
      }

      // Upsert the new reaction (replaces any existing one)
      await supabaseAdmin.from('feed_reactions').upsert({
        post_id:  postId,
        user_id:  user.id,
        reaction: action,
      }, { onConflict: 'post_id,user_id' });

      return NextResponse.json({ ok: true, toggled: true });
    }

    // ── Create post ──
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });
    if (content.length > 280) return NextResponse.json({ error: 'Max 280 characters' }, { status: 400 });

    // XSS guard
    const blocked = ['<script', 'javascript:', 'onerror=', 'onclick=', '<iframe'];
    if (blocked.some(b => content.toLowerCase().includes(b))) {
      return NextResponse.json({ error: 'Content rejected' }, { status: 400 });
    }

    // Ensure profile + get ink_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('ink_id')
      .eq('id', user.id)
      .single();

    // Auto-create profile if anonymous user doesn't have one yet
    let inkId = profile?.ink_id;
    if (!inkId) {
      inkId = `ink_${user.id.replace(/-/g, '').slice(0, 8)}`;
      await supabaseAdmin.from('profiles').upsert({
        id: user.id, ink_id: inkId, is_ephemeral: true,
      }, { onConflict: 'id' });
    }

    const postId_new = `post_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const { data: newPost, error: insertError } = await supabaseAdmin
      .from('feed_posts')
      .insert({
        id:         postId_new,
        author_id:  user.id,
        author_ink: inkId,
        content:    content.trim(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      data: {
        id:            newPost.id,
        authorInkId:   newPost.author_ink,
        content:       newPost.content,
        resonateCount: 0,
        dismissCount:  0,
        myReaction:    null,
        createdAt:     new Date(newPost.created_at).getTime(),
        expiresAt:     new Date(newPost.expires_at).getTime(),
      }
    }, { status: 201 });
  } catch (err) {
    console.error('Feed POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

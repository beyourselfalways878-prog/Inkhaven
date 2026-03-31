import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@inkhaven.in',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // This endpoint should be protected and ideally only called server-side internally
    // Alternatively, we could do an auth check to verify the sender.
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { targetUserId, title, payload, url } = body;

    if (!targetUserId || !title) {
        return NextResponse.json({ error: 'Missing targetUserId or title' }, { status: 400 });
    }

    // Fetch the target user's active push subscriptions
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (subsError) throw subsError;
    if (!subs || subs.length === 0) {
      // User has no push subscriptions registered, which is fine
      return NextResponse.json({ ok: true, sent: 0, message: 'No subscriptions found for user' });
    }

    const pushPayload = JSON.stringify({
      title,
      body: payload || 'New interaction on InkHaven',
      data: { url: url || '/' }
    });

    let sentCount = 0;
    const removals: string[] = [];

    // Notify all devices for this user
    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, pushPayload);
        sentCount++;
      } catch (e: any) {
        // If statusCode is 410 or 404, the subscription is gone/expired. We should remove it.
        if (e.statusCode === 410 || e.statusCode === 404) {
          removals.push(sub.endpoint);
        } else {
            console.error('Failed to send push to one endpoint:', e);
        }
      }
    }));

    // Clean up dead endpoints
    if (removals.length > 0) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', removals);
    }

    return NextResponse.json({ ok: true, sent: sentCount });
  } catch (err: any) {
    console.error('Push delivery error:', err);
    return NextResponse.json({ error: 'Push delivery failed', details: err.message }, { status: 500 });
  }
}

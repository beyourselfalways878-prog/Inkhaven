import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize an admin client to insert reports bypassing generic RLS, 
// ensuring reports always get saved regardless of the user's specific state.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        let reporterId = 'anonymous';

        // Extract reporter ID from token if present
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            // Decode or verify token using supabase admin if necessary, 
            // but for simplicity in reporting, we log the user if they provided a token.
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                reporterId = user.id;
            }
        }

        const body = await req.json();
        const { targetInkId, roomSlug, reason, details } = body;

        if (!targetInkId || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert into reports table
        const { error } = await supabaseAdmin
            .from('reports')
            .insert({
                reporter_id: reporterId,
                reported_id: targetInkId,
                room_slug: roomSlug,
                reason: reason,
                details: details || null,
                status: 'pending' // pending review
            });

        if (error) {
            console.error('Failed to save report to database:', error);
            // Even if DB fails, return 500 so client knows
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Error processing report:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

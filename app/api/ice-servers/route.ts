import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Use environment variables for Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export async function GET() {
  try {
    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not found, falling back to metered/free turn servers.');
      return NextResponse.json({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:inkhaven.metered.live:80' },
          {
            urls: 'turn:inkhaven.metered.live:80',
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME || 'ecbd7a98d14a357e0529d58f',
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL || 'Dfov44eAgjeSEVr9',
          },
          {
            urls: 'turn:inkhaven.metered.live:443',
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME || 'ecbd7a98d14a357e0529d58f',
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL || 'Dfov44eAgjeSEVr9',
          }
        ]
      });
    }

    const client = twilio(accountSid, authToken);
    const token = await client.tokens.create();

    return NextResponse.json({ iceServers: token.iceServers });
  } catch (error) {
    console.error('Error fetching Twilio ICE servers:', error);
    // Fallback ICE servers if Twilio fails
    return NextResponse.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:inkhaven.metered.live:80' }
      ]
    });
  }
}

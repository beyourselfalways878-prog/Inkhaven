import { NextResponse } from 'next/server';

// PeerJS handles WebRTC signaling internally via peerjs.com cloud.
// This endpoint exists only as a convenience — returns reliable Google STUN
// servers that PeerJS can merge with its own ICE config if needed.
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}

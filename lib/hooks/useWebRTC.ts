// This file now delegates entirely to usePeer.ts (PeerJS-based implementation).
// Kept for backward compatibility only — do not add logic here.
export { usePeer as useWebRTC, usePeer } from './usePeer';
export type { PeerMessage as WebRTCMessage, PeerMessage, ConnectionState, IncomingCall } from './usePeer';

import { generateNonce, generateRandomness, jwtToAddress } from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { suiClient } from './sui';

// ── Session storage keys ──────────────────────────────────────────────────────
const EPHEMERAL_KEY = 'suignature:ephemeral_keypair';
const RANDOMNESS_KEY = 'suignature:randomness';
const MAX_EPOCH_KEY = 'suignature:max_epoch';
const NONCE_KEY = 'suignature:nonce';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ZkLoginSession {
  ephemeralKeypair: Ed25519Keypair;
  randomness: string;
  nonce: string;
  maxEpoch: number;
}

// ── Generate login data and build Google OAuth URL ────────────────────────────
export async function generateLoginUrl(): Promise<string> {
  const { epoch } = await suiClient.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + 2; // Valid for ~2 epochs

  const ephemeralKeypair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(
    ephemeralKeypair.getPublicKey(),
    maxEpoch,
    randomness,
  );

  // Persist to sessionStorage (client-side only, never to DB)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      EPHEMERAL_KEY,
      ephemeralKeypair.getSecretKey(),
    );
    sessionStorage.setItem(RANDOMNESS_KEY, randomness);
    sessionStorage.setItem(MAX_EPOCH_KEY, String(maxEpoch));
    sessionStorage.setItem(NONCE_KEY, nonce);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`;

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ── Derive Sui address from JWT ───────────────────────────────────────────────
export function deriveAddress(jwt: string, userSalt: string): string {
  return jwtToAddress(jwt, userSalt, false);
}

// ── Restore ephemeral session from sessionStorage ─────────────────────────────
export function restoreSession(): ZkLoginSession | null {
  if (typeof window === 'undefined') return null;

  const privateKey = sessionStorage.getItem(EPHEMERAL_KEY);
  const randomness = sessionStorage.getItem(RANDOMNESS_KEY);
  const maxEpoch = sessionStorage.getItem(MAX_EPOCH_KEY);
  const nonce = sessionStorage.getItem(NONCE_KEY);

  if (!privateKey || !randomness || !maxEpoch || !nonce) return null;

  const ephemeralKeypair = Ed25519Keypair.fromSecretKey(privateKey);

  return {
    ephemeralKeypair,
    randomness,
    nonce,
    maxEpoch: Number(maxEpoch),
  };
}

// ── Clear session data ────────────────────────────────────────────────────────
export function clearZkLoginSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(EPHEMERAL_KEY);
  sessionStorage.removeItem(RANDOMNESS_KEY);
  sessionStorage.removeItem(MAX_EPOCH_KEY);
  sessionStorage.removeItem(NONCE_KEY);
}

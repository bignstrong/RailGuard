// Сессия админки: подписанный HMAC-SHA256 токен в cookie. Только Web Crypto — работает и в middleware (edge), и в API.
const enc = new TextEncoder();

export const SESSION_COOKIE = '__Host-admin_session';
export const SESSION_TTL_SEC = 8 * 3600;

export type AdminRole = 'admin' | 'manager';
export type AdminSession = { user: string; role: AdminRole; exp: number; sid: string };

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const hmacKey = (secret: string) =>
  crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

// sid — id строки AdminLogin: по нему сессию можно завершить из админки.
export async function createSession(secret: string, user: string, role: AdminRole, sid: string): Promise<string> {
  const body = { user, role, sid, exp: Date.now() + SESSION_TTL_SEC * 1000 };
  const payload = b64url(enc.encode(JSON.stringify(body)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined, secret: string | undefined): Promise<AdminSession | null> {
  if (!token || !secret || secret.length < 32) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const { user, role, exp, sid } = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (typeof exp !== 'number' || exp <= Date.now() || typeof user !== 'string' || typeof sid !== 'string' || (role !== 'admin' && role !== 'manager')) return null;
    return { user, role, exp, sid };
  } catch {
    return null;
  }
}

export const sessionCookie = (token: string, maxAge = SESSION_TTL_SEC) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

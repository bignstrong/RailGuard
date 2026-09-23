// Серверная часть авторизации админки (Node only): пароль (scrypt), TOTP, защита API-хендлеров.
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { AdminRole, AdminSession, SESSION_COOKIE, verifySession } from 'lib/adminSession';
import prisma from 'lib/prisma';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  const [alg, salt, hash] = (stored || '').split(':');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const a = scryptSync(password, salt, 64);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
}

// RFC 6238 TOTP, 6 цифр, шаг 30 с, окно ±1.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Decode(s: string): Buffer {
  let bits = '';
  for (const ch of s.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '')) bits += B32.indexOf(ch).toString(2).padStart(5, '0');
  const out: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}
export function totp(secretB32: string, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', base32Decode(secretB32)).update(msg).digest();
  const off = h[h.length - 1] & 0xf;
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(code % 1_000_000).padStart(6, '0');
}
export function verifyTotp(code: string | undefined, secretB32: string | undefined, now = Date.now()): boolean {
  if (!secretB32) return true; // 2FA не настроена
  if (!/^\d{6}$/.test(code || '')) return false;
  const c = Math.floor(now / 30000);
  return [-1, 0, 1].some((w) => timingSafeEqual(new Uint8Array(Buffer.from(totp(secretB32, c + w))), new Uint8Array(Buffer.from(code as string))));
}

type AnyReq = NextApiRequest | GetServerSidePropsContext['req'];
export const clientIp = (req: AnyReq) =>
  (req.headers['x-real-ip'] as string) || (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

// CSRF: cookie SameSite=Strict + проверка Origin на мутирующих запросах.
export function sameOrigin(req: NextApiRequest): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return origin === `https://${host}` || origin === `http://${host}`;
}

export const OWNER_LOGIN = process.env.ADMIN_LOGIN || 'owner';

export const userAgent = (req: AnyReq) => String(req.headers['user-agent'] || '').slice(0, 300);

// Подпись cookie проверяет middleware; здесь по БД — не завершена ли сессия (AdminLogin) и не отключён ли пользователь.
async function liveSession(req: AnyReq): Promise<AdminSession | null> {
  const session = await verifySession(req.cookies[SESSION_COOKIE], process.env.ADMIN_SESSION_SECRET);
  if (!session) return null;
  const s = await prisma.adminLogin.findUnique({ where: { id: session.sid }, select: { login: true, ok: true, revokedAt: true, lastSeenAt: true, lastIp: true } });
  if (!s || !s.ok || s.revokedAt || s.login !== session.user) return null;
  const ip = clientIp(req);
  if (s.lastIp !== ip || !s.lastSeenAt || Date.now() - s.lastSeenAt.getTime() > 5 * 60_000) {
    await prisma.adminLogin.update({ where: { id: session.sid }, data: { lastSeenAt: new Date(), lastIp: ip } });
  }
  if (session.user === OWNER_LOGIN) return session;
  const u = await prisma.adminUser.findUnique({ where: { login: session.user }, select: { disabled: true, role: true } });
  if (!u || u.disabled) return null;
  return { ...session, role: u.role === 'admin' ? 'admin' : 'manager' };
}

// Вторая линия после middleware: API-хендлер сам проверяет сессию. role='admin' — только для администраторов.
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse, role?: AdminRole): Promise<AdminSession | null> {
  const session = await liveSession(req);
  if (!session) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  if (role === 'admin' && session.role !== 'admin') {
    res.status(403).json({ message: 'Недостаточно прав' });
    return null;
  }
  return session;
}

export const getAdminSession = (ctx: GetServerSidePropsContext) => liveSession(ctx.req);

// Публичный префикс админки (ADMIN_PATH). Страницы получают его через props и строят все ссылки от него.
export const adminBase = () => (process.env.ADMIN_PATH || '').replace(/\/+$/, '');

export const randomTotpSecret = () => Array.from(randomBytes(20), (b) => B32[b % 32]).join('');
export const otpauthUrl = (login: string, secret: string) => `otpauth://totp/RailGuard:${encodeURIComponent(login)}?secret=${secret}&issuer=RailGuard&digits=6&period=30`;

export { ORDER_STATUSES, STATUS_LABEL } from 'lib/adminShared';
export type { OrderStatus } from 'lib/adminShared';

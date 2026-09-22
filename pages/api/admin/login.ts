import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, OWNER_LOGIN, sameOrigin, verifyPassword, verifyTotp } from 'lib/adminAuth';
import { AdminRole, createSession, sessionCookie } from 'lib/adminSession';
import prisma from 'lib/prisma';
import { rateLimit } from 'lib/rateLimit';

const Body = z.object({ login: z.string().min(1).max(50), password: z.string().min(1).max(200), code: z.string().max(10).optional() });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Владелец задаётся в .env (ADMIN_LOGIN/ADMIN_PASSWORD_HASH/ADMIN_TOTP_SECRET), остальные пользователи — таблица AdminUser.
async function authenticate(login: string, password: string, code: string | undefined): Promise<{ user: string; role: AdminRole } | null> {
  const { ADMIN_PASSWORD_HASH, ADMIN_TOTP_SECRET } = process.env;
  if (login === OWNER_LOGIN) {
    return verifyPassword(password, ADMIN_PASSWORD_HASH) && verifyTotp(code, ADMIN_TOTP_SECRET) ? { user: login, role: 'admin' } : null;
  }
  const u = await prisma.adminUser.findUnique({ where: { login } });
  if (!u || u.disabled || !verifyPassword(password, u.passwordHash) || !verifyTotp(code, u.totpSecret)) return null;
  await prisma.adminUser.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } });
  return { user: u.login, role: u.role === 'admin' ? 'admin' : 'manager' };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  // 5 попыток за 15 минут с одного IP, плюс задержка на каждую неудачу.
  if (!rateLimit(req, 5, 15 * 60_000)) return res.status(429).json({ message: 'Слишком много попыток. Подождите 15 минут.' });

  const parsed = Body.safeParse(req.body);
  const secret = process.env.ADMIN_SESSION_SECRET;
  const auth = parsed.success && secret ? await authenticate(parsed.data.login, parsed.data.password, parsed.data.code) : null;
  if (!auth) {
    console.warn(`[admin] failed login "${parsed.success ? parsed.data.login : '?'}" from ${clientIp(req)}`);
    await sleep(1500);
    return res.status(401).json({ message: 'Неверный логин, пароль или код' });
  }
  console.info(`[admin] login ${auth.user} (${auth.role}) from ${clientIp(req)}`);
  res.setHeader('Set-Cookie', sessionCookie(await createSession(secret as string, auth.user, auth.role)));
  return res.status(200).json({ ok: true });
}

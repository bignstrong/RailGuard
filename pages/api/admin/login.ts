import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, OWNER_LOGIN, sameOrigin, verifyPassword, verifyTotp } from 'lib/adminAuth';
import { AdminRole, createSession, sessionCookie } from 'lib/adminSession';
import prisma from 'lib/prisma';
import { rateLimit } from 'lib/rateLimit';

const Body = z.object({ login: z.string().min(1).max(50), password: z.string().min(1).max(200), code: z.string().max(10).optional() });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Auth = { user: string; role: AdminRole } | { needCode: true } | null;

// Все пользователи в таблице AdminUser. Владелец (ADMIN_LOGIN) создаётся при первом входе из ADMIN_PASSWORD_HASH в .env.
async function authenticate(login: string, password: string, code: string | undefined): Promise<Auth> {
  let u = await prisma.adminUser.findUnique({ where: { login } });
  if (!u && login === OWNER_LOGIN && verifyPassword(password, process.env.ADMIN_PASSWORD_HASH)) {
    u = await prisma.adminUser.create({ data: { login, passwordHash: process.env.ADMIN_PASSWORD_HASH as string, role: 'admin' } });
  }
  if (!u || u.disabled || !verifyPassword(password, u.passwordHash)) return null;
  if (u.totpEnabled && u.totpSecret) {
    if (!code) return { needCode: true };
    if (!verifyTotp(code, u.totpSecret)) return null;
  }
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
  if (auth && 'needCode' in auth) return res.status(401).json({ needCode: true, message: 'Введите код из приложения' });
  if (!auth) {
    console.warn(`[admin] failed login "${parsed.success ? parsed.data.login : '?'}" from ${clientIp(req)}`);
    await sleep(1500);
    return res.status(401).json({ message: 'Неверный логин, пароль или код' });
  }
  console.info(`[admin] login ${auth.user} (${auth.role}) from ${clientIp(req)}`);
  res.setHeader('Set-Cookie', sessionCookie(await createSession(secret as string, auth.user, auth.role)));
  return res.status(200).json({ ok: true });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, sameOrigin, verifyPassword, verifyTotp } from 'lib/adminAuth';
import { createSession, sessionCookie } from 'lib/adminSession';
import { rateLimit } from 'lib/rateLimit';

const Body = z.object({ password: z.string().min(1).max(200), code: z.string().max(10).optional() });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  // 5 попыток за 15 минут с одного IP, плюс задержка на каждую неудачу.
  if (!rateLimit(req, 5, 15 * 60_000)) return res.status(429).json({ message: 'Слишком много попыток. Подождите 15 минут.' });

  const parsed = Body.safeParse(req.body);
  const { ADMIN_PASSWORD_HASH, ADMIN_TOTP_SECRET, ADMIN_SESSION_SECRET } = process.env;
  const ok =
    parsed.success && !!ADMIN_SESSION_SECRET && verifyPassword(parsed.data.password, ADMIN_PASSWORD_HASH) && verifyTotp(parsed.data.code, ADMIN_TOTP_SECRET);
  if (!ok) {
    console.warn(`[admin] failed login from ${clientIp(req)}`);
    await sleep(1500);
    return res.status(401).json({ message: 'Неверный пароль или код' });
  }
  console.info(`[admin] login from ${clientIp(req)}`);
  res.setHeader('Set-Cookie', sessionCookie(await createSession(ADMIN_SESSION_SECRET as string)));
  return res.status(200).json({ ok: true });
}

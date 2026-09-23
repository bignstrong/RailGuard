import type { NextApiRequest, NextApiResponse } from 'next';
import { SESSION_COOKIE, sessionCookie, verifySession } from 'lib/adminSession';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const s = await verifySession(req.cookies[SESSION_COOKIE], process.env.ADMIN_SESSION_SECRET);
  if (s) await prisma.adminLogin.updateMany({ where: { id: s.sid, revokedAt: null }, data: { revokedAt: new Date() } });
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  return res.status(200).json({ ok: true });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, hashPassword, otpauthUrl, randomTotpSecret, requireAdmin, sameOrigin, verifyPassword, verifyTotp } from 'lib/adminAuth';
import prisma from 'lib/prisma';

// Настройки текущего пользователя: смена пароля, 2FA, завершение сессий (admin может завершить чужую).
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('password'), current: z.string().min(1).max(200), next: z.string().min(12, 'Пароль не короче 12 символов').max(200) }),
  z.object({ action: z.literal('totp-setup') }),
  z.object({ action: z.literal('totp-enable'), code: z.string().length(6) }),
  z.object({ action: z.literal('totp-disable'), password: z.string().min(1).max(200) }),
  z.object({ action: z.literal('revoke'), id: z.string().min(1).max(40) }),
  z.object({ action: z.literal('revoke-others') }),
]);

const revokeOthers = (login: string, keep: string) =>
  prisma.adminLogin.updateMany({ where: { login, ok: true, revokedAt: null, id: { not: keep } }, data: { revokedAt: new Date() } });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res);
  if (!session) return;
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Некорректные данные' });
  const u = await prisma.adminUser.findUnique({ where: { login: session.user } });
  if (!u) return res.status(404).json({ message: 'Пользователь не найден' });
  const who = `${session.user}@${clientIp(req)}`;
  const b = parsed.data;

  switch (b.action) {
    case 'password': {
      if (!verifyPassword(b.current, u.passwordHash)) return res.status(400).json({ message: 'Текущий пароль неверный' });
      await prisma.adminUser.update({ where: { id: u.id }, data: { passwordHash: hashPassword(b.next) } });
      await revokeOthers(session.user, session.sid);
      console.info(`[admin] ${who} changed own password`);
      return res.status(200).json({ ok: true });
    }
    case 'totp-setup': {
      // Секрет сохраняется, но 2FA включится только после подтверждения кодом.
      const totpSecret = randomTotpSecret();
      await prisma.adminUser.update({ where: { id: u.id }, data: { totpSecret, totpEnabled: false } });
      return res.status(200).json({ totpSecret, otpauth: otpauthUrl(u.login, totpSecret) });
    }
    case 'totp-enable': {
      if (!u.totpSecret) return res.status(400).json({ message: 'Сначала запросите секрет' });
      if (!verifyTotp(b.code, u.totpSecret)) return res.status(400).json({ message: 'Код не подошёл, проверьте время на телефоне' });
      await prisma.adminUser.update({ where: { id: u.id }, data: { totpEnabled: true } });
      console.info(`[admin] ${who} enabled 2FA`);
      return res.status(200).json({ ok: true });
    }
    case 'revoke': {
      const row = await prisma.adminLogin.findUnique({ where: { id: b.id } });
      if (!row || !row.ok) return res.status(404).json({ message: 'Сессия не найдена' });
      if (row.login !== session.user && session.role !== 'admin') return res.status(403).json({ message: 'Недостаточно прав' });
      await prisma.adminLogin.update({ where: { id: row.id }, data: { revokedAt: row.revokedAt ?? new Date() } });
      console.info(`[admin] ${who} revoked session of ${row.login} (${row.ip})`);
      return res.status(200).json({ ok: true });
    }
    case 'revoke-others': {
      await revokeOthers(session.user, session.sid);
      console.info(`[admin] ${who} revoked own other sessions`);
      return res.status(200).json({ ok: true });
    }
    case 'totp-disable': {
      if (!verifyPassword(b.password, u.passwordHash)) return res.status(400).json({ message: 'Пароль неверный' });
      await prisma.adminUser.update({ where: { id: u.id }, data: { totpEnabled: false, totpSecret: null } });
      console.info(`[admin] ${who} disabled 2FA`);
      return res.status(200).json({ ok: true });
    }
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, hashPassword, otpauthUrl, randomTotpSecret, requireAdmin, sameOrigin } from 'lib/adminAuth';
import prisma from 'lib/prisma';

const Patch = z
  .object({
    role: z.enum(['admin', 'manager']).optional(),
    disabled: z.boolean().optional(),
    password: z.string().min(12, 'Пароль не короче 12 символов').max(200).optional(),
    resetTotp: z.literal(true).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, 'Нечего менять');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res, 'admin');
  if (!session) return;
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  const id = String(req.query.id);
  const who = `${session.user}@${clientIp(req)}`;
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

  if (req.method === 'PATCH') {
    const parsed = Patch.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Некорректные данные' });
    const { role, disabled, password, resetTotp } = parsed.data;
    const totpSecret = resetTotp ? randomTotpSecret() : undefined;
    await prisma.adminUser.update({
      where: { id },
      data: { role, disabled, passwordHash: password ? hashPassword(password) : undefined, totpSecret },
    });
    console.info(`[admin] ${who} updated user ${user.login}: ${Object.keys(parsed.data).join(',')}`);
    return res.status(200).json({ ok: true, otpauth: totpSecret ? otpauthUrl(user.login, totpSecret) : undefined, totpSecret });
  }
  if (req.method === 'DELETE') {
    await prisma.adminUser.delete({ where: { id } });
    console.info(`[admin] ${who} deleted user ${user.login}`);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}

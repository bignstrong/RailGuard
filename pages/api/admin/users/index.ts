import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, hashPassword, OWNER_LOGIN, requireAdmin, sameOrigin } from 'lib/adminAuth';
import prisma from 'lib/prisma';

const Create = z.object({
  login: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_.-]+$/i, 'Логин: латиница, цифры, . _ -'),
  password: z.string().min(12, 'Пароль не короче 12 символов').max(200),
  role: z.enum(['admin', 'manager']),
});

// Только роль admin (middleware тоже режет, это вторая линия).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res, 'admin');
  if (!session) return;

  if (req.method === 'GET') {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, login: true, role: true, disabled: true, totpEnabled: true, createdAt: true, lastLoginAt: true },
    });
    return res.status(200).json({ users });
  }
  if (req.method === 'POST') {
    if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
    const parsed = Create.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Некорректные данные' });
    const { login, password, role } = parsed.data;
    if (login.toLowerCase() === OWNER_LOGIN.toLowerCase()) return res.status(400).json({ message: 'Этот логин зарезервирован' });
    if (await prisma.adminUser.findUnique({ where: { login } })) return res.status(409).json({ message: 'Логин занят' });
    const user = await prisma.adminUser.create({ data: { login, role, passwordHash: hashPassword(password) } });
    console.info(`[admin] ${session.user}@${clientIp(req)} created user ${login} (${role})`);
    // 2FA пользователь включает сам в «Настройках».
    return res.status(201).json({ id: user.id, login, role });
  }
  return res.status(405).end();
}

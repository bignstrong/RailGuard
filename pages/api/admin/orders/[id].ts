import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, requireAdmin, sameOrigin } from 'lib/adminAuth';
import { ORDER_STATUSES } from 'lib/adminShared';
import prisma from 'lib/prisma';

const Patch = z.object({ status: z.enum(ORDER_STATUSES) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) return;
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  const id = String(req.query.id);
  const who = clientIp(req);

  if (req.method === 'PATCH') {
    const parsed = Patch.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Некорректный статус' });
    const order = await prisma.order.update({ where: { id }, data: { status: parsed.data.status } }).catch(() => null);
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    console.info(`[admin] ${who} set order ${id} status=${parsed.data.status}`);
    return res.status(200).json({ ok: true, status: order.status });
  }
  if (req.method === 'DELETE') {
    const deleted = await prisma.order.delete({ where: { id } }).catch(() => null);
    if (!deleted) return res.status(404).json({ message: 'Заказ не найден' });
    console.info(`[admin] ${who} deleted order ${id}`);
    return res.status(200).json({ ok: true });
  }
  return res.status(405).end();
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, requireAdmin, routeId, sameOrigin } from 'lib/adminAuth';
import { refreshPayment, refundPayment } from 'lib/payments';

// refresh — перечитать статус у шлюза; refund — полный возврат (только роль admin).
const Body = z.object({ action: z.enum(['refresh', 'refund']) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res);
  if (!session) return;
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Некорректные данные' });
  const id = routeId(req);
  const { action } = parsed.data;
  if (action === 'refund' && session.role !== 'admin') return res.status(403).json({ message: 'Возврат может сделать только администратор' });
  try {
    const p = action === 'refund' ? await refundPayment(id) : await refreshPayment(id);
    if (action === 'refund') console.info(`[admin] ${session.user}@${clientIp(req)} refunded payment ${id}: ${p.status}`);
    return res.status(200).json({ ok: true, status: p.status });
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ message: 'Платёж не найден' });
    return res.status(502).json({ message: err?.message || 'Шлюз не ответил' });
  }
}

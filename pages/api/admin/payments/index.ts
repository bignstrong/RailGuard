import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, requireAdmin, sameOrigin } from 'lib/adminAuth';
import { loadPaymentSettings, startPayment } from 'lib/payments';
import { PROVIDERS } from 'lib/paymentsShared';

// Ссылка на оплату заказа из админки: менеджер отправляет её покупателю. Работает и при выключенной оплате на сайте.
const Body = z.object({ orderId: z.string().min(1).max(40), provider: z.enum(PROVIDERS).optional() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res);
  if (!session) return;
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Некорректные данные' });
  const s = await loadPaymentSettings();
  const provider = parsed.data.provider ?? (s.provider || undefined);
  if (!provider) return res.status(400).json({ message: 'Выберите платёжный шлюз в разделе «Оплата»' });
  try {
    const p = await startPayment(parsed.data.orderId, provider, s);
    console.info(`[admin] ${session.user}@${clientIp(req)} created ${provider} payment ${p.id} for order ${parsed.data.orderId}`);
    return res.status(200).json({ ok: true, id: p.id, url: p.url });
  } catch (err) {
    return res.status(502).json({ message: (err as Error).message || 'Шлюз не ответил' });
  }
}

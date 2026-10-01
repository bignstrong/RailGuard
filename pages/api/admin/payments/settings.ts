import type { NextApiRequest, NextApiResponse } from 'next';
import { clientIp, requireAdmin, sameOrigin } from 'lib/adminAuth';
import { loadPaymentSettings, savePaymentSettings } from 'lib/payments';
import { SettingsSchema } from 'lib/paymentsShared';

// Настройки оплаты — только роль admin. Пустой секрет в запросе = оставить сохранённый (на клиент секреты не уходят).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res, 'admin');
  if (!session) return;
  if (req.method !== 'PUT') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  const parsed = SettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Некорректные настройки' });
  const prev = await loadPaymentSettings();
  const next = parsed.data;
  // Стёрли shopId / Public ID — забываем и секрет.
  next.yookassa.secretKey = next.yookassa.shopId ? next.yookassa.secretKey || prev.yookassa.secretKey : '';
  next.cloudpayments.apiSecret = next.cloudpayments.publicId ? next.cloudpayments.apiSecret || prev.cloudpayments.apiSecret : '';
  await savePaymentSettings(next);
  console.info(`[admin] ${session.user}@${clientIp(req)} updated payment settings: enabled=${next.enabled} provider=${next.provider || '-'}`);
  return res.status(200).json({ ok: true });
}

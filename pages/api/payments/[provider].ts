import type { NextApiRequest, NextApiResponse } from 'next';
import { cpVerify } from 'lib/cloudpayments.mjs';
import { loadPaymentSettings, markRefunded, refreshPayment } from 'lib/payments';
import prisma from 'lib/prisma';

// Сырое тело нужно для проверки подписи CloudPayments (HMAC считается по байтам запроса).
export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('too large');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const parse = (raw: string, type = '') => {
  if (type.includes('json')) return JSON.parse(raw || '{}') as Record<string, any>;
  return Object.fromEntries(new URLSearchParams(raw)) as Record<string, any>;
};

// Уведомления шлюзов о смене статуса.
// ЮKassa: подписи нет — статус перепроверяем запросом к шлюзу. URL прописывается в личном кабинете (HTTP-уведомления).
// CloudPayments: проверяем Content-HMAC секретом API. URL — в личном кабинете (уведомления Pay, Fail, Refund).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const provider = String(req.query.provider);
  let raw: string;
  let body: Record<string, any>;
  try {
    raw = await rawBody(req);
    body = parse(raw, req.headers['content-type']);
  } catch {
    return res.status(400).end();
  }

  let paymentId: string | undefined;
  if (provider === 'yookassa') {
    const providerId = String(body.event || '').startsWith('refund.') ? body.object?.payment_id : body.object?.id;
    const p = providerId ? await prisma.payment.findUnique({ where: { provider_providerId: { provider, providerId: String(providerId) } } }) : null;
    paymentId = p?.id;
  } else if (provider === 'cloudpayments') {
    const header = req.headers['content-hmac'] ?? req.headers['x-content-hmac'];
    if (!cpVerify(raw, Array.isArray(header) ? header[0] : header, (await loadPaymentSettings()).cloudpayments.apiSecret)) return res.status(403).end();
    paymentId = body.InvoiceId ? String(body.InvoiceId) : undefined;
  } else return res.status(404).end();

  const payment = paymentId ? await prisma.payment.findUnique({ where: { id: paymentId } }) : null;
  if (payment && payment.provider === provider) {
    try {
      // Подписанное уведомление о возврате (CloudPayments) — окончательно; иначе спрашиваем статус у шлюза.
      if (provider === 'cloudpayments' && body.OperationType === 'Refund') await markRefunded(payment.id);
      else await refreshPayment(payment.id);
    } catch (err) {
      // 500 → шлюз повторит уведомление позже.
      console.error(`[payments] ${provider} webhook failed:`, err);
      return res.status(500).end();
    }
  }
  // CloudPayments ждёт {"code":0}, иначе повторяет уведомление.
  return provider === 'cloudpayments' ? res.status(200).json({ code: 0 }) : res.status(200).end();
}

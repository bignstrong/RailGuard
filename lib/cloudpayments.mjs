import { createHmac, timingSafeEqual } from 'node:crypto';

// Подпись уведомлений CloudPayments: заголовок Content-HMAC = base64(HMAC-SHA256(сырое тело запроса, секрет API)).
// https://developers.cloudpayments.ru/#proverka-uvedomleniy
/** @param {string} rawBody @param {string} secret */
export const cpHmac = (rawBody, secret) => createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');

/** @param {string} rawBody @param {string | undefined} header @param {string} secret */
export function cpVerify(rawBody, header, secret) {
  if (!secret || !header) return false;
  const got = Buffer.from(header);
  const want = Buffer.from(cpHmac(rawBody, secret));
  return got.length === want.length && timingSafeEqual(new Uint8Array(got), new Uint8Array(want));
}

// Статус платежа по ответу v2/payments/find. Declined — не окончательно: покупатель может оплатить счёт повторно.
/** @param {{ Status?: string; OperationType?: string } | undefined} m @returns {'pending' | 'succeeded' | 'canceled' | 'refunded'} */
export function cpStatus(m) {
  if (!m) return 'pending';
  if (m.OperationType === 'Refund') return 'refunded';
  if (m.Status === 'Completed') return 'succeeded';
  if (m.Status === 'Cancelled') return 'canceled';
  return 'pending';
}

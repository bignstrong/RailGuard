import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { cpStatus } from 'lib/cloudpayments.mjs';
import { DEFAULT_PAYMENTS, isConfigured, PaymentSettings, PayStatus, PROVIDER_LABEL, ProviderKey, SettingsSchema, TAX_SYSTEMS, VATS } from 'lib/paymentsShared';
import prisma from 'lib/prisma';

// Онлайн-оплата (только сервер): ЮKassa и CloudPayments за одним интерфейсом. Настройки и ключи — в Setting["payments"], ключи зашифрованы.
// Выключатель enabled управляет только оплатой у покупателя; ссылку из админки можно создать и при выключенном.

// ───────── шифрование ключей шлюзов ─────────

const key = () => createHash('sha256').update(`payments:${process.env.PAYMENTS_SECRET || process.env.ADMIN_SESSION_SECRET || ''}`).digest();
function seal(plain: string) {
  if (!plain) return '';
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return `enc:${Buffer.concat([iv, c.getAuthTag(), data]).toString('base64')}`;
}
function open(sealed: string) {
  if (!sealed.startsWith('enc:')) return sealed;
  try {
    const buf = Buffer.from(sealed.slice(4), 'base64');
    const d = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
  } catch {
    // Сменили ADMIN_SESSION_SECRET — старые ключи не расшифровать, их надо ввести заново.
    console.error('Payment secret decrypt failed: re-enter keys in admin');
    return '';
  }
}

export async function loadPaymentSettings(): Promise<PaymentSettings> {
  const row = await prisma.setting.findUnique({ where: { key: 'payments' } });
  if (!row) return DEFAULT_PAYMENTS;
  try {
    const raw = JSON.parse(row.value);
    const s = SettingsSchema.parse({
      ...DEFAULT_PAYMENTS,
      ...raw,
      yookassa: { ...DEFAULT_PAYMENTS.yookassa, ...raw.yookassa },
      cloudpayments: { ...DEFAULT_PAYMENTS.cloudpayments, ...raw.cloudpayments },
    });
    return { ...s, yookassa: { ...s.yookassa, secretKey: open(s.yookassa.secretKey) }, cloudpayments: { ...s.cloudpayments, apiSecret: open(s.cloudpayments.apiSecret) } };
  } catch (err) {
    console.error('Payment settings parse failed:', err);
    return DEFAULT_PAYMENTS;
  }
}

export async function savePaymentSettings(s: PaymentSettings) {
  const value = JSON.stringify({
    ...s,
    yookassa: { ...s.yookassa, secretKey: seal(s.yookassa.secretKey) },
    cloudpayments: { ...s.cloudpayments, apiSecret: seal(s.cloudpayments.apiSecret) },
  });
  await prisma.setting.upsert({ where: { key: 'payments' }, update: { value }, create: { key: 'payments', value } });
}

// Предохранитель на сервере: пока в .env нет PAYMENTS_CHECKOUT=on, покупатель оплату не видит, что бы ни стояло в админке.
export const CHECKOUT_ALLOWED = () => process.env.PAYMENTS_CHECKOUT === 'on';
// Покупатель видит оплату, только если её разрешил сервер, включён выключатель и выбранный шлюз настроен.
export const checkoutProvider = (s: PaymentSettings): ProviderKey | null =>
  CHECKOUT_ALLOWED() && s.enabled && s.provider && isConfigured(s, s.provider) ? s.provider : null;

// ───────── шлюзы ─────────

type OrderForPay = { id: string; totalPrice: number; items: { title: string; price: number; quantity: number }[]; contact: { phone?: string; email?: string } };
type PaymentRow = { id: string; amount: number; providerId: string | null };
type Provider = {
  create(p: PaymentRow, o: OrderForPay, s: PaymentSettings, returnUrl: string): Promise<{ providerId: string; url: string }>;
  status(providerId: string, s: PaymentSettings): Promise<PayStatus>;
  refund(p: PaymentRow, o: OrderForPay, s: PaymentSettings): Promise<void>;
};

const site = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://railguard.ru').replace(/\/+$/, '');
const rub = (kop: number) => (kop / 100).toFixed(2);
const kop = (rubles: number) => Math.round(rubles * 100);
const short = (id: string) => id.slice(-6).toUpperCase();
const basic = (login: string, password: string) => `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;

async function call(url: string, init: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    const cause = (err as { cause?: { code?: string } }).cause?.code;
    throw new Error(`шлюз недоступен${cause ? ` (${cause})` : ''}`);
  }
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

const yookassa: Provider = (() => {
  const API = 'https://api.yookassa.ru/v3';
  const headers = (s: PaymentSettings, idem?: string) => ({
    Authorization: basic(s.yookassa.shopId, s.yookassa.secretKey),
    'Content-Type': 'application/json',
    ...(idem ? { 'Idempotence-Key': idem } : {}),
  });
  const receipt = (o: OrderForPay, s: PaymentSettings) =>
    s.receipt
      ? {
          receipt: {
            customer: { ...(o.contact.email ? { email: o.contact.email } : {}), ...(o.contact.phone ? { phone: `7${o.contact.phone}` } : {}) },
            tax_system_code: TAX_SYSTEMS[s.tax][1],
            items: o.items.map((i) => ({
              description: i.title.slice(0, 128),
              quantity: i.quantity,
              amount: { value: rub(kop(i.price)), currency: 'RUB' },
              vat_code: VATS[s.vat][1],
              payment_mode: 'full_prepayment',
              payment_subject: 'commodity',
            })),
          },
        }
      : {};
  const fail = (b: { description?: string; code?: string }) => new Error(`ЮKassa: ${b.description || b.code || 'ошибка запроса'}`);
  return {
    async create(p, o, s, returnUrl) {
      const { ok, body } = await call(`${API}/payments`, {
        method: 'POST',
        headers: headers(s, p.id),
        body: JSON.stringify({
          amount: { value: rub(p.amount), currency: 'RUB' },
          capture: true,
          confirmation: { type: 'redirect', return_url: returnUrl },
          description: `Заказ #${short(o.id)}`,
          metadata: { orderId: o.id, paymentId: p.id },
          ...receipt(o, s),
        }),
      });
      if (!ok || !body.confirmation?.confirmation_url) throw fail(body);
      return { providerId: body.id, url: body.confirmation.confirmation_url };
    },
    async status(id, s) {
      const { ok, body } = await call(`${API}/payments/${encodeURIComponent(id)}`, { headers: headers(s) });
      if (!ok) throw fail(body);
      if (Number(body.refunded_amount?.value) > 0 && body.refunded_amount.value === body.amount?.value) return 'refunded';
      return body.status === 'succeeded' ? 'succeeded' : body.status === 'canceled' ? 'canceled' : 'pending';
    },
    async refund(p, o, s) {
      const { ok, body } = await call(`${API}/refunds`, {
        method: 'POST',
        headers: headers(s, `refund-${p.id}`),
        body: JSON.stringify({ payment_id: p.providerId, amount: { value: rub(p.amount), currency: 'RUB' }, ...receipt(o, s) }),
      });
      if (!ok || body.status === 'canceled') throw fail(body.cancellation_details ? { description: body.cancellation_details.reason } : body);
    },
  };
})();

// CloudPayments: счёт с номером = наш id платежа (InvoiceId), по нему же ищем статус.
const cloudpayments: Provider = (() => {
  const API = 'https://api.cloudpayments.ru';
  const post = async (path: string, s: PaymentSettings, payload: object) => {
    const { status, body } = await call(`${API}${path}`, {
      method: 'POST',
      headers: { Authorization: basic(s.cloudpayments.publicId, s.cloudpayments.apiSecret), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // 401 приходит без тела: без этой проверки неверные ключи выглядели бы как «ещё не оплачено».
    if (status === 401 || status === 403) throw new Error('CloudPayments: неверный Public ID или пароль API');
    return body as { Success?: boolean; Message?: string | null; Model?: any };
  };
  const fail = (b: { Message?: string | null }) => new Error(`CloudPayments: ${b.Message || 'ошибка запроса (проверьте Public ID и пароль API)'}`);
  const find = async (invoiceId: string, s: PaymentSettings) => {
    const b = await post('/v2/payments/find', s, { InvoiceId: invoiceId });
    // «Not found» — покупатель ещё не платил по счёту.
    if (!b.Success && b.Message && !/not found/i.test(b.Message)) throw fail(b);
    return b.Success ? b.Model : undefined;
  };
  return {
    async create(p, o, s, returnUrl) {
      const b = await post('/orders/create', s, {
        Amount: Number(rub(p.amount)),
        Currency: 'RUB',
        Description: `Заказ #${short(o.id)}`,
        InvoiceId: p.id,
        Email: o.contact.email,
        RequireConfirmation: false,
        SendEmail: false,
        SuccessRedirectUrl: returnUrl,
        FailRedirectUrl: returnUrl,
        ...(s.receipt
          ? {
              JsonData: {
                CloudPayments: {
                  CustomerReceipt: {
                    Items: o.items.map((i) => ({
                      label: i.title.slice(0, 128),
                      price: i.price,
                      quantity: i.quantity,
                      amount: i.price * i.quantity,
                      vat: VATS[s.vat][2],
                      method: 1, // полная предоплата
                      object: 1, // товар
                    })),
                    taxationSystem: TAX_SYSTEMS[s.tax][2],
                    email: o.contact.email,
                    phone: o.contact.phone ? `+7${o.contact.phone}` : undefined,
                    amounts: { electronic: Number(rub(p.amount)) },
                  },
                },
              },
            }
          : {}),
      });
      if (!b.Success || !b.Model?.Url) throw fail(b);
      return { providerId: p.id, url: b.Model.Url };
    },
    async status(id, s) {
      return cpStatus(await find(id, s));
    },
    async refund(p, _o, s) {
      const m = await find(p.providerId ?? p.id, s);
      if (!m?.TransactionId) throw new Error('CloudPayments: платёж не найден');
      const b = await post('/payments/refund', s, { TransactionId: m.TransactionId, Amount: Number(rub(p.amount)) });
      if (!b.Success) throw fail(b);
    },
  };
})();

const GATEWAYS: Record<ProviderKey, Provider> = { yookassa, cloudpayments };

// ───────── операции с платежами ─────────

async function orderForPay(orderId: string): Promise<OrderForPay> {
  const o = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { id: true, totalPrice: true, items: true, contact: true } });
  return { id: o.id, totalPrice: o.totalPrice, items: o.items as OrderForPay['items'], contact: (o.contact ?? {}) as OrderForPay['contact'] };
}

// Новая попытка оплаты заказа: запись Payment, затем платёж у шлюза. Ошибка шлюза остаётся в записи (status=failed).
export async function startPayment(orderId: string, provider: ProviderKey, s: PaymentSettings) {
  if (!isConfigured(s, provider)) throw new Error(`${PROVIDER_LABEL[provider]} не настроен`);
  const o = await orderForPay(orderId);
  const p = await prisma.payment.create({ data: { orderId, provider, amount: kop(o.totalPrice) } });
  try {
    const { providerId, url } = await GATEWAYS[provider].create(p, o, s, `${site()}/pay/${p.id}`);
    return await prisma.payment.update({ where: { id: p.id }, data: { providerId, url } });
  } catch (err) {
    await prisma.payment.update({ where: { id: p.id }, data: { status: 'failed', error: String((err as Error).message).slice(0, 500) } });
    throw err;
  }
}

const setStatus = async (p: { id: string; provider: string; orderId: string; status: string }, status: PayStatus) => {
  if (status === p.status) return prisma.payment.findUniqueOrThrow({ where: { id: p.id } });
  console.info(`[payments] ${p.provider} ${p.id} order ${p.orderId}: ${p.status} → ${status}`);
  return prisma.payment.update({ where: { id: p.id }, data: { status, error: null } });
};

// Статус берём у шлюза, а не из уведомления: так подделанный вебхук ничего не изменит.
export async function refreshPayment(id: string, s?: PaymentSettings) {
  const p = await prisma.payment.findUniqueOrThrow({ where: { id } });
  // Возврат окончателен: шлюз может снова показать исходный оплаченный платёж.
  if (!p.providerId || p.status === 'failed' || p.status === 'refunded') return p;
  return setStatus(p, await GATEWAYS[p.provider as ProviderKey].status(p.providerId, s ?? (await loadPaymentSettings())));
}

// Полный возврат. Шлюз ответил успехом — фиксируем «Возвращён» сразу, не дожидаясь уведомления.
export async function refundPayment(id: string) {
  const s = await loadPaymentSettings();
  const p = await prisma.payment.findUniqueOrThrow({ where: { id } });
  if (p.status !== 'succeeded') throw new Error('Вернуть можно только оплаченный платёж');
  await GATEWAYS[p.provider as ProviderKey].refund(p, await orderForPay(p.orderId), s);
  return setStatus(p, 'refunded');
}

export async function markRefunded(id: string) {
  const p = await prisma.payment.findUniqueOrThrow({ where: { id } });
  return p.status === 'succeeded' ? setStatus(p, 'refunded') : p;
}

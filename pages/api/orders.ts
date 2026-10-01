import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { toOrderRow } from 'lib/adminShared';
import { channelOf, deviceOf } from 'lib/attribution';
import { isProductId } from 'lib/catalog';
import { customerFor } from 'lib/customers';
import { sendOrderEmail } from 'lib/mailer';
import { emitOrder } from 'lib/orderEvents';
import prisma from 'lib/prisma';
import { rateLimit } from 'lib/rateLimit';
import { loadSite, visibleProducts } from 'lib/site';

const str = (max: number) => z.string().max(max).optional();
const TouchSchema = z
  .object({
    source: z.string().max(100),
    medium: z.string().max(100),
    campaign: str(100),
    content: str(100),
    term: str(100),
    referrer: str(200),
    landing: z.string().max(200),
    yclid: str(100),
    gclid: str(100),
    at: z.string().max(30),
  })
  .nullable();

const OrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().refine(isProductId, 'Unknown product'),
        quantity: z.number().int().positive().max(1000),
      }),
    )
    .nonempty()
    .max(20),
  contact: z.object({
    phone: z.string().regex(/^\d{10}$/, 'Введите номер полностью'),
    email: z.string().email().max(120),
    preferredContact: z.enum(['phone', 'whatsapp', 'telegram']),
  }),
  // Явное согласие на обработку ПДн (ст. 9 152-ФЗ); факт и время фиксируем в заказе.
  // Источник заказа из cookie rg_ft/rg_lt и ClientID Метрики (для офлайн-конверсий). Битую атрибуцию не считаем ошибкой заказа.
  attribution: z.object({ ft: TouchSchema, lt: TouchSchema, ymClientId: z.string().regex(/^\d{1,30}$/).optional() }).optional().catch(undefined),
  consent: z.literal(true, { errorMap: () => ({ message: 'Нужно согласие на обработку персональных данных' }) }),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  if (!rateLimit(req, 5, 60_000, 'orders')) {
    return res.status(429).json({ message: 'Слишком много попыток. Подождите минуту и попробуйте снова.' });
  }

  const parsed = OrderSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return res.status(400).json({ message: `Проверьте данные: ${first?.path.join('.')} — ${first?.message}`, errors: parsed.error.errors });
  }

  // Цены берём только из настроек сайта: клиентскому totalPrice не доверяем. Скрытые и отсутствующие товары не продаём.
  const { attribution } = parsed.data;
  const products = visibleProducts(await loadSite());
  const itemsByIdMap = new Map<string, typeof parsed.data.items[0]>();
  for (const item of parsed.data.items) {
    const existing = itemsByIdMap.get(item.id);
    itemsByIdMap.set(item.id, existing ? { ...existing, quantity: existing.quantity + item.quantity } : item);
  }
  const items = [];
  for (const { id, quantity } of itemsByIdMap.values()) {
    const p = products.find((x) => x.id === id);
    if (!p || !p.inStock) return res.status(400).json({ message: 'Товар временно недоступен, обновите корзину' });
    items.push({ id, quantity, title: p.title, price: p.price, oldPrice: p.oldPrice, image: p.image });
  }
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    // Без покупателя заказ всё равно сохраняем: привязка — не повод терять заказ.
    const { phone, email } = parsed.data.contact;
    const customer = await customerFor(phone, email).catch((e) => console.error('Customer upsert failed:', e));
    const order = await prisma.order.create({
      data: {
        customerId: customer?.id,
        items,
        contact: { ...parsed.data.contact, consentAt: new Date().toISOString() },
        totalPrice,
        status: 'pending',
        channel: channelOf(attribution?.lt ?? attribution?.ft),
        attribution,
        device: deviceOf(req.headers['user-agent'] || ''),
      },
    });
    emitOrder(toOrderRow(order));
    sendOrderEmail({ id: order.id, totalPrice, items, contact: parsed.data.contact, channel: order.channel ?? undefined, createdAt: order.createdAt }).catch((e) => console.error('Order email failed:', e));
    return res.status(200).json({ message: 'Order created successfully', orderId: order.id, totalPrice });
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ message: 'Не удалось сохранить заказ. Попробуйте позже.' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { isProductId } from 'lib/catalog';
import { sendOrderEmail } from 'lib/mailer';
import prisma from 'lib/prisma';
import { rateLimit } from 'lib/rateLimit';
import { loadSite, visibleProducts } from 'lib/site';

const OrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().refine(isProductId, 'Unknown product'),
        quantity: z.number().int().positive().max(1000),
      }),
    )
    .nonempty(),
  contact: z.object({
    phone: z.string().regex(/^\d{10}$/, 'Введите номер полностью'),
    email: z.string().email().max(120),
    preferredContact: z.enum(['phone', 'whatsapp', 'telegram']),
  }),
  // Явное согласие на обработку ПДн (ст. 9 152-ФЗ); факт и время фиксируем в заказе.
  consent: z.literal(true, { errorMap: () => ({ message: 'Нужно согласие на обработку персональных данных' }) }),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  if (!rateLimit(req, 5)) {
    return res.status(429).json({ message: 'Слишком много попыток. Подождите минуту и попробуйте снова.' });
  }

  const parsed = OrderSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return res.status(400).json({ message: `Проверьте данные: ${first?.path.join('.')} — ${first?.message}`, errors: parsed.error.errors });
  }

  // Цены берём только из настроек сайта: клиентскому totalPrice не доверяем. Скрытые и отсутствующие товары не продаём.
  const products = visibleProducts(await loadSite());
  const items = [];
  for (const { id, quantity } of parsed.data.items) {
    const p = products.find((x) => x.id === id);
    if (!p || !p.inStock) return res.status(400).json({ message: 'Товар временно недоступен, обновите корзину' });
    items.push({ id, quantity, title: p.title, price: p.price, oldPrice: p.oldPrice, image: p.image });
  }
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const order = await prisma.order.create({
      data: { items, contact: { ...parsed.data.contact, consentAt: new Date().toISOString() }, totalPrice, status: 'pending' },
    });
    sendOrderEmail({ id: order.id, totalPrice, items, contact: parsed.data.contact }).catch((e) => console.error('Order email failed:', e));
    return res.status(200).json({ message: 'Order created successfully', orderId: order.id });
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ message: 'Не удалось сохранить заказ. Попробуйте позже.' });
  }
}

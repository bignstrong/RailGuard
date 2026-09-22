import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { CATALOG, isProductId } from 'lib/catalog';
import prisma from 'lib/prisma';
import { rateLimit } from 'lib/rateLimit';

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
    phone: z.string().min(5).max(30),
    email: z.string().email().max(120),
    preferredContact: z.enum(['phone', 'whatsapp', 'telegram']),
  }),
  // Явное согласие на обработку ПДн (ст. 9 152-ФЗ); факт и время фиксируем в заказе.
  consent: z.literal(true),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  if (!rateLimit(req, 5)) {
    return res.status(429).json({ message: 'Too many requests' });
  }

  const parsed = OrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request data', errors: parsed.error.errors });
  }

  // Цены берём только из каталога: клиентскому totalPrice не доверяем.
  const items = parsed.data.items.map(({ id, quantity }) => ({ id, quantity, ...CATALOG[id] }));
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const order = await prisma.order.create({
      data: { items, contact: { ...parsed.data.contact, consentAt: new Date().toISOString() }, totalPrice, status: 'pending' },
    });
    return res.status(200).json({ message: 'Order created successfully', orderId: order.id });
  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ message: 'An error occurred while processing your order. Please try again later.' });
  }
}

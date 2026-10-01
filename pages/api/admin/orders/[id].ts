import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { clientIp, requireAdmin, routeId, sameOrigin } from 'lib/adminAuth';
import { ORDER_STATUSES } from 'lib/adminShared';
import { customerFor, dropIfEmpty } from 'lib/customers';
import prisma from 'lib/prisma';

const Patch = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    note: z
      .string()
      .max(2000)
      .transform((v) => (v === '' ? null : v))
      .optional(),
    contact: z
      .object({
        phone: z.string().regex(/^\d{10}$/, 'Введите номер полностью'),
        email: z.string().email().max(120),
        preferredContact: z.enum(['phone', 'whatsapp', 'telegram']),
      })
      .optional(),
  })
  .refine((v) => v.status !== undefined || v.note !== undefined || v.contact !== undefined, { message: 'Нужно хотя бы одно поле' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res);
  if (!session) return;
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
  const id = routeId(req);
  const who = `${session.user}@${clientIp(req)}`;

  if (req.method === 'PATCH') {
    const parsed = Patch.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Некорректные данные' });
    const { status, note, contact } = parsed.data;
    const changed: string[] = [];
    const data: { status?: string; note?: string | null; contact?: object; customerId?: string } = {};
    let prevCustomerId: string | null = null;
    if (status !== undefined) {
      data.status = status;
      changed.push('status');
    }
    if (note !== undefined) {
      data.note = note;
      changed.push('note');
    }
    if (contact !== undefined) {
      const existing = await prisma.order.findUnique({ where: { id }, select: { contact: true, customerId: true } });
      if (!existing) return res.status(404).json({ message: 'Заказ не найден' });
      const prevContact = (existing.contact ?? {}) as Record<string, unknown>;
      data.contact = { ...contact, consentAt: prevContact.consentAt };
      // Исправили телефон или почту — заказ переезжает к покупателю с новой парой.
      data.customerId = (await customerFor(contact.phone, contact.email)).id;
      prevCustomerId = existing.customerId;
      changed.push('contact');
    }
    let order;
    try {
      order = await prisma.order.update({ where: { id }, data });
    } catch (err: any) {
      if (err.code === 'P2025') return res.status(404).json({ message: 'Заказ не найден' });
      console.error('Order update failed:', err);
      return res.status(500).json({ message: 'Ошибка при обновлении заказа' });
    }
    if (prevCustomerId !== order.customerId) await dropIfEmpty(prevCustomerId);
    console.info(`[admin] ${who} updated order ${id} fields=${changed.join(',')}`);
    return res.status(200).json({ ok: true, status: order.status, note: order.note, contact: order.contact });
  }
  if (req.method === 'DELETE') {
    if (session.role !== 'admin') return res.status(403).json({ message: 'Удалять заказы может только администратор' });
    try {
      const deleted = await prisma.order.delete({ where: { id } });
      await dropIfEmpty(deleted.customerId);
      console.info(`[admin] ${who} deleted order ${id}`);
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      if (err.code === 'P2025') return res.status(404).json({ message: 'Заказ не найден' });
      console.error('Order delete failed:', err);
      return res.status(500).json({ message: 'Ошибка при удалении заказа' });
    }
  }
  return res.status(405).end();
}

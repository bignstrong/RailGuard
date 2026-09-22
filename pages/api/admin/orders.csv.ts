import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from 'lib/adminAuth';
import { ORDER_STATUSES, OrderStatus } from 'lib/adminShared';
import prisma from 'lib/prisma';

// Оборачивает поле в кавычки при наличии ; " или переноса строки, дублируя внутренние кавычки.
function csvField(v: string): string {
  return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) return;
  const q = String(req.query.q || '').trim().slice(0, 100);
  const status = String(req.query.status || '');
  const where = {
    ...(ORDER_STATUSES.includes(status as OrderStatus) ? { status } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { contact: { path: ['phone'], string_contains: q.replace(/\D/g, '') || q } },
            { contact: { path: ['email'], string_contains: q.toLowerCase() } },
          ],
        }
      : {}),
  };
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' } });
  const rows = orders.map((o) => {
    const c = (o.contact ?? {}) as Record<string, string>;
    const items = (o.items ?? []) as { title: string; quantity: number }[];
    const itemsStr = items.map((i) => `${i.title}×${i.quantity}`).join(', ');
    return [o.id, o.createdAt.toISOString(), o.status, c.phone ?? '', c.email ?? '', c.preferredContact ?? '', String(o.totalPrice), itemsStr, o.note ?? '']
      .map(csvField)
      .join(';');
  });
  const csv = ['id;createdAt;status;phone;email;preferredContact;totalPrice;items;note', ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send('﻿' + csv);
}

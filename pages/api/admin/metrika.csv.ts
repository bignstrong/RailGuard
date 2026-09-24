import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from 'lib/adminAuth';
import prisma from 'lib/prisma';

// Выгрузки для ручной загрузки в Метрику (только заказы с ClientID — посетитель дал согласие на cookie):
//  type=crm     — «Загрузка данных CRM», упрощённые заказы: выручка по итоговому статусу, до 111 дней после визита.
//                 https://yandex.ru/dev/metrika/ru/data-import/simple-orders-prep
//  type=offline — «Офлайн-конверсии», цель order_done (JavaScript-событие) по выполненным заказам за 21 день.
//                 https://yandex.ru/support/metrica/ru/data/offline-conversion-data
const CRM_STATUS: Record<string, string> = { completed: 'PAID', cancelled: 'CANCELLED', pending: 'IN_PROGRESS', processing: 'IN_PROGRESS' };
const msk = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req, res))) return;
  const offline = req.query.type === 'offline';
  const orders = await prisma.order.findMany({
    where: offline ? { status: 'completed', updatedAt: { gte: new Date(Date.now() - 21 * 86400000) } } : { createdAt: { gte: new Date(Date.now() - 111 * 86400000) } },
    orderBy: { createdAt: 'asc' },
  });
  const rows: string[] = [];
  for (const o of orders) {
    const cid = (o.attribution as { ymClientId?: string } | null)?.ymClientId;
    if (!cid) continue;
    // ponytail: время выполнения = updatedAt (правка заметки после выполнения сдвинет его); завести completedAt, если станет важно.
    if (offline) rows.push([cid, 'order_done', Math.floor(o.updatedAt.getTime() / 1000), o.totalPrice, 'RUB'].join(','));
    else rows.push([o.id, msk.format(o.createdAt).replace(',', ''), cid, CRM_STATUS[o.status] ?? 'IN_PROGRESS', o.totalPrice, 'RUB'].join(','));
  }
  const header = offline ? 'ClientId,Target,DateTime,Price,Currency' : 'id,create_date_time,client_ids,order_status,revenue,currency';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="metrika-${offline ? 'offline' : 'crm'}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send([header, ...rows].join('\n'));
}

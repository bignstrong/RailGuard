import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from 'lib/adminAuth';
import { ORDER_ROW_SELECT, OrderRow, toOrderRow } from 'lib/adminShared';
import { onOrder } from 'lib/orderEvents';
import prisma from 'lib/prisma';

// SSE: новые заказы прилетают в админку без перезагрузки. id события — время заказа:
// после обрыва браузер сам переподключается с Last-Event-ID, и мы досылаем пропущенное.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!(await requireAdmin(req, res))) return;

  // no-transform — чтобы сжатие Next не копило поток; X-Accel-Buffering — то же для nginx.
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
  const send = (row: OrderRow) => res.write(`id: ${row.createdAt}\nevent: order\ndata: ${JSON.stringify(row)}\n\n`);
  res.write('retry: 5000\n\n');

  // Подписываемся до запроса в БД: заказ между ними не потеряется (дубли клиент отсеет по id).
  const off = onOrder(send);
  // nginx рвёт молчащее соединение через 60 с.
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
  req.on('close', () => {
    off();
    clearInterval(ping);
  });

  const since = new Date(String(req.headers['last-event-id'] || req.query.after || ''));
  if (!isNaN(since.getTime())) {
    const missed = await prisma.order.findMany({ where: { createdAt: { gt: since } }, orderBy: { createdAt: 'asc' }, take: 50, select: ORDER_ROW_SELECT });
    missed.forEach((o) => send(toOrderRow(o)));
  }
}

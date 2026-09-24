import type { NextApiRequest, NextApiResponse } from 'next';
import { CHANNELS, FUNNEL_EVENTS } from 'lib/attribution';
import { isProductId } from 'lib/catalog';
import prisma from 'lib/prisma';
import { rateLimit } from 'lib/rateLimit';

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });

// Счётчик воронки (lib/attribution.ts → countEvent). Пишем только агрегат day/event/channel/product.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!rateLimit(req, 30) || /bot|crawl|spider|headless|lighthouse/i.test(req.headers['user-agent'] || '')) return res.status(204).end();
  const { e, ch, p = '' } = (req.body ?? {}) as Record<string, string>;
  if (!FUNNEL_EVENTS.includes(e as never) || !CHANNELS.includes(ch as never) || (p !== '' && !isProductId(p))) return res.status(400).end();
  const key = { day: dayFmt.format(new Date()), event: e, channel: ch, product: p };
  await prisma.dailyStat
    .upsert({ where: { day_event_channel_product: key }, create: { ...key, count: 1 }, update: { count: { increment: 1 } } })
    .catch((err) => console.error('DailyStat upsert failed:', err));
  res.status(204).end();
}

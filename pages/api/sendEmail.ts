import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import prisma from 'lib/prisma';
import { rateLimit } from 'lib/rateLimit';

const Body = z.object({ email: z.string().email().max(120) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  if (!rateLimit(req, 5)) {
    return res.status(429).json({ message: 'Слишком много запросов' });
  }

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Некорректный email' });
  }

  try {
    const { email } = parsed.data;
    await prisma.subscriber.upsert({ where: { email }, update: {}, create: { email } });
    res.status(200).json({ message: 'Вы успешно подписались!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Произошла ошибка при подписке.' });
  }
}

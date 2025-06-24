import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email обязателен' });
  }

  try {
    await prisma.subscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    res.status(200).json({ message: 'Вы успешно подписались!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Произошла ошибка при подписке.' });
  }
}

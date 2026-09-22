import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionCookie } from 'lib/adminSession';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  return res.status(200).json({ ok: true });
}

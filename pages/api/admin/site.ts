import type { NextApiRequest, NextApiResponse } from 'next';
import { clientIp, requireAdmin, sameOrigin } from 'lib/adminAuth';
import { loadSite, saveSite, SiteSchema } from 'lib/site';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const site = await loadSite();
    return res.status(200).json({ site });
  }

  if (req.method === 'PUT') {
    if (!sameOrigin(req)) return res.status(403).json({ message: 'Forbidden' });
    const sessionAdmin = await requireAdmin(req, res, 'admin');
    if (!sessionAdmin) return;
    const parsed = SiteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || 'Некорректные данные' });
    await saveSite(parsed.data);
    console.info(`[admin] ${session.user}@${clientIp(req)} updated site settings`);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}

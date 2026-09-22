import type { NextApiRequest, NextApiResponse } from 'next';
import { loadSite } from 'lib/site';

// Публичная часть настроек сайта (для полосы-объявления в шапке).
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const site = await loadSite();
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).json({ announcement: site.announcement });
}

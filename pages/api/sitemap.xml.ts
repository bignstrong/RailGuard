import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { loadSite, visibleProducts } from 'lib/site';

const BASE_URL = 'https://railguard.ru';

// loc совпадает с canonical страницы. lastmod только там, где знаем реальную дату правки (цены/наличие из админки):
// дата сборки или запуска сервера менялась бы каждую ночь, и поисковики перестали бы доверять lastmod.
const STATIC = ['/', '/specifications', '/compatibility', '/delivery', '/faq', '/privacy-policy', '/terms-of-use', '/cookies-policy'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [site, row] = await Promise.all([loadSite(), prisma.setting.findUnique({ where: { key: 'site' }, select: { updatedAt: true } })]);
  const pricesChanged = row?.updatedAt.toISOString().slice(0, 10);
  const lastmod = pricesChanged ? `<lastmod>${pricesChanged}</lastmod>` : '';

  const urls = [
    ...STATIC.map((path) => `<url><loc>${BASE_URL}${path}</loc></url>`),
    `<url><loc>${BASE_URL}/pricing</loc>${lastmod}</url>`,
    ...visibleProducts(site).map((p) => `<url><loc>${BASE_URL}/pricing/${p.id}</loc>${lastmod}</url>`),
  ];

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}

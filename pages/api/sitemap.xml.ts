import { NextApiRequest, NextApiResponse } from 'next';
import { CATALOG, ProductId } from 'lib/catalog';
import { loadSite } from 'lib/site';

const BASE_URL = 'https://railguard.ru';
const BUILD_TIME = new Date().toISOString().split('T')[0];

const staticPages = ['', '/pricing', '/specifications', '/compatibility', '/delivery', '/privacy-policy', '/terms-of-use', '/cookies-policy', '/faq'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const site = await loadSite();
  const visibleProducts = (Object.keys(CATALOG) as ProductId[]).filter((id) => !site.products[id].hidden);

  const staticUrls = staticPages.map((path) => `${BASE_URL}${path}`);
  const productUrls = visibleProducts.map((id) => `${BASE_URL}/pricing/${id}`);

  const allUrls = [...staticUrls, ...productUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      (url) => `
    <url>
      <loc>${url}</loc>
      <lastmod>${BUILD_TIME}</lastmod>
    </url>`,
    )
    .join('')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.write(sitemap);
  res.end();
}

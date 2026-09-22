import { NextApiRequest, NextApiResponse } from 'next';

const BASE_URL = 'https://railguard.ru';

const staticPages = ['', '/pricing', '/specifications', '/compatibility', '/delivery', '/privacy-policy', '/terms-of-use', '/cookies-policy'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const urls = staticPages.map((path) => `${BASE_URL}${path}`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
    <url>
      <loc>${url}</loc>
    </url>`,
    )
    .join('')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.write(sitemap);
  res.end();
}

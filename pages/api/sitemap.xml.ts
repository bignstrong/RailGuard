import { NextApiRequest, NextApiResponse } from 'next';

const BASE_URL = 'https://railguard.ru';

const staticPages = ['', '/pricing', '/contact', '/specifications', '/privacy-policy', '/terms-of-use', '/cookies-policy'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Подключить динамические посты из БД/MDX
  const blogPosts: string[] = [];

  const urls = [...staticPages.map((path) => `${BASE_URL}${path}`), ...blogPosts.map((slug) => `${BASE_URL}/blog/${slug}`)];

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

  res.setHeader('Content-Type', 'application/xml');
  res.write(sitemap);
  res.end();
}

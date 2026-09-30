import type { NextApiRequest, NextApiResponse } from 'next';
import { loadSite, visibleProducts } from 'lib/site';

// Публичная часть настроек сайта: полоса-объявление в шапке и актуальные цены для корзины (она хранит цены в localStorage).
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const site = await loadSite();
  const products = Object.fromEntries(visibleProducts(site).map((p) => [p.id, { price: p.price, oldPrice: p.oldPrice, inStock: p.inStock }]));
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).json({ announcement: site.announcement, products });
}

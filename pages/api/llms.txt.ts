import { NextApiRequest, NextApiResponse } from 'next';
import { loadSite, visibleProducts } from 'lib/site';
import { FAQ } from 'views/PricingPage/FaqSection';

const BASE_URL = 'https://railguard.ru';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const site = await loadSite();
  const products = visibleProducts(site);

  const productsList = products
    .map((p) => `- ${p.title}: ${p.price}₽${p.oldPrice ? ` (старая цена ${p.oldPrice}₽)` : ''} — ${p.inStock ? 'в наличии' : 'нет в наличии'} — ${BASE_URL}/pricing#${p.id}`)
    .join('\n');

  const faqList = FAQ.map(([q, a]) => `- **${q}** — ${a}`).join('\n');

  const contactsLines = [];
  if (site.contacts.email) contactsLines.push(`email: ${site.contacts.email}`);
  if (site.contacts.phone) contactsLines.push(`phone: ${site.contacts.phone}`);
  if (site.contacts.hours) contactsLines.push(`${site.contacts.hours}`);
  const contactsSection = contactsLines.join('; ');

  const content = `# RailGuard — топливный фильтр высокого давления для Common Rail

> Фильтр тонкой очистки топлива для дизелей Common Rail: ставится после штатного фильтра и защищает форсунки и ТНВД от металлической стружки. Продаётся в России, доставка по стране.

## Что это
Фильтр тонкой очистки, ставится после основного фильтра между ТНВД и рампой, задерживает стружку и абразив 8–12 мкм. Корпус сталь до 1800 бар, двигатели Common Rail до 2,7 л, резьба M14×1,5 (по заказу M12×1,5), габариты 120×35 мм, вес 430 г, элемент менять вместе с основным фильтром.

## Товары и цены (RUB)
${productsList}

## Частые вопросы
${faqList}

## Страницы
- ${BASE_URL}/ — главная
- ${BASE_URL}/pricing — каталог
- ${BASE_URL}/specifications — характеристики
- ${BASE_URL}/compatibility — совместимость
- ${BASE_URL}/delivery — доставка/оплата/контакты

## Контакты
${contactsSection}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.write(content);
  res.end();
}

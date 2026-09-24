import { NextApiRequest, NextApiResponse } from 'next';
import { formatPrice } from 'lib/catalog';
import { loadSite, visibleProducts } from 'lib/site';

const BASE_URL = 'https://railguard.ru';

// Формат https://llmstxt.org: H1, цитата-резюме, абзацы без заголовков, затем H2-секции со списками ссылок.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const site = await loadSite();
  const products = visibleProducts(site)
    .map((p) => `- [${p.title}](${BASE_URL}/pricing/${p.id}): ${formatPrice(p.price)}${p.oldPrice > p.price ? ` вместо ${formatPrice(p.oldPrice)}` : ''}, ${p.inStock ? 'в наличии' : 'нет в наличии'}`)
    .join('\n');
  const contacts = [site.contacts.email && `email ${site.contacts.email}`, site.contacts.phone && `телефон ${site.contacts.phone}`, site.contacts.telegram && `Telegram ${site.contacts.telegram}`, site.contacts.hours].filter(Boolean).join(', ');

  const content = `# RailGuard

> Фильтр тонкой очистки топлива высокого давления для дизелей Common Rail. Ставится после штатного фильтра, между ТНВД и рампой, и задерживает стружку и абразив 8–12 мкм, чтобы они не попали в форсунки и регулятор давления. Продаётся в России, доставка по всей стране.

Корпус стальной, опрессован на 1800 бар, габариты 120×35 мм, вес 430 г, резьба M14×1,5 (по заказу M12×1,5). Подходит для большинства двигателей Common Rail объёмом до 2,7 л. Сменный элемент меняют вместе с основным топливным фильтром. Цены в рублях, актуальны на момент запроса.

Контакты: ${contacts || 'см. страницу доставки'}.

## Товары

${products}

## Страницы

- [Каталог](${BASE_URL}/pricing): все товары, цены и наличие
- [Характеристики](${BASE_URL}/specifications): размеры, материалы, давление, тонкость фильтрации
- [Совместимость](${BASE_URL}/compatibility): двигатели, для которых подходит фильтр
- [Доставка и оплата](${BASE_URL}/delivery): как проходит заказ, оплата, доставка, возврат, контакты
- [Вопросы и ответы](${BASE_URL}/faq): установка, обслуживание, подбор

## Optional

- [Полная версия для ИИ](${BASE_URL}/llms-full.txt): всё содержимое сайта одним markdown-файлом
- [Фид товаров](${BASE_URL}/feed.xml): YML для маркетплейсов
- [Политика конфиденциальности](${BASE_URL}/privacy-policy)
- [Условия использования](${BASE_URL}/terms-of-use)
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.status(200).send(content);
}

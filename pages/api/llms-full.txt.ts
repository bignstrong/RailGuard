import { NextApiRequest, NextApiResponse } from 'next';
import { formatPrice, PRODUCT_DESCRIPTIONS, ProductId } from 'lib/catalog';
import prisma from 'lib/prisma';
import { loadSite, visibleProducts } from 'lib/site';
import { SPEC_SECTIONS } from 'pages/specifications';
import { FAQ } from 'views/PricingPage/FaqSection';

const BASE_URL = 'https://railguard.ru';

// Полное содержимое сайта одним markdown для ИИ-поисковиков. Только факты со страниц сайта и из БД — ничего не дописывать.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const [site, flag] = await Promise.all([loadSite(), prisma.setting.findUnique({ where: { key: 'compatibility' } })]);
  const vehicles =
    flag?.value === 'on'
      ? await prisma.vehicle.findMany({ orderBy: [{ brand: 'asc' }, { model: 'asc' }, { engine: 'asc' }], select: { brand: true, model: true, engine: true, years: true, note: true } })
      : [];

  const products = visibleProducts(site)
    .map(
      (p) => `### ${p.title}

- Цена: ${formatPrice(p.price)}${p.oldPrice > p.price ? ` (было ${formatPrice(p.oldPrice)})` : ''}
- Наличие: ${p.inStock ? 'в наличии' : 'нет в наличии'}
- Страница: ${BASE_URL}/pricing/${p.id}

${PRODUCT_DESCRIPTIONS[p.id as ProductId]}`,
    )
    .join('\n\n');

  const specs = SPEC_SECTIONS.map((s) => `### ${s.title}\n\n${s.specs.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`).join('\n\n');

  const compatibility = vehicles.length
    ? `| Марка | Модель | Двигатель | Годы | Примечание |\n|---|---|---|---|---|\n${vehicles.map((v) => `| ${v.brand} | ${v.model} | ${v.engine} | ${v.years ?? ''} | ${v.note ?? ''} |`).join('\n')}`
    : 'Подходит для большинства двигателей Common Rail объёмом до 2,7 л. Подробная таблица по моделям готовится; до её публикации подбор по VIN или модели двигателя делает менеджер.';

  const faq = FAQ.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n');
  const contacts = [site.contacts.email && `- Email: ${site.contacts.email}`, site.contacts.phone && `- Телефон: ${site.contacts.phone}`, site.contacts.hours && `- ${site.contacts.hours}`]
    .filter(Boolean)
    .join('\n');

  const content = `# RailGuard

> Фильтр тонкой очистки топлива высокого давления для дизелей Common Rail. Ставится после штатного фильтра, между ТНВД и рампой, и задерживает стружку и абразив 8–12 мкм. Продаётся в России. Цены в рублях, актуальны на момент запроса.

Краткая версия со ссылками: ${BASE_URL}/llms.txt

## Зачем нужен

- Фильтрует топливо от продуктов износа ТННД и ТНВД и абразива, прошедшего через основной фильтр
- Защищает форсунки и регулятор давления от преждевременного износа
- Стальной корпус выдерживает давление до 1800 бар
- Подходит для большинства двигателей Common Rail объёмом до 2,7 л
- Простое обслуживание: элемент меняют вместе с основным фильтром

## Товары и цены

${products}

## Характеристики

${specs}

## Совместимость

${compatibility}

## Заказ, оплата, доставка, возврат

- Товар добавляют в корзину на сайте и оставляют телефон и email.
- Менеджер перезванивает или пишет в WhatsApp/Telegram, подтверждает наличие и адрес.
- Отправка в день подтверждения, если заказ оформлен до 18:00 по Москве.
- Оплата переводом по реквизитам от менеджера; для автосервисов и юрлиц — безналичный расчёт по счёту с закрывающими документами. Цена на сайте окончательная.
- Доставка по России транспортной компанией или Почтой, 1–3 рабочих дня по центральным регионам. Бесплатно при заказе от 5 000 ₽. Трек-номер приходит на email в день отправки.
- Возврат неустановленного товара в течение 14 дней с момента получения. Каждый корпус опрессован на 1800 бар перед отправкой. Условия гарантии уточняются у менеджера.

## Вопросы и ответы

${faq}

## Контакты

${contacts || `См. ${BASE_URL}/delivery`}

## Страницы сайта

- [Главная](${BASE_URL}/)
- [Каталог](${BASE_URL}/pricing)
- [Характеристики](${BASE_URL}/specifications)
- [Совместимость](${BASE_URL}/compatibility)
- [Доставка и оплата](${BASE_URL}/delivery)
- [Вопросы и ответы](${BASE_URL}/faq)
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.status(200).send(content);
}

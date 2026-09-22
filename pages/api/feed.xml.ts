import type { NextApiRequest, NextApiResponse } from 'next';
import { loadSite } from 'lib/site';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const site = await loadSite();
  // Данные о товарах для Яндекс Директа; цены и наличие — из админки.
  const products = [
    {
      id: 'fto-cr-standard',
      hidden: site.products['fto-cr-standard'].hidden,
      available: site.products['fto-cr-standard'].inStock,
      typePrefix: 'Фильтр топливный',
      name: 'Корпус фильтра высокого давления RailGuard',
      model: 'FTO-CR-Standard',
      price: site.products['fto-cr-standard'].price,
      oldPrice: site.products['fto-cr-standard'].oldPrice,
      categoryId: 1,
      picture: 'https://railguard.ru/webp/corpus.webp',
      description:
        'Базовый корпус фильтра высокого давления для дизельных двигателей Common Rail. Защищает форсунки и ТНВД от металлической стружки и абразива. Тонкость фильтрации 8-12 мкм.',
      vendor: 'RailGuard',
      countryOfOrigin: 'Россия',
      warranty: true,
      salesNotes: 'Бесплатная доставка от 5000₽',
      params: [
        { name: 'Тонкость фильтрации', value: '8-12 мкм' },
        { name: 'Площадь фильтрации', value: '2000 мм²' },
        { name: 'Рабочее давление', value: 'до 2500 бар' },
        { name: 'Применение', value: 'Common Rail' },
      ],
    },
    {
      id: 'cr-10-cartridge',
      hidden: site.products['cr-10-cartridge'].hidden,
      available: site.products['cr-10-cartridge'].inStock,
      typePrefix: 'Фильтрующий элемент',
      name: 'Сменный картридж RailGuard',
      model: 'CR-10',
      price: site.products['cr-10-cartridge'].price,
      oldPrice: site.products['cr-10-cartridge'].oldPrice,
      categoryId: 1,
      picture: 'https://railguard.ru/webp/element_2.webp',
      description:
        'Сменный фильтрующий элемент для корпуса RailGuard. Рекомендуемый интервал замены — каждые 30 000 км или при замене топливного фильтра.',
      vendor: 'RailGuard',
      countryOfOrigin: 'Россия',
      warranty: true,
      salesNotes: 'Бесплатная доставка от 5000₽',
      params: [
        { name: 'Тонкость фильтрации', value: '8-12 мкм' },
        { name: 'Ресурс', value: '30 000 км' },
        { name: 'Совместимость', value: 'Корпус RailGuard' },
      ],
    },
    {
      id: 'profi-start-kit',
      hidden: site.products['profi-start-kit'].hidden,
      available: site.products['profi-start-kit'].inStock,
      typePrefix: 'Комплект',
      name: 'Комплект «Старт» RailGuard',
      model: 'Start-Kit',
      price: site.products['profi-start-kit'].price,
      oldPrice: site.products['profi-start-kit'].oldPrice,
      categoryId: 2,
      picture: 'https://railguard.ru/webp/start.webp',
      description:
        'Выгодный комплект: корпус фильтра высокого давления и два сменных фильтрующих элемента. Идеальный выбор для установки и длительной эксплуатации.',
      vendor: 'RailGuard',
      countryOfOrigin: 'Россия',
      warranty: true,
      salesNotes: 'Бесплатная доставка',
      params: [
        { name: 'Комплектация', value: 'Корпус + 2 элемента' },
        { name: 'Экономия', value: '10 000₽' },
        { name: 'Применение', value: 'Common Rail' },
      ],
    },
    {
      id: 'sto-bulk-kit',
      hidden: site.products['sto-bulk-kit'].hidden,
      available: site.products['sto-bulk-kit'].inStock,
      typePrefix: 'Набор оптовый',
      name: 'Оптовый набор СТО RailGuard',
      model: 'STO-Bulk',
      price: site.products['sto-bulk-kit'].price,
      oldPrice: site.products['sto-bulk-kit'].oldPrice,
      categoryId: 2,
      picture: 'https://railguard.ru/webp/large.webp',
      description: 'Специальное предложение для автосервисов: 5 корпусов и 10 фильтрующих элементов по оптовой цене. Скидка 50%.',
      vendor: 'RailGuard',
      countryOfOrigin: 'Россия',
      warranty: true,
      salesNotes: 'Бесплатная доставка, скидка 50%',
      params: [
        { name: 'Комплектация', value: '5 корпусов + 10 элементов' },
        { name: 'Для', value: 'Автосервисов' },
        { name: 'Экономия', value: '60 000₽' },
      ],
    },
  ];

  const categories = [
    { id: 1, name: 'Топливные фильтры и картриджи', parentId: null },
    { id: 2, name: 'Комплекты и специальные наборы', parentId: null },
  ];

  // Формат даты для Яндекс Директа: YYYY-MM-DD HH:MM
  const now = new Date();
  const dateForYandex = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(
    2,
    '0',
  )} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog date="${dateForYandex}">
  <shop>
    <name>RailGuard</name>
    <company>RailGuard — фильтры высокого давления</company>
    <url>https://railguard.ru</url>
    <platform>Next.js</platform>
    <email>info@railguard.ru</email>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
${categories.map((cat) => `      <category id="${cat.id}">${cat.name}</category>`).join('\n')}
    </categories>
    <delivery-options>
      <option cost="0" days="1-3" order-before="18"/>
    </delivery-options>
    <offers>
${products
  .filter((product) => !product.hidden)
  .map(
    (product) => `      <offer id="${product.id}" available="${product.available}">
        <url>https://railguard.ru/pricing#${product.id}</url>
        <price>${product.price}</price>
        <oldprice>${product.oldPrice}</oldprice>
        <currencyId>RUR</currencyId>
        <categoryId>${product.categoryId}</categoryId>
        <picture>${product.picture}</picture>
        <store>false</store>
        <pickup>false</pickup>
        <delivery>true</delivery>
        <typePrefix>${product.typePrefix}</typePrefix>
        <vendor>${product.vendor}</vendor>
        <model>${product.model}</model>
        <name>${product.name}</name>
        <description><![CDATA[${product.description}]]></description>
        <sales_notes>${product.salesNotes}</sales_notes>
        <manufacturer_warranty>${product.warranty}</manufacturer_warranty>
        <country_of_origin>${product.countryOfOrigin}</country_of_origin>
${product.params.map((p) => `        <param name="${p.name}">${p.value}</param>`).join('\n')}
      </offer>`,
  )
  .join('\n')}
    </offers>
  </shop>
</yml_catalog>`;

  // Заголовки для кеширования и правильного типа
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
}

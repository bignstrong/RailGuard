// Единственный источник цен. Сервер (/api/orders, feed.xml) и каталог читают отсюда.
export const CATALOG = {
  'fto-cr-standard': { title: 'Корпус фильтра', price: 12000, oldPrice: 18000, image: '/webp/corpus.webp' },
  'cr-10-cartridge': { title: 'Фильтрующий элемент', price: 1200, oldPrice: 3000, image: '/webp/element_2.webp' },
  'profi-start-kit': { title: 'Комплект «Старт»', price: 14000, oldPrice: 24000, image: '/webp/start.webp' },
  'sto-bulk-kit': { title: 'Оптовый набор СТО', price: 60000, oldPrice: 120000, image: '/webp/large.webp' },
} as const;

export type ProductId = keyof typeof CATALOG;

export const isProductId = (id: string): id is ProductId => id in CATALOG;

export const formatPrice = (n: number) => `${n.toLocaleString('ru-RU')}₽`;

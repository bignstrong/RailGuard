// Единственный источник цен. Сервер (/api/orders, feed.xml) и каталог читают отсюда.
export const CATALOG = {
  'fto-cr-standard': { title: 'Корпус фильтра', price: 12000, oldPrice: 18000, image: '/webp/corpus.webp' },
  'cr-10-cartridge': { title: 'Фильтрующий элемент', price: 1200, oldPrice: 3000, image: '/webp/element_2.webp' },
  'profi-start-kit': { title: 'Комплект «Старт»', price: 14000, oldPrice: 24000, image: '/webp/start.webp' },
  'sto-bulk-kit': { title: 'Оптовый набор СТО', price: 60000, oldPrice: 120000, image: '/webp/large.webp' },
} as const;

export type ProductId = keyof typeof CATALOG;

// Короткие описания для страниц товаров и llms-full.txt. Факты — из /specifications и feed.xml.
export const PRODUCT_DESCRIPTIONS: Record<ProductId, string> = {
  'fto-cr-standard': 'Корпус фильтра высокого давления из стали, выдерживает до 1800 бар. Резьба M14×1,5, габариты 120×35 мм, вес 430 г. Ставится между ТНВД и рампой форсунок.',
  'cr-10-cartridge': 'Сменный фильтрующий элемент тонкой очистки 8–12 мкм для системы Common Rail. Менять одновременно с основным топливным фильтром.',
  'profi-start-kit': 'Корпус фильтра и два сменных элемента: хватит на установку и первую замену.',
  'sto-bulk-kit': 'Для автосервисов: 5 корпусов и 10 фильтрующих элементов по оптовой цене, скидка 50%.',
};

export const isProductId = (id: string): id is ProductId => id in CATALOG;

export const formatPrice = (n: number) => `${n.toLocaleString('ru-RU')}₽`;

// Настройки сайта, которые владелец меняет в админке без деплоя. Одна строка Setting["site"] с JSON.
import { z } from 'zod';
import { CATALOG, ProductId } from 'lib/catalog';
import prisma from 'lib/prisma';

const Product = z.object({
  price: z.number().int().positive(),
  oldPrice: z.number().int().nonnegative(),
  inStock: z.boolean(),
  hidden: z.boolean(),
});

export const SiteSchema = z.object({
  announcement: z.string().trim().max(200),
  contacts: z.object({
    phone: z.string().trim().max(40),
    email: z.string().trim().email().max(120),
    hours: z.string().trim().max(80),
    legal: z.string().trim().max(200),
    telegram: z
      .string()
      .trim()
      .max(100)
      .refine((v) => v === '' || /^https:\/\/t\.me\/[A-Za-z0-9_]{4,}$/.test(v), 'Telegram: ссылка вида https://t.me/имя'),
  }),
  products: z.record(Product),
});

export type SiteConfig = z.infer<typeof SiteSchema>;
export type ProductConfig = z.infer<typeof Product>;

export const DEFAULT_SITE: SiteConfig = {
  announcement: '',
  contacts: { phone: '', email: 'info@railguard.ru', hours: 'Пн–Пт, 9:00–18:00 (МСК)', legal: '', telegram: 'https://t.me/railguard_manager' },
  products: Object.fromEntries(
    (Object.keys(CATALOG) as ProductId[]).map((id) => [id, { price: CATALOG[id].price, oldPrice: CATALOG[id].oldPrice, inStock: true, hidden: false }]),
  ),
};

export async function loadSite(): Promise<SiteConfig> {
  const row = await prisma.setting.findUnique({ where: { key: 'site' } });
  const parsed = row ? SiteSchema.deepPartial().safeParse(JSON.parse(row.value)) : null;
  const saved = parsed?.success ? parsed.data : {};
  const products = { ...DEFAULT_SITE.products };
  for (const id of Object.keys(products)) products[id] = { ...products[id], ...saved.products?.[id] };
  return { ...DEFAULT_SITE, ...saved, contacts: { ...DEFAULT_SITE.contacts, ...saved.contacts }, products } as SiteConfig;
}

export const saveSite = (cfg: SiteConfig) =>
  prisma.setting.upsert({ where: { key: 'site' }, update: { value: JSON.stringify(cfg) }, create: { key: 'site', value: JSON.stringify(cfg) } });

export type Product = ProductConfig & { id: ProductId; title: string; image: string };

// Товары для каталога/фида: скрытые не отдаём.
export const visibleProducts = (cfg: SiteConfig): Product[] =>
  (Object.keys(CATALOG) as ProductId[]).filter((id) => !cfg.products[id].hidden).map((id) => ({ id, ...CATALOG[id], ...cfg.products[id] }));

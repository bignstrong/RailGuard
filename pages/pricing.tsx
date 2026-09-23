import type { GetServerSideProps } from 'next';
import Page from 'components/Page';
import { loadSite, Product, visibleProducts } from 'lib/site';
import CatalogSection from 'views/PricingPage/CatalogSection';
import FaqSection from 'views/PricingPage/FaqSection';

type Props = { products: Product[] };

// Цены и наличие — из админки, поэтому страница серверная; кешируем на минуту.
export const getServerSideProps: GetServerSideProps<Props> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return { props: { products: visibleProducts(await loadSite()) } };
};

export default function PricingPage({ products }: Props) {
  return (
    <Page
      title="Полный каталог RailGuard"
      description="Фильтр высокого давления, картридж, комплект и оптовый набор для СТО. Цены, наличие, доставка по России."
      canonical="https://railguard.ru/pricing"
    >
      <CatalogSection products={products} />
      <FaqSection />
    </Page>
  );
}

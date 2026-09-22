import Page from 'components/Page';
import CatalogSection from 'views/PricingPage/CatalogSection';
import FaqSection from 'views/PricingPage/FaqSection';

export default function PricingPage() {
  return (
    <Page title="Полный каталог RailGuard" canonical="https://railguard.ru/pricing">
      <CatalogSection />
      <FaqSection />
    </Page>
  );
}


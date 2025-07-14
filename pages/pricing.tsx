import Page from 'components/Page';
import styled from 'styled-components';
import CatalogSection from 'views/PricingPage/CatalogSection';
import FaqSection from 'views/PricingPage/FaqSection';
// import PricingTablesSection from 'views/PricingPage/PricingTablesSection';

export default function PricingPage() {
  return (
    <Page title="Полный каталог RailGuard" canonical="https://railguard.ru/pricing">
      <CatalogSection />
      {/* <PricingTablesSection /> */}
      <FaqSection />
    </Page>
  );
}

const Wrapper = styled.div`
  & > :last-child {
    margin-bottom: 15rem;
  }
`;

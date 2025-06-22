import AutofitGrid from 'components/AutofitGrid';
import BasicCard from 'components/BasicCard';
import Container from 'components/Container';
import styled from 'styled-components';
import { media } from 'utils/media';

const CHARACTERISTICS = [
  {
    imageUrl: '/grid-icons/asset-1.svg',
    title: 'Тонкая фильтрация',
    description: 'Фильтрация 2-12 мкм против 70-150 мкм у аналогов. Эффективная защита форсунок.',
  },
  {
    imageUrl: '/grid-icons/asset-2.svg',
    title: 'Большая площадь',
    description: 'Площадь фильтрующего элемента 1850-2000 мм² - в 2-3 раза больше конкурентов.',
  },
  {
    imageUrl: '/grid-icons/asset-3.svg',
    title: 'Производительность',
    description: 'До 100 л/ч без перегрузки. Подходит для двигателей до 3.0л.',
  },
];

export default function Characteristics() {
  return (
    <Container>
      <CustomAutofitGrid>
        {CHARACTERISTICS.map((singleCharacteristic, idx) => (
          <BasicCard key={singleCharacteristic.title} {...singleCharacteristic} />
        ))}
      </CustomAutofitGrid>
    </Container>
  );
}

const CustomAutofitGrid = styled(AutofitGrid)`
  --autofit-grid-item-size: 40rem;

  ${media('<=tablet')} {
    --autofit-grid-item-size: 30rem;
  }

  ${media('<=phone')} {
    --autofit-grid-item-size: 100%;
  }
`;

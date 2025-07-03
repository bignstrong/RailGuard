import Button from 'components/Button';
import ButtonGroup from 'components/ButtonGroup';
import Container from 'components/Container';
import FilterImage from 'components/FilterImage';
import OverTitle from 'components/OverTitle';
import { useNewsletterModalContext } from 'contexts/newsletter-modal.context';
import NextLink from 'next/link';
import styled from 'styled-components';
import { media } from 'utils/media';

export default function Hero() {
  const { setIsModalOpened } = useNewsletterModalContext();

  return (
    <HeroWrapper>
      <Contents>
        <CustomOverTitle>Защита топливной системы Common Rail</CustomOverTitle>
        <Heading>RailGuard</Heading>
        <Description>
          <strong>ХВАТИТ ВЫБРАСЫВАТЬ ВРЕМЯ И ДЕНЬГИ</strong> на ремонт форсунок! RailGuard – это профессиональная защита вашего двигателя с
          тонкостью фильтрации <span className="highlight">8-12 мкм</span>. <strong>Испытан под давлением 1800 бар</strong> – надёжное
          профессиональное решение. Площадь фильтрующего элемента <span className="highlight">2000 мм²</span>, протестирован на двигателях
          до <span className="highlight">2.7л</span>. <strong>Защитите свой двигатель прямо сейчас!</strong>
        </Description>
        <CustomButtonGroup>
          <NextLink href="/pricing" passHref>
            <Button>
              Заказать <span>&rarr;</span>
            </Button>
          </NextLink>
          <NextLink href="/specifications" passHref>
            <Button transparent>
              Технические характеристики <span>&rarr;</span>
            </Button>
          </NextLink>
        </CustomButtonGroup>
      </Contents>
      <ImageContainer>
        <FilterImage />
      </ImageContainer>
    </HeroWrapper>
  );
}

const HeroWrapper = styled(Container)`
  display: flex;
  padding-top: 5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 45%;
    height: 120%;
    background: linear-gradient(135deg, rgba(0, 71, 255, 0.02) 0%, rgba(0, 71, 255, 0.01) 100%);
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    z-index: -1;
  }

  ${media('<=desktop')} {
    padding-top: 1rem;
    flex-direction: column;
    align-items: center;
  }
`;

const Contents = styled.div`
  flex: 1;
  max-width: 60rem;
  position: relative;
  z-index: 2;

  ${media('<=desktop')} {
    max-width: 100%;
  }
`;

const CustomButtonGroup = styled(ButtonGroup)`
  margin-top: 4rem;
`;

const ImageContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  position: relative;

  ${media('<=desktop')} {
    margin-top: 2rem;
    justify-content: center;
    width: 100%;
  }
`;

const Description = styled.p`
  font-size: 1.8rem;
  opacity: 0.8;
  line-height: 1.6;

  ${media('<=desktop')} {
    font-size: 1.5rem;
  }
`;

const CustomOverTitle = styled(OverTitle)`
  margin-bottom: 2rem;
`;

const Heading = styled.h1`
  font-size: 7.2rem;
  font-weight: bold;
  line-height: 1.1;
  margin-bottom: 4rem;
  letter-spacing: -0.03em;

  ${media('<=tablet')} {
    font-size: 4.6rem;
    margin-bottom: 2rem;
  }
`;
const style = styled.style`
  .highlight {
    color: #4caf50;
    font-weight: 600;
  }
  strong {
    color: #1976d2;
    font-weight: 700;
  }
`;

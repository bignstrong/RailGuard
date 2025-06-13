import Button from 'components/Button'
import ButtonGroup from 'components/ButtonGroup'
import Container from 'components/Container'
import HeroIllustration from 'components/HeroIllustation'
import OverTitle from 'components/OverTitle'
import { useNewsletterModalContext } from 'contexts/newsletter-modal.context'
import NextLink from 'next/link'
import styled from 'styled-components'
import { media } from 'utils/media'

export default function Hero() {
  const { setIsModalOpened } = useNewsletterModalContext();

  return (
    <HeroWrapper>
      <Contents>
        <CustomOverTitle>Защита топливной системы Common Rail</CustomOverTitle>
        <Heading>RailGuard</Heading>
        <Description>
          Профессиональный фильтр тонкой очистки с защитой до 10 мкм и рабочим давлением 2000 бар. Устанавливается между ТНВД и топливной
          рампой для полной защиты форсунок от продуктов износа. Каждый фильтр опрессован под давлением 1800 бар и имеет ресурс до 100 000
          км. Подтверждённая эффективность на двигателях до 2.7л.
        </Description>
        <CustomButtonGroup>
          <Button onClick={() => setIsModalOpened(true)}>
            Заказать <span>&rarr;</span>
          </Button>
          <NextLink href="#whitepaper" passHref>
            <Button transparent>
              Технические характеристики <span>&rarr;</span>
            </Button>
          </NextLink>
        </CustomButtonGroup>
      </Contents>
      <ImageContainer>
        <HeroIllustration />
      </ImageContainer>
    </HeroWrapper>
  );
}

const HeroWrapper = styled(Container)`
  display: flex;
  padding-top: 5rem;

  ${media('<=desktop')} {
    padding-top: 1rem;
    flex-direction: column;
    align-items: center;
  }
`;

const Contents = styled.div`
  flex: 1;
  max-width: 60rem;

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
  align-items: flex-start;

  svg {
    max-width: 45rem;
  }

  ${media('<=desktop')} {
    margin-top: 2rem;
    justify-content: center;
    svg {
      max-width: 80%;
    }
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

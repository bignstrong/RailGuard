import Image from 'next/image';
import NextLink from 'next/link';
import styled from 'styled-components';
import Button from 'components/Button';
import ButtonGroup from 'components/ButtonGroup';
import Container from 'components/Container';
import OverTitle from 'components/OverTitle';
import { media } from 'utils/media';

export default function Hero() {
  return (
    <Wrapper>
      <Contents>
        <OverTitle>Защита топливной системы Common Rail</OverTitle>
        <Heading>RailGuard</Heading>
        <Description>
          <strong>Хватит выбрасывать время и деньги</strong> на ремонт форсунок. RailGuard — фильтр тонкой очистки с тонкостью фильтрации{' '}
          <strong>8–12 мкм</strong>, испытанный под давлением <strong>1800 бар</strong>. Площадь фильтрующего элемента 2000 мм², проверен на
          двигателях до 2,7 л.
        </Description>
        <ButtonGroup>
          <Button as={NextLink} href="/pricing">
            Заказать →
          </Button>
          <Button as={NextLink} href="/specifications" $outline>
            Характеристики
          </Button>
        </ButtonGroup>
      </Contents>
      <ImageBox>
        <Image src="/webp/corpus_black.webp" alt="RailGuard фильтр тонкой очистки" width={360} height={640} priority />
      </ImageBox>
    </Wrapper>
  );
}

const Wrapper = styled(Container)`
  display: flex;
  align-items: center;
  gap: 6rem;
  padding-top: 8rem;

  ${media('<=desktop')} {
    flex-direction: column;
    padding-top: 4rem;
  }
`;

const Contents = styled.div`
  flex: 1;
  max-width: 64rem;
`;

const ImageBox = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;

  img {
    width: auto;
    height: 56rem;
    max-width: 100%;
    object-fit: contain;
  }

  ${media('<=desktop')} {
    img {
      height: 40rem;
    }
  }
`;

const Heading = styled.h1`
  font-size: 7.2rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 2rem 0 3rem;

  ${media('<=tablet')} {
    font-size: 4.6rem;
  }
`;

const Description = styled.p`
  font-size: 1.8rem;
  line-height: 1.6;
  color: rgba(var(--ink), 0.8);
  margin-bottom: 4rem;

  strong {
    color: rgb(var(--ink));
  }
`;

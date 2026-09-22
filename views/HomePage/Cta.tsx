import NextLink from 'next/link';
import styled from 'styled-components';
import Button from 'components/Button';
import ButtonGroup from 'components/ButtonGroup';
import Container from 'components/Container';
import OverTitle from 'components/OverTitle';
import SectionTitle from 'components/SectionTitle';

export default function Cta() {
  return (
    <Wrapper>
      <Container>
        <Stack>
          <OverTitle>Надёжная защита вашего дизеля</OverTitle>
          <SectionTitle>Фильтр, который заботится о вашем двигателе</SectionTitle>
          <Description>
            RailGuard ставится после основного фильтра и берёт на себя финальную очистку топлива: задерживает мельчайшие частицы
            металлической стружки и абразива, которые проходят через стандартную фильтрацию.
            <br />
            <b>Тонкость фильтрации:</b> 8–12 мкм · <b>Корпус:</b> сталь, до 1800 бар · <b>Для кого:</b> Common Rail до 2,7 л
          </Description>
          <ButtonGroup>
            <Button as={NextLink} href="/pricing">
              Заказать сейчас →
            </Button>
            <Button as={NextLink} href="/specifications" $outline>
              Характеристики
            </Button>
          </ButtonGroup>
        </Stack>
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  padding: 12rem 0;
  border-top: var(--line);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  text-align: center;
`;

const Description = styled.p`
  font-size: 1.8rem;
  line-height: 1.7;
  color: rgba(var(--ink), 0.8);
  max-width: 80rem;

  b {
    color: rgb(var(--ink));
  }
`;

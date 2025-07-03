import Button from 'components/Button';
import ButtonGroup from 'components/ButtonGroup';
import Container from 'components/Container';
import OverTitle from 'components/OverTitle';
import SectionTitle from 'components/SectionTitle';
import NextLink from 'next/link';
import styled from 'styled-components';
import { media } from 'utils/media';

export default function Cta() {
  return (
    <CtaWrapper>
      <Container>
        <Stack>
          <OverTitle>Надёжная защита вашего дизеля</OverTitle>
          <SectionTitle>RailGuard — фильтр, который заботится о вашем двигателе</SectionTitle>
          <Description>
            RailGuard устанавливается после основного фильтра и берёт на себя финальную очистку топлива — задерживает мельчайшие частицы
            металлической стружки и абразива, которые могут пройти через стандартную фильтрацию.
            <br />
            <b>Тонкость фильтрации:</b> 8–12 мкм &nbsp;|&nbsp; <b>Корпус:</b> сталь, выдерживает давление до 1800 бар
            <br />
            <b>Для кого:</b> большинство двигателей Common Rail объёмом до 2,7 л<br />
            RailGuard помогает продлить срок службы форсунок и топливного насоса, снижая риск дорогостоящего ремонта и обеспечивая
            уверенность в каждом километре.
          </Description>
          <ButtonGroup>
            <NextLink href="/pricing">
              <Button>
                Заказать сейчас<span>&rarr;</span>
              </Button>
            </NextLink>
            <NextLink href="/specifications">
              <Button>
                Узнать характеристики <span>&rarr;</span>
              </Button>
            </NextLink>
          </ButtonGroup>
        </Stack>
      </Container>
    </CtaWrapper>
  );
}

const Description = styled.div`
  font-size: 1.8rem;
  color: rgba(var(--textSecondary), 0.8);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12.5rem 0;
  color: rgb(var(--textSecondary));
  text-align: center;
  align-items: center;
  justify-content: center;

  & > *:not(:first-child) {
    max-width: 80%;
    margin-top: 4rem;
  }

  ${media('<=tablet')} {
    text-align: center;

    & > *:not(:first-child) {
      max-width: 100%;
      margin-top: 2rem;
    }
  }
`;

const OutlinedButton = styled(Button)`
  border: 1px solid rgb(var(--textSecondary));
  color: rgb(var(--textSecondary));
`;

const CtaWrapper = styled.div`
  background: rgb(var(--secondary));
`;

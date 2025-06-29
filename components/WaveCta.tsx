import Button from 'components/Button';
import ButtonGroup from 'components/ButtonGroup';
import Container from 'components/Container';
import SectionTitle from 'components/SectionTitle';
import { useNewsletterModalContext } from 'contexts/newsletter-modal.context';
import styled from 'styled-components';
import { media } from 'utils/media';

export default function WaveCta() {
  const { setIsModalOpened } = useNewsletterModalContext();

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          fill="#0A121E"
          fillOpacity="1"
          d="M0,64L80,58.7C160,53,320,43,480,80C640,117,800,203,960,197.3C1120,192,1280,96,1360,48L1440,0L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
        ></path>
      </svg>
      <CtaWrapper>
        <Container>
          <Title>Получайте первыми новости о скидках и специальных предложениях!</Title>
          <Description>
            Подпишитесь на нашу рассылку и получите:
            <BenefitsList>
              <li>Эксклюзивные технические обзоры</li>
              <li>Советы по обслуживанию топливной системы</li>
              <li>Приоритетный доступ к новым продуктам</li>
            </BenefitsList>
          </Description>
          <CustomButtonGroup>
            <Button onClick={() => setIsModalOpened(true)}>
              Подписаться на рассылку <span>&rarr;</span>
            </Button>
            {/* <NextLink href="/features">
              <OutlinedButton transparent>
                Узнать больше <span>&rarr;</span>
              </OutlinedButton>
            </NextLink> */}
          </CustomButtonGroup>
        </Container>
      </CtaWrapper>
    </>
  );
}

const CtaWrapper = styled.div`
  background: rgb(var(--secondary));
  margin-top: -1rem;
  padding-bottom: 16rem;

  ${media('<=tablet')} {
    padding-top: 8rem;
  }
`;

const Title = styled(SectionTitle)`
  color: rgb(var(--textSecondary));
  margin-bottom: 2rem;
`;

const Description = styled.div`
  font-size: 1.8rem;
  color: rgb(var(--textSecondary));
  text-align: center;
  margin-bottom: 3rem;
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 2rem 0;

  li {
    margin: 1rem 0;
    font-size: 1.6rem;
    color: rgba(var(--textSecondary), 0.8);

    &:before {
      content: '✓';
      margin-right: 1rem;
      color: rgb(var(--primary));
    }
  }
`;

const OutlinedButton = styled(Button)`
  border: 1px solid rgb(var(--textSecondary));
  color: rgb(var(--textSecondary));
`;

const CustomButtonGroup = styled(ButtonGroup)`
  justify-content: center;
`;

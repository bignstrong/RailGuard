import Container from 'components/Container';
import Link from 'components/Link';
import NotFoundIllustration from 'components/NotFoundIllustration';
import styled from 'styled-components';

export default function NotFoundPage() {
  return (
    <Wrapper>
      <Container>
        <ImageContainer>
          <NotFoundIllustration />
        </ImageContainer>
        <Title>404</Title>
        <Subtitle>Здравствуйте, что вы тут забыли?</Subtitle>
        <Description>
          Покупать <AccentLink href="/pricing">тут</AccentLink>!
        </Description>
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  background: rgb(var(--background));
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 7rem;
  margin-top: 2rem;
  color: rgb(var(--primary));
  font-weight: 900;
  letter-spacing: 0.1em;
`;

const Subtitle = styled.h2`
  font-size: 2.6rem;
  margin-top: 2.5rem;
  color: rgb(var(--text-primary));
  font-weight: 700;
`;

const Description = styled.div`
  font-size: 2.2rem;
  opacity: 0.95;
  margin-top: 2.5rem;
  color: rgb(var(--text-secondary));
`;

const AccentLink = styled(Link)`
  display: inline-block;
  margin: 0 0.3em;
  padding: 0.2em 1.2em;
  font-size: 2.2rem;
  font-weight: 700;
  color: white;
  background: rgb(var(--primary));
  border-radius: 2em;
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(var(--primary), 0.12);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover {
    background: rgb(var(--primary-dark));
    color: white;
    box-shadow: 0 4px 24px rgba(var(--primary), 0.18);
  }
`;

const ImageContainer = styled.div`
  width: 28rem;
  margin: 0 auto 2rem auto;
`;

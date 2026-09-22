import NextLink from 'next/link';
import styled from 'styled-components';
import Button from 'components/Button';

export default function NotFoundPage() {
  return (
    <Wrapper>
      <Code>404</Code>
      <Text>Такой страницы нет.</Text>
      <Button as={NextLink} href="/pricing">
        В каталог →
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  text-align: center;
  padding: 2rem;
`;

const Code = styled.h1`
  font-size: 9rem;
  font-weight: 700;
  color: rgb(var(--accent));
  letter-spacing: 0.05em;
`;

const Text = styled.p`
  font-size: 2rem;
  opacity: 0.7;
`;

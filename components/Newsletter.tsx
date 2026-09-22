import NextLink from 'next/link';
import { FormEvent, useState } from 'react';
import styled from 'styled-components';
import Button from 'components/Button';
import Container from 'components/Container';
import Input from 'components/Input';
import SectionTitle from 'components/SectionTitle';
import { media } from 'utils/media';

// Подписка прямо в блоке, без модалки.
export default function Newsletter() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus('sending');
    try {
      const res = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), consent: form.get('consent') === 'on' }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || (res.ok ? 'Вы подписаны' : 'Ошибка отправки'));
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setMessage('Нет связи с сервером');
      setStatus('error');
    }
  }

  return (
    <Wrapper>
      <Container>
        <Title>Новости о скидках и новых продуктах</Title>
        <Text>Технические обзоры, советы по обслуживанию топливной системы, ранний доступ к новинкам.</Text>
        {status === 'done' ? (
          <Text>{message}</Text>
        ) : (
          <Form onSubmit={onSubmit}>
            <Row>
              <Input name="email" type="email" required placeholder="Ваш email" aria-label="Email" />
              <Button type="submit" disabled={status === 'sending'}>
                Подписаться
              </Button>
            </Row>
            <Consent>
              <input type="checkbox" name="consent" required />
              <span>
                Согласен(на) на обработку персональных данных и получение рассылки (
                <NextLink href="/privacy-policy" target="_blank">
                  политика
                </NextLink>
                )
              </span>
            </Consent>
            {status === 'error' && <Error>{message}</Error>}
          </Form>
        )}
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  padding: 10rem 0;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  text-align: center;
`;

const Title = styled(SectionTitle)`
  margin-bottom: 2rem;
`;

const Text = styled.p`
  font-size: 1.8rem;
  opacity: 0.8;
  max-width: 60rem;
  margin: 0 auto 3rem;
`;

const Form = styled.form`
  max-width: 60rem;
  margin: 0 auto;
`;

const Row = styled.div`
  display: flex;
  gap: 1.2rem;

  ${media('<=tablet')} {
    flex-direction: column;
  }
`;

const Consent = styled.label`
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  margin-top: 1.6rem;
  font-size: 1.3rem;
  line-height: 1.4;
  text-align: left;
  opacity: 0.8;
  cursor: pointer;

  input {
    margin-top: 0.3rem;
    accent-color: rgb(var(--accent));
  }
  a {
    border-bottom: 1px solid currentColor;
  }
`;

const Error = styled.p`
  margin-top: 1.2rem;
  color: rgb(var(--accent));
  font-size: 1.4rem;
`;

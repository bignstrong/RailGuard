import useEscClose from 'hooks/useEscKey';
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { media } from 'utils/media';
import Button from './Button';
import CloseIcon from './CloseIcon';
import Container from './Container';
import Input from './Input';
import Overlay from './Overlay';

export interface NewsletterModalProps {
  onClose: () => void;
}

export default function NewsletterModal({ onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEscClose({ onClose });

  const isDisabled = status === 'success';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('idle');
    setMessage('');
    if (email) {
      try {
        const res = await fetch('/api/sendEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          setStatus('success');
        } else {
          const data = await res.json();
          setMessage(data.message || 'Ошибка отправки');
          setStatus('error');
        }
      } catch (e) {
        setMessage('Ошибка сети');
        setStatus('error');
      }
    }
  }

  return (
    <Overlay>
      <Container>
        <Card onSubmit={onSubmit}>
          <CloseIconContainer>
            <CloseIcon onClick={onClose} />
          </CloseIconContainer>
          {status === 'success' ? (
            <SuccessWrapper>
              <SuccessIcon>✓</SuccessIcon>
              <SuccessTitle>Вы успешно подписались!</SuccessTitle>
              <SuccessDescription>
                Спасибо за интерес к RailGuard!
                <br />
                Теперь вы будете первыми узнавать о скидках, новинках и полезных советах.
              </SuccessDescription>
              <CloseButton as="button" onClick={onClose}>
                <span style={{ fontSize: '1.5em', lineHeight: 0 }}>✕</span> Закрыть
              </CloseButton>
            </SuccessWrapper>
          ) : (
            <>
              <Title>Подпишитесь на рассылку RailGuard</Title>
              <Description>Получайте первыми новости о скидках, специальных предложениях и новых продуктах!</Description>
              <Row>
                <CustomInput
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Введите ваш email..."
                  required
                  type="email"
                  autoFocus
                />
                <CustomButton as="button" type="submit" disabled={isDisabled}>
                  Подписаться
                </CustomButton>
              </Row>
              {message && <ErrorMessage>{message}</ErrorMessage>}
            </>
          )}
        </Card>
      </Container>
    </Overlay>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: none; }
`;

const Card = styled.form`
  display: flex;
  position: relative;
  flex-direction: column;
  margin: auto;
  padding: 10rem 5rem;
  background: rgb(var(--modalBackground));
  border-radius: 0.6rem;
  max-width: 70rem;
  min-width: 320px;
  overflow: hidden;
  color: rgb(var(--text));
  box-shadow: var(--shadow-lg);
  animation: ${fadeIn} 0.5s cubic-bezier(0.4, 0, 0.2, 1);

  ${media('<=tablet')} {
    padding: 7.5rem 2.5rem;
    min-width: 0;
    width: 100%;
  }
`;

const CloseIconContainer = styled.div`
  position: absolute;
  right: 2rem;
  top: 2rem;
  z-index: 2;
  svg {
    cursor: pointer;
    width: 2rem;
  }
`;

const Title = styled.h2`
  font-size: 2.2rem;
  font-weight: bold;
  line-height: 1.1;
  text-align: center;
  color: rgb(var(--text));
  margin-bottom: 1.2rem;
`;

const Description = styled.p`
  font-size: 1.3rem;
  margin: 0 0 2.5rem 0;
  text-align: center;
  color: rgb(var(--text-secondary));
`;

const Row = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 1.5rem;
  gap: 1rem;

  ${media('<=tablet')} {
    flex-direction: column;
    gap: 1.2rem;
  }
`;

const CustomButton = styled(Button)`
  height: 4.2rem;
  padding: 0 2.2rem;
  font-size: 1.3rem;
  font-weight: 600;
  background: rgb(var(--primary));
  color: #fff;
  border-radius: 0.6rem;
  box-shadow: var(--shadow-lg);
  transition: background 0.2s;
  &:hover {
    background: rgb(var(--primary), 0.85);
  }
  ${media('<=tablet')} {
    width: 100%;
    margin-left: 0;
    margin-top: 0;
  }
`;

const CustomInput = styled(Input)`
  width: 100%;
  font-size: 1.3rem;
  padding: 1.2rem 1.2rem;
  border-radius: 0.6rem;
  border: 1px solid rgb(var(--primary), 0.2);
  color: rgb(var(--text));
  background: rgb(var(--background));
  &::placeholder {
    color: rgb(var(--text-secondary));
    opacity: 0.8;
  }
`;

const ErrorMessage = styled.p`
  color: rgb(var(--errorColor));
  font-size: 1.3rem;
  margin: 1.5rem 0 0 0;
  text-align: center;
  background: rgba(255, 0, 0, 0.07);
  border-radius: 0.5rem;
  padding: 0.7rem 1rem;
`;

const SuccessWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 24rem;
  animation: ${fadeIn} 0.5s cubic-bezier(0.4, 0, 0.2, 1);
`;

const SuccessIcon = styled.div`
  width: 5rem;
  height: 5rem;
  background: rgb(var(--primary));
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
`;

const SuccessTitle = styled.h2`
  font-size: 2rem;
  color: rgb(var(--text));
  margin-bottom: 0.7rem;
  text-align: center;
`;

const SuccessDescription = styled.p`
  font-size: 1.3rem;
  color: rgb(var(--text-secondary));
  text-align: center;
  margin-bottom: 2.2rem;
`;

const CloseButton = styled(Button)`
  width: 100%;
  max-width: 20rem;
  font-size: 1.3rem;
  padding: 1.3rem 0;
  border-radius: 0.6rem;
  margin-top: 2.5rem;
  background: rgb(var(--primary));
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  box-shadow: var(--shadow-lg);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: rgb(var(--primary), 0.85);
    box-shadow: 0 0 0 3px rgba(var(--primary), 0.15);
  }
`;

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import YandexMetrika from 'components/YandexMetrika';

const KEY = 'cookie-consent';
type Choice = 'accepted' | 'rejected';

// Метрика грузится только после явного согласия (152-ФЗ: cookie + IP = ПДн).
export default function CookieConsent() {
  const [choice, setChoice] = useState<Choice | 'unknown' | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      setChoice(saved === 'accepted' || saved === 'rejected' ? saved : 'unknown');
    } catch {
      setChoice('unknown');
    }
  }, []);

  const choose = (value: Choice) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    setChoice(value);
  };

  return (
    <>
      {choice === 'accepted' && <YandexMetrika />}
      {choice === 'unknown' && (
        <Bar role="dialog" aria-live="polite" aria-label="Использование cookies">
          <Text>
            Мы используем cookies и Яндекс.Метрику для аналитики. Подробнее в{' '}
            <NextLink href="/cookies-policy">политике cookies</NextLink>.
          </Text>
          <Buttons>
            <Btn type="button" onClick={() => choose('rejected')}>
              Отклонить
            </Btn>
            <Btn type="button" $primary onClick={() => choose('accepted')}>
              Принять
            </Btn>
          </Buttons>
        </Bar>
      )}
    </>
  );
}

const Bar = styled.div`
  position: fixed;
  left: 1.6rem;
  right: 1.6rem;
  bottom: 1.6rem;
  z-index: var(--z-sticky);
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  align-items: center;
  justify-content: space-between;
  padding: 1.6rem 2rem;
  border-radius: 0.8rem;
  background: #1a202c;
  color: #fff;
  box-shadow: var(--shadow-lg);
  font-size: 1.4rem;
  line-height: 1.5;

  a {
    color: #fff;
    text-decoration: underline;
  }
`;

const Text = styled.p`
  margin: 0;
  flex: 1 1 28rem;
`;

const Buttons = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const Btn = styled.button<{ $primary?: boolean }>`
  padding: 0.8rem 1.6rem;
  border-radius: 0.6rem;
  border: 1px solid #fff;
  background: ${(p) => (p.$primary ? '#fff' : 'transparent')};
  color: ${(p) => (p.$primary ? '#1a202c' : '#fff')};
  font: inherit;
  cursor: pointer;
`;

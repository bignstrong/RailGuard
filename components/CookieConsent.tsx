import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import GoogleAnalytics from 'components/GoogleAnalytics';
import YandexMetrika from 'components/YandexMetrika';

const KEY = 'cookie-consent';
type Choice = 'accepted' | 'rejected';

// Метрика грузится только после явного согласия (152-ФЗ: cookie + IP = ПДн).
// Google Analytics — только для визитов не из РФ (страна из cookie geo-country, см. middleware.ts).
export default function CookieConsent() {
  const [choice, setChoice] = useState<Choice | 'unknown' | null>(null);
  const [country, setCountry] = useState('XX');

  useEffect(() => {
    setCountry(document.cookie.match(/(?:^|; )geo-country=([A-Z]{2})/)?.[1] ?? 'XX');
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
      {choice === 'accepted' && country !== 'RU' && country !== 'XX' && <GoogleAnalytics />}
      {choice === 'unknown' && (
        <Bar role="dialog" aria-live="polite" aria-label="Использование cookies">
          <Text>
            Мы используем cookies и Яндекс.Метрику для аналитики. Подробнее в <NextLink href="/cookies-policy">политике cookies</NextLink>.
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
  border-radius: 0.4rem;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  font-size: 1.4rem;
  line-height: 1.5;

  a {
    border-bottom: 1px solid currentColor;
  }
`;

const Text = styled.p`
  flex: 1 1 28rem;
`;

const Buttons = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const Btn = styled.button<{ $primary?: boolean }>`
  padding: 0.8rem 1.6rem;
  border-radius: 0.4rem;
  border: 1px solid ${(p) => (p.$primary ? 'rgb(var(--accent))' : 'rgba(var(--bg), 0.5)')};
  background: ${(p) => (p.$primary ? 'rgb(var(--accent))' : 'transparent')};
  color: rgb(var(--bg));
  cursor: pointer;
`;

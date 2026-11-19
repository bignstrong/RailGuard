import styled from 'styled-components';
import { media } from 'utils/media';

// Единственная кнопка сайта: сплошная оранжевая или контурная. Рендерится как <a> через as={NextLink}.
const Button = styled.button<{ $outline?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 4.4rem;
  padding: 1.6rem 2.4rem;
  border: 2px solid ${(p) => (p.$outline ? 'rgb(var(--accent-text))' : 'rgb(var(--accent))')};
  border-radius: 0.4rem;
  background: ${(p) => (p.$outline ? 'transparent' : 'rgb(var(--accent))')};
  /* Белый текст на заливке: требование владельца (2026-11-20). Контраст 2,86:1, ниже AA. */
  color: ${(p) => (p.$outline ? 'rgb(var(--accent-text))' : 'rgb(var(--bg))')};
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${media('<=tablet')} {
    width: 100%;
    padding: 1.4rem 2rem;
  }
`;

export default Button;

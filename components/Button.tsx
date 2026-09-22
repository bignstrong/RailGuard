import styled from 'styled-components';
import { media } from 'utils/media';

// Единственная кнопка сайта: сплошная оранжевая или контурная. Рендерится как <a> через as={NextLink}.
const Button = styled.button<{ $outline?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.6rem 2.4rem;
  border: 2px solid rgb(var(--accent));
  border-radius: 0.4rem;
  background: ${(p) => (p.$outline ? 'transparent' : 'rgb(var(--accent))')};
  color: ${(p) => (p.$outline ? 'rgb(var(--accent))' : 'rgb(var(--bg))')};
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
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

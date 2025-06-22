import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';

export interface ButtonProps {
  transparent?: boolean;
  disabled?: boolean;
  as?: any;
  type?: 'submit' | 'button' | 'reset';
}

export default function Button({
  children,
  transparent,
  disabled,
  as,
  type,
  ...buttonProps
}: PropsWithChildren<ButtonProps & { [key: string]: any }>) {
  return (
    <ButtonWrapper as={as} type={type} transparent={transparent} disabled={disabled} {...buttonProps}>
      {children}
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.button<ButtonProps>`
  border: none;
  background: ${(p) => (p.transparent ? 'transparent' : 'rgb(var(--primary))')};
  display: inline-block;
  text-decoration: none;
  text-align: center;
  padding: 1.75rem 2.25rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: ${(p) => (p.transparent ? 'rgb(var(--text))' : 'rgb(var(--textSecondary))')};
  text-transform: uppercase;
  font-family: var(--font);
  transition: transform 0.3s;
  backface-visibility: hidden;
  will-change: transform;
  cursor: pointer;
  border-radius: 0.4rem;

  span {
    margin-left: 2rem;
  }

  &:hover {
    transform: scale(1.025);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  ${media('<=tablet')} {
    font-size: 1.1rem;
    padding: 1.5rem 2rem;
  }
`;

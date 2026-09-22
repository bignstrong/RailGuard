import { useEffect } from 'react';
import styled from 'styled-components';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  onClick?: () => void;
}

export default function Toast({ message, type = 'success', onClose, onClick }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Box $error={type === 'error'} onClick={onClick} role="status">
      {message}
      <Close type="button" aria-label="Закрыть" onClick={onClose}>
        ✕
      </Close>
    </Box>
  );
}

const Box = styled.div<{ $error: boolean }>`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.2rem 1.6rem;
  border-radius: 0.4rem;
  background: ${(p) => (p.$error ? 'rgb(var(--accent))' : 'rgb(var(--ink))')};
  color: rgb(var(--bg));
  font-size: 1.4rem;
  cursor: ${(p) => (p.onClick ? 'pointer' : 'default')};
`;

const Close = styled.button`
  border: 0;
  background: none;
  color: inherit;
  font-size: 1.4rem;
  cursor: pointer;
  opacity: 0.7;
`;

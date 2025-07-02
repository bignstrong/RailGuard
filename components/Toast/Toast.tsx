import { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  onClick?: () => void;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const Toast = ({ message, duration = 3000, onClose, type = 'success', onClick }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <ToastContainer onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Message>{message}</Message>
      <CloseButton onClick={onClose}>×</CloseButton>
    </ToastContainer>
  );
};

const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgb(var(--primary));
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  animation: ${slideIn} 0.3s ease-out;
  font-size: 1.4rem;
  border: 2.5px solid #ff0000;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1), 0 0 0 4px rgba(255, 0, 0, 0.1);
  transition: border-color 0.3s, box-shadow 0.3s;
`;

const Message = styled.p`
  margin: 0;
  color: white;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 0;
  opacity: 0.8;
  transition: opacity 0.2s;
  line-height: 1;

  &:hover {
    opacity: 1;
  }
`;

export default Toast;

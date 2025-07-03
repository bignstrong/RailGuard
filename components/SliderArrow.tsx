import styled from 'styled-components';
import { media } from 'utils/media';

interface SliderArrowProps {
  direction: 'left' | 'right';
  onClick: () => void;
  className?: string;
}

const ArrowButton = styled.button<{ direction: 'left' | 'right' }>`
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ direction }) => (direction === 'left' ? 'left: 15px;' : 'right: 15px;')}
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgb(var(--primary));
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 16px rgba(var(--primary), 0.3);

    svg {
      stroke: white;
      transform: ${({ direction }) => (direction === 'left' ? 'rotate(180deg) translateX(2px)' : 'translateX(2px)')};
    }
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--primary), 0.3);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  svg {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: rgb(var(--primary));
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: ${({ direction }) => direction === 'left' && 'rotate(180deg)'};
  }

  ${media('<=tablet')} {
    width: 40px;
    height: 40px;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

export default function SliderArrow({ direction, onClick, className }: SliderArrowProps) {
  return (
    <ArrowButton direction={direction} onClick={onClick} className={className} aria-label={`${direction} arrow`}>
      <svg viewBox="0 0 24 24">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </ArrowButton>
  );
}

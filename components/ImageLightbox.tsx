import useEscKey from 'hooks/useEscKey';
import React, { useState } from 'react';
import styled from 'styled-components';
import { media } from 'utils/media';
import CloseIcon from './CloseIcon';

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNavigation?: boolean;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.97);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Image = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  user-select: none;
  -webkit-user-drag: none;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: white;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const NavigationButton = styled.button<{ direction: 'left' | 'right' }>`
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
    display: none;
  }
`;

export default function ImageLightbox({ imageUrl, onClose, onNext, onPrev, hasNavigation = false }: ImageLightboxProps) {
  useEscKey({ onClose });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onNext) {
      onNext();
    }
    if (isRightSwipe && onPrev) {
      onPrev();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePrev = () => {
    if (onPrev) onPrev();
  };

  const handleNext = () => {
    if (onNext) onNext();
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Image src={imageUrl} alt="Enlarged view" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} />
      <CloseButton onClick={onClose} aria-label="Close lightbox">
        <CloseIcon />
      </CloseButton>
      {hasNavigation && (
        <>
          <NavigationButton direction="left" onClick={handlePrev} aria-label="Previous image">
            <svg viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </NavigationButton>
          <NavigationButton direction="right" onClick={handleNext} aria-label="Next image">
            <svg viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </NavigationButton>
        </>
      )}
    </Overlay>
  );
}

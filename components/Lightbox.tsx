import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from 'components/Icons';
import { useLightbox } from 'contexts/lightbox.context';
import { media } from 'utils/media';

// Полноэкранный просмотр: Esc/стрелки, свайп на тач-устройствах, клик по фону закрывает.
export default function Lightbox() {
  const { images, index, alt, close, step } = useLightbox();
  const isOpen = images.length > 0;
  const touchX = useRef<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      if (lastFocus.current?.isConnected) lastFocus.current.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close, step]);

  if (!isOpen) return null;

  function trapFocus(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return;
    const focusable = overlayRef.current?.querySelectorAll<HTMLElement>('button');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <Overlay
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Просмотр изображения'}
      onKeyDown={trapFocus}
      onClick={(e) => e.target === e.currentTarget && close()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={alt} />
      <Close ref={closeRef} type="button" aria-label="Закрыть" onClick={close}>
        <CloseIcon />
      </Close>
      {images.length > 1 && (
        <>
          <Arrow type="button" aria-label="Назад" $left onClick={() => step(-1)}>
            <ChevronLeftIcon />
          </Arrow>
          <Arrow type="button" aria-label="Вперёд" onClick={() => step(1)}>
            <ChevronRightIcon />
          </Arrow>
        </>
      )}
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--ink), 0.96);

  img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    user-select: none;
  }
`;

const Close = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 4.4rem;
  height: 4.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: none;
  color: rgb(var(--bg));
  font-size: 2.4rem;
  cursor: pointer;
`;

const Arrow = styled.button<{ $left?: boolean }>`
  position: absolute;
  top: 50%;
  ${(p) => (p.$left ? 'left: 2rem;' : 'right: 2rem;')}
  transform: translateY(-50%);
  width: 4.8rem;
  height: 4.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgb(var(--bg));
  color: rgb(var(--ink));
  font-size: 3rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgb(var(--accent));
    color: rgb(var(--ink));
  }

  ${media('<=tablet')} {
    display: none;
  }
`;

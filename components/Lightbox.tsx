import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useLightbox } from 'contexts/lightbox.context';
import { media } from 'utils/media';

// Полноэкранный просмотр: Esc/стрелки, свайп на тач-устройствах, клик по фону закрывает.
export default function Lightbox() {
  const { images, index, close, step } = useLightbox();
  const touchX = useRef<number | null>(null);
  const isOpen = images.length > 0;

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

  return (
    <Overlay
      onClick={(e) => e.target === e.currentTarget && close()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt="" />
      <Close type="button" aria-label="Закрыть" onClick={close}>
        ✕
      </Close>
      {images.length > 1 && (
        <>
          <Arrow type="button" aria-label="Назад" $left onClick={() => step(-1)}>
            ‹
          </Arrow>
          <Arrow type="button" aria-label="Вперёд" onClick={() => step(1)}>
            ›
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
  border: 0;
  border-radius: 50%;
  background: rgb(var(--bg));
  color: rgb(var(--ink));
  font-size: 3rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgb(var(--accent));
    color: rgb(var(--bg));
  }

  ${media('<=tablet')} {
    display: none;
  }
`;

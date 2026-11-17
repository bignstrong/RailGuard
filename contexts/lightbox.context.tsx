import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';

interface LightboxState {
  images: string[];
  index: number;
  alt: string;
  open: (images: string[], index?: number, alt?: string) => void;
  close: () => void;
  step: (delta: number) => void;
}

const LightboxContext = createContext<LightboxState>({ images: [], index: 0, alt: '', open: () => {}, close: () => {}, step: () => {} });

export function LightboxProvider({ children }: PropsWithChildren<{}>) {
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [alt, setAlt] = useState('');

  const open = useCallback((list: string[], i = 0, label = '') => {
    setImages(list);
    setIndex(i);
    setAlt(label);
  }, []);
  const close = useCallback(() => setImages([]), []);
  const step = useCallback((delta: number) => setIndex((i) => (i + delta + images.length) % images.length), [images.length]);

  return <LightboxContext.Provider value={{ images, index, alt, open, close, step }}>{children}</LightboxContext.Provider>;
}

export const useLightbox = () => useContext(LightboxContext);

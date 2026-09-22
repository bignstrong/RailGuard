import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';

interface LightboxState {
  images: string[];
  index: number;
  open: (images: string[], index?: number) => void;
  close: () => void;
  step: (delta: number) => void;
}

const LightboxContext = createContext<LightboxState>({ images: [], index: 0, open: () => {}, close: () => {}, step: () => {} });

export function LightboxProvider({ children }: PropsWithChildren<{}>) {
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const open = useCallback((list: string[], i = 0) => {
    setImages(list);
    setIndex(i);
  }, []);
  const close = useCallback(() => setImages([]), []);
  const step = useCallback((delta: number) => setIndex((i) => (i + delta + images.length) % images.length), [images.length]);

  return <LightboxContext.Provider value={{ images, index, open, close, step }}>{children}</LightboxContext.Provider>;
}

export const useLightbox = () => useContext(LightboxContext);

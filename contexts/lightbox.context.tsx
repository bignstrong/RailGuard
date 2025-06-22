import { createContext, PropsWithChildren, useContext, useState } from 'react';

interface LightboxContextType {
  imageUrl: string | null;
  openLightbox: (url: string, images?: string[]) => void;
  closeLightbox: () => void;
  nextImage: () => void;
  prevImage: () => void;
  hasNavigation: boolean;
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined);

export const LightboxProvider = ({ children }: PropsWithChildren<{}>) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (url: string, imagesList?: string[]) => {
    setImageUrl(url);
    if (imagesList) {
      setImages(imagesList);
      setCurrentIndex(imagesList.indexOf(url));
    } else {
      setImages([url]);
      setCurrentIndex(0);
    }
  };

  const closeLightbox = () => {
    setImageUrl(null);
    setImages([]);
    setCurrentIndex(0);
  };

  const nextImage = () => {
    if (images.length > 1 && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setImageUrl(images[currentIndex + 1]);
    }
  };

  const prevImage = () => {
    if (images.length > 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setImageUrl(images[currentIndex - 1]);
    }
  };

  return (
    <LightboxContext.Provider
      value={{
        imageUrl,
        openLightbox,
        closeLightbox,
        nextImage,
        prevImage,
        hasNavigation: images.length > 1,
      }}
    >
      {children}
    </LightboxContext.Provider>
  );
};

export const useLightbox = () => {
  const context = useContext(LightboxContext);
  if (context === undefined) {
    throw new Error('useLightbox must be used within a LightboxProvider');
  }
  return context;
};

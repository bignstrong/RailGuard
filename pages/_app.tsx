import Cart from 'components/Cart/Cart';
import Footer from 'components/Footer';
import { GlobalStyle } from 'components/GlobalStyles';
import ImageLightbox from 'components/ImageLightbox';
import Navbar from 'components/Navbar';
import NavigationDrawer from 'components/NavigationDrawer';
import NewsletterModal from 'components/NewsletterModal';
import WaveCta from 'components/WaveCta';
import { CartProvider } from 'contexts/cart.context';
import { LightboxProvider, useLightbox } from 'contexts/lightbox.context';
import { NewsletterModalContextProvider, useNewsletterModalContext } from 'contexts/newsletter-modal.context';
import { ToastProvider } from 'contexts/toast.context';
import { AppProps } from 'next/dist/shared/lib/router/router';
import Head from 'next/head';
import { ColorModeScript } from 'nextjs-color-mode';
import { PropsWithChildren } from 'react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/bundle';
import 'swiper/css/navigation';
import { NavItems } from 'types';

const navItems: NavItems = [
  { title: 'Характеристики', href: '/specifications' },
  { title: 'Каталог', href: '/pricing' },
];

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <NewsletterModalContextProvider>
        <CartProvider>
          <LightboxProvider>
            <GlobalStyle />
            <Head>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
              <link rel="icon" type="image/png" href="/favicon.png" />
              {/* <link rel="alternate" type="application/rss+xml" href={EnvVars.URL + 'rss'} title="RSS 2.0" /> */}
              {/* Google Analytics код закомментирован */}
            </Head>
            <ColorModeScript />
            <Providers>
              <Modals />
              <Lightbox />
              <Navbar items={navItems} />
              <Cart />
              <Component {...pageProps} />
              <WaveCta />
              <Footer />
            </Providers>
          </LightboxProvider>
        </CartProvider>
      </NewsletterModalContextProvider>
    </ToastProvider>
  );
}

function Providers<T>({ children }: PropsWithChildren<T>) {
  return <NavigationDrawer items={navItems}>{children}</NavigationDrawer>;
}

function Modals() {
  const { isModalOpened, setIsModalOpened } = useNewsletterModalContext();
  if (!isModalOpened) {
    return null;
  }
  return <NewsletterModal onClose={() => setIsModalOpened(false)} />;
}

function Lightbox() {
  const { imageUrl, closeLightbox, nextImage, prevImage, hasNavigation } = useLightbox();
  if (!imageUrl) {
    return null;
  }
  return <ImageLightbox imageUrl={imageUrl} onClose={closeLightbox} onNext={nextImage} onPrev={prevImage} hasNavigation={hasNavigation} />;
}

export default MyApp;

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Cart from 'components/Cart';
import CookieConsent from 'components/CookieConsent';
import Footer from 'components/Footer';
import { GlobalStyle } from 'components/GlobalStyles';
import Lightbox from 'components/Lightbox';
import Navbar from 'components/Navbar';
import Newsletter from 'components/Newsletter';
import { CartProvider } from 'contexts/cart.context';
import { LightboxProvider } from 'contexts/lightbox.context';
import { ToastProvider } from 'contexts/toast.context';

export default function MyApp({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter();
  if (pathname.startsWith('/admin')) {
    return (
      <>
        <GlobalStyle />
        <Component {...pageProps} />
      </>
    );
  }
  return (
    <ToastProvider>
      <CartProvider>
        <LightboxProvider>
          <GlobalStyle />
          <Head>
            <link rel="icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/favicon.png" />
            <link rel="manifest" href="/manifest.json" />
          </Head>
          <Navbar />
          <main>
            <Component {...pageProps} />
          </main>
          <Newsletter />
          <Footer />
          <Cart />
          <Lightbox />
          <CookieConsent />
        </LightboxProvider>
      </CartProvider>
    </ToastProvider>
  );
}

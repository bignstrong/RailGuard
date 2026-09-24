import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
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
import { startSession } from 'lib/attribution';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'RailGuard',
      url: 'https://railguard.ru/',
      logo: 'https://railguard.ru/webp/Logo.webp',
      email: 'info@railguard.ru',
      sameAs: ['https://t.me/railguard_manager'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Sales',
        email: 'info@railguard.ru',
      },
    },
    {
      '@type': 'WebSite',
      name: 'RailGuard',
      url: 'https://railguard.ru/',
    },
  ],
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter();
  const isAdmin = pathname.startsWith('/admin');
  useEffect(() => {
    if (!isAdmin) startSession();
  }, [isAdmin]);
  if (isAdmin) {
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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
            <link rel="icon" href="/favicon.ico" sizes="48x48" />
            <link rel="icon" href="/favicon-120.png" type="image/png" sizes="120x120" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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

import Footer from 'components/Footer'
import { GlobalStyle } from 'components/GlobalStyles'
import Navbar from 'components/Navbar'
import NavigationDrawer from 'components/NavigationDrawer'
import NewsletterModal from 'components/NewsletterModal'
import WaveCta from 'components/WaveCta'
import { NewsletterModalContextProvider, useNewsletterModalContext } from 'contexts/newsletter-modal.context'
import { AppProps } from 'next/dist/shared/lib/router/router'
import Head from 'next/head'
import { ColorModeScript } from 'nextjs-color-mode'
import { PropsWithChildren } from 'react'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/bundle'
import 'swiper/css/navigation'
import { NavItems } from 'types'

const navItems: NavItems = [
  { title: 'Характеристики', href: '/features' },
  { title: 'Цены', href: '/pricing' },
  { title: 'Контакты', href: '/contact' },
  { title: 'Заказать', href: '/sign-up', outlined: true },
];

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        {/* <link rel="alternate" type="application/rss+xml" href={EnvVars.URL + 'rss'} title="RSS 2.0" /> */}
        {/* Google Analytics код закомментирован */}
      </Head>
      <ColorModeScript />
      <GlobalStyle />
      <Providers>
        <Modals />
        <Navbar items={navItems} />

        <Component {...pageProps} />

        <WaveCta />
        <Footer />
      </Providers>
    </>
  );
}

function Providers<T>({ children }: PropsWithChildren<T>) {
  return (
    <NewsletterModalContextProvider>
      <NavigationDrawer items={navItems}>{children}</NavigationDrawer>
    </NewsletterModalContextProvider>
  );
}

function Modals() {
  const { isModalOpened, setIsModalOpened } = useNewsletterModalContext();
  if (!isModalOpened) {
    return null;
  }
  return <NewsletterModal onClose={() => setIsModalOpened(false)} />;
}

export default MyApp;

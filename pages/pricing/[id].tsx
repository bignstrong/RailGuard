import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styled from 'styled-components';
import Button from 'components/Button';
import Link from 'components/Link';
import Page from 'components/Page';
import { useCart } from 'contexts/cart.context';
import { useLightbox } from 'contexts/lightbox.context';
import { useToast } from 'contexts/toast.context';
import { EnvVars } from 'env';
import { CATALOG, formatPrice, isProductId, PRODUCT_DESCRIPTIONS, ProductId } from 'lib/catalog';
import { loadSite, Product } from 'lib/site';
import { track } from 'lib/track';

type Props = { product: Product };

const PRICE_VALID_UNTIL = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);

// Пути пустые: при docker build нет БД. Страница рендерится при первом запросе и кешируется (ISR).
export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const id = params?.id;

  if (!id || typeof id !== 'string' || !isProductId(id)) {
    return { notFound: true };
  }

  const site = await loadSite();

  if (site.products[id].hidden) {
    return { notFound: true };
  }

  const product: Product = { id, ...CATALOG[id], ...site.products[id] };

  return {
    props: { product },
    revalidate: 60,
  };
};

export default function ProductPage({ product }: Props) {
  const { addItem, items, toggleCart } = useCart();
  const showToast = useToast();
  const { open } = useLightbox();
  const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const discount = product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const canonical = `${EnvVars.URL}pricing/${product.id}`;

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@graph': [
      {
        '@type': 'Product',
        name: product.title,
        image: [`${EnvVars.URL}${product.image.slice(1)}`],
        description: PRODUCT_DESCRIPTIONS[product.id as ProductId],
        sku: product.id,
        brand: { '@type': 'Brand', name: 'RailGuard' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'RUB',
          price: String(product.price),
          availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: canonical,
          priceValidUntil: PRICE_VALID_UNTIL,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'RailGuard',
            item: EnvVars.URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Каталог',
            item: `${EnvVars.URL}pricing`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.title,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <Page title={product.title} description={PRODUCT_DESCRIPTIONS[product.id as ProductId]} canonical={canonical}>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </Head>
      <Container>
        <Grid>
          <ImageSection>
            <Picture type="button" onClick={() => open([product.image])} aria-label={`Увеличить: ${product.title}`}>
              {discount > 0 && <Badge>−{discount}%</Badge>}
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'contain' }}
                priority
              />
            </Picture>
          </ImageSection>
          <InfoSection>
            <Description>{PRODUCT_DESCRIPTIONS[product.id as ProductId]}</Description>
            <PriceRow>
              <Price>{formatPrice(product.price)}</Price>
              {product.oldPrice > product.price && <OldPrice>{formatPrice(product.oldPrice)}</OldPrice>}
            </PriceRow>
            <Button
              type="button"
              disabled={!product.inStock}
              onClick={() => {
                addItem(product);
                track('add_to_cart', { id: product.id, price: product.price });
                showToast(`${product.title} — в корзине`, 'success', toggleCart);
              }}
            >
              {product.inStock ? `В корзину${inCart > 0 ? ` (${inCart})` : ''}` : 'Нет в наличии'}
            </Button>
            <BackLink href="/pricing">← Вернуться в каталог</BackLink>
            <Note>Производитель может менять форму и цвет изделия без ухудшения его функциональности.</Note>
          </InfoSection>
        </Grid>
      </Container>
    </Page>
  );
}

const Container = styled.div`
  max-width: 120rem;
  margin: 0 auto;
  padding: 4rem 2rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ImageSection = styled.div`
  position: relative;
`;

const Picture = styled.button`
  position: relative;
  width: 100%;
  height: 40rem;
  border: 0;
  background: none;
  cursor: zoom-in;

  @media (max-width: 768px) {
    height: 30rem;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 1.6rem;
  left: 1.6rem;
  z-index: 1;
  padding: 0.4rem 1rem;
  border-radius: 0.4rem;
  background: rgb(var(--ink));
  color: rgb(var(--bg));
  font-size: 1.4rem;
  font-weight: 700;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Description = styled.p`
  font-size: 1.5rem;
  line-height: 1.6;
  color: rgba(var(--ink), 0.8);
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  margin: 1rem 0;
`;

const Price = styled.span`
  font-size: 3.2rem;
  font-weight: 700;
  color: rgb(var(--accent));
`;

const OldPrice = styled.s`
  font-size: 2rem;
  color: rgba(var(--ink), 0.5);
`;

const BackLink = styled(Link)`
  font-size: 1.4rem;
  margin-top: 1rem;
`;

const Note = styled.small`
  font-size: 1.2rem;
  color: rgba(var(--ink), 0.5);
  margin-top: 1rem;
`;

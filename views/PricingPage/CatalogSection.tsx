import Image from 'next/image';
import styled from 'styled-components';
import Button from 'components/Button';
import Link from 'components/Link';
import { useCart } from 'contexts/cart.context';
import { useLightbox } from 'contexts/lightbox.context';
import { useToast } from 'contexts/toast.context';
import { formatPrice, ProductId } from 'lib/catalog';
import type { Product } from 'lib/site';
import { track } from 'lib/track';
import { media } from 'utils/media';

const TEXT: Record<ProductId, { description: string; more?: string; best?: boolean }> = {
  'fto-cr-standard': { description: 'Базовый корпус фильтра высокого давления для систем Common Rail', more: '/specifications#filter-body' },
  'cr-10-cartridge': { description: 'Сменный фильтрующий элемент', more: '/specifications#filter-element' },
  'profi-start-kit': { description: 'Корпус и два фильтрующих элемента', best: true },
  'sto-bulk-kit': { description: 'Специальное предложение для автосервисов' },
};

// Страница статическая: дата фиксируется на момент сборки, ~90 дней вперёд.

function ProductCard({ id, title, price, oldPrice, image, inStock }: Product) {
  const { description, more, best } = TEXT[id];
  const { addItem, items, toggleCart } = useCart();
  const showToast = useToast();
  const { open } = useLightbox();
  const inCart = items.find((i) => i.id === id)?.quantity ?? 0;
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;


  return (
    <Card id={id} $best={best}>
      {best && <Ribbon>Лучший выбор</Ribbon>}
      <Picture type="button" onClick={() => open([image])} aria-label={`Увеличить: ${title}`}>
        {discount > 0 && <Badge>−{discount}%</Badge>}
        <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'contain' }} />
      </Picture>
      <Body>
        <h3>{title}</h3>
        <p>{description}</p>
        <Links>
          <Link href={`/pricing/${id}`}>Товар</Link>
          {more && <Link href={more}>Характеристики</Link>}
        </Links>
        <PriceRow>
          <b>{formatPrice(price)}</b>
          {oldPrice > price && <s>{formatPrice(oldPrice)}</s>}
        </PriceRow>
        <Button
          type="button"
          disabled={!inStock}
          onClick={() => {
            addItem({ id, title, price, oldPrice, image });
            track('add_to_cart', { id, price });
            showToast(`${title} — в корзине`, 'success', toggleCart);
          }}
        >
          {inStock ? `В корзину${inCart > 0 ? ` (${inCart})` : ''}` : 'Нет в наличии'}
        </Button>
        <Note>Производитель может менять форму и цвет изделия без ухудшения его функциональности.</Note>
      </Body>
    </Card>
  );
}

export default function CatalogSection({ products }: { products: Product[] }) {
  return (
    <Grid>
      {products.map((p) => (
        <ProductCard key={p.id} {...p} />
      ))}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
  gap: 2rem;
`;

const Card = styled.article<{ $best?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid ${(p) => (p.$best ? 'rgb(var(--accent))' : 'rgba(var(--ink), 0.12)')};
  border-radius: 0.4rem;
  background: rgb(var(--bg));
`;

const Ribbon = styled.span`
  position: absolute;
  top: 1.6rem;
  right: 1.6rem;
  z-index: 1;
  padding: 0.4rem 1rem;
  border-radius: 0.4rem;
  background: rgb(var(--accent));
  color: rgb(var(--bg));
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Picture = styled.button`
  position: relative;
  width: 100%;
  height: 30rem;
  border: 0;
  border-bottom: var(--line);
  background: none;
  cursor: zoom-in;

  ${media('<=tablet')} {
    height: 24rem;
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

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 2.4rem;

  h3 {
    font-size: 2rem;
  }
  p {
    font-size: 1.5rem;
    color: rgba(var(--ink), 0.7);
  }
  a {
    font-size: 1.4rem;
  }
`;

const Links = styled.div`
  display: flex;
  gap: 1.2rem;
  margin-top: 0.4rem;

  a {
    align-self: flex-start;
  }
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1.2rem;

  b {
    font-size: 2.6rem;
    color: rgb(var(--accent));
  }
  s {
    font-size: 1.6rem;
    color: rgba(var(--ink), 0.5);
  }
`;

const Note = styled.small`
  font-size: 1.2rem;
  color: rgba(var(--ink), 0.5);
`;

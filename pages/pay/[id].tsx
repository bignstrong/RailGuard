import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import styled from 'styled-components';
import Button from 'components/Button';
import { formatPrice } from 'lib/catalog';
import { refreshPayment } from 'lib/payments';
import type { PayStatus } from 'lib/paymentsShared';
import prisma from 'lib/prisma';

// Сюда шлюз возвращает покупателя после оплаты. id — наш cuid платежа, без персональных данных на странице.
type Props = { status: PayStatus; amount: number; order: string; url: string | null };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id);
  let p = await prisma.payment.findUnique({ where: { id } });
  if (!p) return { notFound: true };
  // Уведомление от шлюза может прийти позже покупателя — спрашиваем статус сами.
  if (p.status === 'pending') p = await refreshPayment(p.id).catch(() => p!);
  ctx.res.setHeader('Cache-Control', 'no-store');
  return { props: { status: p.status as PayStatus, amount: p.amount / 100, order: p.orderId.slice(-6).toUpperCase(), url: p.status === 'pending' ? p.url : null } };
};

const TEXT: Record<PayStatus, [string, string]> = {
  succeeded: ['Оплата прошла', 'Спасибо! Менеджер свяжется с вами, чтобы подтвердить адрес и отправку.'],
  pending: ['Ждём подтверждение оплаты', 'Банк ещё обрабатывает платёж. Страница обновится сама.'],
  canceled: ['Оплата не прошла', 'Деньги не списаны. Попробуйте ещё раз или напишите нам — поможем.'],
  failed: ['Оплата не прошла', 'Деньги не списаны. Напишите нам — пришлём новую ссылку на оплату.'],
  refunded: ['Платёж возвращён', 'Деньги по этому платежу вернулись на карту.'],
};

export default function PayResult({ status, amount, order, url }: Props) {
  const [title, text] = TEXT[status];
  return (
    <Wrapper>
      <Head>
        <title>{title} | RailGuard</title>
        <meta name="robots" content="noindex, nofollow" />
        {status === 'pending' && <meta httpEquiv="refresh" content="5" />}
      </Head>
      <Mark $ok={status === 'succeeded'}>{status === 'succeeded' ? '✓' : status === 'pending' ? '…' : '!'}</Mark>
      <h1>{title}</h1>
      <p>
        Заказ #{order} · {formatPrice(amount)}
      </p>
      <p>{text}</p>
      {url ? (
        <Button as="a" href={url}>
          Вернуться к оплате
        </Button>
      ) : (
        <Button as={NextLink} href={status === 'succeeded' ? '/pricing' : '/delivery#contacts'}>
          {status === 'succeeded' ? 'В каталог' : 'Контакты'}
        </Button>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  text-align: center;
  padding: 4rem 2rem;

  h1 {
    font-size: 3.6rem;
  }
  p {
    max-width: 52rem;
    font-size: 1.7rem;
    color: rgba(var(--ink), 0.75);
  }
`;

const Mark = styled.div<{ $ok: boolean }>`
  display: grid;
  place-items: center;
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  font-size: 3.4rem;
  font-weight: 700;
  color: ${(p) => (p.$ok ? 'rgb(var(--bg))' : 'rgb(var(--accent))')};
  background: ${(p) => (p.$ok ? 'rgb(var(--accent))' : 'rgba(var(--accent), 0.12)')};
`;

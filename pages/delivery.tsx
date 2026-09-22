import type { GetServerSideProps } from 'next';
import styled from 'styled-components';
import Page from 'components/Page';
import RichText from 'components/RichText';
import { loadSite, SiteConfig } from 'lib/site';

type Props = { contacts: SiteConfig['contacts'] };

// Контакты редактируются в админке (раздел «Сайт»); пустые строки не показываются.
export const getServerSideProps: GetServerSideProps<Props> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return { props: { contacts: (await loadSite()).contacts } };
};

export default function DeliveryPage({ contacts: CONTACTS }: Props) {
  return (
    <Page
      title="Доставка, оплата и гарантия"
      description="Как заказать фильтр RailGuard: оплата, доставка по России, возврат, гарантия, контакты"
      canonical="https://railguard.ru/delivery"
    >
      <Columns>
        <Block id="order">
          <h2>Как проходит заказ</h2>
          <RichText>
            <ul>
              <li>Вы добавляете товар в корзину и оставляете телефон и email.</li>
              <li>Менеджер перезванивает или пишет в WhatsApp/Telegram, подтверждает наличие и адрес.</li>
              <li>Отправляем в день подтверждения, если заказ оформлен до 18:00 по Москве.</li>
            </ul>
          </RichText>
        </Block>

        <Block id="payment">
          <h2>Оплата</h2>
          <RichText>
            <ul>
              <li>Перевод на счёт по реквизитам, которые пришлёт менеджер.</li>
              <li>Для автосервисов и юрлиц — безналичный расчёт по счёту с закрывающими документами.</li>
              <li>Цена на сайте окончательная, скрытых доплат нет.</li>
            </ul>
          </RichText>
        </Block>

        <Block id="delivery">
          <h2>Доставка</h2>
          <RichText>
            <ul>
              <li>По России транспортной компанией или Почтой, 1–3 рабочих дня по центральным регионам.</li>
              <li>Доставка бесплатная при заказе от 5 000 ₽.</li>
              <li>Трек-номер присылаем на email в день отправки.</li>
            </ul>
          </RichText>
        </Block>

        <Block id="returns">
          <h2>Возврат и гарантия</h2>
          <RichText>
            <ul>
              <li>Возврат неустановленного товара в течение 14 дней с момента получения.</li>
              <li>Каждый корпус опрессован на 1800 бар перед отправкой.</li>
              <li>Условия гарантии на корпус уточняйте у менеджера при заказе.</li>
            </ul>
          </RichText>
        </Block>

        <Block id="contacts">
          <h2>Контакты</h2>
          <RichText>
            <ul>
              {CONTACTS.phone && (
                <li>
                  Телефон и WhatsApp: <a href={`tel:${CONTACTS.phone.replace(/[^\d+]/g, '')}`}>{CONTACTS.phone}</a>
                </li>
              )}
              <li>
                Email: <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>
              </li>
              <li>{CONTACTS.hours}</li>
              {CONTACTS.legal && <li>{CONTACTS.legal}</li>}
            </ul>
          </RichText>
        </Block>
      </Columns>
    </Page>
  );
}

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(32rem, 1fr));
  gap: 2rem;
`;

const Block = styled.section`
  padding: 3rem;
  border: var(--line);
  border-radius: 0.4rem;
  scroll-margin-top: 8rem;

  h2 {
    font-size: 2.2rem;
    margin-bottom: 1.6rem;
  }
  a {
    color: rgb(var(--accent));
    border-bottom: 1px solid currentColor;
  }
`;

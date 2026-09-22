import nodemailer from 'nodemailer';
import { formatPrice } from 'lib/catalog';

type OrderForMail = {
  id: string;
  totalPrice: number;
  items: { title: string; quantity: number; price: number }[];
  contact: { phone: string; email: string; preferredContact: string };
};

// Письмо о новом заказе через SMTP (Яндекс 360). Не настроен SMTP — только предупреждение в лог, заказ уже сохранён.
export async function sendOrderEmail(order: OrderForMail): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ORDER_NOTIFY_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ORDER_NOTIFY_TO) {
    console.warn('SMTP is not configured, order email skipped:', order.id);
    return;
  }
  const port = Number(SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://railguard.ru';
  const text = [
    `Новый заказ #${order.id}`,
    `Сумма: ${formatPrice(order.totalPrice)}`,
    '',
    'Товары:',
    ...order.items.map((i) => `- ${i.title} × ${i.quantity} = ${formatPrice(i.price * i.quantity)}`),
    '',
    `Телефон: +7${order.contact.phone}`,
    `Email: ${order.contact.email}`,
    `Связь: ${order.contact.preferredContact}`,
    '',
    `Открыть в админке: ${site}${process.env.ADMIN_PATH || ''}/orders/${order.id}`,
  ].join('\n');
  await transport.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: ORDER_NOTIFY_TO,
    subject: `Заказ #${order.id.slice(-6)} на ${formatPrice(order.totalPrice)}`,
    text,
  });
}

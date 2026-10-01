import nodemailer from 'nodemailer';
import { type Channel, CHANNEL_LABEL } from 'lib/attribution';
import { formatPrice } from 'lib/catalog';
import { loadSite, notifyList } from 'lib/site';

type OrderForMail = {
  id: string;
  totalPrice: number;
  items: { title: string; quantity: number; price: number; oldPrice?: number }[];
  contact: { phone: string; email: string; preferredContact: string };
  channel?: string;
  createdAt?: Date;
};

const PREFERRED: Record<string, string> = { phone: 'Звонок', whatsapp: 'WhatsApp', telegram: 'Telegram' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fmtPhone = (p: string) => `+7 ${p.slice(0, 3)} ${p.slice(3, 6)}-${p.slice(6, 8)}-${p.slice(8)}`;

// Цвета сайта (GlobalStyles): белый фон, тёмно-синий текст, оранжевый акцент. Вёрстка таблицами и инлайн-стилями — иначе почтовики ломают.
const INK = '#0a121e';
const ACCENT = '#ff6b00';
const MUTED = '#5b626c';
const LINE = '#e3e5e8';
const FONT = "'Poppins', 'Segoe UI', Roboto, Arial, sans-serif";

export function orderEmailHtml(order: OrderForMail, site: string, adminUrl: string): string {
  const { phone, email, preferredContact } = order.contact;
  const when = (order.createdAt ?? new Date()).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const qty = order.items.reduce((s, i) => s + i.quantity, 0);
  const quick =
    preferredContact === 'whatsapp' ? `https://wa.me/7${phone}` : preferredContact === 'telegram' ? `https://t.me/+7${phone}` : `tel:+7${phone}`;
  const channel = order.channel && CHANNEL_LABEL[order.channel as Channel];

  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font-size:15px;color:${INK};">
          <div style="font-weight:600;">${esc(i.title)}</div>
          <div style="font-size:13px;color:${MUTED};margin-top:2px;">${i.quantity} × ${formatPrice(i.price)}${
            i.oldPrice && i.oldPrice > i.price ? ` <span style="text-decoration:line-through;">${formatPrice(i.oldPrice)}</span>` : ''
          }</div>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid ${LINE};font-size:15px;font-weight:600;color:${INK};white-space:nowrap;">${formatPrice(i.price * i.quantity)}</td>
      </tr>`,
    )
    .join('');

  const field = (label: string, value: string) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${MUTED};width:120px;vertical-align:top;">${label}</td>
        <td style="padding:6px 0;font-size:15px;color:${INK};">${value}</td>
      </tr>`;

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Новый заказ</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<div style="display:none;max-height:0;overflow:hidden;">${formatPrice(order.totalPrice)} · ${qty} шт. · +7${phone}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;font-family:${FONT};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="height:4px;background:${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:24px 32px 0;">
        <a href="${site}" style="text-decoration:none;color:${INK};font-size:20px;font-weight:700;">
          <img src="${site}/icon-192.png" width="32" height="32" alt="" style="vertical-align:middle;border:0;margin-right:8px;">RailGuard
        </a>
      </td></tr>
      <tr><td style="padding:28px 32px 8px;">
        <div style="display:inline-block;padding:4px 12px;border-radius:999px;background:#fff1e6;color:${ACCENT};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Новый заказ</div>
        <div style="margin-top:14px;font-size:40px;line-height:1.1;font-weight:700;color:${INK};">${formatPrice(order.totalPrice)}</div>
        <div style="margin-top:8px;font-size:14px;color:${MUTED};">№ ${esc(order.id.slice(-6).toUpperCase())} · ${when} МСК${channel ? ` · ${esc(channel)}` : ''}</div>
      </td></tr>
      <tr><td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
          <tr>
            <td style="padding:16px 0 0;font-size:15px;color:${MUTED};">Итого, ${qty} шт.</td>
            <td align="right" style="padding:16px 0 0;font-size:20px;font-weight:700;color:${INK};white-space:nowrap;">${formatPrice(order.totalPrice)}</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:28px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;border-radius:10px;">
          <tr><td style="padding:18px 20px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};margin-bottom:6px;">Покупатель</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${field('Телефон', `<a href="tel:+7${phone}" style="color:${INK};font-weight:600;text-decoration:none;">${fmtPhone(phone)}</a>`)}
              ${field('Email', `<a href="mailto:${esc(email)}" style="color:${INK};text-decoration:none;">${esc(email)}</a>`)}
              ${field('Связаться', `<a href="${quick}" style="color:${ACCENT};font-weight:600;text-decoration:none;">${PREFERRED[preferredContact] ?? esc(preferredContact)} →</a>`)}
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:28px 32px 32px;">
        <a href="${adminUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;background:${ACCENT};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Открыть заказ в админке</a>
      </td></tr>
      <tr><td style="padding:18px 32px;border-top:1px solid ${LINE};font-size:12px;color:${MUTED};">
        Письмо отправлено автоматически с <a href="${site}" style="color:${MUTED};">${esc(site.replace(/^https?:\/\//, ''))}</a>. Получателей меняют в админке: Сайт → Уведомления о заказах.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// Письмо о новом заказе через SMTP (SpaceWeb). Получатели — из админки «Сайт», иначе ORDER_NOTIFY_TO.
// Не настроен SMTP — только предупреждение в лог, заказ уже сохранён.
export async function sendOrderEmail(order: OrderForMail): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ORDER_NOTIFY_TO = '' } = process.env;
  const to = notifyList((await loadSite()).orderNotifyTo || ORDER_NOTIFY_TO);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !to.length) {
    console.warn('SMTP is not configured, order email skipped:', order.id);
    return;
  }
  const port = Number(SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://railguard.ru';
  const adminUrl = `${site}${process.env.ADMIN_PATH || ''}/orders/${order.id}`;
  const text = [
    `Новый заказ #${order.id}`,
    `Сумма: ${formatPrice(order.totalPrice)}`,
    '',
    'Товары:',
    ...order.items.map((i) => `- ${i.title} × ${i.quantity} = ${formatPrice(i.price * i.quantity)}`),
    '',
    `Телефон: +7${order.contact.phone}`,
    `Email: ${order.contact.email}`,
    `Связь: ${PREFERRED[order.contact.preferredContact] ?? order.contact.preferredContact}`,
    '',
    `Открыть в админке: ${adminUrl}`,
  ].join('\n');
  const mail = {
    from: SMTP_FROM || SMTP_USER,
    subject: `Заказ #${order.id.slice(-6).toUpperCase()} на ${formatPrice(order.totalPrice)}`,
    text,
    html: orderEmailHtml(order, site, adminUrl),
  };
  // Каждому получателю — отдельное письмо: адреса друг друга не видны, сбой одного не мешает остальным.
  const results = await Promise.allSettled(to.map((addr) => transport.sendMail({ ...mail, to: addr })));
  results.forEach((r, i) =>
    r.status === 'fulfilled'
      ? console.info(`Order email ${order.id} → ${to[i]}: ${r.value.response}`)
      : console.error(`Order email ${order.id} → ${to[i]} failed:`, r.reason),
  );
}

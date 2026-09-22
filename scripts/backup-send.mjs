// Письмо с дампом (stdin) на ORDER_NOTIFY_TO через SMTP из .env. Вызывается из backup.sh, когда Telegram не настроен или недоступен.
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ORDER_NOTIFY_TO, BACKUP_NAME = 'railguard.dump' } = process.env;
if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ORDER_NOTIFY_TO) {
  console.error('smtp not configured (SMTP_HOST/SMTP_USER/SMTP_PASS/ORDER_NOTIFY_TO)');
  process.exit(1);
}
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const file = Buffer.concat(chunks);
const subject = `RailGuard backup ${BACKUP_NAME}, ${Math.round(file.length / 1024)} KB`;
const port = Number(SMTP_PORT) || 465;
const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
await transport.sendMail({ from: SMTP_FROM || SMTP_USER, to: ORDER_NOTIFY_TO, subject, text: subject, attachments: [{ filename: BACKUP_NAME, content: file }] });
console.log('sent by email');

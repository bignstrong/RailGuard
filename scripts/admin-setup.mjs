#!/usr/bin/env node
// Генерирует значения для .env админки. Запуск: node scripts/admin-setup.mjs [пароль]
// Без аргумента пароль генерируется случайный и печатается один раз.
import { createHmac, randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2] || randomBytes(15).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const sessionSecret = randomBytes(48).toString('base64url');
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const totp = Array.from(randomBytes(20), (b) => B32[b % 32]).join('');
const adminPath = '/' + randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, 'x') + '-panel';
// Самопроверка TOTP-алгоритма по RFC 6238 (вектор для SHA1, T=59 → 287082? для 8 цифр 94287082)
const msg = Buffer.alloc(8);
msg.writeBigUInt64BE(1n);
const h = createHmac('sha1', Buffer.from('12345678901234567890')).update(msg).digest();
const off = h[19] & 0xf;
const code = (((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]) % 1_000_000;
if (String(code).padStart(6, '0') !== '287082') throw new Error('TOTP self-check failed');

console.log(`# Пароль админки (покажется только сейчас): ${password}\n`);
console.log(`ADMIN_PATH=${adminPath}`);
console.log('ADMIN_LOGIN=owner');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log('\n# Первый вход: логин owner + пароль. 2FA включается в админке, раздел «Настройки».');

// node lib/attribution.test.mjs
import ts from 'typescript';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Node 22 без встроенного TypeScript: транспилируем модуль на лету.
const src = readFileSync(new URL('./attribution.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { channelOf, deviceOf, touchFromLocation } = await import('data:text/javascript,' + encodeURIComponent(js));

const t = (href, ref = '') => touchFromLocation(href, ref);
const ch = (href, ref) => channelOf(t(href, ref));

assert.equal(t('https://railguard.ru/pricing', 'https://railguard.ru/'), null, 'internal navigation is not a touch');
assert.equal(ch('https://railguard.ru/', ''), 'direct');
assert.equal(ch('https://railguard.ru/', 'https://yandex.ru/search/?text=x'), 'search');
assert.equal(ch('https://railguard.ru/', 'https://www.google.com/'), 'search');
assert.equal(ch('https://railguard.ru/', 'https://mail.yandex.ru/'), 'email');
assert.equal(ch('https://railguard.ru/', 'https://t.me/'), 'social');
assert.equal(ch('https://railguard.ru/', 'https://www.avito.ru/item'), 'classified');
assert.equal(ch('https://railguard.ru/', 'https://www.drive2.ru/l/1'), 'forum');
assert.equal(ch('https://railguard.ru/', 'https://example.com/'), 'referral');
assert.equal(ch('https://railguard.ru/?yclid=123', 'https://yandex.ru/'), 'ads');
assert.equal(ch('https://railguard.ru/?utm_source=avito&utm_medium=classified', ''), 'classified');
assert.equal(ch('https://railguard.ru/?utm_source=x&utm_medium=weird', ''), 'tagged');
assert.equal(ch('https://railguard.ru/?utm_source=sto&utm_medium=email', 'https://railguard.ru/'), 'email', 'utm wins over own referrer');
const y = t('https://railguard.ru/pricing?yclid=9', '');
assert.deepEqual([y.source, y.medium, y.yclid, y.landing], ['yandex', 'cpc', '9', '/pricing?yclid=9']);
assert.equal(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148'), 'mobile');
assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 14; SM-X200) AppleWebKit/537.36 Safari/537.36'), 'tablet');
assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36'), 'mobile');
assert.equal(deviceOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop');
console.log('attribution ok');

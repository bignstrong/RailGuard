// node lib/phone.test.mjs
import assert from 'node:assert/strict';
import { formatPhone, phoneDigits } from './phone.mjs';

assert.equal(phoneDigits('+7 (999) 123-45-67'), '9991234567');
assert.equal(phoneDigits('89991234567'), '9991234567');
assert.equal(phoneDigits('999123456789'), '9991234567');
assert.equal(formatPhone(''), '');
assert.equal(formatPhone('999'), '+7 (999');
assert.equal(formatPhone('99912'), '+7 (999) 12');
assert.equal(formatPhone('9991234567'), '+7 (999) 123-45-67');
console.log('phone ok');

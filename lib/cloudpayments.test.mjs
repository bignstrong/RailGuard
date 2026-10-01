// node lib/cloudpayments.test.mjs
import assert from 'node:assert/strict';
import { cpHmac, cpStatus, cpVerify } from './cloudpayments.mjs';

const secret = 'api-secret';
const body = 'TransactionId=504&Amount=14000.00&Currency=RUB&InvoiceId=cmabc&Status=Completed&OperationType=Payment';
const sig = cpHmac(body, secret);
assert.equal(sig, 'OcYjNx0htEwOaHEKfmxf8kj8hq4/4TglmTQqClLae4I=', 'совпадает с openssl dgst -sha256 -hmac … | base64');
assert.ok(cpVerify(body, sig, secret));
assert.ok(!cpVerify(body.replace('14000.00', '1.00'), sig, secret), 'подменённое тело не проходит');
assert.ok(!cpVerify(body, sig, ''), 'без секрета уведомления не принимаем');
assert.ok(!cpVerify(body, undefined, secret), 'без заголовка не принимаем');

assert.equal(cpStatus({ Status: 'Completed', OperationType: 'Payment' }), 'succeeded');
assert.equal(cpStatus({ Status: 'Completed', OperationType: 'Refund' }), 'refunded');
assert.equal(cpStatus({ Status: 'Declined' }), 'pending');
assert.equal(cpStatus({ Status: 'Cancelled' }), 'canceled');
assert.equal(cpStatus(undefined), 'pending');
console.log('cloudpayments: ok');

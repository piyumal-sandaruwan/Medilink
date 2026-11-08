import crypto from 'crypto';
import {
  generatePayHereCheckoutHash,
  verifyPayHereNotification,
} from '../src/services/payhereService.js';

describe('PayHere signature helpers', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PAYHERE_MERCHANT_ID = '1234567';
    process.env.PAYHERE_MERCHANT_SECRET = 'test-merchant-secret';
    process.env.PAYHERE_SANDBOX = 'true';
    process.env.API_PUBLIC_URL = 'https://api.example.test';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('generates a deterministic checkout hash using two-decimal LKR amount', () => {
    const hash = generatePayHereCheckoutHash({
      merchantId: '1234567',
      orderId: 'MLK-ORDER-1',
      amount: 2500,
      currency: 'LKR',
      merchantSecret: 'test-merchant-secret',
    });
    expect(hash).toMatch(/^[A-F0-9]{32}$/);
    expect(hash).toBe(generatePayHereCheckoutHash({
      merchantId: '1234567',
      orderId: 'MLK-ORDER-1',
      amount: '2500.00',
      currency: 'LKR',
      merchantSecret: 'test-merchant-secret',
    }));
  });

  test('accepts a valid PayHere notification signature', () => {
    const payload = {
      merchant_id: '1234567',
      order_id: 'MLK-ORDER-1',
      payhere_amount: '2500.00',
      payhere_currency: 'LKR',
      status_code: '2',
    };
    const hashedSecret = crypto.createHash('md5').update('test-merchant-secret').digest('hex').toUpperCase();
    payload.md5sig = crypto.createHash('md5')
      .update(`${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`)
      .digest('hex').toUpperCase();
    expect(verifyPayHereNotification(payload)).toBe(true);
  });

  test('rejects a forged or modified notification', () => {
    expect(verifyPayHereNotification({
      merchant_id: '1234567',
      order_id: 'MLK-ORDER-1',
      payhere_amount: '2500.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: '00000000000000000000000000000000',
    })).toBe(false);
  });
});

import crypto from 'crypto';
import config from '../config/env.js';

export const formatPayHereAmount = (amount) => Number(amount).toFixed(2);

export const generatePayHereCheckoutHash = ({ merchantId, orderId, amount, currency = 'LKR', merchantSecret }) => {
  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  return crypto
    .createHash('md5')
    .update(`${merchantId}${orderId}${formatPayHereAmount(amount)}${currency}${hashedSecret}`)
    .digest('hex')
    .toUpperCase();
};

export const verifyPayHereNotification = (payload) => {
  const { merchantId, merchantSecret } = config.payhere;
  if (
    !merchantId ||
    !merchantSecret ||
    payload.merchant_id !== merchantId ||
    !payload.order_id ||
    !payload.payhere_amount ||
    !payload.payhere_currency ||
    payload.status_code === undefined ||
    !payload.md5sig
  ) {
    return false;
  }

  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const expected = crypto
    .createHash('md5')
    .update(
      `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`
    )
    .digest('hex')
    .toUpperCase();

  const received = String(payload.md5sig).toUpperCase();
  if (!/^[A-F0-9]{32}$/.test(received)) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

export const createPayHereCheckoutFields = ({ payment, patient, appointment, schedule }) => {
  const { merchantId, merchantSecret, checkoutUrl } = config.payhere;
  const orderId = payment.orderId;
  const amount = formatPayHereAmount(payment.amount);
  const fullName = String(patient.name || 'MediLink Patient').trim().split(/\s+/);
  const firstName = fullName.shift() || 'Patient';
  const lastName = fullName.join(' ') || 'MediLink';
  const hospital = schedule?.hospital;
  const address = hospital?.address || 'Sri Lanka';
  const city = hospital?.city || 'Colombo';
  const baseClientUrl = config.clientUrl.replace(/\/$/, '');

  return {
    checkoutUrl,
    fields: {
      merchant_id: merchantId,
      return_url: `${baseClientUrl}/patient/checkout/${appointment._id}?payment=return`,
      cancel_url: `${baseClientUrl}/patient/checkout/${appointment._id}?payment=cancelled`,
      notify_url: `${config.apiPublicUrl}/api/payments/payhere/notify`,
      first_name: firstName,
      last_name: lastName,
      email: patient.email,
      phone: patient.phone,
      address,
      city,
      country: 'Sri Lanka',
      order_id: orderId,
      items: `MediLink Appointment #${appointment.appointmentNo}`,
      currency: 'LKR',
      amount,
      hash: generatePayHereCheckoutHash({
        merchantId,
        orderId,
        amount,
        currency: 'LKR',
        merchantSecret,
      }),
    },
  };
};

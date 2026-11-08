import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validates critical environment variables and exports application configuration.
 * Fails fast if critical variables are missing in non-test environments.
 */
export const validateEnv = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const missingCritical = [];

  if (!process.env.MONGODB_URI) {
    missingCritical.push('MONGODB_URI');
  }

  if (!process.env.JWT_SECRET) {
    missingCritical.push('JWT_SECRET');
  }

  if (missingCritical.length > 0) {
    const errorBanner = [
      '=================================================================',
      'CRITICAL CONFIGURATION ERROR: MISSING ENVIRONMENT VARIABLES',
      '-----------------------------------------------------------------',
      `The following required environment variable(s) are missing:`,
      ...missingCritical.map((v) => `  - ${v}`),
      '',
      'Please create a .env file in /server based on .env.example',
      'and configure valid values for MONGODB_URI and JWT_SECRET.',
      '=================================================================',
    ].join('\n');

    console.error('\n' + errorBanner + '\n');
    throw new Error(`Missing required environment variables: ${missingCritical.join(', ')}`);
  }
};

export const config = {
  get port() {
    return parseInt(process.env.PORT || '5000', 10);
  },
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get isProduction() {
    return process.env.NODE_ENV === 'production';
  },
  get isTest() {
    return process.env.NODE_ENV === 'test';
  },
  get mongoUri() {
    return process.env.MONGODB_URI || '';
  },
  get jwtSecret() {
    return process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-jwt-secret-key-123456789' : '');
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
  },
  get clientUrl() {
    return process.env.CLIENT_URL || 'http://localhost:5173';
  },

  get apiPublicUrl() {
    return (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
  },

  get payhere() {
    const merchantId = process.env.PAYHERE_MERCHANT_ID || '';
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || '';
    const sandbox = (process.env.PAYHERE_SANDBOX || 'true').toLowerCase() !== 'false';
    return {
      merchantId,
      merchantSecret,
      sandbox,
      checkoutUrl: sandbox
        ? 'https://sandbox.payhere.lk/pay/checkout'
        : 'https://www.payhere.lk/pay/checkout',
      isConfigured: Boolean(merchantId && merchantSecret && process.env.API_PUBLIC_URL),
    };
  },

  get aws() {
    return {
      region: process.env.AWS_REGION || 'ap-south-1',
      bucket: process.env.AWS_S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      isConfigured: Boolean(
        process.env.AWS_S3_BUCKET &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
      ),
    };
  },

  get smtp() {
    return {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.MAIL_FROM || 'MediLink <noreply@medilink.lk>',
      isConfigured: Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ),
    };
  },

  get seed() {
    return {
      adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@medilink.lk',
      adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
    };
  },
};

export default config;

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/env.js';
import logger from '../utils/logger.js';

let s3Client = null;

if (config.aws.isConfigured) {
  try {
    s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    logger.info(`AWS S3 client initialized for bucket: ${config.aws.bucket} (${config.aws.region})`);
  } catch (err) {
    logger.warn(`Failed to initialize S3 client: ${err.message}. S3 features disabled.`);
  }
} else {
  logger.info('AWS S3 is not configured. Upload & view endpoints will return safe "not configured" responses.');
}

const PURPOSE_CONFIG = {
  'doctor-photo': {
    prefix: 'doctors/photos',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5 MB
  },
  'slmc-document': {
    prefix: 'doctors/slmc',
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 5 * 1024 * 1024,
  },
  'hospital-image': {
    prefix: 'hospitals/photos',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
  },
};

/**
 * Checks if S3 is active and configured.
 */
export const isS3Configured = () => {
  return Boolean(s3Client && config.aws.bucket);
};

/**
 * Generates a presigned PUT URL for browser direct-upload to S3.
 */
export const getPresignedUploadUrl = async ({ purpose, contentType, size }) => {
  if (!isS3Configured()) {
    return {
      configured: false,
      message: 'S3 storage is not configured on this server.',
    };
  }

  const purposeRules = PURPOSE_CONFIG[purpose];
  if (!purposeRules) {
    throw new Error(`Invalid upload purpose: ${purpose}`);
  }

  if (!purposeRules.allowedTypes.includes(contentType)) {
    throw new Error(
      `Content type '${contentType}' not allowed for ${purpose}. Allowed: ${purposeRules.allowedTypes.join(', ')}`
    );
  }

  if (size && size > purposeRules.maxSize) {
    throw new Error(`File size exceeds limit of 5MB`);
  }

  const extension = contentType === 'application/pdf' ? 'pdf' : contentType.split('/')[1] || 'bin';
  const key = `${purposeRules.prefix}/${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
    ContentType: contentType,
  });

  // Presigned URL valid for 15 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    configured: true,
    uploadUrl,
    key,
  };
};

/**
 * Generates a short-lived signed GET URL to view private objects.
 */
export const getPresignedViewUrl = async (key, expiresIn = 3600) => {
  if (!key) return null;

  if (!isS3Configured()) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (err) {
    logger.warn(`Failed generating signed view URL for key ${key}: ${err.message}`);
    return null;
  }
};

/**
 * Resolves an image key to a signed URL or null.
 */
export const resolveImageUrl = async (key) => {
  if (!key) return null;
  // If it's already a full URL (e.g. placeholder or external URL), return as-is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return await getPresignedViewUrl(key, 3600);
};

export default {
  isS3Configured,
  getPresignedUploadUrl,
  getPresignedViewUrl,
  resolveImageUrl,
  PURPOSE_CONFIG,
};

import {
  getPresignedUploadUrl,
  getPresignedViewUrl,
  isS3Configured,
} from '../services/s3Service.js';
import Doctor from '../models/Doctor.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Generate presigned URL for direct client S3 upload
 */
export const presignUpload = async (req, res, next) => {
  try {
    const { purpose, contentType, size } = req.body;

    if (!purpose || !contentType) {
      return next(new AppError('Both purpose and contentType are required.', 400));
    }

    if (!isS3Configured()) {
      return successResponse(res, {
        data: {
          configured: false,
          message: 'S3 storage is not configured on this server. File uploads are simulated.',
        },
      });
    }

    const result = await getPresignedUploadUrl({
      purpose,
      contentType,
      size: size ? parseInt(size, 10) : undefined,
    });

    return successResponse(res, {
      message: 'Presigned upload URL generated successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate short-lived signed GET URL to view private S3 objects
 * Access control: SLMC documents viewable ONLY by owner doctor and admins
 */
export const viewUpload = async (req, res, next) => {
  try {
    const { key } = req.query;

    if (!key) {
      return next(new AppError('S3 object key is required.', 400));
    }

    // Access control for SLMC documents
    if (key.startsWith('doctors/slmc')) {
      if (!req.user) {
        return next(new AppError('Authentication required to view SLMC verification documents.', 401));
      }

      const isAdmin = req.user.role === 'admin';
      let isOwnerDoctor = false;

      if (req.user.role === 'doctor') {
        const doc = await Doctor.findOne({ user: req.user._id });
        if (doc && doc.slmcDocument === key) {
          isOwnerDoctor = true;
        }
      }

      if (!isAdmin && !isOwnerDoctor) {
        return next(
          new AppError('Forbidden: SLMC verification documents can only be viewed by the owner doctor or administrators.', 403)
        );
      }
    }

    if (!isS3Configured()) {
      return successResponse(res, {
        data: {
          configured: false,
          viewUrl: null,
          message: 'S3 is not configured on this server.',
        },
      });
    }

    const viewUrl = await getPresignedViewUrl(key, 3600); // 1 hour expiration

    return successResponse(res, {
      data: {
        configured: true,
        viewUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  presignUpload,
  viewUpload,
};

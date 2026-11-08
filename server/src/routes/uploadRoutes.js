import express from 'express';
import { presignUpload, viewUpload } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/uploads/presign', authenticate, presignUpload);
router.get('/uploads/view', authenticate, viewUpload);

export default router;

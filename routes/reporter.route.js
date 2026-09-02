import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { applyForReporter, getReporterStatus } from '../controllers/reporter.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadFiles = upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'paymentReceipt', maxCount: 1 },
]);

router.post('/apply', authMiddleware, uploadFiles, applyForReporter);
router.get('/status', authMiddleware, getReporterStatus);

export default router;
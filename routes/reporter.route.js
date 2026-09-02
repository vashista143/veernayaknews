import express from 'express';
import multer from 'multer';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  applyForReporter,
  getReporterStatus,
  getAllReporterApplications,
  updateReporterApplicationStatus,
  revokeReporterAccess,
} from '../controllers/reporter.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadFiles = upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'paymentReceipt', maxCount: 1 },
]);

// User endpoints
router.post('/apply', authMiddleware, uploadFiles, applyForReporter);
router.get('/status', authMiddleware, getReporterStatus);

// Admin endpoints
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), getAllReporterApplications);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), updateReporterApplicationStatus);
router.patch('/admin/:id/revoke', authMiddleware, authorizeRoles('admin'), revokeReporterAccess);

export default router;

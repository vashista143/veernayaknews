import express from 'express';
import multer from 'multer';
import { createNewspaper, getNewspaperByDate } from '../controllers/newspaper.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/pdfs/' });

// Middleware to verify admin authorization header/token
const verifyAdmin = (req, res, next) => {
  const userRole = req.headers['x-user-role']; // Or verify JWT token here
  if (userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  }
  next();
};

router.post('/create', verifyAdmin, upload.single('pdf'), createNewspaper);
router.get('/', getNewspaperByDate);

export default router;

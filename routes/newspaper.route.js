import express from 'express';
import multer from 'multer';
import { createNewspaper, getNewspaperByDate } from '../controllers/newspaper.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/pdfs/' });

router.post('/create', upload.single('pdf'), createNewspaper);
router.get('/', getNewspaperByDate);

export default router;
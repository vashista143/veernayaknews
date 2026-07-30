import fs from 'fs';
import { Newspaper } from '../models/newspaper.model.js';
import { uploadToR2 } from '../config/r2.js';
import { processPdfThumbnail } from '../utils/pdfThumbnail.js';

export const createNewspaper = async (req, res) => {
  try {
    const { title, date } = req.body;
    const pdfFile = req.file;

    if (!pdfFile) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const localThumbnailPath = await processPdfThumbnail(pdfFile.path);

    const pdfUploadResult = await uploadToR2({
      originalname: pdfFile.originalname,
      buffer: fs.readFileSync(pdfFile.path),
      mimetype: pdfFile.mimetype || 'application/pdf',
    });

    const thumbnailBuffer = fs.readFileSync(localThumbnailPath);
    const thumbnailUploadResult = await uploadToR2({
      originalname: `thumb_${Date.now()}.png`,
      buffer: thumbnailBuffer,
      mimetype: 'image/png',
    });

    if (fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
    if (fs.existsSync(localThumbnailPath)) fs.unlinkSync(localThumbnailPath);

    const newspaper = await Newspaper.create({
      title: title || `Newspaper - ${new Date(date).toLocaleDateString()}`,
      date: new Date(date),
      pdfUrl: pdfUploadResult,
      thumbnailUrl: thumbnailUploadResult,
    });

    return res.status(201).json({ success: true, data: newspaper });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNewspaperByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all newspapers for the date ordered by newest upload
    const newspapers = await Newspaper.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });

    if (!newspapers || newspapers.length === 0) {
      return res.status(404).json({ success: false, message: 'No newspapers found for this date' });
    }

    return res.status(200).json({ success: true, data: newspapers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import { Newspaper } from '../models/newspaper.model.js';
import { processPdfThumbnail } from '../utils/pdfThumbnail.js'; // Utility helper

// Upload / Create Newspaper
export const createNewspaper = async (req, res) => {
  try {
    const { title, date } = req.body;
    const pdfFile = req.file; // Assuming Multer handles file upload

    if (!pdfFile) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    // Generate thumbnail from first page of PDF
    const thumbnailUrl = await processPdfThumbnail(pdfFile.path);

    const newspaper = await Newspaper.create({
      title,
      date: new Date(date),
      pdfUrl: pdfFile.path, // or Cloudinary / S3 URL
      thumbnailUrl: thumbnailUrl,
    });

    res.status(201).json({ success: true, data: newspaper });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch Newspaper by Selected Date
export const getNewspaperByDate = async (req, res) => {
  try {
    const { date } = req.query; // Expecting ISO string or YYYY-MM-DD
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const newspaper = await Newspaper.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!newspaper) {
      return res.status(404).json({ message: 'No newspaper found for this date' });
    }

    res.status(200).json({ success: true, data: newspaper });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
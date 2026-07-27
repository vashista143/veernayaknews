import { fromPath } from 'pdf2pic';
import path from 'path';

export const processPdfThumbnail = async (pdfPath) => {
  const options = {
    density: 100,
    saveFilename: `thumb_${Date.now()}`,
    savePath: './uploads/thumbnails',
    format: 'png',
    width: 600,
    height: 800,
  };

  const storeAsImage = fromPath(pdfPath, options);
  const pageToConvert = 1; // Convert only page 1 for the front thumbnail

  const result = await storeAsImage(pageToConvert);
  return result.path; // Return saved thumbnail image path/URL
};
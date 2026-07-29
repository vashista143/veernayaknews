import pdfImgConvert from 'pdf-img-convert';
import fs from 'fs';
import path from 'path';

export const processPdfThumbnail = async (pdfPath) => {
  // Convert only page 1
  const outputImages = await pdfImgConvert.convert(pdfPath, { page_numbers: [1] });

  // Save generated buffer to disk
  const outputPath = path.join('./uploads/thumbnails', `thumb_${Date.now()}.png`);
  fs.writeFileSync(outputPath, outputImages[0]);

  return outputPath;
};

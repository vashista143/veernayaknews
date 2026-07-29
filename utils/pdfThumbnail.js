import { pdf } from 'pdf-to-img';
import fs from 'fs';
import path from 'path';

export const processPdfThumbnail = async (pdfPath) => {
  // 1. Ensure target directory exists
  const outputDir = path.resolve('./uploads/thumbnails');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 2. Load the PDF document
  const document = await pdf(pdfPath, { scale: 1.5 });

  // 3. Extract the first page buffer (1-indexed page number)
  const firstPageBuffer = await document.getPage(1);

  // 4. Save the generated PNG image buffer to local disk
  const thumbnailFilename = `thumb_${Date.now()}.png`;
  const outputPath = path.join(outputDir, thumbnailFilename);
  fs.writeFileSync(outputPath, firstPageBuffer);

  return outputPath;
};

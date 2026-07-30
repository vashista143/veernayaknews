import mongoose from 'mongoose';

const newspaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true }, // One newspaper issue per date
    pdfUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true }, // Auto-generated first page preview image
  },
  { timestamps: true }
);

export const Newspaper = mongoose.model('Newspaper', newspaperSchema);

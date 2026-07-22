import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3-compatible client for Cloudflare R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Helper function to upload file buffer to Cloudflare R2
export const uploadToR2 = async (file) => {
  const fileName = `news/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await r2Client.send(new PutObjectCommand(uploadParams));

  // Return public URL (Configure custom domain or public R2 dev domain in Cloudflare dashboard)
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};
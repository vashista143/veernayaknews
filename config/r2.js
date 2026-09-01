import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3-compatible client for Cloudflare R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// Helper function to upload file buffer to Cloudflare R2
export const uploadToR2 = async ({ originalname = "file.pdf", buffer, mimetype = "application/pdf" }) => {
  // 1. Sanitize filename: replace spaces, parentheses, and special chars with underscores
  const sanitizedName = originalname
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");

  const timestamp = Date.now();
  const fileKey = `news/${timestamp}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: mimetype,
  });

  // Fixed variable name: r2Client instead of s3Client
  await r2Client.send(command);

  // 2. Return clean public URL
  const publicDomain = process.env.R2_PUBLIC_URL || "";
  return `${publicDomain.replace(/\/$/, "")}/${fileKey}`;
};

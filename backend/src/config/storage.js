const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const crypto = require('crypto');

// Initialise S3 client (eu-central-1, Frankfurt for EU data residency)
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET;

// Memory storage — buffer needed for SHA-256 hashing and PDF metadata stripping
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

// Upload a buffer to S3 and return the object key
async function uploadBufferToS3(buffer, slug, originalName) {
  const ext = path.extname(originalName) || '.pdf';
  const key = `documents/${slug}/${uuidv4()}${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    Metadata: {
      originalName,
      uploadedAt: new Date().toISOString(),
    },
  }));
  return key;
}

// SHA-256 hex digest of a buffer
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { s3, upload, S3_BUCKET, uploadBufferToS3, sha256 };

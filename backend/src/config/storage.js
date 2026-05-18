const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialise S3 client (eu-central-1, Frankfurt for EU data residency)
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET;

// Multer storage configured to upload directly to S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    // Each file gets a unique key under documents/<slug>/<uuid>.pdf
    key: (req, file, cb) => {
      const slug = req.body.slug || req.params.slug || 'unknown';
      const ext = path.extname(file.originalname) || '.pdf';
      const key = `documents/${slug}/${uuidv4()}${ext}`;
      cb(null, key);
    },
    metadata: (req, file, cb) => {
      cb(null, {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      });
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

module.exports = { s3, upload, S3_BUCKET };
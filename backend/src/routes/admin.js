const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { upload } = require('../config/storage');
const { adminAuth } = require('../middleware/auth');

router.use(adminAuth);

// POST /admin/documents — create new document with first version
router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    const {
      slug, productCode, productName,
      versionNumber = '1.0',
      title, language, productCategory,
      documentType = 'Other', issueDate,
      edmsDocId, edmsVersionId, uploadedBy = 'admin',
      status = 'draft',
    } = req.body;

    if (!slug || !productCode || !productName) {
      return res.status(400).json({ error: 'slug, productCode, productName are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const existing = await Document.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        error: 'Slug already exists. Use PATCH /admin/documents/:slug/versions to add a version.',
      });
    }

    // multer-s3 puts the S3 object key on req.file.key
    const fileKey = req.file.key;

    const doc = new Document({
      slug, productCode, productName, status,
      versions: [{
        versionNumber,
        versionTag: `v${versionNumber.split('.')[0]}`,
        fileKey,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        publicMetadata: { title, language, productCategory, documentType, issueDate },
        internalMetadata: { uploadedBy, edmsDocId, edmsVersionId, sourceSystem: 'manual' },
      }],
      latestVersionIndex: 0,
    });

    await doc.save();

    res.status(201).json({
      message: 'Document created',
      slug: doc.slug,
      dynamicUrl: `${process.env.BASE_URL}/docs/${doc.slug}/latest`,
      versionUrl: `${process.env.BASE_URL}/docs/${doc.slug}/v/${versionNumber}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/documents/:slug/versions — append new version
router.patch('/documents/:slug/versions', upload.single('file'), async (req, res) => {
  try {
    const doc = await Document.findOne({ slug: req.params.slug });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

    const {
      versionNumber, title, language, productCategory,
      documentType, issueDate, edmsDocId, edmsVersionId,
      uploadedBy = 'admin',
    } = req.body;

    if (!versionNumber) return res.status(400).json({ error: 'versionNumber required' });

    const exists = doc.versions.find(v => v.versionNumber === versionNumber);
    if (exists) return res.status(409).json({ error: `Version ${versionNumber} already exists` });

    doc.versions[doc.latestVersionIndex].supersededAt = new Date();

    // multer-s3 puts the S3 object key on req.file.key
    const fileKey = req.file.key;

    doc.versions.push({
      versionNumber,
      versionTag: `v${versionNumber.split('.')[0]}`,
      fileKey,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      publicMetadata: { title, language, productCategory, documentType, issueDate },
      internalMetadata: { uploadedBy, edmsDocId, edmsVersionId, sourceSystem: 'manual' },
    });

    doc.latestVersionIndex = doc.versions.length - 1;
    doc.updatedAt = new Date();
    await doc.save();

    res.json({
      message: `Version ${versionNumber} added`,
      dynamicUrl: `${process.env.BASE_URL}/docs/${doc.slug}/latest`,
      versionUrl: `${process.env.BASE_URL}/docs/${doc.slug}/v/${versionNumber}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/documents/:slug/publish
router.patch('/documents/:slug/publish', async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { slug: req.params.slug },
      { status: 'published', updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Published', status: doc.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/documents/:slug/archive
router.patch('/documents/:slug/archive', async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { slug: req.params.slug },
      { status: 'archived', updatedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Archived', status: doc.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/documents
router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find({}).sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/documents/:slug
router.get('/documents/:slug', async (req, res) => {
  try {
    const doc = await Document.findOne({ slug: req.params.slug });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
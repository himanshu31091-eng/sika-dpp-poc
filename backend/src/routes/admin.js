const express = require('express');
const router = express.Router();
const { PDFDocument } = require('pdf-lib');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const Analytics = require('../models/Analytics');
const { upload, uploadBufferToS3, sha256 } = require('../config/storage');
const { adminAuth } = require('../middleware/auth');

router.use(adminAuth);

// Strip internal PDF metadata fields before storing
async function stripPdfMetadata(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    return Buffer.from(await pdfDoc.save());
  } catch {
    // If stripping fails (e.g. corrupted PDF), return original buffer
    return buffer;
  }
}

function getPerformedBy(req) {
  return req.headers['x-admin-user'] || req.body.uploadedBy || 'unknown';
}

// POST /admin/documents — create new document with first version
router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    const {
      slug, productCode, productName,
      versionNumber = '1.0',
      title, language, productCategory,
      documentType = 'Other', issueDate,
      edmsDocId, edmsVersionId,
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

    const strippedBuffer = await stripPdfMetadata(req.file.buffer);
    const fileHash = sha256(strippedBuffer);
    const fileKey = await uploadBufferToS3(strippedBuffer, slug, req.file.originalname);
    const performedBy = getPerformedBy(req);

    const doc = new Document({
      slug, productCode, productName, status,
      versions: [{
        versionNumber,
        versionTag: `v${versionNumber.split('.')[0]}`,
        fileKey,
        fileName: req.file.originalname,
        fileSize: strippedBuffer.length,
        fileHash,
        publicMetadata: { title, language, productCategory, documentType, issueDate },
        internalMetadata: { uploadedBy: performedBy, edmsDocId, edmsVersionId, sourceSystem: 'manual' },
      }],
      latestVersionIndex: 0,
    });

    await doc.save();
    await AuditLog.create({ action: 'create', slug, version: versionNumber, performedBy, ip: req.ip });

    res.status(201).json({
      message: 'Document created',
      slug: doc.slug,
      fileHash,
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
    } = req.body;

    if (!versionNumber) return res.status(400).json({ error: 'versionNumber required' });

    const exists = doc.versions.find(v => v.versionNumber === versionNumber);
    if (exists) return res.status(409).json({ error: `Version ${versionNumber} already exists` });

    const strippedBuffer = await stripPdfMetadata(req.file.buffer);
    const fileHash = sha256(strippedBuffer);
    const fileKey = await uploadBufferToS3(strippedBuffer, req.params.slug, req.file.originalname);
    const performedBy = getPerformedBy(req);

    doc.versions[doc.latestVersionIndex].supersededAt = new Date();

    doc.versions.push({
      versionNumber,
      versionTag: `v${versionNumber.split('.')[0]}`,
      fileKey,
      fileName: req.file.originalname,
      fileSize: strippedBuffer.length,
      fileHash,
      publicMetadata: { title, language, productCategory, documentType, issueDate },
      internalMetadata: { uploadedBy: performedBy, edmsDocId, edmsVersionId, sourceSystem: 'manual' },
    });

    doc.latestVersionIndex = doc.versions.length - 1;
    doc.updatedAt = new Date();
    await doc.save();
    await AuditLog.create({ action: 'add_version', slug: req.params.slug, version: versionNumber, performedBy, ip: req.ip });

    res.json({
      message: `Version ${versionNumber} added`,
      fileHash,
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
    await AuditLog.create({ action: 'publish', slug: req.params.slug, performedBy: getPerformedBy(req), ip: req.ip });
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
    await AuditLog.create({ action: 'archive', slug: req.params.slug, performedBy: getPerformedBy(req), ip: req.ip });
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

// GET /admin/audit — recent audit log entries
router.get('/audit', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/analytics — view + download counts per document
router.get('/analytics', async (req, res) => {
  try {
    const [views, downloads] = await Promise.all([
      Analytics.aggregate([
        { $match: { event: 'view' } },
        { $group: { _id: '$slug', count: { $sum: 1 } } },
      ]),
      Analytics.aggregate([
        { $match: { event: 'download' } },
        { $group: { _id: '$slug', count: { $sum: 1 } } },
      ]),
    ]);

    const viewMap = Object.fromEntries(views.map(v => [v._id, v.count]));
    const dlMap = Object.fromEntries(downloads.map(d => [d._id, d.count]));

    const slugs = [...new Set([...Object.keys(viewMap), ...Object.keys(dlMap)])];
    const result = slugs.map(slug => ({
      slug,
      views: viewMap[slug] || 0,
      downloads: dlMap[slug] || 0,
    })).sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads));

    const totalViews = views.reduce((s, v) => s + v.count, 0);
    const totalDownloads = downloads.reduce((s, d) => s + d.count, 0);

    res.json({ totalViews, totalDownloads, byDocument: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

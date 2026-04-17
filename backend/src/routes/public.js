const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { UPLOAD_DIR } = require('../config/storage');
const { publicRateLimit } = require('../middleware/auth');

router.use(publicRateLimit);

// Strip internal metadata before any public response
const stripInternal = (version) => {
  const pub = version.publicMetadata
    ? (version.publicMetadata.toObject ? version.publicMetadata.toObject() : version.publicMetadata)
    : {};
  return {
    versionNumber: version.versionNumber,
    versionTag: version.versionTag,
    fileName: version.fileName,
    fileSize: version.fileSize,
    uploadedAt: version.uploadedAt,
    ...pub,
  };
};

// GET /docs — search
router.get('/', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const query = { status: 'published' };
    if (q) {
      query.$or = [
        { productCode: new RegExp(q, 'i') },
        { productName: new RegExp(q, 'i') },
      ];
    }
    const docs = await Document.find(query)
      .limit(Number(limit))
      .select('slug productCode productName latestVersionIndex versions updatedAt');
    res.json(docs.map(d => ({
      slug: d.slug,
      productCode: d.productCode,
      productName: d.productName,
      latestVersion: d.versions[d.latestVersionIndex]?.versionNumber,
      documentType: d.versions[d.latestVersionIndex]?.publicMetadata?.documentType,
      updatedAt: d.updatedAt,
      dynamicUrl: `${process.env.BASE_URL}/docs/${d.slug}/latest`,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /docs/:slug/latest
router.get('/:slug/latest', async (req, res) => {
  try {
    const doc = await Document.findOne({ slug: req.params.slug, status: 'published' });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const version = doc.versions[doc.latestVersionIndex];
    res.set('Cache-Control', 'no-store');
    res.json({
      slug: doc.slug,
      productCode: doc.productCode,
      productName: doc.productName,
      currentVersion: stripInternal(version),
      versionCount: doc.versions.length,
      links: {
        download: `${process.env.BASE_URL}/docs/${doc.slug}/v/${version.versionNumber}/download`,
        versionList: `${process.env.BASE_URL}/docs/${doc.slug}/versions`,
        versionSpecific: `${process.env.BASE_URL}/docs/${doc.slug}/v/${version.versionNumber}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /docs/:slug/versions
router.get('/:slug/versions', async (req, res) => {
  try {
    const doc = await Document.findOne({ slug: req.params.slug, status: 'published' });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({
      slug: doc.slug,
      productName: doc.productName,
      productCode: doc.productCode,
      versions: doc.versions.map((v, i) => ({
        ...stripInternal(v),
        isLatest: i === doc.latestVersionIndex,
        supersededAt: v.supersededAt,
        url: `${process.env.BASE_URL}/docs/${doc.slug}/v/${v.versionNumber}`,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /docs/:slug/v/:version
router.get('/:slug/v/:version', async (req, res) => {
  try {
    const doc = await Document.findOne({ slug: req.params.slug, status: 'published' });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const versionIndex = doc.versions.findIndex(v => v.versionNumber === req.params.version);
    if (versionIndex === -1) return res.status(404).json({ error: 'Version not found' });
    const version = doc.versions[versionIndex];
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.json({
      slug: doc.slug,
      productCode: doc.productCode,
      productName: doc.productName,
      version: stripInternal(version),
      isLatest: versionIndex === doc.latestVersionIndex,
      supersededAt: version.supersededAt,
      links: {
        download: `${process.env.BASE_URL}/docs/${doc.slug}/v/${version.versionNumber}/download`,
        versionList: `${process.env.BASE_URL}/docs/${doc.slug}/versions`,
        latest: `${process.env.BASE_URL}/docs/${doc.slug}/latest`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /docs/:slug/v/:version/download — serve PDF directly from disk
router.get('/:slug/v/:version/download', async (req, res) => {
  try {
    const doc = await Document.findOne({ slug: req.params.slug, status: 'published' });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const version = doc.versions.find(v => v.versionNumber === req.params.version);
    if (!version) return res.status(404).json({ error: 'Version not found' });

    const filePath = path.resolve(UPLOAD_DIR, version.fileKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${version.fileName}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

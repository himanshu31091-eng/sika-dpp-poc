const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const Document = require('../models/Document');

/**
 * EDMS Integration endpoint
 * Optimal Systems (yuuvis-rad) calls POST /edms/push when a document
 * is approved and ready for public publication.
 *
 * In production: EDMS provides a temp fileUrl, this service downloads,
 * strips metadata, and stores in object storage.
 * For POC: registers the intent, file upload is done separately.
 */
router.post('/push', adminAuth, async (req, res) => {
  try {
    const {
      edmsDocId,
      edmsVersionId,
      slug,
      productCode,
      productName,
      versionNumber,
      documentType,
      language,
      title,
      issueDate,
      fileUrl, // temp download URL from EDMS
    } = req.body;

    if (!edmsDocId || !slug || !versionNumber) {
      return res.status(400).json({ error: 'edmsDocId, slug, versionNumber required' });
    }

    console.log(`[EDMS Push] DocID: ${edmsDocId} | Version: ${versionNumber} | Slug: ${slug}`);

    const existing = await Document.findOne({ slug });

    if (existing) {
      // New version of existing document
      return res.json({
        action: 'version_pending',
        message: 'Document exists. Upload file to add version.',
        endpoint: `PATCH /admin/documents/${slug}/versions`,
        edmsDocId,
        edmsVersionId,
        slug,
        versionNumber,
      });
    }

    // New document
    res.json({
      action: 'create_pending',
      message: 'New document. Upload file to create.',
      endpoint: 'POST /admin/documents',
      edmsDocId,
      slug,
      versionNumber,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /edms/status/:edmsDocId — check if EDMS doc is registered
router.get('/status/:edmsDocId', adminAuth, async (req, res) => {
  try {
    const doc = await Document.findOne({
      'versions.internalMetadata.edmsDocId': req.params.edmsDocId,
    });
    if (!doc) return res.json({ registered: false });
    res.json({
      registered: true,
      slug: doc.slug,
      status: doc.status,
      versions: doc.versions.length,
      dynamicUrl: `${process.env.BASE_URL}/docs/${doc.slug}/latest`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  versionNumber: { type: String, required: true },
  versionTag: { type: String },
  fileKey: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String, default: 'application/pdf' },
  publicMetadata: {
    title: String,
    language: String,
    productCategory: String,
    documentType: {
      type: String,
      enum: ['DoPC', 'SDS', 'TDS', 'Label', 'Technical', 'Other'],
      default: 'Other',
    },
    issueDate: Date,
    validFrom: Date,
  },
  internalMetadata: {
    uploadedBy: String,
    edmsDocId: String,
    edmsVersionId: String,
    internalNotes: String,
    sourceSystem: String,
  },
  uploadedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  supersededAt: { type: Date, default: null },
});

const DocumentSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
  },
  productCode: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  versions: [VersionSchema],
  latestVersionIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
});

DocumentSchema.virtual('latestVersion').get(function () {
  return this.versions[this.latestVersionIndex];
});

DocumentSchema.virtual('dynamicUrl').get(function () {
  return `/docs/${this.slug}/latest`;
});

module.exports = mongoose.model('Document', DocumentSchema);

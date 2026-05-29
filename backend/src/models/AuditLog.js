const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['create', 'add_version', 'publish', 'archive'],
    required: true,
  },
  slug: { type: String, required: true, index: true },
  version: { type: String },
  performedBy: { type: String, default: 'unknown' },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);

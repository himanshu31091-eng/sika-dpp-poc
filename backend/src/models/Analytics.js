const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  event: { type: String, enum: ['view', 'download'], required: true },
  slug: { type: String, required: true, index: true },
  version: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);

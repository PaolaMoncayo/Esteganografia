const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: { type: Date },
  approvedBy: { type: String },
});

module.exports = mongoose.model('Photo', photoSchema);
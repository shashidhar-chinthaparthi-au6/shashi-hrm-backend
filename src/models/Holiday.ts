import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['public', 'company', 'regional', 'religious'],
  },
  description: {
    type: String,
    required: false,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Add indexes for better query performance
holidaySchema.index({ date: 1 });
holidaySchema.index({ type: 1 });

// Update the updatedAt field before saving
holidaySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Holiday = mongoose.model('Holiday', holidaySchema); 
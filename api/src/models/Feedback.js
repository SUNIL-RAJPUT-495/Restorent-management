import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  customerName: {
    type: String
  },
  customerPhone: {
    type: String
  }
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;

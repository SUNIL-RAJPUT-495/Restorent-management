import mongoose from 'mongoose';

const promoBannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const PromoBanner = mongoose.model('PromoBanner', promoBannerSchema);

export default PromoBanner;

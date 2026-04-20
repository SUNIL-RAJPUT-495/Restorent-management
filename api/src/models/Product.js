import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String, 
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
  },
  available: {
    type: Boolean,
    default: true,
  },
  recipe: [{
    ingredient: String,
    quantity: String,
  }],
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;

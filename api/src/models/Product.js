import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  restId: {
    type: String,
  },
  category: {
    type: String, 
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    default: 0,
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
  trackStock: {
    type: Boolean,
    default: false,
  },
  stock: {
    type: Number,
    default: 0,
  },
  recipe: [{
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
    },
    quantity: {
      type: Number,
      required: true,
    },
  }],
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;

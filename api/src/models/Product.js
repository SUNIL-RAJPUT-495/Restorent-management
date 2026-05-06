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

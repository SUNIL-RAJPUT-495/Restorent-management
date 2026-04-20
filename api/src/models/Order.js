import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['qsr', 'fine-dine'],
    required: true,
  },
  tableNumber: {
    type: String,
  },
  customer: {
    type: String,
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: String,
    price: Number,
    qty: Number,
  }],
  status: {
    type: String,
    enum: ['new', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'new',
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online'],
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

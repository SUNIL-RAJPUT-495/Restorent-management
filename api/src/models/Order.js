import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  restId: {
    type: String,
  },
  type: {
    type: String,
    enum: ['qsr', 'fine-dine'],
    required: true,
  },
  tableNumber: {
    type: String,
  },
  customerName: {
    type: String,
  },
  customerPhone: {
    type: String,
  },
  customerEmail: {
    type: String,
  },
  source: {
    type: String,
    enum: ['pos', 'self-order'],
    default: 'pos'
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
    enum: ['new', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'],
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
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  imbOrderId: {
    type: String,
  },
  imbPaymentId: {
    type: String,
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;

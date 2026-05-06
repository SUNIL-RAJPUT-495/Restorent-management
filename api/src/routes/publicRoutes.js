import express from 'express';
import { 
  getMenu, 
  getTables, 
  placeOrder, 
  createRazorpayOrder, 
  verifyRazorpayPayment,
  createImbOrder,
  verifyImbPayment,
  imbWebhook,
  getRestaurantInfo
} from '../controllers/publicController.js';

const router = express.Router();

// QR Ordering Public Routes (Simplified for single restaurant)
router.get('/info', getRestaurantInfo);
router.get('/menu', getMenu);
router.get('/tables', getTables);
router.post('/order', placeOrder);

// Payment Routes
router.post('/payment/razorpay/create', createRazorpayOrder);
router.post('/payment/razorpay/verify', verifyRazorpayPayment);
router.post('/payment/imb/create', createImbOrder);
router.post('/payment/imb/verify', verifyImbPayment);
router.post('/payment/imb/webhook', imbWebhook);

export default router;

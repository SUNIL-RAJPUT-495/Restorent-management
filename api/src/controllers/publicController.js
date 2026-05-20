import Product from '../models/Product.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Setting from '../models/Setting.js';
import Feedback from '../models/Feedback.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import axios from 'axios';


const IMB_STATUS_URL = process.env.IMB_STATUS_URL;
const IMB_CLIENT_SECRET = process.env.IMB_CLIENT_SECRET;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_secret',
});

/**
 * Publicly fetch restaurant information
 */
export const getRestaurantInfo = async (req, res) => {
  try {
    const settings = await Setting.findOne({}); // Fetch the only settings available
    if (!settings) return res.status(404).json({ message: "Restaurant not found" });
    
    res.json({
      restaurantName: settings.restaurantName,
      logo: settings.logo,
      address: settings.address,
      contact: settings.contact,
      currency: settings.currency || '₹',
      cgst: settings.cgst || 0,
      sgst: settings.sgst || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch all available menu items
 */
export const getMenu = async (req, res) => {
  try {
    const products = await Product.find({ available: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch all tables
 */
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find({}).sort({ number: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Place a new order
 */
export const placeOrder = async (req, res) => {
  try {
    const { items, type, tableNumber, totalAmount, paymentMethod, guests, customerName, customerPhone, customerEmail } = req.body;

    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${orderCount + 1}`;

    const order = new Order({
      orderNumber,
      items,
      type,
      tableNumber,
      totalAmount,
      paymentMethod,
      customerName,
      customerPhone,
      customerEmail,
      source: 'self-order',
      paymentStatus: 'pending',
    });

    const createdOrder = await order.save();

    // Mark table as occupied
    if (tableNumber) {
      await Table.findOneAndUpdate(
        { number: tableNumber },
        {
          status: 'occupied',
          guests: guests || 1,
          occupiedSince: new Date(),
        },
        { new: true }
      );
    }

    // Emit socket event for KDS/POS real-time updates
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newOrder', createdOrder);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Create a Razorpay Order
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify Razorpay Payment
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_secret')
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'completed';
        order.razorpayOrderId = razorpay_order_id;
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();

        const io = req.app.get('socketio');
        if (io) {
          io.emit('orderUpdated', order);
        }
      }
      res.json({ message: "Payment verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid Signature" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create an IMB Order
 */
export const createImbOrder = async (req, res) => {
  try {
    const { items, type, tableNumber, totalAmount, guests, customerName, customerPhone, customerEmail } = req.body;

    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${orderCount + 1}`;

    const order = new Order({
      orderNumber,
      items,
      type,
      tableNumber,
      totalAmount,
      customerName,
      customerPhone,
      customerEmail,
      source: 'self-order',
      paymentMethod: 'online',
      paymentStatus: 'pending',
    });

    const savedOrder = await order.save();

    // Mark table as occupied
    if (tableNumber) {
      await Table.findOneAndUpdate(
        { number: tableNumber },
        {
          status: 'occupied',
          guests: guests || 1,
          occupiedSince: new Date(),
        },
        { new: true }
      );
    }

    const cleanPhone = String(customerPhone).replace(/\D/g, "");
    
    const payload = new URLSearchParams({
      customer_mobile: cleanPhone,
      user_token: process.env.IMB_CLIENT_SECRET,
      amount: String(totalAmount),
      order_id: orderNumber,
      customer_name: customerName,
      remark1: customerEmail || 'Order',
      remark2: `Table ${tableNumber}`,
      redirect_url: `${process.env.FRONTEND_URL}/order/status/${orderNumber}`,
    });

    const response = await axios.post(`${process.env.IMB_BASE_URL}api/create-order`, payload.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const data = response.data;

    if (data && data.status === true && data.result) {
      res.status(200).json({
        success: true,
        payment_url: data.result.payment_url || data.result.paytm_link || data.result.bhim_link || data.result.check_link,
        orderId: orderNumber
      });
    } else {
      throw new Error(data.message || "Failed to generate payment link.");
    }
  } catch (error) {
    console.error("IMB Create Order Error Details:", error.response?.data || error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify IMB Payment
 */
export const verifyImbPayment = async (req, res) => {
  try {
    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ message: "Order number is required" });
    }

    // Guard: check env vars are set (common issue on Vercel if not configured)
    if (!process.env.IMB_STATUS_URL || !process.env.IMB_CLIENT_SECRET) {
      console.error("IMB env vars missing: IMB_STATUS_URL or IMB_CLIENT_SECRET not set");
      return res.status(503).json({ message: "Payment verification service not configured. Please contact support." });
    }

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If already marked completed (e.g. via webhook), return success directly
    if (order.paymentStatus === 'completed') {
      return res.status(200).json({ success: true, order });
    }

    const statusPayload = new URLSearchParams({
      user_token: process.env.IMB_CLIENT_SECRET,
      order_id: orderNumber
    });

    const response = await axios.post(process.env.IMB_STATUS_URL, statusPayload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000 // 10 second timeout
    });
    const data = response.data;

    if (data.status === "SUCCESS" || data.status === "COMPLETED") {
      if (order.paymentStatus !== 'completed') {
        order.paymentStatus = 'completed';
        order.imbPaymentId = data.upi_txn_id || data.bank_txn_id || orderNumber;
        await order.save();

        const io = req.app.get('socketio');
        if (io) {
          io.emit('newOrder', order);
          io.emit('orderUpdated', order);
        }
      }
      return res.status(200).json({ success: true, order });
    } else if (data.status === "PENDING" || data.status === "PROCESSING") {
      return res.status(200).json({ success: true, status: "pending" });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(400).json({ message: "Payment failed or cancelled" });
    }
  } catch (error) {
    console.error("IMB Verify Payment Error Details:", error.response?.data || error.message);
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
};

/**
 * IMB Webhook (Background Update)
 */
export const imbWebhook = async (req, res) => {
  try {
    const data = req.body;
    console.log("🔥 Webhook Received from IMB:", data);

    const orderNumber = data.client_txn_id || data.order_id;
    if (!orderNumber) return res.status(400).send("Order number missing");

    const order = await Order.findOne({ orderNumber });
    if (!order) return res.status(404).send("Order not found");

    if ((data.status === "SUCCESS" || data.status === "COMPLETED") && order.paymentStatus !== 'completed') {
      order.paymentStatus = 'completed';
      order.imbPaymentId = data.upi_txn_id || data.bank_txn_id || orderNumber;
      await order.save();

      const io = req.app.get('socketio');
      if (io) {
        io.emit('newOrder', order); // Notify KDS
        io.emit('orderUpdated', order);
      }
      console.log(`✅ Order ${orderNumber} marked as PAID via Webhook!`);
    } else if (data.status === "FAILED" && order.paymentStatus !== 'completed') {
      order.paymentStatus = 'failed';
      await order.save();
      console.log(`❌ Order ${orderNumber} marked as FAILED via Webhook!`);
    }

    return res.status(200).send("Webhook Processed Successfully");
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).send("Internal Server Error");
  }
};

/**
 * Submit Customer Feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const { orderNumber, rating, comment, customerName, customerPhone } = req.body;
    
    const feedback = new Feedback({
      orderNumber,
      rating,
      comment,
      customerName,
      customerPhone
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

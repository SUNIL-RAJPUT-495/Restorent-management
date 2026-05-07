import Order from '../models/Order.js';
import Table from '../models/Table.js';

export const createOrder = async (req, res) => {
  try {
    const { items, type, tableNumber, totalAmount, paymentMethod } = req.body;
    
    // Simple order number generation
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${orderCount + 1}`;

    const order = new Order({
      orderNumber,
      items,
      type,
      tableNumber,
      totalAmount,
      paymentMethod,
    });

    const createdOrder = await order.save();
    
    // Automatically mark table as occupied if it's fine-dine
    if (tableNumber) {
      await Table.findOneAndUpdate(
        { number: tableNumber },
        { 
          status: 'occupied',
          $set: { guests: req.body.guests || 1 },
          $setOnInsert: { occupiedSince: new Date() }
        }
      );
    }

    // Emit socket event for KDS and live tracking
    const io = req.app.get('socketio');
    if (io) {
      io.emit('newOrder', createdOrder);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      if (req.body.items) order.items = req.body.items;
      if (req.body.totalAmount) order.totalAmount = req.body.totalAmount;
      const updatedOrder = await order.save();

      // Automatically mark table as occupied if an order gets active again
      if (order.tableNumber && ['new', 'preparing', 'ready'].includes(updatedOrder.status)) {
        await Table.findOneAndUpdate(
          { number: order.tableNumber },
          { status: 'occupied' }
        );
      } else if (order.tableNumber && ['completed', 'cancelled', 'delivered'].includes(updatedOrder.status)) {
        // Automatically clear table if order is completed, cancelled, or delivered
        await Table.findOneAndUpdate(
          { number: order.tableNumber },
          { status: 'vacant', guests: 0, occupiedSince: null }
        );
      }

      // Emit socket event so QR tracking and KDS updates instantly
      const io = req.app.get('socketio');
      if (io) {
        io.emit('orderUpdated', updatedOrder);
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

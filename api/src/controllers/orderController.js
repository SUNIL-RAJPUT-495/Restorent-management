import Order from '../models/Order.js';
import Table from '../models/Table.js';
import { deductInventoryStock, restoreInventoryStock, adjustInventoryStock } from '../utils/inventoryHelper.js';

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
    
    // Automatically deduct inventory stock if not cancelled
    if (createdOrder.status !== 'cancelled') {
      await deductInventoryStock(createdOrder);
    }
    
    // Automatically mark table as occupied if it's fine-dine
    if (tableNumber) {
      await Table.findOneAndUpdate(
        { number: tableNumber },
        {
          status: 'occupied',
          guests: req.body.guests || 1,
          occupiedSince: new Date(),
        },
        { new: true }
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
      if (req.body.items) {
        // If order items are being updated (and order isn't cancelled), adjust inventory levels
        if (order.status !== 'cancelled') {
          await adjustInventoryStock(order.items, req.body.items);
        }
        order.items = req.body.items;
      }
      if (req.body.paymentStatus) {
        console.log(`Order ${req.params.id}: paymentStatus update requested -> ${req.body.paymentStatus}`);
        order.paymentStatus = req.body.paymentStatus;
        // Keep order.status unchanged when payment status is toggled.
        // Only explicit status updates should change the order workflow state.
      }
      if (req.body.status) {
        // Handle transitions to/from cancelled status for stock recovery
        if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
          await restoreInventoryStock(order);
        } else if (order.status === 'cancelled' && req.body.status !== 'cancelled') {
          await deductInventoryStock(order);
        }
        order.status = req.body.status;
      }

      const updatedOrder = await order.save();
      console.log(`Order ${req.params.id}: updated paymentStatus = ${updatedOrder.paymentStatus}, status = ${updatedOrder.status}`);

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

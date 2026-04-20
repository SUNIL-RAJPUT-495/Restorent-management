import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import morgan from 'morgan';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import tableRoutes from './src/routes/tableRoutes.js';

// .env file ko load karne ke liye
dotenv.config();

// Database connection
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // JSON data read karne ke liye
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/admin', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);

// Pehli API (Testing ke liye)
app.get('/', (req, res) => {
  res.send('Restaurant Management API is running');
});

// Server Start karna
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
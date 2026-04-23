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
import ingredientRoutes from './src/routes/ingredientRoutes.js';

dotenv.config();

connectDB();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173","http://localhost:8080", "https://restorent-management-eight.vercel.app", "https://restorent-management-g7de.vercel.app"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

app.use('/api/admin', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/ingredients', ingredientRoutes);

app.get('/', (req, res) => {
  res.send('Restaurant Management API is running');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
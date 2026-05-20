import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import morgan from 'morgan';
import { Server } from 'socket.io';
import http from 'http';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import tableRoutes from './src/routes/tableRoutes.js';
import ingredientRoutes from './src/routes/ingredientRoutes.js';
import settingRoutes from './src/routes/settingRoutes.js';

import publicRoutes from './src/routes/publicRoutes.js';

dotenv.config();

connectDB();

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Define allowed domains or patterns
        const allowedOrigins = [
            'http://localhost:8080',
            'https://restorent-management-eight.vercel.app',
            process.env.FRONTEND_URL,
            'https://bhukhabhukhi.com'
        ].filter(Boolean);

        // Check if origin matches allowed domains
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            } else if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

app.use('/api/admin', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/settings', settingRoutes);

app.use('/api/public', publicRoutes);

app.get('/', (req, res) => {
  res.send('Restaurant Management API is running');
});
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('👋 Client disconnected');
    });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use.`);
    console.error(`💡 Please kill the process using this port, or change the PORT in your .env file.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
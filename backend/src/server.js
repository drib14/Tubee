import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

// Load Env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Endpoint Routers
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/location', locationRoutes);

// Base Check Route
app.get('/', (req, res) => {
  res.send('Tubee MERN Backend Server running successfully.');
});

// Error handling fallback
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Tubee Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

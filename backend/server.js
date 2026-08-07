import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import { initSocket } from './socket.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';






dotenv.config();

// Connect Database
connectDB();

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// 3. Rate Limiting (Prevent Brute-Force & DDoS)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body Parser Middleware

app.use(express.json());
app.use(cookieParser());

// Mount API Routers
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/venues', venueRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Centralized Error Middleware (Must be mounted LAST)
app.use(errorHandler);

// HTTP & Socket Server Assembly
const server = http.createServer(app);
initSocket(server); 

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => { 
  console.log(`[SERVER] GatherSpace running on port ${PORT}`);
});
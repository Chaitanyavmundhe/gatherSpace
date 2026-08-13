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
// Trust Render's reverse proxy for express-rate-limit IP detection
app.set('trust proxy', 1);

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  'https://gather-space.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

if (process.env.CLIENT_URL) {
  let clientUrl = process.env.CLIENT_URL.trim();
  // Guarantee protocol prefix
  if (!clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
    clientUrl = `https://${clientUrl}`;
  }
  allowedOrigins.push(clientUrl.replace(/\/$/, ''));
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const sanitizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(sanitizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Not Allowed for origin: ${origin}`));
    },
    credentials: true,
  })
);

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
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

// Centralized Error Middleware
app.use(errorHandler);

// HTTP & Socket Server Assembly
const server = http.createServer(app);
initSocket(server); 

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => { 
  console.log(`[SERVER] GatherSpace running on port ${PORT}`);
});
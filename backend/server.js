import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import feeStructureRoutes from './routes/feeStructureRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Express JSON body parser
app.use(express.json());

// Base health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Fee Collection & Receipt Management API is operational',
    timestamp: new Date().toISOString()
  });
});

// Mount Resource API Routes
app.use('/api/auth', authRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);

// Catch-all 404 handler for unknown API routes
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Central Error Handler Middleware
app.use(errorHandler);

// Port from environment variable (nothing hardcoded)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Fee Management Server] running on port ${PORT}`);
});

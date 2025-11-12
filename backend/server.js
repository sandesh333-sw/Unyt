import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// import helmet from 'helmet';
// import compression from 'compression';
import connectDB from './src/config/database.js';

//import authRoutes from './src/routes/auth.js';
//import listingsRoutes from './src/routes/listings.js';

const app = express();

// Connect to MongoDB (fail fast if it can’t connect)
try {
  await connectDB();
  console.log('✅ MongoDB connected');
} catch (err) {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1);
}

// Basic middleware for testing
// app.use(helmet());
// app.use(compression());

// CORS: open for local testing; tighten later via env
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust reverse proxy if you later sit behind one (safe to leave)
app.set('trust proxy', 1);

// Routes
//app.use('/api/auth', authRoutes);
//app.use('/api/listings', listingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling (keep last)
app.use((err, req, res, next) => {
  console.error(' Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

// Graceful shutdowns
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION ', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION ', err);
  server.close(() => process.exit(1));
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

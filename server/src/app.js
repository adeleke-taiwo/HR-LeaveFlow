const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Trust proxy (needed for secure cookies and rate limiting behind Render's proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
app.use('/api/v1', routes);

// Health check
app.get('/health', async (req, res) => {
  const health = { status: 'ok', timestamp: new Date().toISOString() };
  try {
    const prisma = require('./config/database');
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB health check timed out')), 5000)),
    ]);
    health.db = 'connected';
  } catch (err) {
    health.db = 'error';
    health.dbError = err.message;
  }
  res.json(health);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const emotionRoutes = require('./routes/emotions');
const therapyRoutes = require('./routes/therapy');
const doctorRoutes = require('./routes/doctors');
const chatRoutes = require('./routes/chat');
const sessionRoutes = require('./routes/sessions');
const privacyRoutes = require('./routes/privacy');
const notificationRoutes = require('./routes/notifications');
const notificationEnhancedRoutes = require('./routes/notifications-enhanced');
const emergencyAlertRoutes = require('./routes/emergency-alert');
const voiceAssistantRoutes = require('./routes/voice-assistant');
const Scheduler = require('./modules/notifications_module/services/Scheduler');

// Load environment variables
dotenv.config();

// Initialize scheduler for cron jobs
const scheduler = new Scheduler();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow frontend URLs
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.NETLIFY_URL ? `https://${process.env.NETLIFY_URL}` : null,
].filter(Boolean); // Remove null/undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow requests from allowed origins
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint (define BEFORE routes to ensure it works)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PsycheMirror API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      emotions: '/api/emotions',
      therapy: '/api/therapy'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (define BEFORE routes)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PsycheMirror API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
try {
  console.log('📦 Loading routes...');
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/emotions', emotionRoutes);
  app.use('/api/therapy', therapyRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/privacy', privacyRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/notifications', notificationEnhancedRoutes);
  app.use('/api/emergency-alert', emergencyAlertRoutes);
  app.use('/api/voice', voiceAssistantRoutes);
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  throw error;
}

// Error handling middleware (MUST come before 404 handler)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for undefined routes (MUST be last)
app.use((req, res) => {
  console.log(`⚠️  404: ${req.method} ${req.path} not found`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      '/api/emotions',
      '/api/therapy',
      '/api/users'
    ]
  });
});

// Initialize database connection
let pool;
try {
  console.log('📊 Initializing database connection...');
  pool = require('./config/database');
  console.log('✅ Database connection initialized');
} catch (error) {
  console.error('❌ Database initialization error:', error);
  // Don't exit - server can still start without DB for health checks
}

// Start server
console.log(`🔧 Starting server on port ${PORT}...`);
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PsycheMirror API server running on port ${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Server listening on: 0.0.0.0:${PORT}`);
  console.log(`✅ Server is ready to accept connections`);
  
  // Start cron job for processing scheduled notifications (runs every minute)
  try {
    cron.schedule('* * * * *', async () => {
      try {
        await scheduler.processPendingNotifications();
      } catch (error) {
        console.error('Error processing scheduled notifications:', error);
      }
    });
    console.log('⏰ Scheduled notifications cron job started (runs every minute)');
  } catch (error) {
    console.error('❌ Error starting cron job:', error);
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    if (pool && pool.end) {
      pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

// Log unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;

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

// Routes
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PsycheMirror API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PsycheMirror API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  // Start cron job for processing scheduled notifications (runs every minute)
  cron.schedule('* * * * *', async () => {
    try {
      await scheduler.processPendingNotifications();
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  });
  
  console.log('⏰ Scheduled notifications cron job started (runs every minute)');
});

module.exports = app;

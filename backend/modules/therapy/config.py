# Configuration file for Activity & Therapy Recommendations Module

# Database Configuration
DATABASE_URL = sqlite:///therapy_recommendations.db

# Application Configuration
SECRET_KEY = your-secret-key-change-this-in-production
DEBUG = True
HOST = 0.0.0.0
PORT = 5000

# API Configuration
API_PREFIX = /api
CORS_ORIGINS = *

# Session Configuration
SESSION_TIMEOUT = 3600  # 1 hour in seconds

# Multimedia Configuration
MULTIMEDIA_PATH = static/multimedia
ALLOWED_EXTENSIONS = ['mp3', 'mp4', 'gif', 'jpg', 'png', 'webm']

# Emotional States Configuration
SUPPORTED_EMOTIONAL_STATES = ['anxious', 'depressed', 'stressed', 'angry']

# Activity Types Configuration
ACTIVITY_TYPES = ['relaxation', 'mindfulness', 'cbt', 'journaling']

# Default Settings
DEFAULT_INTENSITY = medium
DEFAULT_SESSION_TIMEOUT = 30  # minutes
MAX_ACTIVITY_DURATION = 60  # minutes

# Logging Configuration
LOG_LEVEL = INFO
LOG_FILE = logs/app.log

# 🪞 Psyche Mirror

> An AI-powered mental health monitoring and therapy recommendation system that uses multimodal emotion analysis (facial, voice, and text) to provide personalized mental wellness support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Python](https://img.shields.io/badge/python-%3E%3D3.10-blue.svg)
![React](https://img.shields.io/badge/react-19.2.0-61dafb.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the App](#-running-the-app)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎭 Multimodal Emotion Analysis
- **Facial Emotion Detection** - Real-time emotion recognition using webcam
- **Voice Emotion Analysis** - Detect emotions from speech patterns
- **Text Sentiment Analysis** - Analyze emotional content in written text
- **Combined Analysis** - Multimodal fusion for accurate psychological state assessment

### 🏥 Mental Health Support
- **Personalized Therapy Recommendations** - AI-driven therapy plans based on emotional state
- **Therapy Activity Tracking** - Track progress through guided activities
- **Psychological Assessment** - Comprehensive mental wellness evaluation

### 👥 User Management
- **Patient Dashboard** - Track emotions, view history, access therapy
- **Doctor Dashboard** - Monitor patients, view emotional trends
- **Role-based Access Control** - Secure authentication with JWT

### 🔔 Smart Notifications
- **Emergency Alerts** - Crisis detection and alert system
- **Scheduled Notifications** - Customizable reminder system
- **Emergency Contacts** - Quick access to support network

### 🔐 Security & Privacy
- **Two-Factor Authentication (MFA)** - Enhanced account security
- **Data Encryption** - Secure storage of sensitive information
- **Privacy Controls** - User-controlled data sharing settings

### 🌍 Internationalization
- Multi-language support (English, Spanish, French, German)

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Material-UI 7 | Component Library |
| TensorFlow.js | Client-side ML |
| Chart.js / Recharts | Data Visualization |
| Framer Motion | Animations |
| i18next | Internationalization |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express 5 | Web Framework |
| PostgreSQL | Database |
| JWT | Authentication |
| Multer | File Uploads |

### AI/ML (Python)
| Technology | Purpose |
|------------|---------|
| TensorFlow / tf-keras | Deep Learning |
| OpenCV | Image Processing |
| Librosa | Audio Analysis |
| scikit-learn | Machine Learning |

---

## 📦 Prerequisites

Before running this application, make sure you have the following installed:

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | >= 18.0.0 | [nodejs.org](https://nodejs.org/) |
| **Python** | >= 3.10 | [python.org](https://python.org/) |
| **PostgreSQL** | >= 14.0 | [postgresql.org](https://postgresql.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Python Dependencies
```
tensorflow>=2.10.0
tf-keras
opencv-python>=4.6.0
numpy>=1.21.0
librosa>=0.9.0
scikit-learn>=1.1.0
Pillow>=9.0.0
soundfile
```

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/223hashimfarooq/psyche-mirror.git
cd psyche-mirror
```

### 2. Set Up PostgreSQL Database
```sql
-- Create database
CREATE DATABASE psychemirror;

-- Create user (optional)
CREATE USER psycheuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE psychemirror TO psycheuser;
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 5. Install Python Dependencies
```bash
pip install tensorflow tf-keras opencv-python numpy librosa scikit-learn Pillow soundfile
```

### 6. Configure Environment Variables
Create a `.env` file in the `backend` folder:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=psychemirror
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this

# Encryption Key (32 bytes hex)
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Python Path (optional, if not in PATH)
PYTHON_CMD=python
```

---

## ▶️ Running the App

### Option 1: Quick Start (Windows)
Simply double-click:
```
start-app.bat
```
This will start both frontend and backend servers automatically.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## 📁 Project Structure

```
psyche-mirror/
├── backend/                    # Node.js Backend
│   ├── config/
│   │   └── database.js         # PostgreSQL configuration
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   └── audit.js            # Audit logging
│   ├── modules/
│   │   ├── face-emotion/       # Facial emotion detection (Python)
│   │   ├── voice-emotion/      # Voice emotion analysis (Python)
│   │   ├── text-sentiment/     # Text sentiment analysis (Python)
│   │   ├── multimodal/         # Combined analysis (Python)
│   │   ├── therapy/            # Therapy recommendations
│   │   ├── notifications_module/
│   │   ├── emergency_alert_module/
│   │   └── voice_assistant_module/
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── emotions.js         # Emotion analysis routes
│   │   ├── therapy.js          # Therapy routes
│   │   └── ...
│   ├── utils/
│   │   ├── encryption.js       # Data encryption
│   │   └── mfa.js              # Two-factor auth
│   ├── server.js               # Main server file
│   └── package.json
│
├── frontend/                   # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── MultiModalAnalysis.js
│   │   │   ├── EmotionDisplay.js
│   │   │   └── ...
│   │   ├── pages/              # Page components
│   │   │   ├── PatientDashboard.js
│   │   │   ├── DoctorDashboard.js
│   │   │   ├── EmotionAnalysis.js
│   │   │   ├── TherapyPage.js
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # Authentication state
│   │   ├── services/
│   │   │   └── api.js          # API service
│   │   ├── i18n/               # Translations
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── start-app.bat               # Quick start script (Windows)
├── .gitignore
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | Yes |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `ENCRYPTION_KEY` | Key for data encryption | Yes |
| `PYTHON_CMD` | Python command (python/python3) | No |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/verify-mfa` | Verify 2FA code |

### Emotion Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emotions/analyze/face` | Analyze facial emotions |
| POST | `/api/emotions/analyze/voice` | Analyze voice emotions |
| POST | `/api/emotions/analyze/text` | Analyze text sentiment |
| POST | `/api/emotions/analyze/multimodal` | Combined analysis |

### Therapy
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/therapy/assessment` | Save assessment |
| GET | `/api/therapy/assessments` | Get assessment history |
| POST | `/api/therapy/session` | Save therapy session |
| GET | `/api/therapy/progress` | Get progress summary |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

**Talha Adeel**
- GitHub: [@talhatalha30talha](https://github.com/talhatalha30talha)

**Hashim Farooq**
- GitHub: [@223hashimfarooq](https://github.com/223hashimfarooq)

**Ali Khayyam**
---

## 🙏 Acknowledgments

- TensorFlow team for the machine learning frameworks
- Material-UI for the beautiful component library
- All contributors and supporters of this project

---

<p align="center">Made with ❤️ for mental health awareness</p>


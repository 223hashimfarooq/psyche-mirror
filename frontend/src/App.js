import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const EmotionAnalysis = lazy(() => import('./pages/EmotionAnalysis'));
const TherapyPage = lazy(() => import('./pages/TherapyPage'));
const TherapyRecommendationPage = lazy(() => import('./pages/TherapyRecommendationPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PrivacySettingsPage = lazy(() => import('./pages/PrivacySettingsPage'));
const NewRequestsPage = lazy(() => import('./pages/NewRequestsPage'));
const ScheduleSessionPage = lazy(() => import('./pages/ScheduleSessionPage'));
const FeeSetupPage = lazy(() => import('./pages/FeeSetupPage'));
const TherapyGuidePage = lazy(() => import('./pages/TherapyGuidePage'));
const EmergencyHotlinePage = lazy(() => import('./pages/EmergencyHotlinePage'));
const ContactDoctorPage = lazy(() => import('./pages/ContactDoctorPage'));
const AverageWellnessScorePage = lazy(() => import('./pages/AverageWellnessScorePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'));
const EmergencyContactsPage = lazy(() => import('./pages/EmergencyContactsPage'));
const ScheduledNotificationsPage = lazy(() => import('./pages/ScheduledNotificationsPage'));

// Create theme with calming colors inspired by Truemo
const theme = createTheme({
  palette: {
    primary: {
      main: '#6B73FF',
      light: '#9C88FF',
      dark: '#4A52CC',
    },
    secondary: {
      main: '#FF6B9D',
      light: '#FF9EC7',
      dark: '#CC557D',
    },
    background: {
      default: '#F8F9FF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3748',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

// Loading Component
const LoadingSpinner = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    bgcolor="background.default"
  >
    <CircularProgress size={60} />
  </Box>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (currentUser) {
    if (userRole === 'patient') {
      return <Navigate to="/patient/dashboard" replace />;
    } else if (userRole === 'doctor') {
      return <Navigate to="/doctor/overview" replace />;
    }
  }
  
  return children;
};

function App() {
  const { i18n } = useTranslation();

  // Ensure language synchronization across the entire app
  useEffect(() => {
    // Load language from localStorage on app start
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && ['en', 'es', 'fr', 'de'].includes(savedLanguage)) {
      if (i18n.language !== savedLanguage) {
        i18n.changeLanguage(savedLanguage);
      }
    }

    // Listen for custom language change events from any component
    const handleLanguageChange = () => {
      const currentLang = localStorage.getItem('i18nextLng') || 'en';
      if (i18n.language !== currentLang && ['en', 'es', 'fr', 'de'].includes(currentLang)) {
        i18n.changeLanguage(currentLang);
      }
    };

    // Listen to i18n's built-in language change event to keep localStorage in sync
    const handleI18nLanguageChange = (lng) => {
      localStorage.setItem('i18nextLng', lng);
    };

    window.addEventListener('languagechange', handleLanguageChange);
    i18n.on('languageChanged', handleI18nLanguageChange);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
      i18n.off('languageChanged', handleI18nLanguageChange);
    };
  }, [i18n]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />

            {/* Patient Routes */}
            <Route 
              path="/patient/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/analyze" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <EmotionAnalysis />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/therapy" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <TherapyPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/therapy-recommendation" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <TherapyRecommendationPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/settings"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/privacy"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PrivacySettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/emergency-hotline" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <EmergencyHotlinePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/contact-doctor" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <ContactDoctorPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/notifications" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/notification-settings" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <NotificationSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/emergency-contacts" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <EmergencyContactsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/scheduled-notifications" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <ScheduledNotificationsPage />
                </ProtectedRoute>
              } 
            />

            {/* Doctor Routes */}
            <Route 
              path="/doctor/overview" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/patients" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/requests" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <NewRequestsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/schedule" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <ScheduleSessionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/fees" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <FeeSetupPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/therapy-guide" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <TherapyGuidePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/wellness-score" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <AverageWellnessScorePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/settings" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/notifications" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/privacy" 
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <PrivacySettingsPage />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
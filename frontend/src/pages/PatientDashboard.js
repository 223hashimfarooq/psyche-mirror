import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Chip,
  Badge,
  useTheme,
  alpha,
  Dialog,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Psychology,
  Mic,
  TextFields,
  Favorite,
  Notifications,
  Settings,
  Logout,
  EmojiEmotions,
  Person,
  Dashboard,
  Message,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PatientProfile from '../components/PatientProfile';
import TherapyTrackingChart from '../components/TherapyTrackingChart';
import EmotionalProgressGraph from '../components/EmotionalProgressGraph';
import MultiModalAnalysis from '../components/MultiModalAnalysis';
import RecentAnalysisHistory from '../components/RecentAnalysisHistory';
import DoctorTab from '../components/DoctorTab';
import VoiceAssistant from '../components/VoiceAssistant';

const PatientDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [hasTherapyHistory, setHasTherapyHistory] = useState(false);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    checkTherapyHistory();
    loadUserProfile();
    fetchUnreadNotificationCount();
    
    // Refresh unread count every 5 seconds
    const interval = setInterval(() => {
      fetchUnreadNotificationCount();
    }, 5000);

    // Refresh when window regains focus (user returns from notifications page)
    const handleFocus = () => {
      fetchUnreadNotificationCount();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.getUserProfile(currentUser.id);
      console.log('Profile loaded:', response);
      setUserProfile(response);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to currentUser data
      setUserProfile({
        ...currentUser,
        profile_picture: currentUser.profile_picture || ''
      });
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  const fetchUnreadNotificationCount = async () => {
    try {
      const response = await api.request('/notifications/unread-count');
      if (response && response.success) {
        setUnreadNotificationCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  const checkTherapyHistory = async () => {
    try {
      if (!currentUser?.id) {
        setHasTherapyHistory(false);
        return;
      }

      console.log('Checking therapy history for user:', currentUser.id);
      // Use the correct endpoint that exists in the backend
      const response = await api.request('/therapy/sessions');
      console.log('Therapy history response:', response);
      
      // Check if user has any therapy sessions
      setHasTherapyHistory(response.sessions && response.sessions.length > 0);
    } catch (error) {
      console.error('Error checking therapy history:', error);
      setHasTherapyHistory(false);
    }
  };


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleAnalysisComplete = (analysisResult) => {
    setAnalysisOpen(false);
    // Navigate to therapy recommendation page with analysis results
    navigate('/patient/therapy-recommendation', { state: { analysisResult } });
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: theme.palette.secondary.main,
      sad: theme.palette.primary.main,
      angry: '#FF5722',
      anxious: '#FF9800',
      neutral: theme.palette.text.secondary,
    };
    return colors[mood] || colors.neutral;
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      anxious: '😰',
      neutral: '😐',
    };
    return emojis[mood] || emojis.neutral;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      position: 'relative',
      backgroundImage: `url('https://www.psychologs.com/wp-content/uploads/2023/11/Life-of-a-Psychologist-Career-Challenges-and-Responsibility.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.secondary.main, 0.6)} 100%)`,
        zIndex: 1,
      }
    }}>
      {/* Navigation */}
      <AppBar position="sticky" sx={{ 
        bgcolor: alpha('#ffffff', 0.1),
        backdropFilter: 'blur(20px)',
        boxShadow: 'none',
        zIndex: 10,
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
            PsycheMirror
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton sx={{ color: '#ffffff' }} onClick={() => setProfileOpen(true)}>
            {(() => {
              const profilePic = userProfile?.profile_picture || currentUser?.profile_picture;
              console.log('Profile picture data:', profilePic);
              return (
                <Avatar 
                  src={profilePic && profilePic !== 'undefined' ? profilePic : null} 
                  sx={{ width: 32, height: 32 }}
                >
                  <Person />
                </Avatar>
              );
            })()}
          </IconButton>
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/patient/notifications')}>
            <Badge 
              badgeContent={unreadNotificationCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#f44336',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  minWidth: '20px',
                  height: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }
              }}
            >
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/patient/settings')}>
            <Settings />
          </IconButton>
          <IconButton sx={{ color: '#ffffff' }} onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('dashboard.patient.welcome', { name: currentUser?.name || 'Patient' })}
            </Typography>
            <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {t('dashboard.patient.greeting')}
            </Typography>
          </Box>
        </motion.div>

        {/* Tabs for different sections */}
        <Card sx={{ 
          mb: 3,
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderRadius: 3
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              centered
              sx={{ 
                '& .MuiTab-root': { 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 600,
                  borderRadius: '12px 12px 0 0',
                  mx: 1,
                  minHeight: 56,
                  py: 1.25,
                  minWidth: 0,
                  flex: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                },
                '& .Mui-selected': { 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Tab 
                icon={<Dashboard />} 
                label={t('common.dashboard')} 
                iconPosition="start"
                sx={{ flex: 1, minWidth: 0 }}
              />
              <Tab 
                icon={<Message />} 
                label={t('dashboard.patient.doctorCommunication')} 
                iconPosition="start"
                sx={{ flex: 1, minWidth: 0 }}
              />
            </Tabs>
          </Box>
        </Card>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Grid container columnSpacing={4} rowSpacing={4}>
            {/* For patients with therapy history - show all components */}
            {hasTherapyHistory ? (
            <>
              {/* 1. Therapy Tracking Chart (Pie Chart) - Top */}
              <Grid size={{ xs: 12 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <TherapyTrackingChart />
                </motion.div>
              </Grid>

              {/* 2. Emotional Progress Graph - Below pie chart */}
              <Grid size={{ xs: 12 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <EmotionalProgressGraph />
                </motion.div>
              </Grid>

              {/* 3. Current Mood - Below graph */}
              <Grid size={{ xs: 12 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card sx={{ 
                    height: '100%',
                    bgcolor: alpha('#ffffff', 0.15),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {t('dashboard.patient.currentMood')}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h1" sx={{ fontSize: '4rem' }}>
                          {getMoodEmoji(currentMood)}
                        </Typography>
                      </Box>
                      <Chip
                        label={t(`emotions.${currentMood}`, { defaultValue: currentMood.charAt(0).toUpperCase() + currentMood.slice(1) })}
                        sx={{
                          bgcolor: alpha(getMoodColor(currentMood), 0.15),
                          color: getMoodColor(currentMood),
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          px: 2,
                          py: 1,
                          border: `2px solid ${alpha(getMoodColor(currentMood), 0.3)}`,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                          {t('dashboard.patient.lastUpdated', { date: new Date().toLocaleDateString() })}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* 4. Analyze Button - Next to current mood */}
              <Grid size={{ xs: 12 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.15),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: { xs: 4, md: 6 } }}>
                      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {t('dashboard.patient.multiModalAnalysis')}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', maxWidth: 900, mx: 'auto' }}>
                        {t('dashboard.patient.analysisDescription')}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<Psychology />}
                        onClick={() => setAnalysisOpen(true)}
                        sx={{ 
                          bgcolor: alpha('#ffffff', 0.2),
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(10px)',
                          px: 4,
                          py: 2,
                          fontSize: '1.1rem',
                          '&:hover': {
                            bgcolor: alpha('#ffffff', 0.3),
                            border: '1px solid rgba(255,255,255,0.5)',
                          },
                        }}
                      >
                        {t('dashboard.patient.startAnalysis')}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* 5. Recent Analysis History - Bottom */}
              <Grid size={{ xs: 12 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <RecentAnalysisHistory />
                </motion.div>
              </Grid>
            </>
          ) : (
            /* For new patients - show only Analyze Emotions button */
            <Grid size={{ xs: 12 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 6 }}>
                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {t('dashboard.patient.welcomeJourney')}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 4, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      {t('dashboard.patient.multiModalAnalysis')}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', maxWidth: '600px', mx: 'auto' }}>
                      {t('dashboard.patient.analysisDescription')}
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Psychology />}
                      onClick={() => setAnalysisOpen(true)}
                      sx={{ 
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                        px: 6,
                        py: 3,
                        fontSize: '1.2rem',
                        '&:hover': {
                          bgcolor: alpha('#ffffff', 0.3),
                          border: '1px solid rgba(255,255,255,0.5)',
                        },
                      }}
                    >
                      {t('dashboard.patient.startFirstAnalysis')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}
          </Grid>
        )}

        {/* Doctor Communication Tab */}
        {activeTab === 1 && (
          <DoctorTab />
        )}
      </Container>

      {/* Patient Profile Dialog */}
      <PatientProfile 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Multi-Modal Analysis Dialog */}
      <Dialog 
        open={analysisOpen} 
        onClose={() => setAnalysisOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            maxWidth: '100%',
            m: 2
          }
        }}
        BackdropProps={{
          sx: {
            bgcolor: alpha('#000000', 0.5),
            backdropFilter: 'blur(5px)'
          }
        }}
      >
        <MultiModalAnalysis onAnalysisComplete={handleAnalysisComplete} />
      </Dialog>

      {/* Voice Assistant */}
      <VoiceAssistant />
    </Box>
  );
};

export default PatientDashboard;
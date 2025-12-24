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
  Notifications,
  Settings,
  Logout,
  Person,
  Dashboard,
  Message,
  People,
  RequestQuote,
  AttachMoney,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PatientProfile from '../components/PatientProfile';
import DoctorPatientList from '../components/DoctorPatientList';
import PatientRequests from '../components/PatientRequests';
import PricingManagement from '../components/PricingManagement';
import AllPatientsOverview from '../components/AllPatientsOverview';

const DoctorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    pendingRequests: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [patientListKey, setPatientListKey] = useState(0);

  useEffect(() => {
    loadUserProfile();
    loadStats();
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
      setUserProfile({
        ...currentUser,
        profile_picture: currentUser.profile_picture || ''
      });
    }
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

  const loadStats = async () => {
    try {
      setLoading(true);
      const [patientsRes, requestsRes, sessionsRes] = await Promise.all([
        api.getDoctorPatients().catch(() => ({ success: false, patients: [] })),
        api.getDoctorRequests().catch(() => ({ success: false, requests: [] })),
        api.request('/therapy/sessions').catch(() => ({ success: false, sessions: [] })),
      ]);

      const activePatients = patientsRes.patients?.length || 0;
      const pendingRequests = requestsRes.requests?.length || 0;
      const totalSessions = sessionsRes.sessions?.length || 0;

      setStats({
        totalPatients: activePatients,
        activePatients: activePatients,
        pendingRequests: pendingRequests,
        totalSessions: totalSessions,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleRequestUpdate = () => {
    console.log('DoctorDashboard: Request update triggered');
    loadStats();
    // Force refresh of patient list to show newly accepted patients
    setPatientListKey(prev => {
      const newKey = prev + 1;
      console.log('DoctorDashboard: patientListKey updated to', newKey);
      return newKey;
    });
    // Automatically switch to patient list tab to show the newly accepted patient
    if (activeTab !== 1) {
      console.log('DoctorDashboard: Switching to patient list tab');
      setActiveTab(1);
    }
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
          <IconButton 
            sx={{ color: '#ffffff' }} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/doctor/notifications');
            }}
          >
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
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/doctor/settings')}>
            <Settings />
          </IconButton>
          <IconButton sx={{ color: '#ffffff' }} onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 4, position: 'relative', zIndex: 2, px: { xs: 1, sm: 2, md: 2 }, width: '100%' }}>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('dashboard.doctor.welcome', { name: currentUser?.name || 'Doctor' })}
            </Typography>
            <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {t('dashboard.doctor.description')}
            </Typography>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card sx={{ 
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                textAlign: 'center',
                height: '100%',
              }}>
                <CardContent>
                  <Typography variant="h3" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 700, mb: 1 }}>
                    {stats.totalPatients}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', opacity: 0.9 }}>
                    {t('dashboard.doctor.totalPatients')}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card sx={{ 
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                textAlign: 'center',
                height: '100%',
              }}>
                <CardContent>
                  <Typography variant="h3" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 700, mb: 1 }}>
                    {stats.activePatients}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', opacity: 0.9 }}>
                    {t('dashboard.doctor.activePatients')}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card sx={{ 
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                textAlign: 'center',
                height: '100%',
              }}>
                <CardContent>
                  <Typography variant="h3" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 700, mb: 1 }}>
                    {stats.pendingRequests}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', opacity: 0.9 }}>
                    {t('dashboard.doctor.pendingRequests')}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card sx={{ 
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                textAlign: 'center',
                height: '100%',
              }}>
                <CardContent>
                  <Typography variant="h3" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 700, mb: 1 }}>
                    {stats.totalSessions}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', opacity: 0.9 }}>
                    {t('dashboard.doctor.totalSessions')}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

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
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                '& .MuiTab-root': { 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 600,
                  borderRadius: '12px 12px 0 0',
                  mx: 1,
                  minHeight: 56,
                  py: 1.25,
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
                label={t('dashboard.doctor.dashboardTab')} 
                iconPosition="start"
              />
              <Tab 
                icon={<People />} 
                label={t('dashboard.doctor.myPatients')} 
                iconPosition="start"
              />
              <Tab 
                icon={<RequestQuote />} 
                label={`${t('dashboard.doctor.patientRequests')}${stats.pendingRequests > 0 ? ` (${stats.pendingRequests})` : ''}`}
                iconPosition="start"
              />
              <Tab 
                icon={<AttachMoney />} 
                label={t('dashboard.doctor.pricing')} 
                iconPosition="start"
              />
            </Tabs>
          </Box>
        </Card>

        {/* Tab Content */}
        {activeTab === 0 && (
          <AllPatientsOverview />
        )}

        {activeTab === 1 && (
          <DoctorPatientList key={patientListKey} refreshKey={patientListKey} onUpdate={loadStats} />
        )}

        {activeTab === 2 && (
          <PatientRequests onUpdate={handleRequestUpdate} />
        )}

        {activeTab === 3 && (
          <PricingManagement />
        )}
      </Container>

      {/* Doctor Profile Dialog */}
      <PatientProfile 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </Box>
  );
};

export default DoctorDashboard;

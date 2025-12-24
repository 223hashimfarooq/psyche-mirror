import React, { useState } from 'react';
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
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Favorite,
  SelfImprovement,
  Psychology,
  MusicNote,
  FitnessCenter,
  Spa,
  Timer,
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const TherapyPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeSession, setActiveSession] = useState(null);
  const [sessionProgress, setSessionProgress] = useState(0);

  const therapyActivities = [
    {
      id: 1,
      title: t('therapy.activities.breathing.title'),
      description: t('therapy.activities.breathing.description'),
      duration: `5 ${t('therapy.minutes')}`,
      type: 'breathing',
      icon: <Spa sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      difficulty: t('therapy.difficulty.easy'),
    },
    {
      id: 2,
      title: t('therapy.activities.meditation.title'),
      description: t('therapy.activities.meditation.description'),
      duration: `10 ${t('therapy.minutes')}`,
      type: 'meditation',
      icon: <SelfImprovement sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
      difficulty: t('therapy.difficulty.medium'),
    },
    {
      id: 3,
      title: t('therapy.activities.cbt.title'),
      description: t('therapy.activities.cbt.description'),
      duration: `15 ${t('therapy.minutes')}`,
      type: 'cbt',
      icon: <Psychology sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
      difficulty: t('therapy.difficulty.medium'),
    },
    {
      id: 4,
      title: t('therapy.activities.music.title'),
      description: t('therapy.activities.music.description'),
      duration: `20 ${t('therapy.minutes')}`,
      type: 'music',
      icon: <MusicNote sx={{ fontSize: 40 }} />,
      color: '#FF9800',
      difficulty: t('therapy.difficulty.easy'),
    },
    {
      id: 5,
      title: t('therapy.activities.relaxation.title'),
      description: t('therapy.activities.relaxation.description'),
      duration: `12 ${t('therapy.minutes')}`,
      type: 'relaxation',
      icon: <FitnessCenter sx={{ fontSize: 40 }} />,
      color: '#9C27B0',
      difficulty: t('therapy.difficulty.medium'),
    },
    {
      id: 6,
      title: t('therapy.activities.gratitude.title'),
      description: t('therapy.activities.gratitude.description'),
      duration: `8 ${t('therapy.minutes')}`,
      type: 'gratitude',
      icon: <Favorite sx={{ fontSize: 40 }} />,
      color: '#E91E63',
      difficulty: t('therapy.difficulty.easy'),
    },
  ];

  const startSession = (activity) => {
    setActiveSession(activity);
    setSessionProgress(0);
    
    // Simulate session progress
    const interval = setInterval(() => {
      setSessionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setActiveSession(null);
          return 0;
        }
        return prev + 1;
      });
    }, 100);
  };

  const pauseSession = () => {
    setActiveSession(null);
    setSessionProgress(0);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      [t('therapy.difficulty.easy')]: '#4CAF50',
      [t('therapy.difficulty.medium')]: '#FF9800',
      [t('therapy.difficulty.hard')]: '#F44336',
    };
    return colors[difficulty] || colors[t('therapy.difficulty.easy')];
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
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/patient/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', ml: 2 }}>
            {t('therapy.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('therapy.personalizedSessions')}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
              {t('therapy.description')}
            </Typography>
          </Box>
        </motion.div>

        {/* Active Session */}
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{ 
              mb: 4, 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: alpha(activeSession.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 3,
                    }}
                  >
                    {activeSession.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: activeSession.color, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontSize: '1.1rem' }}>
                      {activeSession.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: activeSession.color, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                      {activeSession.duration} • {activeSession.difficulty}
                    </Typography>
                  </Box>
                  <IconButton onClick={pauseSession} color="error">
                    <Pause />
                  </IconButton>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                    {t('therapy.progress')}: {sessionProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={sessionProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(activeSession.color, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: activeSession.color,
                      },
                    }}
                  />
                </Box>
                
                <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                  {activeSession.description}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Therapy Activities Grid */}
        <Grid container spacing={3}>
          {therapyActivities.map((activity, index) => (
            <Grid item xs={12} sm={6} md={4} key={activity.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    bgcolor: alpha('#ffffff', 0.15),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    },
                  }}
                  onClick={() => startSession(activity)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          bgcolor: alpha(activity.color, 0.2),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          border: `2px solid ${alpha(activity.color, 0.3)}`,
                        }}
                      >
                        {activity.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: activity.color, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontSize: '1.1rem' }}>
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, color: activity.color, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600, fontSize: '0.95rem' }}>
                        {activity.description}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={activity.duration}
                        size="small"
                        sx={{ 
                          bgcolor: alpha(activity.color, 0.2), 
                          color: activity.color,
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          border: `2px solid ${alpha(activity.color, 0.4)}`,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        }}
                      />
                      <Chip
                        label={activity.difficulty}
                        size="small"
                        sx={{ 
                          bgcolor: alpha(getDifficultyColor(activity.difficulty), 0.2), 
                          color: getDifficultyColor(activity.difficulty),
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          border: `2px solid ${alpha(getDifficultyColor(activity.difficulty), 0.4)}`,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        }}
                      />
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrow />}
                      sx={{
                        bgcolor: alpha(activity.color, 0.8),
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        border: `1px solid ${alpha(activity.color, 0.3)}`,
                        backdropFilter: 'blur(10px)',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          bgcolor: alpha(activity.color, 0.9),
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                        },
                      }}
                    >
                      {t('therapy.startSession')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Progress Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card sx={{ 
            mt: 4,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('therapy.yourProgress')}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      12
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                      {t('therapy.sessionsCompleted')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      3.2h
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                      {t('therapy.totalTime')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      85%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                      {t('therapy.consistencyRate')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card sx={{ 
            mt: 4, 
            bgcolor: alpha('#F44336', 0.15), 
            backdropFilter: 'blur(10px)',
            border: `2px solid ${alpha('#F44336', 0.3)}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', fontWeight: 600, textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('therapy.needImmediateHelp')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                {t('therapy.emergencyHelpDesc')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/patient/emergency-hotline')}
                  sx={{ 
                    px: 3,
                    bgcolor: alpha('#F44336', 0.8),
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: `1px solid ${alpha('#F44336', 0.3)}`,
                    backdropFilter: 'blur(10px)',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha('#F44336', 0.9),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {t('therapy.emergencyHotline')}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/patient/contact-doctor')}
                  sx={{ 
                    px: 3,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: `2px solid ${alpha('#ffffff', 0.3)}`,
                    backdropFilter: 'blur(10px)',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.1),
                      border: `2px solid ${alpha('#ffffff', 0.5)}`,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {t('therapy.contactDoctor')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default TherapyPage;
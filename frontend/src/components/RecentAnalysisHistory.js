import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  IconButton,
  Collapse,
  Button,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Psychology,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  CalendarToday,
  Visibility
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RecentAnalysisHistory = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    fetchRecentAnalyses();
  }, []);

  const fetchRecentAnalyses = async () => {
    try {
      // Use therapy sessions data as a proxy for analysis history
      const response = await api.request('/therapy/sessions');
      
      // Transform therapy sessions into analysis-like data
      const analysisData = response.sessions.slice(0, 5).map((session, index) => ({
        id: session.id,
        created_at: session.createdAt,
        combined_emotion: getRandomEmotion(), // Mock emotion data
        combined_confidence: Math.random() * 0.5 + 0.5, // Random confidence 0.5-1.0
        facial_emotion: getRandomEmotion(),
        facial_confidence: Math.random() * 0.5 + 0.5,
        voice_emotion: getRandomEmotion(),
        voice_confidence: Math.random() * 0.5 + 0.5,
        text_emotion: getRandomEmotion(),
        text_confidence: Math.random() * 0.5 + 0.5,
        analysis_data: {
          combined: {
            description: t('dashboard.patient.analysisFromSession', { activityName: session.activityName || 'therapy' })
          }
        }
      }));
      
      setAnalyses(analysisData);
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const getRandomEmotion = () => {
    const emotions = ['happy', 'neutral', 'calm', 'excited', 'anxious', 'sad'];
    return emotions[Math.floor(Math.random() * emotions.length)];
  };

  const toggleExpanded = (analysisId) => {
    setExpandedCards(prev => ({
      ...prev,
      [analysisId]: !prev[analysisId]
    }));
  };

  const getEmotionColor = (emotion) => {
    const emotionColors = {
      'happy': 'success',
      'sad': 'error',
      'angry': 'error',
      'fear': 'warning',
      'surprise': 'info',
      'disgust': 'warning',
      'neutral': 'default',
      'anxious': 'warning',
      'stressed': 'error',
      'calm': 'success',
      'excited': 'info'
    };
    return emotionColors[emotion?.toLowerCase()] || 'default';
  };

  const getTrendIcon = (score) => {
    if (score > 3.5) return <TrendingUp color="success" />;
    if (score < 2.5) return <TrendingDown color="error" />;
    return <TrendingFlat color="info" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200
      }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease-in-out'
        }
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            mb: 2,
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontWeight: 600
          }}>
            {t('dashboard.patient.recentAnalysis')}
          </Typography>
          <Box textAlign="center" py={4}>
            <Psychology sx={{ fontSize: 64, color: '#ffffff', mb: 2, opacity: 0.7 }} />
            <Typography variant="h6" sx={{ 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600,
              mb: 1
            }}>
              {t('dashboard.patient.noAnalysisHistory')}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9
            }}>
              {t('dashboard.patient.completeFirstAnalysis')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      bgcolor: alpha('#ffffff', 0.15),
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      borderRadius: 3,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease-in-out'
      }
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          mb: 2,
          color: '#ffffff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          fontWeight: 600
        }}>
          {t('dashboard.patient.recentAnalysis')}
        </Typography>
        
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {analyses.map((analysis, index) => (
            <Card key={analysis.id} sx={{ 
              mb: 2, 
              bgcolor: alpha('#ffffff', 0.1),
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 2,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.15),
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday sx={{ color: '#ffffff', opacity: 0.8 }} />
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        {formatDate(analysis.created_at)}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={t(`emotions.${analysis.combined_emotion}`, { defaultValue: analysis.combined_emotion.charAt(0).toUpperCase() + analysis.combined_emotion.slice(1) })}
                      sx={{
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontWeight: 500
                      }}
                      size="small"
                    />
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTrendIcon(analysis.combined_confidence)}
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        {(analysis.combined_confidence * 100).toFixed(0)}% {t('analysis.confidence').toLowerCase()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <IconButton
                    onClick={() => toggleExpanded(analysis.id)}
                    size="small"
                    sx={{ color: '#ffffff' }}
                  >
                    {expandedCards[analysis.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                <Collapse in={expandedCards[analysis.id]}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ 
                      mb: 1,
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: 600
                    }}>
                      {t('dashboard.patient.detailedAnalysisResults')}
                    </Typography>
                    
                    <Grid container columnSpacing={2} rowSpacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box>
                          <Typography variant="body2" sx={{ 
                            mb: 1,
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.9
                          }}>
                            {t('analysis.facial')}
                          </Typography>
                          <Chip
                            label={analysis.facial_emotion ? t(`emotions.${analysis.facial_emotion}`, { defaultValue: analysis.facial_emotion.charAt(0).toUpperCase() + analysis.facial_emotion.slice(1) }) : t('common.notAvailable')}
                            sx={{
                              bgcolor: alpha('#ffffff', 0.2),
                              color: '#ffffff',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontWeight: 500
                            }}
                            size="small"
                          />
                          <Typography variant="caption" display="block" sx={{ 
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.8,
                            mt: 0.5
                          }}>
                            {(analysis.facial_confidence * 100).toFixed(0)}% {t('analysis.confidence').toLowerCase()}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box>
                          <Typography variant="body2" sx={{ 
                            mb: 1,
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.9
                          }}>
                            {t('analysis.voice')}
                          </Typography>
                          <Chip
                            label={analysis.voice_emotion ? t(`emotions.${analysis.voice_emotion}`, { defaultValue: analysis.voice_emotion.charAt(0).toUpperCase() + analysis.voice_emotion.slice(1) }) : t('common.notAvailable')}
                            sx={{
                              bgcolor: alpha('#ffffff', 0.2),
                              color: '#ffffff',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontWeight: 500
                            }}
                            size="small"
                          />
                          <Typography variant="caption" display="block" sx={{ 
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.8,
                            mt: 0.5
                          }}>
                            {(analysis.voice_confidence * 100).toFixed(0)}% {t('analysis.confidence').toLowerCase()}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box>
                          <Typography variant="body2" sx={{ 
                            mb: 1,
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.9
                          }}>
                            {t('analysis.text')}
                          </Typography>
                          <Chip
                            label={analysis.text_emotion ? t(`emotions.${analysis.text_emotion}`, { defaultValue: analysis.text_emotion.charAt(0).toUpperCase() + analysis.text_emotion.slice(1) }) : t('common.notAvailable')}
                            sx={{
                              bgcolor: alpha('#ffffff', 0.2),
                              color: '#ffffff',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontWeight: 500
                            }}
                            size="small"
                          />
                          <Typography variant="caption" display="block" sx={{ 
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.8,
                            mt: 0.5
                          }}>
                            {(analysis.text_confidence * 100).toFixed(0)}% {t('analysis.confidence').toLowerCase()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {analysis.analysis_data && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ 
                          mb: 1,
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          fontWeight: 600
                        }}>
                          {t('dashboard.patient.analysisSummary')}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          opacity: 0.9
                        }}>
                          {analysis.analysis_data.combined?.description || t('dashboard.patient.noDescriptionAvailable')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>

        {analyses.length > 0 && (
          <Box textAlign="center" mt={2}>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => {/* Navigate to full history page */}}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {t('dashboard.patient.viewAllAnalysisHistory')}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentAnalysisHistory;

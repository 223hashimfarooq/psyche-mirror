import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const EmotionalProgressGraph = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState('stable');

  // Compute the translated Y-axis label text - force evaluation
  // Use i18n.language directly to ensure it updates when language changes
  const yAxisLabelText = useMemo(() => {
    const currentLang = i18n.language;
    const translated = t('wellness.emotionalScore');
    // If translation returns the key itself, it means the key doesn't exist - use fallback
    if (!translated || translated === 'wellness.emotionalScore') {
      return 'Emotional Score';
    }
    return translated;
  }, [t, i18n.language]);
  

  useEffect(() => {
    fetchProgressData();
  }, []);

  // Force re-render when language changes
  useEffect(() => {
    // This will trigger a re-render when language changes
    console.log('Language changed to:', i18n.language);
  }, [i18n.language]);

  const fetchProgressData = async () => {
    try {
      // Use the correct endpoint that exists in the backend
      const response = await api.request('/therapy/progress');
      
      // The API returns progress data with moodTrends array
      const moodTrends = response.progress.moodTrends || [];
      
      // Transform mood trends data for chart
      const chartData = moodTrends.map((item, index) => {
        const progress = parseFloat(item.avg_progress) || 0;
        return {
          day: `${t('emotionalProgress.day')} ${index + 1}`,
          date: item.date,
          emotionalScore: progress,
          therapySession: 'Yes', // All items in moodTrends are from completed sessions
          notes: `Progress: ${progress.toFixed(1)}`
        };
      });

      setProgressData(chartData);
      calculateTrend(chartData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setProgressData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (data) => {
    if (data.length < 2) {
      setTrend('stable');
      return;
    }

    const firstScore = data[0].emotionalScore;
    const lastScore = data[data.length - 1].emotionalScore;
    const difference = lastScore - firstScore;

    if (difference > 0.5) {
      setTrend('improving');
    } else if (difference < -0.5) {
      setTrend('declining');
    } else {
      setTrend('stable');
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            boxShadow: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {label} - {data.date}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('wellness.emotionalScore')}: {data.emotionalScore}/5
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('therapy.sessions')}: {data.therapySession}
          </Typography>
          {data.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('schedule.notes')}: {data.notes}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" />;
      case 'declining':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="info" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return 'success';
      case 'declining':
        return 'error';
      default:
        return 'info';
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving':
        return t('emotionalProgress.improving');
      case 'declining':
        return t('emotionalProgress.declining');
      default:
        return t('emotionalProgress.stable');
    }
  };

  if (loading) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3,
        height: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Card>
    );
  }

  if (progressData.length === 0) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3,
        height: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box textAlign="center">
          <Typography variant="h6" sx={{ 
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontWeight: 600,
            mb: 1
          }}>
            No Progress Data
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            opacity: 0.9
          }}>
            Complete therapy sessions to track your emotional progress.
          </Typography>
        </Box>
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ 
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontWeight: 600
          }}>
            {t('dashboard.patient.emotionalProgress')}
          </Typography>
          <Chip
            icon={getTrendIcon()}
            label={getTrendText()}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              fontWeight: 500
            }}
          />
        </Box>

        <Box sx={{ height: 300, mb: 2 }} key={`chart-container-${i18n.language}`}>
          <ResponsiveContainer width="100%" height="100%" key={`responsive-${i18n.language}`}>
            <LineChart data={progressData} key={`chart-${i18n.language}-${yAxisLabelText}`}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12, fill: '#ffffff' }}
                stroke="#ffffff"
                tickFormatter={(value) => {
                  // Extract day number from "Day X" format and translate
                  const dayNum = value.replace(/^[^\d]*(\d+)/, '$1');
                  return `${t('emotionalProgress.day')} ${dayNum}`;
                }}
              />
              <YAxis 
                domain={[0, 5]}
                tick={{ fontSize: 12, fill: '#ffffff' }}
                label={{
                  value: yAxisLabelText,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#ffffff' }
                }}
                stroke="#ffffff"
                key={`yaxis-${i18n.language}-${yAxisLabelText}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={2.5} stroke="#ff7300" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="emotionalScore"
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#8884d8', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Progress Summary */}
        <Grid container columnSpacing={2} rowSpacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600
              }}>
                {progressData.length}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9
              }}>
                {t('emotionalProgress.totalSessions')}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600
              }}>
                {progressData.length > 0 ? progressData[0].emotionalScore.toFixed(1) : '0'}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9
              }}>
                {t('emotionalProgress.initialScore')}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box textAlign="center">
              <Typography variant="h4" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600
              }}>
                {progressData.length > 0 ? progressData[progressData.length - 1].emotionalScore.toFixed(1) : '0'}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9
              }}>
                {t('emotionalProgress.latestScore')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EmotionalProgressGraph;

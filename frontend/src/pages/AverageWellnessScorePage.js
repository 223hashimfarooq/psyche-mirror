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
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Psychology,
  Assessment,
  Timeline,
  FilterList,
  Refresh,
  Download,
  Share,
  Person,
  CalendarToday,
  EmojiEmotions,
  Favorite,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AverageWellnessScorePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [wellnessData, setWellnessData] = useState([]);
  const [overallStats, setOverallStats] = useState({
    averageScore: 0,
    totalPatients: 0,
    improvedPatients: 0,
    stablePatients: 0,
    declinedPatients: 0,
    trendDirection: 'stable',
    trendPercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch live wellness data from API
  const fetchWellnessData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      // Fetch patients with their wellness scores
      const patientsResponse = await api.get('/users/patients');
      const patients = patientsResponse.data;
      
      // Fetch emotion analysis data for each patient
      const wellnessPromises = patients.map(async (patient) => {
        try {
          const emotionsResponse = await api.get(`/emotions/patient/${patient.id}?period=${selectedPeriod}`);
          const emotions = emotionsResponse.data;
          
          if (emotions.length === 0) {
            return {
              id: patient.id,
              patientName: patient.name,
              patientId: `P${patient.id.toString().padStart(3, '0')}`,
              currentScore: 0,
              previousScore: 0,
              trend: 'stable',
              trendPercentage: 0,
              lastAssessment: patient.created_at,
              totalSessions: 0,
              improvementAreas: [],
              concerns: ['No assessment data'],
              avatar: patient.name.charAt(0).toUpperCase() + (patient.name.split(' ')[1]?.charAt(0) || ''),
              email: patient.email,
              phone: patient.phone
            };
          }
          
          // Calculate current and previous scores
          const recentEmotions = emotions.slice(-10); // Last 10 sessions
          const olderEmotions = emotions.slice(-20, -10); // Previous 10 sessions
          
          const currentScore = recentEmotions.length > 0 
            ? recentEmotions.reduce((sum, emotion) => sum + (emotion.intensity || 5), 0) / recentEmotions.length
            : 0;
            
          const previousScore = olderEmotions.length > 0
            ? olderEmotions.reduce((sum, emotion) => sum + (emotion.intensity || 5), 0) / olderEmotions.length
            : currentScore;
          
          // Calculate trend
          const trendPercentage = previousScore > 0 
            ? ((currentScore - previousScore) / previousScore) * 100
            : 0;
            
          const trend = trendPercentage > 2 ? 'up' : trendPercentage < -2 ? 'down' : 'stable';
          
          // Determine improvement areas and concerns based on emotion types
          const emotionTypes = recentEmotions.map(e => e.emotion_type);
          const improvementAreas = [];
          const concerns = [];
          
          if (emotionTypes.includes('anxiety')) {
            improvementAreas.push('Anxiety Management');
            concerns.push('High Anxiety Levels');
          }
          if (emotionTypes.includes('depression')) {
            improvementAreas.push('Mood Regulation');
            concerns.push('Depression Symptoms');
          }
          if (emotionTypes.includes('stress')) {
            improvementAreas.push('Stress Management');
            concerns.push('High Stress Levels');
          }
          if (emotionTypes.includes('anger')) {
            improvementAreas.push('Anger Management');
            concerns.push('Anger Issues');
          }
          if (emotionTypes.includes('sadness')) {
            improvementAreas.push('Emotional Support');
            concerns.push('Sadness');
          }
          
          return {
            id: patient.id,
            patientName: patient.name,
            patientId: `P${patient.id.toString().padStart(3, '0')}`,
            currentScore: Math.round(currentScore * 10) / 10,
            previousScore: Math.round(previousScore * 10) / 10,
            trend,
            trendPercentage: Math.round(trendPercentage * 10) / 10,
            lastAssessment: emotions[emotions.length - 1]?.timestamp || patient.created_at,
            totalSessions: emotions.length,
            improvementAreas,
            concerns,
            avatar: patient.name.charAt(0).toUpperCase() + (patient.name.split(' ')[1]?.charAt(0) || ''),
            email: patient.email,
            phone: patient.phone
          };
        } catch (error) {
          console.error(`Error fetching emotions for patient ${patient.id}:`, error);
          return {
            id: patient.id,
            patientName: patient.name,
            patientId: `P${patient.id.toString().padStart(3, '0')}`,
            currentScore: 0,
            previousScore: 0,
            trend: 'stable',
            trendPercentage: 0,
            lastAssessment: patient.created_at,
            totalSessions: 0,
            improvementAreas: [],
            concerns: ['No assessment data'],
            avatar: patient.name.charAt(0).toUpperCase() + (patient.name.split(' ')[1]?.charAt(0) || ''),
            email: patient.email,
            phone: patient.phone
          };
        }
      });
      
      const wellnessResults = await Promise.all(wellnessPromises);
      setWellnessData(wellnessResults);
      
      // Calculate overall statistics
      const validScores = wellnessResults.filter(p => p.currentScore > 0);
      const averageScore = validScores.length > 0 
        ? validScores.reduce((sum, p) => sum + p.currentScore, 0) / validScores.length
        : 0;
        
      const improvedPatients = wellnessResults.filter(p => p.trend === 'up').length;
      const stablePatients = wellnessResults.filter(p => p.trend === 'stable').length;
      const declinedPatients = wellnessResults.filter(p => p.trend === 'down').length;
      
      // Calculate overall trend
      const overallTrendPercentage = validScores.length > 0
        ? validScores.reduce((sum, p) => sum + p.trendPercentage, 0) / validScores.length
        : 0;
        
      const trendDirection = overallTrendPercentage > 2 ? 'up' : overallTrendPercentage < -2 ? 'down' : 'stable';
      
      setOverallStats({
        averageScore: Math.round(averageScore * 10) / 10,
        totalPatients: patients.length,
        improvedPatients,
        stablePatients,
        declinedPatients,
        trendDirection,
        trendPercentage: Math.round(overallTrendPercentage * 10) / 10
      });
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching wellness data:', error);
      
      // Provide more specific error messages
      if (error.message === 'User not authenticated') {
        setError(t('wellness.errorNotAuthenticated'));
      } else if (error.response?.status === 403) {
        setError(t('wellness.errorAccessDenied'));
      } else if (error.response?.status === 404) {
        setError(t('wellness.errorNoPatients'));
      } else {
        setError(t('wellness.errorConnection'));
      }
      
      // Fallback to comprehensive mock data if API fails
      const mockWellnessData = [
        {
          id: 1,
          patientName: 'Sarah Johnson',
          patientId: 'P001',
          currentScore: 8.2,
          previousScore: 7.8,
          trend: 'up',
          trendPercentage: 5.1,
          lastAssessment: '2024-01-15',
          totalSessions: 12,
          improvementAreas: ['Anxiety Management', 'Sleep Quality'],
          concerns: ['Work Stress'],
          avatar: 'SJ',
          email: 'sarah.johnson@email.com',
          phone: '+1-555-0123'
        },
        {
          id: 2,
          patientName: 'Michael Chen',
          patientId: 'P002',
          currentScore: 6.5,
          previousScore: 6.9,
          trend: 'down',
          trendPercentage: -5.8,
          lastAssessment: '2024-01-14',
          totalSessions: 8,
          improvementAreas: ['Social Skills'],
          concerns: ['Depression', 'Isolation'],
          avatar: 'MC',
          email: 'michael.chen@email.com',
          phone: '+1-555-0124'
        },
        {
          id: 3,
          patientName: 'Emily Rodriguez',
          patientId: 'P003',
          currentScore: 9.1,
          previousScore: 8.7,
          trend: 'up',
          trendPercentage: 4.6,
          lastAssessment: '2024-01-16',
          totalSessions: 15,
          improvementAreas: ['Self-Esteem', 'Coping Strategies'],
          concerns: [],
          avatar: 'ER',
          email: 'emily.rodriguez@email.com',
          phone: '+1-555-0125'
        },
        {
          id: 4,
          patientName: 'David Thompson',
          patientId: 'P004',
          currentScore: 7.0,
          previousScore: 7.0,
          trend: 'stable',
          trendPercentage: 0,
          lastAssessment: '2024-01-13',
          totalSessions: 6,
          improvementAreas: ['Anger Management'],
          concerns: ['Relationship Issues'],
          avatar: 'DT',
          email: 'david.thompson@email.com',
          phone: '+1-555-0126'
        },
        {
          id: 5,
          patientName: 'Lisa Wang',
          patientId: 'P005',
          currentScore: 8.8,
          previousScore: 8.2,
          trend: 'up',
          trendPercentage: 7.3,
          lastAssessment: '2024-01-16',
          totalSessions: 20,
          improvementAreas: ['Trauma Recovery', 'Mindfulness'],
          concerns: [],
          avatar: 'LW',
          email: 'lisa.wang@email.com',
          phone: '+1-555-0127'
        }
      ];
      
      setWellnessData(mockWellnessData);
      setOverallStats({
        averageScore: 7.9,
        totalPatients: 5,
        improvedPatients: 3,
        stablePatients: 1,
        declinedPatients: 1,
        trendDirection: 'up',
        trendPercentage: 2.6
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWellnessData();
  }, [selectedPeriod]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWellnessData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const filteredData = wellnessData.filter(patient =>
    patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp sx={{ color: '#4CAF50' }} />;
      case 'down': return <TrendingDown sx={{ color: '#F44336' }} />;
      default: return <TrendingFlat sx={{ color: '#FF9800' }} />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    return '#F44336';
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setOpenDialog(true);
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        doctor: currentUser?.name,
        period: selectedPeriod,
        overallStats,
        patients: wellnessData.map(patient => ({
          name: patient.patientName,
          id: patient.patientId,
          currentScore: patient.currentScore,
          previousScore: patient.previousScore,
          trend: patient.trend,
          trendPercentage: patient.trendPercentage,
          lastAssessment: patient.lastAssessment,
          totalSessions: patient.totalSessions,
          improvementAreas: patient.improvementAreas,
          concerns: patient.concerns
        }))
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wellness-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const handleRefreshData = () => {
    fetchWellnessData();
  };

  // Chart data - dynamically generated from live data
  const generateTrendChartData = () => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyAverages = weeks.map((_, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (4 - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      // Calculate average score for this week
      const weekScores = wellnessData
        .filter(patient => {
          const lastAssessment = new Date(patient.lastAssessment);
          return lastAssessment >= weekStart && lastAssessment < weekEnd;
        })
        .map(patient => patient.currentScore)
        .filter(score => score > 0);
        
      return weekScores.length > 0 
        ? weekScores.reduce((sum, score) => sum + score, 0) / weekScores.length
        : overallStats.averageScore;
    });
    
    return {
      labels: weeks,
      datasets: [
        {
          label: 'Average Wellness Score',
          data: weeklyAverages,
          borderColor: '#ffffff',
          backgroundColor: alpha('#ffffff', 0.1),
          tension: 0.4,
        }
      ]
    };
  };

  const generateDistributionChartData = () => {
    const excellent = wellnessData.filter(p => p.currentScore >= 8).length;
    const good = wellnessData.filter(p => p.currentScore >= 6 && p.currentScore < 8).length;
    const needsAttention = wellnessData.filter(p => p.currentScore > 0 && p.currentScore < 6).length;
    
    return {
      labels: ['Excellent (8-10)', 'Good (6-8)', 'Needs Attention (0-6)'],
      datasets: [
        {
          data: [excellent, good, needsAttention],
          backgroundColor: [
            alpha('#4CAF50', 0.8),
            alpha('#FF9800', 0.8),
            alpha('#F44336', 0.8)
          ],
          borderColor: ['#4CAF50', '#FF9800', '#F44336'],
          borderWidth: 2,
        }
      ]
    };
  };

  const trendChartData = generateTrendChartData();
  const distributionChartData = generateDistributionChartData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: alpha('#ffffff', 0.1)
        }
      },
      x: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: alpha('#ffffff', 0.1)
        }
      }
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
          <IconButton onClick={() => navigate('/doctor/overview')} sx={{ mr: 2, color: '#ffffff' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            {t('wellness.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRefreshData}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
              mr: 2,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              },
            }}
          >
            {t('wellness.refresh')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportData}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              },
            }}
          >
            {t('wellness.download')}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              bgcolor: alpha('#F44336', 0.1),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '1px solid rgba(244,67,54,0.3)',
              backdropFilter: 'blur(10px)',
            }}
            onClose={() => setError(null)}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRefreshData}
                sx={{
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1),
                  },
                }}
              >
                {t('wellness.retry')}
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress sx={{ color: '#ffffff' }} />
            <Typography variant="h6" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {t('wellness.loading')}
            </Typography>
          </Box>
        )}

        {/* Last Updated Info */}
        {!loading && (
          <Box sx={{ 
            mb: 3, 
            textAlign: 'center',
            bgcolor: alpha('#ffffff', 0.1),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 2,
            py: 1,
            px: 2
          }}>
            <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
              {t('wellness.lastUpdated')}: {lastUpdated.toLocaleString()} • {t('wellness.autoRefresh')}
            </Typography>
          </Box>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && (
          <>
            {/* Overview Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card sx={{ 
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Assessment sx={{ fontSize: 40, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {overallStats.averageScore}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                    {t('wellness.averageScore')}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

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
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Person sx={{ fontSize: 40, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {overallStats.totalPatients}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                    {t('wellness.totalPatients')}
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
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: '#4CAF50', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {overallStats.improvedPatients}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                    {t('wellness.improvedPatients')}
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
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingDown sx={{ fontSize: 40, color: '#F44336', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#F44336', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {overallStats.declinedPatients}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                    {t('wellness.declinedPatients')}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
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
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('wellness.wellnessTrend')}
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line data={trendChartData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card sx={{ 
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('wellness.scoreDistribution')}
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Doughnut data={distributionChartData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card sx={{ 
            mb: 3,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder={t('wellness.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      '& .MuiInputLabel-root': {
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      },
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        bgcolor: alpha('#ffffff', 0.1),
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffffff',
                        },
                        '& input::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('wellness.timePeriod')}</InputLabel>
                    <Select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      label={t('wellness.timePeriod')}
                      sx={{
                        color: '#ffffff',
                        bgcolor: alpha('#ffffff', 0.1),
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#ffffff',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#ffffff',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: alpha('#ffffff', 0.9),
                            backdropFilter: 'blur(10px)',
                          },
                        },
                      }}
                    >
                      <MenuItem value="7">{t('wellness.last7Days')}</MenuItem>
                      <MenuItem value="30">{t('wellness.last30Days')}</MenuItem>
                      <MenuItem value="90">{t('wellness.last90Days')}</MenuItem>
                      <MenuItem value="365">{t('wellness.lastYear')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500, textAlign: 'center' }}>
                    {t('wellness.showingPatients', { count: filteredData.length })}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Wellness Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('wellness.patientWellnessScores')}
              </Typography>
              <TableContainer 
                component={Paper} 
                variant="outlined"
                sx={{
                  bgcolor: alpha('#ffffff', 0.1),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#ffffff', 0.05) }}>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('wellness.patient')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('wellness.currentScore')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('wellness.trend')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('wellness.lastAssessment')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('wellness.totalSessions')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((patient) => (
                      <TableRow 
                        key={patient.id} 
                        hover
                        sx={{ 
                          '&:hover': {
                            bgcolor: alpha('#ffffff', 0.05),
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: alpha(theme.palette.primary.main, 0.2), border: `1px solid ${alpha('#ffffff', 0.3)}` }}>
                              {patient.avatar}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                {patient.patientName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                {patient.patientId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: getScoreColor(patient.currentScore), textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mr: 1 }}>
                              {patient.currentScore}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={(patient.currentScore / 10) * 100}
                              sx={{
                                width: 60,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha('#ffffff', 0.2),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getScoreColor(patient.currentScore),
                                },
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTrendIcon(patient.trend)}
                            <Typography variant="body2" sx={{ ml: 1, color: getTrendColor(patient.trend), textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                              {patient.trendPercentage > 0 ? '+' : ''}{patient.trendPercentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          {new Date(patient.lastAssessment).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          {patient.totalSessions}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewDetails(patient)}
                            sx={{
                              color: '#ffffff',
                              borderColor: 'rgba(255,255,255,0.3)',
                              '&:hover': {
                                bgcolor: alpha('#ffffff', 0.1),
                                borderColor: 'rgba(255,255,255,0.5)',
                              },
                            }}
                          >
                            {t('wellness.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
          </>
        )}
      </Container>

      {/* Patient Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {selectedPatient?.patientName} - {t('wellness.patientDetails')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                <Share />
              </IconButton>
              <IconButton sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                <Download />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.1),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    mb: 2,
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {t('wellness.currentScore')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: getScoreColor(selectedPatient.currentScore), textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mr: 2 }}>
                          {selectedPatient.currentScore}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(selectedPatient.currentScore / 10) * 100}
                            sx={{
                              height: 12,
                              borderRadius: 6,
                              bgcolor: alpha('#ffffff', 0.2),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getScoreColor(selectedPatient.currentScore),
                              },
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        {t('wellness.previousScore')}: {selectedPatient.previousScore}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.1),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    mb: 2,
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {t('wellness.improvementAreas')}
                      </Typography>
                      <List>
                        {selectedPatient.improvementAreas.map((area, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircle sx={{ color: '#4CAF50', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={
                                <Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                  {area}
                                </Typography>
                              } 
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.1),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {t('wellness.concerns')}
                      </Typography>
                      {selectedPatient.concerns.length > 0 ? (
                        <List>
                          {selectedPatient.concerns.map((concern, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Warning sx={{ color: '#F44336', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                    {concern}
                                  </Typography>
                                } 
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          {t('wellness.noConcerns')}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
                border: '1px solid rgba(255,255,255,0.5)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              },
            }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AverageWellnessScorePage;

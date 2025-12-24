import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  Psychology,
  CalendarToday,
  Assessment,
  TrendingUp,
  TrendingDown,
  EmojiEmotions,
  LocalHospital,
  Timeline,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const PatientDetailsView = ({ patientId, relationshipId }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [languageKey, setLanguageKey] = useState(i18n.language);

  // Custom Tooltip for Pie Chart to translate emotion names
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const emotionName = data.name;
      const translatedName = t(`emotions.${emotionName}`, { defaultValue: emotionName.charAt(0).toUpperCase() + emotionName.slice(1) });
      return (
        <Box
          sx={{
            bgcolor: alpha('#000000', 0.8),
            p: 1.5,
            borderRadius: 1,
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {translatedName}
          </Typography>
          <Typography variant="body2">
            {data.value} ({((data.payload.percent || 0) * 100).toFixed(0)}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };


  useEffect(() => {
    const handleLanguageChange = (lng) => {
      console.log('PatientDetailsView: Language changed to', lng);
      setLanguageKey(lng);
    };
    i18n.on('languageChanged', handleLanguageChange);
    // Also update immediately if language is already different
    if (i18n.language !== languageKey) {
      setLanguageKey(i18n.language);
    }
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, languageKey]);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId, i18n.language]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/doctors/my/patients/${patientId}/details`);
      console.log('📥 Patient Details API Response:', response);
      if (response.success) {
        console.log('✅ Patient data received:', {
          emotionsCount: response.emotions?.length || 0,
          statistics: response.statistics,
          hasEmotionDistribution: !!response.statistics?.emotionDistribution
        });
        setPatientData(response);
      } else {
        console.error('❌ Failed to fetch patient details:', response.error || response.message);
        setPatientData(null);
      }
    } catch (error) {
      console.error('❌ Error fetching patient details:', error);
      setPatientData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  if (!patientData) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <CardContent>
          <Typography sx={{ color: '#ffffff', textAlign: 'center' }}>
            {t('profile.noPatientData')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

    const { patient, emotions, therapySessions, scheduledSessions, assessments, multimodalAnalysis, statistics } = patientData;

    if (!patient || !statistics) {
      return (
        <Card sx={{ 
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <CardContent>
            <Typography sx={{ color: '#ffffff', textAlign: 'center' }}>
              {t('profile.loadingPatientData')}
            </Typography>
          </CardContent>
        </Card>
      );
    }

    // Prepare chart data
    console.log('📊 Patient Details - Raw emotions data:', emotions);
    console.log('📊 Patient Details - Statistics:', statistics);
    console.log('📊 Patient Details - Emotions array length:', emotions?.length || 0);
    
    // Process emotion chart data - show all emotions, even with zero scores
    const emotionChartData = (emotions || [])
      .filter(e => e && e.created_at) // Filter out invalid entries
      .slice(0, 20)
      .reverse()
      .map((e, idx) => {
        // Try multiple score fields
        const score = parseFloat(e.combined_score) || 
                     parseFloat(e.confidence) || 
                     (e.facial_data && parseFloat(e.facial_data.confidence)) ||
                     (e.voice_data && parseFloat(e.voice_data.confidence)) ||
                     (e.text_data && parseFloat(e.text_data.confidence)) ||
                     50; // Default to 50 if no score available
        
        return {
          date: new Date(e.created_at).toLocaleDateString(),
          score: isNaN(score) ? 50 : score,
          emotion: e.emotion_value || e.emotion_type || 'neutral',
          index: idx + 1
        };
      });

    console.log('📊 Processed emotionChartData:', emotionChartData);
    console.log('📊 emotionChartData length:', emotionChartData.length);

    // Process emotion distribution - use statistics if available, otherwise calculate from emotions
    let emotionDistribution = statistics?.emotionDistribution || {};
    
    // If statistics don't have distribution, calculate it from emotions array
    if (Object.keys(emotionDistribution).length === 0 && emotions && emotions.length > 0) {
      console.log('⚠️ No emotionDistribution in statistics, calculating from emotions array...');
      emotionDistribution = {};
      emotions.forEach(e => {
        const emotion = e.emotion_value || e.emotion_type || 'unknown';
        emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
      });
      console.log('📊 Calculated emotionDistribution:', emotionDistribution);
    }

    const emotionDistributionData = Object.entries(emotionDistribution)
      .map(([emotion, count]) => ({
        name: emotion,
        value: parseInt(count) || 0
      }))
      .filter(item => item.value > 0);

    console.log('📊 Processed emotionDistributionData:', emotionDistributionData);
    console.log('📊 emotionDistributionData length:', emotionDistributionData.length);

    const sessionProgressData = (therapySessions || []).slice(0, 10).reverse().map((s, idx) => ({
    session: `Session ${idx + 1}`,
    progress: s.progress || 0,
    completed: s.completed ? 1 : 0
  }));

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', p: 0 }} key={`patient-details-${languageKey}`}>
      {/* Patient Header */}
      <Card sx={{ 
        mb: 3,
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }} key={`patient-card-${languageKey}`}>
        <CardContent>
          <Grid container spacing={3} alignItems="center" key={`patient-header-${languageKey}`}>
            <Grid item>
              <Avatar 
                src={patient.profile_picture && patient.profile_picture !== 'undefined' ? patient.profile_picture : null}
                sx={{ width: 80, height: 80, bgcolor: alpha('#ffffff', 0.2) }}
              >
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600, mb: 1 }} key={`patient-name-${languageKey}`}>
                {patient.name || patient.patient_name || t('wellness.unknownPatient')}
              </Typography>
              <Grid container spacing={2} key={`patient-info-${languageKey}`}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`email-${languageKey}`}>
                    <strong key={`email-strong-${languageKey}`}>{t('register.email')}:</strong> {patient.email || patient.patient_email || t('common.notAvailable')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`phone-${languageKey}`}>
                    <strong key={`phone-strong-${languageKey}`}>{t('register.phoneNumber')}:</strong> {patient.phone || patient.patient_phone || t('common.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`lastActive-${languageKey}`}>
                    <strong key={`lastActive-strong-${languageKey}`}>
                      {t('wellness.lastActive')}:
                    </strong> {patient.last_active ? new Date(patient.last_active).toLocaleString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE') : t('common.notAvailable')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`lastMood-${languageKey}`}>
                    <strong key={`lastMood-strong-${languageKey}`}>
                      {t('wellness.lastMood')}:
                    </strong> {patient.last_mood ? t(`emotions.${patient.last_mood}`, { defaultValue: patient.last_mood }) : t('common.notAvailable')}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }} key={`stats-${languageKey}`}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
                {statistics.totalEmotions || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`totalEmotions-${languageKey}`}>
                {t('wellness.totalEmotions')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
                {statistics.completedSessions || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`completedSessions-${languageKey}`}>
                {t('dashboard.patient.completedSessions')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
                {statistics.avgConfidence || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`avgConfidence-${languageKey}`}>
                {t('wellness.avgConfidence')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
                {(scheduledSessions || []).length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }} key={`scheduledSessions-${languageKey}`}>
                {t('wellness.scheduledSessions')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ 
        mb: 2,
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        width: '100%',
        maxWidth: '100%',
        mx: 0,
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            key={`tabs-${languageKey}`}
            sx={{ 
              '& .MuiTab-root': { 
                color: '#ffffff',
                '&.Mui-selected': { 
                  color: '#ffffff',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }
            }}
          >
            <Tab label={t('wellness.chartsAnalytics')} icon={<Timeline />} iconPosition="start" key={`tab-charts-${languageKey}`} />
            <Tab label={t('wellness.emotionsHistory')} icon={<EmojiEmotions />} iconPosition="start" key={`tab-emotions-${languageKey}`} />
            <Tab label={t('wellness.therapySessions')} icon={<Psychology />} iconPosition="start" key={`tab-therapy-${languageKey}`} />
            <Tab label={t('wellness.profileMedical')} icon={<Person />} iconPosition="start" key={`tab-profile-${languageKey}`} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 2, width: '100%', '&:last-child': { pb: 2 } }}>
          {/* Charts Tab */}
          {activeTab === 0 && (
            <Grid container spacing={2} sx={{ width: '100%', margin: 0 }}>
              {/* Emotional Progress Chart */}
              <Grid item xs={12} sx={{ width: '100%', padding: '0 !important' }}>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.1),
                  border: '1px solid rgba(255,255,255,0.2)',
                  width: '100%',
                  maxWidth: '100%',
                  mx: 0,
                }}>
                  <CardContent sx={{ p: 2, width: '100%', '&:last-child': { pb: 2 } }}>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                      {t('wellness.emotionalProgressOverTime')}
                    </Typography>
                    <Box sx={{ height: 450, width: '100%', minWidth: 0 }} key={`chart-container-${languageKey}`}>
                      {emotionChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            key={`line-chart-${languageKey}`}
                            data={emotionChartData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 80 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#ffffff', fontSize: 11 }}
                            stroke="#ffffff"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                            <YAxis 
                              tick={{ fill: '#ffffff', fontSize: 13 }}
                              stroke="#ffffff"
                              width={60}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: alpha('#000000', 0.8),
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#ffffff'
                              }}
                            />
                            <Legend wrapperStyle={{ color: '#ffffff' }} />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              dot={{ fill: '#8884d8', r: 4 }}
                              name={t('wellness.emotionalScore')}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography sx={{ color: '#ffffff', opacity: 0.7 }}>
                            {t('wellness.noEmotionalData')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Emotion Distribution Pie Chart */}
              <Grid item xs={12} md={12} sx={{ width: '100%', padding: '0 !important' }}>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.1),
                  border: '1px solid rgba(255,255,255,0.2)',
                  width: '100%',
                  maxWidth: '100%',
                  mx: 0,
                }}>
                  <CardContent sx={{ p: 2, width: '100%', '&:last-child': { pb: 2 } }}>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                      {t('wellness.emotionDistribution')}
                    </Typography>
                    <Box sx={{ height: 450, width: '100%', minWidth: 0, display: 'flex', justifyContent: 'center' }} key={`pie-chart-container-${languageKey}`}>
                      {emotionDistributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart key={`pie-chart-${languageKey}`}>
                            <Pie
                              key={`pie-${i18n.language}`}
                              data={emotionDistributionData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => {
                                const translatedName = t(`emotions.${name}`, { defaultValue: name.charAt(0).toUpperCase() + name.slice(1) });
                                return `${translatedName}: ${(percent * 100).toFixed(0)}%`;
                              }}
                              outerRadius={160}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {emotionDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography sx={{ color: '#ffffff', opacity: 0.7 }}>
                            {t('wellness.noEmotionDistributionData')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Session Progress Chart */}
              {sessionProgressData.length > 0 && (
                <Grid item xs={12} sx={{ width: '100%', padding: '0 !important' }}>
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.1),
                    border: '1px solid rgba(255,255,255,0.2)',
                    width: '100%',
                    maxWidth: '100%',
                    mx: 0,
                  }}>
                    <CardContent sx={{ p: 2, width: '100%', '&:last-child': { pb: 2 } }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                        {t('wellness.therapySessionProgress')}
                      </Typography>
                      <Box sx={{ height: 450, width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={sessionProgressData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                            <XAxis 
                              dataKey="session" 
                              tick={{ fill: '#ffffff', fontSize: 13 }}
                              stroke="#ffffff"
                              interval={0}
                            />
                            <YAxis 
                              tick={{ fill: '#ffffff', fontSize: 13 }}
                              stroke="#ffffff"
                              domain={[0, 100]}
                              width={60}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: alpha('#000000', 0.8),
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#ffffff'
                              }}
                            />
                            <Legend wrapperStyle={{ color: '#ffffff' }} />
                            <Bar dataKey="progress" fill="#82ca9d" name={t('wellness.progressPercent')} />
                            <Bar dataKey="completed" fill="#8884d8" name={t('schedule.completed')} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* Emotions History Tab */}
          {activeTab === 1 && (
            <TableContainer component={Paper} sx={{ 
              bgcolor: alpha('#ffffff', 0.1),
              maxHeight: 500
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.date')}</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.emotion')}</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.type')}</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.confidence')}</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.score')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(emotions || []).slice(0, 20).map((emotion) => (
                    <TableRow key={emotion.id}>
                      <TableCell sx={{ color: '#ffffff' }}>
                        {new Date(emotion.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        <Chip 
                          label={emotion.emotion_value || 'N/A'} 
                          size="small"
                          sx={{ bgcolor: alpha('#ffffff', 0.2), color: '#ffffff' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>{emotion.emotion_type}</TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        {(parseFloat(emotion.confidence) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        {parseFloat(emotion.combined_score || emotion.confidence || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Therapy Sessions Tab */}
          {activeTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                  {t('wellness.therapyActivities')}
                </Typography>
                <TableContainer component={Paper} sx={{ 
                  bgcolor: alpha('#ffffff', 0.1),
                  maxHeight: 400
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.activity')}</TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.progress')}</TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.status')}</TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.date')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(therapySessions || []).slice(0, 10).map((session) => (
                        <TableRow key={session.id}>
                          <TableCell sx={{ color: '#ffffff' }}>{session.activity_name}</TableCell>
                          <TableCell sx={{ color: '#ffffff' }}>{session.progress || 0}%</TableCell>
                          <TableCell sx={{ color: '#ffffff' }}>
                            <Chip 
                              label={session.completed ? t('schedule.completed') : t('wellness.inProgress')} 
                              size="small"
                              sx={{ 
                                bgcolor: session.completed 
                                  ? alpha('#4CAF50', 0.3) 
                                  : alpha('#ff9800', 0.3),
                                color: '#ffffff'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#ffffff' }}>
                            {new Date(session.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                  {t('wellness.scheduledSessions')}
                </Typography>
                <TableContainer component={Paper} sx={{ 
                  bgcolor: alpha('#ffffff', 0.1),
                  maxHeight: 400
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.date')}</TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.time')}</TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.type')}</TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{t('wellness.status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(scheduledSessions || []).map((session) => (
                        <TableRow key={session.id}>
                          <TableCell sx={{ color: '#ffffff' }}>
                            {new Date(session.session_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ color: '#ffffff' }}>{session.session_time}</TableCell>
                          <TableCell sx={{ color: '#ffffff' }}>{session.session_type}</TableCell>
                          <TableCell sx={{ color: '#ffffff' }}>
                            <Chip 
                              label={session.status} 
                              size="small"
                              sx={{ 
                                bgcolor: alpha('#ffffff', 0.2),
                                color: '#ffffff'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}

          {/* Profile & Medical Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.1),
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                      Personal Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        <strong>{t('profile.dateOfBirth')}:</strong> {patient.date_of_birth ? (() => {
                          try {
                            const date = new Date(patient.date_of_birth);
                            if (isNaN(date.getTime())) return patient.date_of_birth;
                            return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
                          } catch (error) {
                            return patient.date_of_birth;
                          }
                        })() : t('common.notAvailable')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        <strong>{t('profile.gender')}:</strong> {patient.gender || t('common.notAvailable')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        <strong>{t('profile.address')}:</strong> {patient.address || t('common.notAvailable')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        <strong>{t('profile.emergencyContact')}:</strong> {patient.emergency_contact || t('common.notAvailable')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        <strong>{t('profile.memberSince')}:</strong> {patient.created_at ? (() => {
                          try {
                            const date = new Date(patient.created_at);
                            if (isNaN(date.getTime())) return patient.created_at;
                            return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
                          } catch (error) {
                            return patient.created_at;
                          }
                        })() : t('common.notAvailable')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.1),
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                      {t('profile.medicalHistory')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff', whiteSpace: 'pre-wrap' }}>
                      {patient.medical_history || t('profile.noMedicalHistory')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {(assessments || []).length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.1),
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                        Therapy Assessments
                      </Typography>
                      {(assessments || []).map((assessment) => (
                        <Card key={assessment.id} sx={{ 
                          mb: 2,
                          bgcolor: alpha('#ffffff', 0.05),
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 1 }}>
                              {t('wellness.assessmentDate')}: {new Date(assessment.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE')}
                            </Typography>
                            {assessment.disorderDetected && (
                              <Chip 
                                label={`${t('wellness.disorder')}: ${JSON.parse(assessment.disorderDetected).disorder || t('common.notAvailable')}`}
                                sx={{ bgcolor: alpha('#f44336', 0.3), color: '#ffffff', mb: 1 }}
                              />
                            )}
                            {assessment.therapyPlan && (
                              <Typography variant="body2" sx={{ color: '#ffffff', mt: 1 }}>
                                <strong>Therapy Plan:</strong> {JSON.parse(assessment.therapyPlan).plan || 'N/A'}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PatientDetailsView;


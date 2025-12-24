import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const TherapyTrackingChart = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const [therapyData, setTherapyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#5B8DEF', '#2ED47A', '#F7B500', '#F7685B', '#885AF8'];

  useEffect(() => {
    fetchTherapyData();
  }, []);

  const fetchTherapyData = async () => {
    try {
      // Use the correct endpoint that exists in the backend
      const response = await api.request('/therapy/tracking');
      
      // The API returns tracking data, not therapies array
      // Create mock pie chart data based on tracking info
      const tracking = response.tracking;
      
      const chartData = [
        {
          name: 'completedSessions',
          value: tracking.totalSessions || 0,
          status: 'completed',
          sessions: tracking.totalSessions || 0
        },
        {
          name: 'sessionsToday',
          value: tracking.sessionsToday || 0,
          status: 'active',
          sessions: tracking.sessionsToday || 0
        },
        {
          name: 'planProgress',
          value: tracking.planProgress || 0,
          status: 'active',
          sessions: Math.floor((tracking.planProgress || 0) / 10)
        }
      ].filter(item => item.value > 0); // Only show items with data
      
      setTherapyData(chartData);
    } catch (error) {
      console.error('Error fetching therapy data:', error);
      setTherapyData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const nameMap = {
        'completedSessions': t('dashboard.patient.completedSessions'),
        'sessionsToday': t('dashboard.patient.sessionsToday'),
        'planProgress': t('dashboard.patient.planProgress')
      };
      const translatedName = nameMap[data.name] || data.name;
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
            {translatedName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.patient.progress')}: {data.value}%
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" component="span">
              {t('schedule.status')}:
            </Typography>
            <Chip 
              label={data.status === 'active' ? t('schedule.scheduled') : t('schedule.completed')} 
              size="small" 
              color={data.status === 'active' ? 'success' : 'default'}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('therapy.sessions')}: {data.sessions}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3,
        height: 420,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Card>
    );
  }

  if (therapyData.length === 0) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3,
        height: 420,
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
            {t('dashboard.patient.noTherapyData')}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            opacity: 0.9
          }}>
            {t('dashboard.patient.startFirstTherapy')}
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
        <Typography variant="h5" sx={{ 
          mb: 2,
          color: '#ffffff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          fontWeight: 600
        }}>
          {t('dashboard.patient.therapyTrackingTitle')}
        </Typography>
        
        <Box sx={{ height: { xs: 340, sm: 380, md: 400 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={therapyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {therapyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                wrapperStyle={{ color: '#fff' }}
                formatter={(value) => {
                  const keyMap = {
                    'completedSessions': t('dashboard.patient.completedSessions'),
                    'sessionsToday': t('dashboard.patient.sessionsToday'),
                    'planProgress': t('dashboard.patient.planProgress')
                  };
                  return keyMap[value] || value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Therapy Summary */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ 
            mb: 1,
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontWeight: 600
          }}>
            {t('dashboard.patient.activeTherapies')}:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {therapyData
              .filter(therapy => therapy.status === 'active')
              .map((therapy, index) => {
                const nameMap = {
                  'completedSessions': t('dashboard.patient.completedSessions'),
                  'sessionsToday': t('dashboard.patient.sessionsToday'),
                  'planProgress': t('dashboard.patient.planProgress')
                };
                const translatedName = nameMap[therapy.name] || therapy.name;
                return (
                  <Chip
                    key={index}
                    label={`${translatedName} (${therapy.value}%)`}
                    sx={{
                      bgcolor: alpha('#ffffff', 0.2),
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontWeight: 500
                    }}
                    size="small"
                  />
                );
              })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TherapyTrackingChart;

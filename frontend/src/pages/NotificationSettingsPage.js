import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Notifications,
  Save,
  Email,
  Sms,
  PhoneAndroid,
  NotificationsActive
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const NotificationSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [preferences, setPreferences] = useState({
    enable_emotion_alerts: true,
    enable_scheduled_reminders: true,
    enable_motivational_messages: true,
    enable_self_care_reminders: true,
    enable_emergency_alerts: true,
    preferred_channels: ['in_app'],
    frequency: 'instant',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    language: i18n.language
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/preferences');
      // API service returns data directly, not wrapped in response.data
      if (response && response.success) {
        setPreferences({
          ...response.preferences,
          preferred_channels: typeof response.preferences.preferred_channels === 'string' 
            ? JSON.parse(response.preferences.preferred_channels) 
            : response.preferences.preferred_channels || ['in_app']
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: t('notifications.preferences.preferencesSaveFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field) => (event) => {
    setPreferences({
      ...preferences,
      [field]: event.target.checked
    });
  };

  const handleChannelToggle = (channel) => {
    const channels = preferences.preferred_channels || [];
    const newChannels = channels.includes(channel)
      ? channels.filter(c => c !== channel)
      : [...channels, channel];
    setPreferences({
      ...preferences,
      preferred_channels: newChannels
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null); // Clear previous messages
      
      // Ensure preferred_channels is properly formatted
      const preferencesToSend = {
        ...preferences,
        preferred_channels: Array.isArray(preferences.preferred_channels) 
          ? preferences.preferred_channels 
          : ['in_app']
      };
      
      const response = await api.post('/notifications/preferences/update', preferencesToSend);
      // API service returns data directly, not wrapped in response.data
      if (response && response.success) {
        setMessage({ type: 'success', text: t('notifications.preferences.preferencesSaved') });
        // Update local preferences with response
        if (response.preferences) {
          setPreferences({
            ...response.preferences,
            preferred_channels: typeof response.preferences.preferred_channels === 'string' 
              ? JSON.parse(response.preferences.preferred_channels) 
              : response.preferences.preferred_channels || ['in_app']
          });
        }
      } else {
        setMessage({ type: 'error', text: t('notifications.preferences.preferencesSaveFailed') });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      const errorMessage = error.response?.data?.message || error.message || t('notifications.preferences.preferencesSaveFailed');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const channels = [
    { key: 'in_app', label: t('notifications.preferences.inApp'), icon: <NotificationsActive /> },
    { key: 'email', label: t('notifications.preferences.email'), icon: <Email /> },
    { key: 'sms', label: t('notifications.preferences.sms'), icon: <Sms /> },
    { key: 'push', label: t('notifications.preferences.push'), icon: <PhoneAndroid /> }
  ];

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
      <Container maxWidth="md" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        <Card sx={{ 
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderRadius: 3
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={4}>
              <Notifications sx={{ color: '#ffffff', fontSize: 40 }} />
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
                {t('notifications.preferences.title')}
              </Typography>
            </Box>

            {message && (
              <Alert severity={message.type} sx={{ mb: 3, bgcolor: alpha('#ffffff', 0.1) }}>
                {message.text}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Notification Types */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                  {t('notifications.preferences.title')}
                </Typography>
                <Box sx={{ bgcolor: alpha('#ffffff', 0.1), p: 2, borderRadius: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.enable_emotion_alerts}
                        onChange={handleToggle('enable_emotion_alerts')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ffffff',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ffffff',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {t('notifications.preferences.emotionAlerts')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {t('notifications.preferences.emotionAlertsDesc')}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ bgcolor: alpha('#ffffff', 0.1), p: 2, borderRadius: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.enable_scheduled_reminders}
                        onChange={handleToggle('enable_scheduled_reminders')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ffffff',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ffffff',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {t('notifications.preferences.scheduledReminders')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {t('notifications.preferences.scheduledRemindersDesc')}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ bgcolor: alpha('#ffffff', 0.1), p: 2, borderRadius: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.enable_motivational_messages}
                        onChange={handleToggle('enable_motivational_messages')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ffffff',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ffffff',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {t('notifications.preferences.motivationalMessages')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {t('notifications.preferences.motivationalMessagesDesc')}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ bgcolor: alpha('#ffffff', 0.1), p: 2, borderRadius: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.enable_self_care_reminders}
                        onChange={handleToggle('enable_self_care_reminders')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ffffff',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ffffff',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {t('notifications.preferences.selfCareReminders')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {t('notifications.preferences.selfCareRemindersDesc')}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ bgcolor: alpha('#ffffff', 0.1), p: 2, borderRadius: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.enable_emergency_alerts}
                        onChange={handleToggle('enable_emergency_alerts')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ffffff',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ffffff',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {t('notifications.preferences.emergencyAlerts')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {t('notifications.preferences.emergencyAlertsDesc')}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 2 }} />
              </Grid>

              {/* Notification Channels */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                  {t('notifications.preferences.channels')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                  {t('notifications.preferences.channelsDesc')}
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {channels.map((channel) => (
                    <Chip
                      key={channel.key}
                      icon={channel.icon}
                      label={channel.label}
                      onClick={() => handleChannelToggle(channel.key)}
                      sx={{
                        bgcolor: preferences.preferred_channels.includes(channel.key)
                          ? alpha('#ffffff', 0.3)
                          : alpha('#ffffff', 0.1),
                        color: '#ffffff',
                        border: `1px solid ${preferences.preferred_channels.includes(channel.key) ? '#ffffff' : 'rgba(255,255,255,0.3)'}`,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha('#ffffff', 0.2),
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Frequency */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#ffffff' }}>
                    {t('notifications.preferences.frequency')}
                  </InputLabel>
                  <Select
                    value={preferences.frequency}
                    onChange={(e) => setPreferences({ ...preferences, frequency: e.target.value })}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ffffff',
                      },
                    }}
                  >
                    <MenuItem value="instant">{t('notifications.preferences.instant')}</MenuItem>
                    <MenuItem value="hourly">{t('notifications.preferences.hourly')}</MenuItem>
                    <MenuItem value="daily">{t('notifications.preferences.daily')}</MenuItem>
                    <MenuItem value="weekly">{t('notifications.preferences.weekly')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Quiet Hours */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#ffffff', mb: 1 }}>
                  {t('notifications.preferences.quietHours')}
                </Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    type="time"
                    label={t('notifications.preferences.startTime')}
                    value={preferences.quiet_hours_start}
                    onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                    InputLabelProps={{ sx: { color: '#ffffff' } }}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffffff',
                        },
                      },
                    }}
                  />
                  <TextField
                    type="time"
                    label={t('notifications.preferences.endTime')}
                    value={preferences.quiet_hours_end}
                    onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                    InputLabelProps={{ sx: { color: '#ffffff' } }}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ffffff',
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.5,
                    bgcolor: theme.palette.primary.main,
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }}
                >
                  {saving ? t('common.loading') : t('notifications.preferences.savePreferences')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default NotificationSettingsPage;


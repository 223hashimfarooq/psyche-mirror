import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  Schedule,
  AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ScheduledNotificationsPage = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'self_care',
    frequency: 'daily',
    time: '09:00',
    scheduledTime: '',
    daysOfWeek: [],
  });

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/schedule');
      // API service returns data directly, not wrapped in response.data
      if (response && response.success) {
        setScheduled(response.scheduled || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      setMessage({ type: 'error', text: t('notifications.scheduled.fetchError') });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      title: '',
      message: '',
      type: 'self_care',
      frequency: 'daily',
      time: '09:00',
      scheduledTime: '',
      daysOfWeek: [],
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      title: '',
      message: '',
      type: 'self_care',
      frequency: 'daily',
      time: '09:00',
      scheduledTime: '',
      daysOfWeek: [],
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.message) {
        setMessage({ type: 'error', text: t('notifications.scheduled.validationError') });
        return;
      }

      const notificationData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        channel: 'in_app',
        severity: 'low',
      };

      let schedule;
      if (formData.frequency === 'onetime') {
        if (!formData.scheduledTime) {
          setMessage({ type: 'error', text: t('notifications.scheduled.timeRequired') });
          return;
        }
        schedule = {
          frequency: 'onetime',
          scheduledTime: formData.scheduledTime,
        };
      } else {
        schedule = {
          frequency: formData.frequency,
          time: formData.time,
          daysOfWeek: formData.daysOfWeek,
        };
      }

      await api.post('/notifications/schedule', {
        notificationData,
        schedule,
      });

      setMessage({ type: 'success', text: t('notifications.scheduled.addSuccess') });
      handleCloseDialog();
      fetchScheduled();
    } catch (error) {
      console.error('Error scheduling notification:', error);
      setMessage({ type: 'error', text: t('notifications.scheduled.saveError') });
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm(t('notifications.scheduled.deleteConfirm'))) {
      return;
    }

    try {
      await api.delete(`/notifications/schedule/${jobId}`);
      setMessage({ type: 'success', text: t('notifications.scheduled.deleteSuccess') });
      fetchScheduled();
    } catch (error) {
      console.error('Error deleting scheduled notification:', error);
      setMessage({ type: 'error', text: t('notifications.scheduled.deleteError') });
    }
  };

  const formatNextRun = (nextRunAt) => {
    if (!nextRunAt) return t('notifications.scheduled.notScheduled');
    const date = new Date(nextRunAt);
    return date.toLocaleString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE');
  };

  const notificationTypes = [
    { value: 'self_care', label: t('notifications.scheduled.types.selfCare') },
    { value: 'scheduled_reminder', label: t('notifications.scheduled.types.reminder') },
    { value: 'motivation', label: t('notifications.scheduled.types.motivation') },
  ];

  const frequencies = [
    { value: 'onetime', label: t('notifications.scheduled.frequencies.onetime') },
    { value: 'daily', label: t('notifications.scheduled.frequencies.daily') },
    { value: 'weekly', label: t('notifications.scheduled.frequencies.weekly') },
  ];

  const daysOfWeekOptions = [
    { value: 0, label: t('notifications.scheduled.days.sunday') },
    { value: 1, label: t('notifications.scheduled.days.monday') },
    { value: 2, label: t('notifications.scheduled.days.tuesday') },
    { value: 3, label: t('notifications.scheduled.days.wednesday') },
    { value: 4, label: t('notifications.scheduled.days.thursday') },
    { value: 5, label: t('notifications.scheduled.days.friday') },
    { value: 6, label: t('notifications.scheduled.days.saturday') },
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
      <AppBar
        position="sticky"
        sx={{
          bgcolor: alpha('#ffffff', 0.1),
          backdropFilter: 'blur(20px)',
          boxShadow: 'none',
          zIndex: 10,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#ffffff' }}>
            {t('notifications.scheduled.title')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{
              bgcolor: '#ffffff',
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.9),
              }
            }}
          >
            {t('notifications.scheduled.addSchedule')}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3, bgcolor: alpha('#ffffff', 0.1) }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <Card sx={{ 
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
              {t('notifications.scheduled.description')}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#ffffff' }} />
              </Box>
            ) : scheduled.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Schedule sx={{ fontSize: 64, color: 'rgba(255,255,255,0.5)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                  {t('notifications.scheduled.noScheduled')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  {t('notifications.scheduled.addFirstSchedule')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenDialog}
                  sx={{
                    bgcolor: '#ffffff',
                    color: theme.palette.primary.main,
                  }}
                >
                  {t('notifications.scheduled.addSchedule')}
                </Button>
              </Box>
            ) : (
              <List>
                {scheduled.map((item, index) => {
                  const notificationData = typeof item.notification_data === 'string' 
                    ? JSON.parse(item.notification_data) 
                    : item.notification_data;
                  const scheduleConfig = typeof item.schedule_config === 'string'
                    ? JSON.parse(item.schedule_config)
                    : item.schedule_config;

                  return (
                    <React.Fragment key={item.id}>
                      <ListItem
                        sx={{
                          bgcolor: alpha('#ffffff', 0.1),
                          borderRadius: 2,
                          mb: 1.5,
                          py: 2,
                          px: 2,
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                              {notificationData.title}
                            </Typography>
                            <Chip
                              label={notificationTypes.find(t => t.value === notificationData.type)?.label || notificationData.type}
                              size="small"
                              sx={{
                                bgcolor: alpha('#ffffff', 0.2),
                                color: '#ffffff',
                              }}
                            />
                            <Chip
                              label={frequencies.find(f => f.value === scheduleConfig.frequency)?.label || scheduleConfig.frequency}
                              size="small"
                              sx={{
                                bgcolor: alpha('#ffffff', 0.2),
                                color: '#ffffff',
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                            {notificationData.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {t('notifications.scheduled.nextRun')}: {formatNextRun(item.next_run_at)}
                            </Typography>
                          </Box>
                        </Box>
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(item.id)}
                            sx={{
                              color: '#f44336',
                              bgcolor: alpha('#f44336', 0.2),
                              '&:hover': {
                                bgcolor: alpha('#f44336', 0.3),
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < scheduled.length - 1 && (
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 1 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Add Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#ffffff', 0.95),
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle>
          {t('notifications.scheduled.addSchedule')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('notifications.scheduled.type')}</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label={t('notifications.scheduled.type')}
              >
                {notificationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('notifications.scheduled.title')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={t('notifications.scheduled.message')}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />
            <FormControl fullWidth>
              <InputLabel>{t('notifications.scheduled.frequency')}</InputLabel>
              <Select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                label={t('notifications.scheduled.frequency')}
              >
                {frequencies.map((freq) => (
                  <MenuItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.frequency === 'onetime' ? (
              <TextField
                label={t('notifications.scheduled.scheduledTime')}
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            ) : (
              <>
                <TextField
                  label={t('notifications.scheduled.time')}
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                />
                {formData.frequency === 'weekly' && (
                  <FormControl fullWidth>
                    <InputLabel>{t('notifications.scheduled.daysOfWeek')}</InputLabel>
                    <Select
                      multiple
                      value={formData.daysOfWeek}
                      onChange={(e) => setFormData({ ...formData, daysOfWeek: e.target.value })}
                      label={t('notifications.scheduled.daysOfWeek')}
                    >
                      {daysOfWeekOptions.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduledNotificationsPage;


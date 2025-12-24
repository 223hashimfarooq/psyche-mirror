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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Notifications as NotificationsIcon,
  CheckCircle,
  Cancel,
  Message,
  Person,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Auto-refresh notifications in the background every 5 seconds
    // This happens silently without showing loading states
    const interval = setInterval(() => {
      fetchNotificationsSilently();
      fetchUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.request('/notifications');
      if (response && response.success) {
        setNotifications(response.notifications || []);
        console.log('Notifications fetched:', response.notifications?.length || 0);
      } else {
        console.error('Invalid response format:', response);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh - updates notifications without showing loading state
  const fetchNotificationsSilently = async () => {
    try {
      const response = await api.request('/notifications');
      if (response && response.success) {
        setNotifications(response.notifications || []);
      }
    } catch (error) {
      console.error('Error silently fetching notifications:', error);
      // Don't update state on error to avoid flickering
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.request('/notifications/unread-count');
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.request(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.request('/notifications/read-all', {
        method: 'PUT'
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.request(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'relationship_update':
      case 'contact_request':
        return <Person />;
      case 'chat_message':
        return <Message />;
      case 'session_scheduled':
        return <Schedule />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'relationship_update':
        return '#4CAF50';
      case 'contact_request':
        return '#2196F3';
      case 'chat_message':
        return '#FF9800';
      case 'session_scheduled':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  // Function to translate notification title and message
  const translateNotification = (notification) => {
    let translatedTitle = notification.title;
    let translatedMessage = notification.message;

    // Translate based on notification type and content
    switch (notification.type) {
      case 'contact_request':
        if (notification.title === 'New Contact Request' || notification.title.includes('Contact Request')) {
          translatedTitle = t('notifications.types.contactRequest.title');
        }
        if (notification.message.includes('received a contact request')) {
          translatedMessage = t('notifications.types.contactRequest.message');
        }
        break;

      case 'relationship_update':
        if (notification.title === 'Request Accepted' || notification.title.includes('Accepted')) {
          translatedTitle = t('notifications.types.requestAccepted.title');
          // Extract doctor name from message if present
          const doctorMatch = notification.message.match(/Dr\.\s+([^.]+)/);
          if (doctorMatch) {
            translatedMessage = t('notifications.types.requestAccepted.message', { doctorName: doctorMatch[1] });
          } else {
            translatedMessage = t('notifications.types.requestAccepted.message', { doctorName: '' });
          }
        } else if (notification.title === 'Request Rejected' || notification.title.includes('Rejected')) {
          translatedTitle = t('notifications.types.requestRejected.title');
          const doctorMatch = notification.message.match(/Dr\.\s+([^.]+)/);
          if (doctorMatch) {
            translatedMessage = t('notifications.types.requestRejected.message', { doctorName: doctorMatch[1] });
          } else {
            translatedMessage = t('notifications.types.requestRejected.message', { doctorName: '' });
          }
        }
        break;

      case 'chat_message':
        if (notification.title === 'New Message' || notification.title.includes('Message')) {
          translatedTitle = t('notifications.types.newMessage.title');
          // Extract sender name from message
          const senderMatch = notification.message.match(/from\s+(.+)/i);
          if (senderMatch) {
            translatedMessage = t('notifications.types.newMessage.message', { senderName: senderMatch[1] });
          } else {
            translatedMessage = t('notifications.types.newMessage.message', { senderName: '' });
          }
        }
        break;

      case 'session_scheduled':
        if (notification.title === 'Session Scheduled' || notification.title.includes('Scheduled')) {
          translatedTitle = t('notifications.types.sessionScheduled.title');
          // Try to extract details from message - session messages often contain date/time
          if (notification.message && notification.message.includes('scheduled')) {
            // Extract date/time if present, otherwise use generic message
            const dateMatch = notification.message.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
            const timeMatch = notification.message.match(/(\d{1,2}:\d{2})/);
            if (dateMatch || timeMatch) {
              // Keep the date/time but translate the prefix
              translatedMessage = notification.message
                .replace(/Session scheduled/i, t('notifications.types.sessionScheduled.messagePrefix'))
                .replace(/A session has been scheduled/i, t('notifications.types.sessionScheduled.messagePrefix'));
            } else {
              translatedMessage = t('notifications.types.sessionScheduled.message');
            }
          } else {
            translatedMessage = t('notifications.types.sessionScheduled.message');
          }
        }
        break;

      default:
        // For unknown types, try to translate common patterns
        if (notification.title) {
          translatedTitle = notification.title;
        }
        if (notification.message) {
          translatedMessage = notification.message;
        }
    }

    return {
      ...notification,
      title: translatedTitle,
      message: translatedMessage
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays });
    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE');
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

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
        key={`appbar-${i18n.language}`}
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
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#ffffff' }} key={`notifications-title-${i18n.language}`}>
            {t('notifications.title')}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/patient/notification-settings')}
            sx={{
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.5)',
              mr: 1,
              '&:hover': {
                borderColor: '#ffffff',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {t('notifications.preferences.title')}
          </Button>
          {unreadNotifications.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={markAllAsRead}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Quick Navigation Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card
            sx={{
              flex: 1,
              minWidth: 200,
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.25),
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}
            onClick={() => navigate('/patient/notification-settings')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                {t('notifications.preferences.title')}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              flex: 1,
              minWidth: 200,
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.25),
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}
            onClick={() => navigate('/patient/emergency-contacts')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                {t('notifications.emergencyContacts.title')}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              flex: 1,
              minWidth: 200,
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.25),
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}
            onClick={() => navigate('/patient/scheduled-notifications')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                {t('notifications.scheduled.title')}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#ffffff' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <NotificationsIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.5)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                  {t('notifications.noNotifications')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('notifications.allCaughtUp')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {unreadNotifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: '#ffffff', 
                  fontWeight: 700,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontSize: '1.3rem'
                }}>
                  {t('notifications.unread', { count: unreadNotifications.length })}
                </Typography>
                <Card sx={{ 
                  mb: 3,
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <List sx={{ py: 1 }}>
                    {unreadNotifications.map((notification, index) => {
                      const translatedNotification = translateNotification(notification);
                      return (
                      <React.Fragment key={notification.id}>
                        <ListItem
                          sx={{
                            bgcolor: alpha('#ffffff', 0.2),
                            borderRadius: 2,
                            mb: 1.5,
                            py: 2,
                            px: 2,
                            border: '1px solid rgba(255,255,255,0.3)',
                            '&:hover': {
                              bgcolor: alpha('#ffffff', 0.25),
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              transition: 'all 0.3s ease-in-out'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: getNotificationColor(notification.type),
                              width: 48,
                              height: 48,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}>
                              {getNotificationIcon(notification.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            sx={{ ml: 2 }}
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle1" sx={{ 
                                  color: '#ffffff', 
                                  fontWeight: 700,
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  fontSize: '1.1rem'
                                }}>
                                  {translatedNotification.title}
                                </Typography>
                                <Chip
                                  label={t('notifications.new')}
                                  size="small"
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    bgcolor: '#f44336',
                                    color: '#ffffff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body1" sx={{ 
                                  color: '#ffffff', 
                                  mt: 0.5,
                                  mb: 1,
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  lineHeight: 1.6,
                                  fontSize: '0.95rem'
                                }}>
                                  {translatedNotification.message}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: 'rgba(255,255,255,0.8)', 
                                  display: 'block',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  fontWeight: 500
                                }}>
                                  {formatDate(notification.created_at)}
                                </Typography>
                              </>
                            }
                          />
                          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => markAsRead(notification.id)}
                              sx={{ 
                                color: '#4CAF50',
                                bgcolor: alpha('#4CAF50', 0.2),
                                '&:hover': {
                                  bgcolor: alpha('#4CAF50', 0.3),
                                }
                              }}
                              title={t('notifications.markAsRead')}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteNotification(notification.id)}
                              sx={{ 
                                color: '#f44336',
                                bgcolor: alpha('#f44336', 0.2),
                                '&:hover': {
                                  bgcolor: alpha('#f44336', 0.3),
                                }
                              }}
                              title={t('notifications.delete')}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Box>
                        </ListItem>
                        {index < unreadNotifications.length - 1 && (
                          <Divider sx={{ 
                            borderColor: 'rgba(255,255,255,0.2)',
                            my: 1
                          }} />
                        )}
                      </React.Fragment>
                    );
                    })}
                  </List>
                </Card>
              </motion.div>
            )}

            {readNotifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  color: '#ffffff', 
                  fontWeight: 700,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontSize: '1.3rem'
                }}>
                  {t('notifications.read', { count: readNotifications.length })}
                </Typography>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <List sx={{ py: 1 }}>
                    {readNotifications.map((notification, index) => {
                      const translatedNotification = translateNotification(notification);
                      return (
                      <React.Fragment key={notification.id}>
                        <ListItem
                          sx={{
                            bgcolor: alpha('#ffffff', 0.1),
                            borderRadius: 2,
                            mb: 1.5,
                            py: 2,
                            px: 2,
                            border: '1px solid rgba(255,255,255,0.2)',
                            opacity: 0.8,
                            '&:hover': {
                              opacity: 1,
                              bgcolor: alpha('#ffffff', 0.15),
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                              transition: 'all 0.3s ease-in-out'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: getNotificationColor(notification.type),
                              width: 48,
                              height: 48,
                              opacity: 0.8,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}>
                              {getNotificationIcon(notification.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            sx={{ ml: 2 }}
                            primary={
                              <Typography variant="subtitle1" sx={{ 
                                color: '#ffffff', 
                                fontWeight: 600,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                fontSize: '1.05rem',
                                mb: 0.5
                              }}>
                                {translatedNotification.title}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body1" sx={{ 
                                  color: 'rgba(255,255,255,0.95)', 
                                  mt: 0.5,
                                  mb: 1,
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  lineHeight: 1.6,
                                  fontSize: '0.95rem'
                                }}>
                                  {translatedNotification.message}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: 'rgba(255,255,255,0.7)', 
                                  display: 'block',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  fontWeight: 500
                                }}>
                                  {formatDate(notification.created_at)}
                                </Typography>
                              </>
                            }
                          />
                          <IconButton
                            size="small"
                            onClick={() => deleteNotification(notification.id)}
                            sx={{ 
                              color: '#f44336',
                              bgcolor: alpha('#f44336', 0.2),
                              ml: 1,
                              '&:hover': {
                                bgcolor: alpha('#f44336', 0.3),
                              }
                            }}
                            title={t('notifications.delete')}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </ListItem>
                        {index < readNotifications.length - 1 && (
                          <Divider sx={{ 
                            borderColor: 'rgba(255,255,255,0.2)',
                            my: 1
                          }} />
                        )}
                      </React.Fragment>
                    );
                    })}
                  </List>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default NotificationsPage;


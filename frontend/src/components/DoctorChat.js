import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DoctorChat = ({ relationship }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessagesLengthRef = useRef(0);

  useEffect(() => {
    if (relationship) {
      fetchMessages();
      
      // Auto-refresh messages every 3 seconds to get new messages from doctor
      const interval = setInterval(() => {
        fetchMessagesSilently();
      }, 3000);
      
      // Also refresh when window regains focus
      const handleFocus = () => {
        fetchMessagesSilently();
      };
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [relationship]);

  // Check if user is near bottom of chat before scrolling
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    // Consider "near bottom" if within 100px of bottom
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Track scroll position to determine if user has scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      shouldAutoScrollRef.current = isNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User is near bottom (hasn't scrolled up)
    // 2. New messages were added (not just a refresh)
    const newMessagesAdded = messages.length > previousMessagesLengthRef.current;
    
    if (shouldAutoScrollRef.current && (newMessagesAdded || previousMessagesLengthRef.current === 0)) {
      scrollToBottom();
    }
    
    previousMessagesLengthRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.request(`/chat/messages/${relationship.id}`);
      if (response.success) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Silent fetch without showing loading indicator
  const fetchMessagesSilently = async () => {
    try {
      const response = await api.request(`/chat/messages/${relationship.id}`);
      if (response.success) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Error silently fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await api.request('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          relationshipId: relationship.id,
          message: newMessage.trim(),
          messageType: 'text'
        })
      });

      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('chat.messageFailed'));
    } finally {
      setSendingMessage(false);
    }
  };


  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const isMyMessage = (message) => {
    return message.sender_id === currentUser.id;
  };

  // Function to translate specialization
  const translateSpecialization = (specialization) => {
    if (!specialization) return t('register.specializations.general');
    const specLower = specialization.toLowerCase().trim();
    const specMap = {
      'psychology': 'register.specializations.general',
      'clinical psychology': 'register.specializations.clinical',
      'clinical': 'register.specializations.clinical',
      'counseling psychology': 'register.specializations.counseling',
      'counseling': 'register.specializations.counseling',
      'psychiatry': 'register.specializations.psychiatry',
      'therapy': 'register.specializations.therapy',
      'general': 'register.specializations.general',
      'general psychology': 'register.specializations.general',
      'psychologie générale': 'register.specializations.general',
      'psychologie general': 'register.specializations.general'
    };
    const translationKey = specMap[specLower] || 'register.specializations.general';
    return t(translationKey);
  };

  const getDoctorInfo = () => {
    return {
      name: relationship.doctor_name,
      specialization: translateSpecialization(relationship.doctor_specialization),
      profilePicture: relationship.doctor_profile_picture
    };
  };

  if (!relationship) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3
      }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <MessageIcon sx={{ fontSize: 64, color: '#ffffff', mb: 2 }} />
          <Typography variant="h6" sx={{ 
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}>
            {t('chat.selectDoctor', 'Select a doctor to start chatting')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const doctorInfo = getDoctorInfo();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Card sx={{ 
        mb: 2,
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={doctorInfo.profilePicture}
                sx={{ 
                  width: 50, 
                  height: 50, 
                  mr: 2,
                  bgcolor: alpha('#ffffff', 0.2),
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                <PersonIcon sx={{ color: '#ffffff' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 600
                }}>
                  Dr. {doctorInfo.name}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  opacity: 0.9
                }}>
                  {doctorInfo.specialization}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip
                    label={relationship.status}
                    size="small"
                    sx={{
                      bgcolor: alpha('#ffffff', 0.2),
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontWeight: 500
                    }}
                  />
                  {relationship.session_fee && (
                    <Chip
                      icon={<MoneyIcon sx={{ color: '#ffffff' }} />}
                      label={`$${relationship.session_fee}/${t('doctorSearch.sessionUnit')}`}
                      size="small"
                      sx={{
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontWeight: 500
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card sx={{ 
        flexGrow: 1, 
        mb: 2,
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3
      }}>
        <CardContent 
          ref={messagesContainerRef}
          sx={{ height: 400, overflowY: 'auto', p: 2 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#ffffff' }} />
            </Box>
          ) : (
            <List>
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem
                    sx={{
                      flexDirection: isMyMessage(message) ? 'row-reverse' : 'row',
                      alignItems: 'flex-start'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={isMyMessage(message) ? currentUser.profile_picture : doctorInfo.profilePicture}
                        sx={{ width: 40, height: 40 }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{
                        textAlign: isMyMessage(message) ? 'right' : 'left',
                        ml: isMyMessage(message) ? 0 : 2,
                        mr: isMyMessage(message) ? 2 : 0
                      }}
                      primary={
                        <Box
                          sx={{
                            bgcolor: isMyMessage(message) ? 'primary.main' : 'grey.100',
                            color: isMyMessage(message) ? 'white' : 'text.primary',
                            p: 1.5,
                            borderRadius: 2,
                            maxWidth: '70%',
                            display: 'inline-block'
                          }}
                        >
                          <Typography variant="body1">
                            {message.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              opacity: 0.7
                            }}
                          >
                            {formatTime(message.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {message.message_type === 'system' && (
                    <Box sx={{ textAlign: 'center', my: 1 }}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={message.message}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('chat.typeMessage')}
              disabled={relationship.status !== 'active'}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              sx={{
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
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffffff',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255,255,255,0.7)',
                  opacity: 1,
                }
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!newMessage.trim() || sendingMessage || relationship.status !== 'active'}
              sx={{
                color: '#ffffff',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                '&:disabled': {
                  color: 'rgba(255,255,255,0.5)'
                }
              }}
            >
              {sendingMessage ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : <SendIcon />}
              {sendingMessage && <Typography sx={{ ml: 1, color: '#ffffff' }}>{t('chat.sending')}</Typography>}
            </IconButton>
          </Box>
          {relationship.status !== 'active' && (
            <Alert severity="warning" sx={{ 
              mt: 1,
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              '& .MuiAlert-icon': {
                color: '#ffffff'
              }
            }}>
              {t('chat.cannotChat')}
            </Alert>
          )}
        </CardContent>
      </Card>

    </Box>
  );
};

export default DoctorChat;

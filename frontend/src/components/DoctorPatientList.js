import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person,
  Message,
  Phone,
  Email,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Simple chat component for doctors
const DoctorPatientChat = ({ relationshipId, patientName, patientAvatar }) => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    sessionDate: '',
    sessionTime: '',
    durationMinutes: 60,
    sessionType: 'consultation',
    notes: '',
    fee: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (relationshipId) {
      fetchMessages();
    }
  }, [relationshipId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/chat/messages/${relationshipId}`);
      if (response.success) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !relationshipId) return;
    
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      setSending(true);
      const response = await api.request('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          relationshipId,
          message: messageText,
          messageType: 'text'
        })
      });
      
      if (response.success && response.message) {
        // Add the new message to the messages array without refetching
        setMessages(prev => [...prev, response.message]);
      } else {
        // If response doesn't have the message, refetch as fallback
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message text if sending failed
      setNewMessage(messageText);
      // Optionally refetch to ensure sync with server
      fetchMessages();
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#ffffff' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Typography sx={{ color: '#ffffff', textAlign: 'center', opacity: 0.7 }}>
            {t('chat.noMessages')}. {t('chat.startConversation')}
          </Typography>
        ) : (
          <Box>
            {messages.map((message) => {
              const isMyMessage = message.sender_id === currentUser.id;
              return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      bgcolor: isMyMessage 
                        ? alpha('#ffffff', 0.3) 
                        : alpha('#ffffff', 0.15),
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Typography sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontSize: '0.9rem'
                    }}>
                      {message.message}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#ffffff',
                      opacity: 0.7,
                      display: 'block',
                      mt: 0.5
                    }}>
                      {new Date(message.created_at).toLocaleTimeString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            key={`schedule-btn-${i18n.language}`}
            variant="outlined"
            startIcon={<Schedule sx={{ color: '#ffffff' }} />}
            onClick={() => setScheduleDialogOpen(true)}
            sx={{
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': {
                borderColor: '#ffffff',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {t('schedule.scheduleSession')}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            key={`message-input-${i18n.language}`}
            fullWidth
            size="small"
            placeholder={t('chat.typeMessage')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            sx={{
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
              },
            }}
          />
          <Button
            key={`send-btn-${i18n.language}`}
            variant="contained"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
              },
              '&:disabled': {
                bgcolor: alpha('#ffffff', 0.1),
                color: 'rgba(255,255,255,0.5)',
              }
            }}
          >
            {t('chat.send')}
          </Button>
        </Box>
      </Box>

      {/* Schedule Session Dialog */}
      <Dialog 
        open={scheduleDialogOpen} 
        onClose={() => setScheduleDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#ffffff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          fontWeight: 600
        }}>
          {t('schedule.scheduleTherapySession')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('schedule.selectDate')}
                type="date"
                value={scheduleForm.sessionDate}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, sessionDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
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
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('schedule.selectTime')}
                type="time"
                value={scheduleForm.sessionTime}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, sessionTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
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
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('schedule.selectDuration')}
                type="number"
                value={scheduleForm.durationMinutes}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
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
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('schedule.selectType')}
                value={scheduleForm.sessionType}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, sessionType: e.target.value }))}
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
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={`${t('fees.individualSession')} (USD)`}
                type="number"
                value={scheduleForm.fee}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, fee: e.target.value }))}
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
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('schedule.notes')}
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('schedule.notesPlaceholder')}
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setScheduleDialogOpen(false);
              setScheduleForm({
                sessionDate: '',
                sessionTime: '',
                durationMinutes: 60,
                sessionType: 'consultation',
                notes: '',
                fee: ''
              });
            }}
            sx={{
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              try {
                const response = await api.request('/sessions/sessions', {
                  method: 'POST',
                  body: JSON.stringify({
                    relationshipId,
                    sessionDate: scheduleForm.sessionDate,
                    sessionTime: scheduleForm.sessionTime,
                    durationMinutes: scheduleForm.durationMinutes,
                    sessionType: scheduleForm.sessionType,
                    notes: scheduleForm.notes || '',
                    fee: scheduleForm.fee || null
                  })
                });

                if (response.success) {
                  setSnackbar({ open: true, message: t('schedule.sessionScheduled'), severity: 'success' });
                  setScheduleDialogOpen(false);
                  setScheduleForm({
                    sessionDate: '',
                    sessionTime: '',
                    durationMinutes: 60,
                    sessionType: 'consultation',
                    notes: '',
                    fee: ''
                  });
                  fetchMessages(); // Refresh messages to show system message
                } else {
                  // If response exists but success is false, show the error message
                  setSnackbar({ 
                    open: true, 
                    message: response.message || response.error || t('schedule.sessionScheduleFailed'), 
                    severity: 'error' 
                  });
                }
              } catch (error) {
                console.error('Error scheduling session:', error);
                // Check if error has a response with a message
                const errorMessage = error.response?.data?.message || error.message || t('schedule.sessionScheduleFailed');
                setSnackbar({ open: true, message: errorMessage, severity: 'error' });
              }
            }}
            variant="contained"
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3)
              }
            }}
          >
            {t('schedule.scheduleSession')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            bgcolor: snackbar.severity === 'success' 
              ? alpha('#4CAF50', 0.9) 
              : alpha('#f44336', 0.9),
            color: '#ffffff',
            '& .MuiAlert-icon': {
              color: '#ffffff'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const DoctorPatientList = ({ onUpdate, refreshKey }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [relationship, setRelationship] = useState(null);
  const prevRefreshKeyRef = useRef(refreshKey);

  // Load patients on mount
  useEffect(() => {
    console.log('DoctorPatientList: Component mounted, loading patients');
    loadPatients();
  }, []); // Run once on mount
  
  // Reload when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey !== null) {
      // Check if refreshKey actually changed
      if (prevRefreshKeyRef.current !== refreshKey) {
        console.log('DoctorPatientList: refreshKey changed from', prevRefreshKeyRef.current, 'to', refreshKey);
        prevRefreshKeyRef.current = refreshKey;
        // Small delay to ensure state is updated
        setTimeout(() => {
          loadPatients();
        }, 100);
      }
    } else {
      // Initialize the ref if refreshKey is provided on mount
      prevRefreshKeyRef.current = refreshKey;
    }
  }, [refreshKey]); // Reload when refreshKey changes

  // Also refresh when window regains focus (user switches back to tab)
  useEffect(() => {
    const handleFocus = () => {
      loadPatients();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadPatients = async () => {
    try {
      console.log('DoctorPatientList: Loading patients...');
      setLoading(true);
      const response = await api.getDoctorPatients();
      console.log('DoctorPatientList: API response:', response);
      if (response.success) {
        console.log('DoctorPatientList: Loaded patients:', response.patients);
        console.log('DoctorPatientList: Number of patients:', response.patients?.length || 0);
        setPatients(response.patients || []);
      } else {
        console.error('DoctorPatientList: Failed to load patients:', response.error);
        alert('Failed to load patients: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('DoctorPatientList: Error loading patients:', error);
      alert('Error loading patients: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (patient) => {
    setSelectedPatient(patient);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  if (patients.length === 0) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <CardContent>
          <Alert severity="info" sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            '& .MuiAlert-icon': {
              color: '#ffffff'
            }
          }}>
            {t('doctorPatientList.noActivePatients')}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxHeight: '70vh',
            overflow: 'auto',
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 600
                }}>
                  {t('dashboard.doctor.activePatients')} ({patients.length})
                </Typography>
                <Button
                  size="small"
                  onClick={loadPatients}
                  sx={{
                    color: '#ffffff',
                    bgcolor: alpha('#ffffff', 0.2),
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.3),
                    }
                  }}
                >
                  {t('common.refresh')}
                </Button>
              </Box>
              <List>
                {patients.map((patient, index) => (
                  <motion.div
                    key={patient.patient_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <ListItem
                      sx={{
                        mb: 1,
                        bgcolor: selectedPatient?.patient_id === patient.patient_id 
                          ? alpha('#ffffff', 0.2) 
                          : alpha('#ffffff', 0.1),
                        borderRadius: 2,
                        cursor: 'pointer',
                        pr: 12, // Add padding-right to prevent overlap with button
                        '&:hover': {
                          bgcolor: alpha('#ffffff', 0.2),
                        }
                      }}
                      onClick={() => handleOpenChat(patient)}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={patient.patient_profile_picture && patient.patient_profile_picture !== 'undefined' 
                            ? patient.patient_profile_picture 
                            : null}
                          sx={{ bgcolor: alpha('#ffffff', 0.2) }}
                        >
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        sx={{
                          flex: '1 1 auto',
                          minWidth: 0, // Allow text to shrink
                          mr: 1, // Add margin-right for spacing
                        }}
                        primary={
                          <Typography sx={{ 
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            fontWeight: 600,
                            wordBreak: 'break-word', // Prevent text overflow
                          }}>
                            {patient.patient_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="body2" 
                              component="span"
                              sx={{ 
                                color: '#ffffff',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                opacity: 0.9,
                                display: 'block',
                                wordBreak: 'break-word', // Prevent text overflow
                              }}>
                              {patient.patient_email}
                            </Typography>
                            {patient.session_fee && (
                              <Chip
                                label={`$${patient.session_fee}/${t('doctorSearch.sessionUnit')}`}
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  bgcolor: alpha('#ffffff', 0.2),
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      <ListItemSecondaryAction
                        sx={{
                          right: 8, // Position from right
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        <Button
                          size="small"
                          startIcon={<Message />}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent ListItem onClick
                            handleOpenChat(patient);
                          }}
                          sx={{
                            color: '#ffffff',
                            whiteSpace: 'nowrap', // Prevent button text from wrapping
                            minWidth: 'auto', // Allow button to size based on content
                            px: 1.5, // Add horizontal padding
                            '&:hover': {
                              bgcolor: alpha('#ffffff', 0.2),
                            }
                          }}
                        >
                          {t('chat.title')}
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedPatient ? (
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <Box sx={{ height: 'calc(70vh)', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={selectedPatient.patient_profile_picture && selectedPatient.patient_profile_picture !== 'undefined' 
                        ? selectedPatient.patient_profile_picture 
                        : null}
                      sx={{ mr: 2, bgcolor: alpha('#ffffff', 0.2) }}
                    >
                      <Person />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        fontWeight: 600
                      }}>
                        {selectedPatient.patient_name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        {selectedPatient.patient_email}
                      </Typography>
                    </Box>
                    <Chip
                      label={t('doctorPatientList.active')}
                      color="success"
                      size="small"
                      sx={{
                        bgcolor: alpha('#4caf50', 0.2),
                        color: '#ffffff',
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <DoctorPatientChat 
                    key={`chat-${selectedPatient.relationship_id}-${i18n.language}`}
                    relationshipId={selectedPatient.relationship_id}
                    patientName={selectedPatient.patient_name}
                    patientAvatar={selectedPatient.patient_profile_picture}
                  />
                </Box>
              </Box>
            </Card>
          ) : (
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minHeight: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  textAlign: 'center'
                }}>
                  {t('doctorPatientList.selectPatient')}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoctorPatientList;


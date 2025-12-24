import React, { useState } from 'react';
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
  useTheme,
  alpha,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Message,
  Phone,
  VideoCall,
  Schedule,
  Person,
  Email,
  LocationOn,
  Star,
  Send,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const ContactDoctorPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [contactMethod, setContactMethod] = useState('message');

  // Mock doctor data - in real app, this would come from API
  const assignedDoctor = {
    name: 'Dr. Sarah Johnson',
    specialization: 'Clinical Psychology',
    experience: '8 years',
    rating: 4.8,
    avatar: '/api/placeholder/100/100',
    phone: '+1 (555) 123-4567',
    email: 'dr.sarah.johnson@psychemirror.com',
    location: 'New York, NY',
    availability: t('contactDoctor.availableNow'),
    nextAppointment: 'Tomorrow at 2:00 PM',
  };

  const urgencyOptions = [
    { value: 'low', label: t('contactDoctor.lowPriority'), color: '#4CAF50', description: t('contactDoctor.lowPriorityDesc') },
    { value: 'normal', label: t('contactDoctor.normalPriority'), color: '#FF9800', description: t('contactDoctor.normalPriorityDesc') },
    { value: 'high', label: t('contactDoctor.highPriority'), color: '#F44336', description: t('contactDoctor.highPriorityDesc') },
  ];

  const contactMethods = [
    { value: 'message', label: t('contactDoctor.sendMessage'), icon: <Message />, description: t('contactDoctor.sendMessageDesc') },
    { value: 'call', label: t('contactDoctor.scheduleCall'), icon: <Phone />, description: t('contactDoctor.scheduleCallDesc') },
    { value: 'video', label: t('contactDoctor.videoSession'), icon: <VideoCall />, description: t('contactDoctor.videoSessionDesc') },
    { value: 'appointment', label: t('contactDoctor.bookAppointment'), icon: <Schedule />, description: t('contactDoctor.bookAppointmentDesc') },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // In real app, this would send to backend
      alert(t('contactDoctor.messageSent', { name: assignedDoctor.name, message }));
      setMessage('');
    }
  };

  const handleContactMethod = (method) => {
    setContactMethod(method);
    // In real app, this would trigger different flows
    switch (method) {
      case 'call':
        alert(t('contactDoctor.callRequestSent', { name: assignedDoctor.name }));
        break;
      case 'video':
        alert(t('contactDoctor.videoRequestSent', { name: assignedDoctor.name }));
        break;
      case 'appointment':
        alert(t('contactDoctor.appointmentRequestSent', { name: assignedDoctor.name }));
        break;
      default:
        break;
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
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/patient/therapy')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', ml: 2 }}>
            {t('contactDoctor.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('contactDoctor.title')}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
              {t('contactDoctor.description')}
            </Typography>
          </Box>
        </motion.div>

        {/* Doctor Information */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card sx={{ 
            mb: 4,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mr: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    border: `2px solid ${alpha('#ffffff', 0.3)}`,
                  }}
                >
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mb: 1 }}>
                    {assignedDoctor.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500, mb: 1 }}>
                    {assignedDoctor.specialization} • {assignedDoctor.experience} {t('contactDoctor.experience')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                      {assignedDoctor.rating}/5.0
                    </Typography>
                    <Chip
                      label={assignedDoctor.availability}
                      size="small"
                      sx={{
                        bgcolor: alpha('#4CAF50', 0.2),
                        color: '#4CAF50',
                        fontWeight: 600,
                        border: `1px solid ${alpha('#4CAF50', 0.3)}`,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('contactDoctor.contactInformation')}
                  </Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: '#ffffff' }}>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>{assignedDoctor.phone}</Typography>}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: '#ffffff' }}>
                        <Email />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>{assignedDoctor.email}</Typography>}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ color: '#ffffff' }}>
                        <LocationOn />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>{assignedDoctor.location}</Typography>}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('contactDoctor.nextAppointment')}
                  </Typography>
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.1),
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}>
                    <CardContent>
                      <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                        {assignedDoctor.nextAppointment}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          mt: 2,
                          color: '#ffffff',
                          borderColor: 'rgba(255,255,255,0.3)',
                          '&:hover': {
                            bgcolor: alpha('#ffffff', 0.1),
                            borderColor: 'rgba(255,255,255,0.5)',
                          },
                        }}
                      >
                        {t('contactDoctor.reschedule')}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card sx={{ 
            mb: 4,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('contactDoctor.chooseContactMethod')}
              </Typography>
              <Grid container spacing={2}>
                {contactMethods.map((method) => (
                  <Grid item xs={12} sm={6} md={3} key={method.value}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        bgcolor: contactMethod === method.value ? alpha('#ffffff', 0.2) : alpha('#ffffff', 0.1),
                        border: `2px solid ${contactMethod === method.value ? alpha('#ffffff', 0.4) : alpha('#ffffff', 0.2)}`,
                        '&:hover': {
                          bgcolor: alpha('#ffffff', 0.15),
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => handleContactMethod(method.value)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Box sx={{ color: '#ffffff', mb: 1 }}>
                          {method.icon}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mb: 1 }}>
                          {method.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {method.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Message Form */}
        {contactMethod === 'message' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card sx={{ 
              mb: 4,
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  {t('contactDoctor.sendMessage')}
                </Typography>
                
                {/* Urgency Selection */}
                <Typography variant="body2" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                  {t('contactDoctor.urgency')}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  {urgencyOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      onClick={() => setUrgency(option.value)}
                      sx={{
                        bgcolor: urgency === option.value ? alpha(option.color, 0.2) : alpha('#ffffff', 0.1),
                        color: urgency === option.value ? option.color : '#ffffff',
                        fontWeight: 600,
                        border: `2px solid ${urgency === option.value ? alpha(option.color, 0.4) : alpha('#ffffff', 0.3)}`,
                        '&:hover': {
                          bgcolor: alpha(option.color, 0.1),
                        },
                      }}
                    />
                  ))}
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={t('contactDoctor.messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  sx={{
                    mb: 3,
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
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  sx={{
                    bgcolor: alpha('#ffffff', 0.2),
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.3),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    },
                    '&:disabled': {
                      bgcolor: alpha('#ffffff', 0.1),
                      color: 'rgba(255,255,255,0.5)',
                    },
                  }}
                >
                  {t('contactDoctor.sendMessage')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Emergency Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Alert 
            severity="warning" 
            sx={{ 
              bgcolor: alpha('#FF9800', 0.15),
              backdropFilter: 'blur(10px)',
              border: `2px solid ${alpha('#FF9800', 0.3)}`,
              '& .MuiAlert-message': {
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 500,
              },
            }}
          >
            <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
              {t('contactDoctor.emergencyNotice')}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/patient/emergency-hotline')}
              sx={{
                mt: 1,
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.1),
                  borderColor: 'rgba(255,255,255,0.5)',
                },
              }}
            >
              {t('contactDoctor.goToEmergencyHotline')}
            </Button>
          </Alert>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ContactDoctorPage;

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
  Chip,
  useTheme,
  alpha,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Phone,
  LocalHospital,
  Psychology,
  Support,
  Warning,
  AccessTime,
  Language,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const EmergencyHotlinePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState('US');

  const emergencyNumbers = {
    US: [
      { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7', type: 'suicide' },
      { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7', type: 'text' },
      { name: 'National Domestic Violence Hotline', number: '1-800-799-7233', available: '24/7', type: 'domestic' },
      { name: 'SAMHSA National Helpline', number: '1-800-662-4357', available: '24/7', type: 'substance' },
    ],
    UK: [
      { name: 'Samaritans', number: '116 123', available: '24/7', type: 'suicide' },
      { name: 'Crisis Text Line UK', number: 'Text SHOUT to 85258', available: '24/7', type: 'text' },
      { name: 'Mind Infoline', number: '0300 123 3393', available: '9am-6pm', type: 'mental' },
      { name: 'Childline', number: '0800 1111', available: '24/7', type: 'child' },
    ],
    CA: [
      { name: 'Crisis Services Canada', number: '1-833-456-4566', available: '24/7', type: 'suicide' },
      { name: 'Kids Help Phone', number: '1-800-668-6868', available: '24/7', type: 'child' },
      { name: 'Mental Health Helpline', number: '1-866-531-2600', available: '24/7', type: 'mental' },
    ],
  };

  const getTypeColor = (type) => {
    const colors = {
      suicide: '#F44336',
      text: '#2196F3',
      domestic: '#FF5722',
      substance: '#9C27B0',
      mental: '#4CAF50',
      child: '#FF9800',
    };
    return colors[type] || '#666';
  };

  const getTypeIcon = (type) => {
    const icons = {
      suicide: <Warning />,
      text: <Support />,
      domestic: <LocalHospital />,
      substance: <Psychology />,
      mental: <Psychology />,
      child: <Support />,
    };
    return icons[type] || <Phone />;
  };

  const handleCall = (number) => {
    // Remove non-numeric characters for phone calls
    const cleanNumber = number.replace(/[^\d]/g, '');
    if (cleanNumber.length > 0) {
      window.open(`tel:${cleanNumber}`, '_self');
    }
  };

  const handleText = (number) => {
    if (number.includes('Text')) {
      // For text services, show instructions
      alert(t('emergency.textServiceInstructions', { number }));
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
            {t('emergency.title')}
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
              {t('emergency.emergencySupport')}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
              {t('emergency.description')}
            </Typography>
          </Box>
        </motion.div>

        {/* Critical Alert */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              bgcolor: alpha('#F44336', 0.15),
              backdropFilter: 'blur(10px)',
              border: `2px solid ${alpha('#F44336', 0.3)}`,
              '& .MuiAlert-message': {
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600,
              },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {t('emergency.criticalAlert')}
            </Typography>
          </Alert>
        </motion.div>

        {/* Country Selection */}
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
                {t('emergency.selectCountry')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {Object.keys(emergencyNumbers).map((country) => (
                  <Chip
                    key={country}
                    label={country}
                    onClick={() => setSelectedCountry(country)}
                    sx={{
                      bgcolor: selectedCountry === country ? alpha('#ffffff', 0.3) : alpha('#ffffff', 0.1),
                      color: '#ffffff',
                      fontWeight: 600,
                      border: `2px solid ${alpha('#ffffff', 0.3)}`,
                      '&:hover': {
                        bgcolor: alpha('#ffffff', 0.2),
                      },
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('emergency.emergencyNumbers')} - {selectedCountry}
              </Typography>
              <List>
                {emergencyNumbers[selectedCountry].map((service, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ 
                      bgcolor: alpha(getTypeColor(service.type), 0.1),
                      borderRadius: 2,
                      mb: 2,
                      border: `1px solid ${alpha(getTypeColor(service.type), 0.2)}`,
                    }}>
                      <ListItemIcon sx={{ color: getTypeColor(service.type) }}>
                        {getTypeIcon(service.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ fontWeight: 600, color: getTypeColor(service.type), textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                            {service.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontSize: '1.1rem' }}>
                              {service.number}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                              <AccessTime sx={{ fontSize: 16, color: '#ffffff' }} />
                              <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                {t('emergency.available')}: {service.available}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<Phone />}
                          onClick={() => handleCall(service.number)}
                          sx={{
                            bgcolor: alpha(getTypeColor(service.type), 0.8),
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: alpha(getTypeColor(service.type), 0.9),
                            },
                          }}
                        >
                          {t('emergency.call')}
                        </Button>
                        {service.type === 'text' && (
                          <Button
                            variant="outlined"
                            onClick={() => handleText(service.number)}
                            sx={{
                              color: getTypeColor(service.type),
                              borderColor: getTypeColor(service.type),
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: alpha(getTypeColor(service.type), 0.1),
                              },
                            }}
                          >
                            {t('emergency.text')}
                          </Button>
                        )}
                      </Box>
                    </ListItem>
                    {index < emergencyNumbers[selectedCountry].length - 1 && <Divider sx={{ my: 2, bgcolor: alpha('#ffffff', 0.1) }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{ 
            mt: 4,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('emergency.additionalResources')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                {t('emergency.notAlone')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/patient/contact-doctor')}
                  sx={{ 
                    bgcolor: alpha('#ffffff', 0.2),
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.3),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {t('emergency.contactYourDoctor')}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/patient/therapy')}
                  sx={{ 
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.1),
                      border: '2px solid rgba(255,255,255,0.5)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {t('emergency.backToTherapy')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default EmergencyHotlinePage;

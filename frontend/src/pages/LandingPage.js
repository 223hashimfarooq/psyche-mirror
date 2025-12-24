import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Psychology,
  Mic,
  TextFields,
  Favorite,
  People,
  Star,
  Phone,
  Email,
  Language,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);

  const handleLanguageMenuOpen = (event) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageChange = (newLanguage) => {
    i18n.changeLanguage(newLanguage).then(() => {
      // Ensure it's saved to localStorage
      localStorage.setItem('i18nextLng', newLanguage);
      // Dispatch event to notify all components of language change
      window.dispatchEvent(new Event('languagechange'));
      handleLanguageMenuClose();
    });
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const features = [
    {
      icon: <Psychology sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: t('landing.features.facial'),
      description: t('landing.features.facialDesc'),
    },
    {
      icon: <Mic sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: t('landing.features.voice'),
      description: t('landing.features.voiceDesc'),
    },
    {
      icon: <TextFields sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: t('landing.features.text'),
      description: t('landing.features.textDesc'),
    },
    {
      icon: <Favorite sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      title: t('landing.features.therapy'),
      description: t('landing.features.therapyDesc'),
    },
    {
      icon: <People sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: t('landing.features.connect', 'Doctor-Patient Connect'),
      description: t('landing.features.connectDesc', 'Seamless connection with mental health professionals for ongoing support.'),
    },
  ];

  const testimonials = [
    {
      name: t('landing.testimonials.sarah.name'),
      role: t('landing.testimonials.sarah.role'),
      content: t('landing.testimonials.sarah.content'),
      rating: 5,
    },
    {
      name: t('landing.testimonials.michael.name'),
      role: t('landing.testimonials.michael.role'),
      content: t('landing.testimonials.michael.content'),
      rating: 5,
    },
    {
      name: t('landing.testimonials.emma.name'),
      role: t('landing.testimonials.emma.role'),
      content: t('landing.testimonials.emma.content'),
      rating: 5,
    },
  ];

  const steps = [
    {
      number: t('landing.steps.detect.number'),
      title: t('landing.steps.detect.title'),
      description: t('landing.steps.detect.description'),
    },
    {
      number: t('landing.steps.analyze.number'),
      title: t('landing.steps.analyze.title'),
      description: t('landing.steps.analyze.description'),
    },
    {
      number: t('landing.steps.heal.number'),
      title: t('landing.steps.heal.title'),
      description: t('landing.steps.heal.description'),
    },
  ];

  return (
    <Box 
      sx={{ 
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
      }}
    >
      {/* Navigation */}
      <AppBar 
        position="fixed" 
        sx={{ 
          bgcolor: alpha('#ffffff', 0.1),
          backdropFilter: 'blur(20px)',
          boxShadow: 'none',
          zIndex: 10,
        }}
      >
        <Toolbar>
          <Typography variant='h6' sx={{ fontWeight: 700, color: '#ffffff' }}>
            PsycheMirror
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            sx={{ color: '#ffffff' }}
            onClick={handleLanguageMenuOpen}
            aria-label="language selection"
          >
            <Language />
          </IconButton>
          <Menu
            anchorEl={languageMenuAnchor}
            open={Boolean(languageMenuAnchor)}
            onClose={handleLanguageMenuClose}
            PaperProps={{
              sx: {
                bgcolor: alpha('#ffffff', 0.95),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }
            }}
          >
            {languages.map((lang) => (
              <MenuItem 
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                sx={{
                  color: '#000000',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <ListItemIcon>
                  <Typography variant="h6">{lang.flag}</Typography>
                </ListItemIcon>
                <ListItemText primary={lang.name} />
              </MenuItem>
            ))}
          </Menu>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
            sx={{ ml: 2 }}
          >
            {t('common.login')}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant='h1'
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {t('landing.tagline')}
              </Typography>
              <Typography
                variant='h5'
                sx={{ mb: 4, color: '#ffffff', fontWeight: 400, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {t('landing.subtagline')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  px: 6,
                  py: 2,
                  bgcolor: '#ffffff',
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.9),
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                {t('landing.loginButton')}
              </Button>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about-section" sx={{ 
        py: 8, 
        position: 'relative',
        zIndex: 2,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant='h2' textAlign='center' sx={{ mb: 4, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('landing.aboutTitle')}
            </Typography>
            <Typography
              variant='h6'
              textAlign='center'
              sx={{ mb: 6, color: '#ffffff', maxWidth: 800, mx: 'auto', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
              {t('landing.aboutDescription')}
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Button 
                variant="contained" 
                size="large" 
                sx={{ 
                  px: 4,
                  bgcolor: theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
                onClick={() => {
                  // Scroll to the features section instead of about section
                  const featuresSection = document.querySelector('[data-section="features"]');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    // Fallback: scroll to top of page
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                {t('landing.moreAboutUs')}
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Box data-section="features" sx={{ 
        py: 8, 
        position: 'relative',
        zIndex: 2,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" textAlign="center" sx={{ mb: 2, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('landing.ourServices')}
            </Typography>
            <Typography variant="h5" textAlign="center" sx={{ mb: 6, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {t('landing.servicesSubtitle')}
            </Typography>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        bgcolor: alpha('#ffffff', 0.15),
                        backdropFilter: 'blur(10px)',
                        transition: 'transform 0.3s ease-in-out',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                          bgcolor: alpha('#ffffff', 0.25),
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 4 }}>
                        <Box sx={{ mb: 2, color: '#ffffff' }}>{feature.icon}</Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ 
        py: 8, 
        position: 'relative',
        zIndex: 2,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" textAlign="center" sx={{ mb: 6, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('landing.howItWorks')}
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {steps.map((step, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Box sx={{ 
                      textAlign: 'center',
                      bgcolor: alpha('#ffffff', 0.15),
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      p: 4,
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}>
                      <Typography
                        variant="h1"
                        sx={{
                          fontSize: '4rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          mb: 2,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        {step.number}
                      </Typography>
                      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {step.description}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ 
        py: 8, 
        position: 'relative',
        zIndex: 2,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" textAlign="center" sx={{ mb: 6, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('landing.testimonials.title')}
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {testimonials.map((testimonial, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card sx={{ 
                      height: '100%',
                      bgcolor: alpha('#ffffff', 0.15),
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}>
                      <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} sx={{ color: '#FFD700', fontSize: 20 }} />
                          ))}
                        </Box>
                        <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          "{testimonial.content}"
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {testimonial.role}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Privacy Policy Section */}
      <Box id="privacy-policy" sx={{ 
        py: 8, 
        position: 'relative',
        zIndex: 2,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" textAlign="center" sx={{ mb: 6, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('landing.privacy.title')}
            </Typography>
            <Box sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              p: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <Typography variant="h5" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.privacy.commitment')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                {t('landing.privacy.commitmentDesc')}
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.privacy.dataProtection')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                • {t('landing.privacy.dataProtectionItems.encryption')}<br/>
                • {t('landing.privacy.dataProtectionItems.hipaa')}<br/>
                • {t('landing.privacy.dataProtectionItems.servers')}<br/>
                • {t('landing.privacy.dataProtectionItems.access')}
              </Typography>

              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.privacy.dataRights')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                • {t('landing.privacy.dataRightsItems.ownership')}<br/>
                • {t('landing.privacy.dataRightsItems.portability')}<br/>
                • {t('landing.privacy.dataRightsItems.deletion')}<br/>
                • {t('landing.privacy.dataRightsItems.consent')}
              </Typography>

              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.privacy.dataUsage')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                {t('landing.privacy.dataUsageDesc')}
              </Typography>

              <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                <strong>{t('landing.privacy.questions')}</strong> {t('landing.privacy.contact')}
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Terms of Service Section */}
      <Box id="terms-of-service" sx={{ 
        py: 8, 
        position: 'relative',
        zIndex: 2,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" textAlign="center" sx={{ mb: 6, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('landing.terms.title')}
            </Typography>
            <Box sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              p: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <Typography variant="h5" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.terms.agreement')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                {t('landing.terms.agreementDesc')}
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.terms.serviceUsage')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                • {t('landing.terms.serviceUsageItems.legitimate')}<br/>
                • {t('landing.terms.serviceUsageItems.accurate')}<br/>
                • {t('landing.terms.serviceUsageItems.respect')}<br/>
                • {t('landing.terms.serviceUsageItems.hack')}
              </Typography>

              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.terms.dataPrivacy')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                • {t('landing.terms.dataPrivacyItems.encrypted')}<br/>
                • {t('landing.terms.dataPrivacyItems.ownership')}<br/>
                • {t('landing.terms.dataPrivacyItems.anonymized')}<br/>
                • {t('landing.terms.dataPrivacyItems.consent')}
              </Typography>

              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.terms.limitations')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                • {t('landing.terms.limitationsItems.notReplacement')}<br/>
                • {t('landing.terms.limitationsItems.emergency')}<br/>
                • {t('landing.terms.limitationsItems.notLiable')}<br/>
                • {t('landing.terms.limitationsItems.informational')}
              </Typography>

              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.terms.termination')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                • {t('landing.terms.terminationItems.terminate')}<br/>
                • {t('landing.terms.terminationItems.reserve')}<br/>
                • {t('landing.terms.terminationItems.deletion')}
              </Typography>

              <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', lineHeight: 1.8 }}>
                <strong>{t('landing.terms.questions')}</strong> {t('landing.terms.contact')}
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        py: 6, 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.2)', 
        position: 'relative',
        zIndex: 2,
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                PsycheMirror
              </Typography>
              <Typography variant='body2' sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.footer.tagline')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Phone sx={{ fontSize: 20, color: '#ffffff' }} />
                <Typography variant='body2' sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  +1 234 567 8900
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Email sx={{ fontSize: 20, color: '#ffffff' }} />
                <Typography variant='body2' sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  info@psychemirror.com
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.footer.quickLinks')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  variant="text" 
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#ffffff', fontWeight: 600, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', '&:hover': { color: '#ffffff', fontWeight: 700 } }}
                  onClick={() => {
                    const aboutSection = document.getElementById('about-section');
                    if (aboutSection) {
                      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {t('landing.footer.aboutUs')}
                </Button>
                <Button 
                  variant="text" 
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#ffffff', fontWeight: 600, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', '&:hover': { color: '#ffffff', fontWeight: 700 } }}
                  onClick={() => {
                    const servicesSection = document.querySelector('[data-section="features"]');
                    if (servicesSection) {
                      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {t('landing.footer.services')}
                </Button>
                <Button 
                  variant="text" 
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#ffffff', fontWeight: 600, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', '&:hover': { color: '#ffffff', fontWeight: 700 } }}
                  onClick={() => {
                    const privacySection = document.getElementById('privacy-policy');
                    if (privacySection) {
                      privacySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {t('landing.footer.privacyPolicy')}
                </Button>
                <Button 
                  variant="text" 
                  sx={{ justifyContent: 'flex-start', p: 0, color: '#ffffff', fontWeight: 600, textShadow: '1px 1px 2px rgba(0,0,0,0.8)', '&:hover': { color: '#ffffff', fontWeight: 700 } }}
                  onClick={() => {
                    const termsSection = document.getElementById('terms-of-service');
                    if (termsSection) {
                      termsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  {t('landing.footer.termsOfService')}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.footer.downloadApp')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('landing.footer.downloadDesc')}
              </Typography>
              <Button variant="contained" sx={{ mb: 1, width: '100%' }}>
                {t('landing.footer.downloadButton')}
              </Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {t('landing.footer.copyright')}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
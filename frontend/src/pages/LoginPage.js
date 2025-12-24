import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Language,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const { signin } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

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

  useEffect(() => {
    const role = searchParams.get('role');
    if (role) {
      setUserRole(role);
    }
  }, [searchParams]);

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setUserRole(newRole);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('login.pleaseFillFields'));
      return;
    }

    // If MFA is required, check for MFA token
    if (requiresMFA && !mfaToken && !backupCode) {
      setError(t('login.pleaseEnterMFA'));
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await signin(email, password, mfaToken || null, backupCode || null);
      
      // Check if MFA is required
      if (result.requiresMFA) {
        setRequiresMFA(true);
        setLoading(false);
        return;
      }
      
      // Force navigation after successful login
      if (result && result.user) {
        navigate(userRole === 'patient' ? '/patient/dashboard' : '/doctor/overview');
      }
    } catch (error) {
      setError(t('login.loginError') + ': ' + error.message);
      setRequiresMFA(false);
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        backgroundImage: `url('https://www.psychologs.com/wp-content/uploads/2023/11/Life-of-a-Psychologist-Career-Challenges-and-Responsibility.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        py: 4,
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
      {/* Navigation with Language Selector */}
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
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, mt: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {t('login.welcomeBack')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('login.signInAccount')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {userRole === 'patient' ? t('login.patientLogin') : t('login.doctorLogin')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <ToggleButtonGroup
                value={userRole}
                exclusive
                onChange={handleRoleChange}
                fullWidth
                sx={{ 
                  mb: 3,
                  '& .MuiToggleButton-root': {
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }
                  }
                }}
              >
                <ToggleButton value="patient" sx={{ py: 1.5 }}>
                  {t('login.patient')}
                </ToggleButton>
                <ToggleButton value="doctor" sx={{ py: 1.5 }}>
                  {t('login.doctor')}
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField
                fullWidth
                label={t('login.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ 
                  mb: 3,
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  },
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
                required
              />
              <TextField
                fullWidth
                label={t('login.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ 
                  mb: 3,
                  '& .MuiInputLabel-root': {
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  },
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
                required
              />
              {requiresMFA && (
                <>
                  <TextField
                    fullWidth
                    label={t('login.mfaCode')}
                    type="text"
                    value={mfaToken}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setMfaToken(value);
                      setBackupCode(''); // Clear backup code if MFA token is entered
                    }}
                    placeholder={t('login.mfaCodePlaceholder')}
                    sx={{ 
                      mb: 2,
                      '& .MuiInputLabel-root': {
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      },
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                    }}
                    inputProps={{ maxLength: 6 }}
                  />
                  <Typography variant="body2" sx={{ mb: 2, color: '#ffffff', textAlign: 'center', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('login.or')}
                  </Typography>
                  <TextField
                    fullWidth
                    label={t('login.backupCode')}
                    type="text"
                    value={backupCode}
                    onChange={(e) => {
                      setBackupCode(e.target.value.toUpperCase());
                      setMfaToken(''); // Clear MFA token if backup code is entered
                    }}
                    sx={{ 
                      mb: 3,
                      '& .MuiInputLabel-root': {
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      },
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                    }}
                  />
                </>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 3, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : t('login.signIn')}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('login.noAccount')}{' '}
                <Link 
                  component={RouterLink} 
                  to={`/register?role=${userRole}`} 
                  sx={{ 
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: '#ffffff',
                      fontWeight: 800,
                    }
                  }}
                >
                  {t('login.signUpHere')}
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginPage;
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
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'patient',
    specialization: '',
    experience: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role) {
      setFormData(prev => ({ ...prev, role }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setFormData({
        ...formData,
        role: newRole,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError(t('register.pleaseFillRequired'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.passwordMinLength'));
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, formData);
      // Redirect to login page after successful registration
      navigate('/login?role=' + formData.role);
    } catch (error) {
      setError(t('register.registerError') + ': ' + error.message);
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
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
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
                {t('register.createAccount')}
              </Typography>
              <Typography variant="body1" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('register.joinJourney')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <ToggleButtonGroup
                value={formData.role}
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
                label={t('register.fullName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                label={t('register.emailAddress')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                label={t('register.phoneNumber')}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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
              />

              {formData.role === 'doctor' && (
                <>
                  <FormControl fullWidth sx={{ 
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
                  }}>
                    <InputLabel sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{t('register.specialization')}</InputLabel>
                    <Select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      label={t('register.specialization')}
                      sx={{ color: '#ffffff' }}
                    >
                      <MenuItem value="general">{t('register.specializations.general')}</MenuItem>
                      <MenuItem value="clinical">{t('register.specializations.clinical')}</MenuItem>
                      <MenuItem value="counseling">{t('register.specializations.counseling')}</MenuItem>
                      <MenuItem value="psychiatry">{t('register.specializations.psychiatry')}</MenuItem>
                      <MenuItem value="therapy">{t('register.specializations.therapy')}</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label={t('register.yearsOfExperience')}
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleChange}
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
                  />
                </>
              )}

              <TextField
                fullWidth
                label={t('register.password')}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
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
                label={t('register.confirmPassword')}
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 3, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : t('register.createAccount')}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('register.alreadyHaveAccount')}{' '}
                <Link 
                  component={RouterLink} 
                  to="/login" 
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
                  {t('register.signInHere')}
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default RegisterPage;
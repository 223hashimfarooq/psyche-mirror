import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
  Paper,
} from '@mui/material';
import {
  AttachMoney,
  Save,
  Info,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const PricingManagement = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [pricing, setPricing] = useState({
    consultation_fee: 100,
    session_fee: 150,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      setLoading(true);
      const response = await api.getDoctorPricing();
      if (response.success && response.pricing) {
        setPricing({
          consultation_fee: response.pricing.consultation_fee || 100,
          session_fee: response.pricing.session_fee || 150,
        });
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
      setMessage({ type: 'error', text: t('fees.failedToLoad') });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      if (!pricing.consultation_fee || !pricing.session_fee) {
        setMessage({ type: 'error', text: t('fees.pleaseEnterValidPricing') });
        return;
      }

      if (pricing.consultation_fee < 0 || pricing.session_fee < 0) {
        setMessage({ type: 'error', text: t('fees.pricingCannotBeNegative') });
        return;
      }

      const response = await api.updateDoctorPricing({
        consultation_fee: parseFloat(pricing.consultation_fee),
        session_fee: parseFloat(pricing.session_fee),
      });

      if (response.success) {
        setMessage({ type: 'success', text: t('fees.pricingUpdatedSuccess') });
      } else {
        setMessage({ type: 'error', text: t('fees.failedToUpdate') });
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      setMessage({ type: 'error', text: t('fees.failedToSave') });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setPricing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        mb: 3,
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AttachMoney sx={{ mr: 2, color: '#ffffff', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600
              }}>
                {t('fees.title')}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9
              }}>
                {t('fees.setDefaultPricing')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ 
            mb: 3,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: message.type === 'success' ? '#4caf50' : '#f44336',
          }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                mb: 3,
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600
              }}>
                {t('fees.setYourPricing')}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`${t('fees.consultationFee')} (USD)`}
                    type="number"
                    value={pricing.consultation_fee}
                    onChange={(e) => handleChange('consultation_fee', e.target.value)}
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ color: '#ffffff', mr: 1 }} />,
                    }}
                    sx={{
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
                  <Typography variant="caption" sx={{ 
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.8,
                    mt: 1,
                    display: 'block'
                  }}>
                    {t('fees.consultationFeeDesc')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`${t('fees.individualSession')} (USD)`}
                    type="number"
                    value={pricing.session_fee}
                    onChange={(e) => handleChange('session_fee', e.target.value)}
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ color: '#ffffff', mr: 1 }} />,
                    }}
                    sx={{
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
                  <Typography variant="caption" sx={{ 
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.8,
                    mt: 1,
                    display: 'block'
                  }}>
                    {t('fees.sessionFeeDesc')}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  onClick={handleSavePricing}
                  disabled={saving}
                  sx={{
                    bgcolor: alpha('#ffffff', 0.2),
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.3),
                      border: '1px solid rgba(255,255,255,0.5)',
                    },
                    '&:disabled': {
                      bgcolor: alpha('#ffffff', 0.1),
                      color: 'rgba(255,255,255,0.5)',
                    }
                  }}
                >
                  {saving ? t('fees.saving') : t('fees.savePricing')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info sx={{ mr: 1, color: '#ffffff' }} />
                <Typography variant="h6" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 600
                }}>
                  {t('fees.pricingInformation')}
                </Typography>
              </Box>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9,
                mb: 2
              }}>
                <strong>{t('fees.consultationFee')}:</strong> {t('fees.consultationFeeInfo')}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9,
                mb: 2
              }}>
                <strong>{t('fees.sessionFee')}:</strong> {t('fees.sessionFeeInfo')}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9
              }}>
                <strong>{t('fees.note')}:</strong> {t('fees.noteText')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PricingManagement;


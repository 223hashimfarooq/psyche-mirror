import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Warning,
  Save,
  Phone,
  Email,
  WhatsApp,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const EmergencyAlertSettings = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [preferences, setPreferences] = useState({
    enable_detection: true,
    alert_methods: ['sms', 'email'],
    require_consent: true,
    allow_manual_override: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.getEmergencyAlertPreferences();
      if (response.success && response.preferences) {
        setPreferences({
          enable_detection: response.preferences.enable_detection !== false,
          alert_methods: response.preferences.alert_methods || ['sms', 'email'],
          require_consent: response.preferences.require_consent !== false,
          allow_manual_override: response.preferences.allow_manual_override !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching emergency preferences:', error);
      setMessage({ type: 'error', text: t('notifications.emergencyAlert.settings.fetchError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.updateEmergencyAlertPreferences(preferences);
      if (response.success) {
        setMessage({ type: 'success', text: t('notifications.emergencyAlert.settings.saveSuccess') });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error saving emergency preferences:', error);
      setMessage({ type: 'error', text: t('notifications.emergencyAlert.settings.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMethod = (method) => {
    setPreferences(prev => {
      const methods = prev.alert_methods || [];
      if (methods.includes(method)) {
        return { ...prev, alert_methods: methods.filter(m => m !== method) };
      } else {
        return { ...prev, alert_methods: [...methods, method] };
      }
    });
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'sms':
        return <Phone fontSize="small" />;
      case 'email':
        return <Email fontSize="small" />;
      case 'whatsapp':
        return <WhatsApp fontSize="small" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  return (
    <Card sx={{ 
      mb: 3,
      bgcolor: alpha('#ffffff', 0.15),
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Warning sx={{ mr: 2, fontSize: 30, color: '#ffffff', opacity: 0.9 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
            {t('notifications.emergencyAlert.settings.title')}
          </Typography>
        </Box>

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3, bgcolor: alpha(message.type === 'success' ? '#4CAF50' : '#f44336', 0.2) }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Enable Detection */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                {t('notifications.emergencyAlert.settings.enableDetection')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.7, mt: 0.5 }}>
                {t('notifications.emergencyAlert.settings.enableDetectionDesc')}
              </Typography>
            </Box>
            <Switch
              checked={preferences.enable_detection}
              onChange={(e) => setPreferences(prev => ({ ...prev, enable_detection: e.target.checked }))}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: theme.palette.primary.main,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

          {/* Alert Methods */}
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff', mb: 2 }}>
              {t('notifications.emergencyAlert.settings.alertMethods')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.7, mb: 2 }}>
              {t('notifications.emergencyAlert.settings.alertMethodsDesc')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['sms', 'email', 'whatsapp'].map((method) => (
                <Chip
                  key={method}
                  icon={getMethodIcon(method)}
                  label={t(`notifications.emergencyAlert.settings.methods.${method}`)}
                  onClick={() => handleToggleMethod(method)}
                  color={preferences.alert_methods.includes(method) ? 'primary' : 'default'}
                  sx={{
                    bgcolor: preferences.alert_methods.includes(method)
                      ? alpha(theme.palette.primary.main, 0.3)
                      : alpha('#ffffff', 0.1),
                    color: '#ffffff',
                    border: `1px solid ${preferences.alert_methods.includes(method) ? theme.palette.primary.main : 'rgba(255,255,255,0.3)'}`,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: preferences.alert_methods.includes(method)
                        ? alpha(theme.palette.primary.main, 0.4)
                        : alpha('#ffffff', 0.2),
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

          {/* Require Consent */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                {t('notifications.emergencyAlert.settings.requireConsent')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.7, mt: 0.5 }}>
                {t('notifications.emergencyAlert.settings.requireConsentDesc')}
              </Typography>
            </Box>
            <Switch
              checked={preferences.require_consent}
              onChange={(e) => setPreferences(prev => ({ ...prev, require_consent: e.target.checked }))}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: theme.palette.primary.main,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

          {/* Manual Override */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                {t('notifications.emergencyAlert.settings.manualOverride')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.7, mt: 0.5 }}>
                {t('notifications.emergencyAlert.settings.manualOverrideDesc')}
              </Typography>
            </Box>
            <Switch
              checked={preferences.allow_manual_override}
              onChange={(e) => setPreferences(prev => ({ ...prev, allow_manual_override: e.target.checked }))}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: theme.palette.primary.main,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          </Box>

          {/* Save Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              mt: 2,
              py: 1.5,
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmergencyAlertSettings;


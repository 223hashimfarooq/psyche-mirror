import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Divider,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Settings,
  Language,
  Palette,
  Security,
  Notifications,
  Delete,
  Save,
  PrivacyTip,
  Lock,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import EmergencyAlertSettings from '../components/EmergencyAlertSettings';

const SettingsPage = () => {
  const { currentUser, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [settings, setSettings] = useState({
    language: i18n.language || 'en',
    theme: 'light',
    notifications: true,
    voiceAssistant: true,
    wakeWordEnabled: localStorage.getItem('voice_assistant_background_mode') === 'true',
    dataSharing: false,
    emergencyContacts: true,
    autoSync: true,
  });
  const [showAlert, setShowAlert] = useState(false);

  // Sync settings language with i18n language when component mounts or language changes
  useEffect(() => {
    const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
    if (settings.language !== currentLang) {
      setSettings(prev => ({ ...prev, language: currentLang }));
    }
  }, [i18n.language]);

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
    
    // If language is changed, update i18n immediately and persist
    if (setting === 'language') {
      i18n.changeLanguage(value).then(() => {
        // Ensure it's saved to localStorage
        localStorage.setItem('i18nextLng', value);
        // Force a re-render of all components using translations
        window.dispatchEvent(new Event('languagechange'));
      });
    }
    
    // If wake word is changed, save to localStorage immediately
    if (setting === 'wakeWordEnabled') {
      localStorage.setItem('voice_assistant_background_mode', value ? 'true' : 'false');
      // Trigger custom event so VoiceAssistant component can react (storage event only works cross-tab)
      window.dispatchEvent(new CustomEvent('voiceAssistantSettingChanged', {
        detail: { key: 'voice_assistant_background_mode', value: value ? 'true' : 'false' }
      }));
    }
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('psycheMirrorSettings', JSON.stringify(settings));
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleDeleteAccount = () => {
    if (window.confirm(t('settings.dataManagement.deleteConfirm'))) {
      // Implement account deletion logic
      logout();
      navigate('/');
    }
  };

  const handleExportData = () => {
    // Implement data export logic
    alert(t('settings.dataManagement.exportData') + ' - ' + t('common.loading'));
  };

  const settingsSections = [
    {
      title: t('settings.general.title'),
      icon: <Settings />,
      items: [
        {
          label: t('settings.general.language'),
          type: 'select',
          value: settings.language,
          onChange: (value) => handleSettingChange('language', value),
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
          ],
        },
        {
          label: t('settings.general.theme'),
          type: 'select',
          value: settings.theme,
          onChange: (value) => handleSettingChange('theme', value),
          options: [
            { value: 'light', label: t('settings.general.light') },
            { value: 'dark', label: t('settings.general.dark') },
            { value: 'auto', label: t('settings.general.auto') },
          ],
        },
      ],
    },
    {
      title: t('settings.privacy.title'),
      icon: <Security />,
      items: [
        {
          label: t('settings.privacy.dataSharing'),
          type: 'switch',
          value: settings.dataSharing,
          onChange: (value) => handleSettingChange('dataSharing', value),
          description: t('settings.privacy.dataSharingDesc'),
        },
        {
          label: t('settings.privacy.emergencyContacts'),
          type: 'switch',
          value: settings.emergencyContacts,
          onChange: (value) => handleSettingChange('emergencyContacts', value),
          description: t('settings.privacy.emergencyContactsDesc'),
        },
      ],
    },
    {
      title: t('settings.notifications.title'),
      icon: <Notifications />,
      items: [
        {
          label: t('settings.notifications.pushNotifications'),
          type: 'switch',
          value: settings.notifications,
          onChange: (value) => handleSettingChange('notifications', value),
          description: t('settings.notifications.pushNotificationsDesc'),
        },
        {
          label: t('settings.notifications.voiceAssistant'),
          type: 'switch',
          value: settings.voiceAssistant,
          onChange: (value) => handleSettingChange('voiceAssistant', value),
          description: t('settings.notifications.voiceAssistantDesc'),
        },
        {
          label: 'Wake Word Detection',
          type: 'switch',
          value: settings.wakeWordEnabled,
          onChange: (value) => handleSettingChange('wakeWordEnabled', value),
          description: 'Enable "Hi Psyche" wake word to activate voice assistant without clicking the button. This allows hands-free operation.',
        },
        {
          label: t('settings.notifications.autoSync'),
          type: 'switch',
          value: settings.autoSync,
          onChange: (value) => handleSettingChange('autoSync', value),
          description: t('settings.notifications.autoSyncDesc'),
        },
      ],
    },
  ];

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
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', ml: 2 }}>
            {t('settings.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            sx={{ 
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            {t('settings.saveChanges')}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Alert */}
        {showAlert && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              bgcolor: alpha('#4CAF50', 0.2),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              '& .MuiAlert-icon': {
                color: '#4CAF50',
              }
            }}
          >
            {t('settings.settingsSaved')}
          </Alert>
        )}


        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
          >
            <Card sx={{ 
              mb: 3,
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ color: '#ffffff', opacity: 0.9 }}>
                    {section.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, ml: 2, color: '#ffffff' }}>
                    {section.title}
                  </Typography>
                </Box>
                
                {section.items.map((item, itemIndex) => (
                  <Box key={itemIndex}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                          {item.label}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.7, mt: 0.5 }}>
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                      
                      {item.type === 'switch' ? (
                        <Switch
                          checked={item.value}
                          onChange={(e) => item.onChange(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: theme.palette.primary.main,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: theme.palette.primary.main,
                            },
                          }}
                        />
                      ) : item.type === 'select' ? (
                        <FormControl sx={{ minWidth: 120 }}>
                          <Select
                            value={item.value}
                            onChange={(e) => item.onChange(e.target.value)}
                            size="small"
                            sx={{
                              bgcolor: alpha('#ffffff', 0.1),
                              color: '#ffffff',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.3)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.5)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#ffffff',
                              },
                              '& .MuiSvgIcon-root': {
                                color: '#ffffff',
                              },
                            }}
                          >
                            {item.options.map((option) => (
                              <MenuItem key={option.value} value={option.value} sx={{ color: '#000000' }}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : null}
                    </Box>
                    {itemIndex < section.items.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Privacy & Data Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{ 
            mb: 3, 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Lock sx={{ mr: 2, fontSize: 30, color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  {t('settings.privacy.title')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 3, color: '#ffffff', opacity: 0.8 }}>
                Manage your privacy settings, encryption, MFA, and data control options. Full control over your sensitive mental health information.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Security />}
                onClick={() => navigate(currentUser?.role === 'patient' ? '/patient/privacy' : '/doctor/privacy')}
                sx={{ 
                  py: 1.5,
                  bgcolor: theme.palette.primary.main,
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
              >
                {t('settings.privacy.openPrivacySettings')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card sx={{ 
            mb: 3,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PrivacyTip sx={{ mr: 2, fontSize: 30, color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  {t('settings.dataManagement.title')}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleExportData}
                    sx={{ 
                      py: 1.5,
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: '#ffffff',
                      '&:hover': {
                        borderColor: '#ffffff',
                        bgcolor: alpha('#ffffff', 0.1),
                      }
                    }}
                  >
                    {t('settings.dataManagement.exportData')}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleDeleteAccount}
                    sx={{ 
                      py: 1.5,
                      borderColor: 'rgba(244, 67, 54, 0.5)',
                      color: '#f44336',
                      '&:hover': {
                        borderColor: '#f44336',
                        bgcolor: alpha('#f44336', 0.1),
                      }
                    }}
                  >
                    {t('settings.dataManagement.deleteAccount')}
                  </Button>
                </Grid>
              </Grid>
              
              <Typography variant="body2" sx={{ mt: 2, color: '#ffffff', opacity: 0.8 }}>
                {t('settings.dataManagement.dataRights')}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Alert Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <EmergencyAlertSettings />
        </motion.div>

        {/* Privacy Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', fontWeight: 600 }}>
                {t('settings.compliance.title')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {t('settings.compliance.hipaa')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ffffff', opacity: 0.7 }}>
                      {t('settings.compliance.hipaaDesc')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {t('settings.compliance.gdpr')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ffffff', opacity: 0.7 }}>
                      {t('settings.compliance.gdprDesc')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {t('settings.compliance.soc2')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ffffff', opacity: 0.7 }}>
                      {t('settings.compliance.soc2Desc')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SettingsPage;
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Link,
} from '@mui/material';
import {
  Warning,
  Phone,
  Close,
  LocalHospital,
  Psychology,
  SelfImprovement,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const CrisisAlertPopup = ({ open, onClose, distressData, onDismiss }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && distressData) {
      fetchRecommendations();
    }
  }, [open, distressData]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.getCrisisRecommendations(i18n.language || 'en');
      if (response.success) {
        setRecommendations(response.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallHelpline = (number) => {
    window.location.href = `tel:${number}`;
  };

  const handleTextHelpline = (number) => {
    window.location.href = `sms:${number}`;
  };

  if (!open) return null;

  const severity = distressData?.fusionResult?.severity || 'high';
  const isCrisis = distressData?.fusionResult?.isCrisis || false;

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: alpha('#ffffff', 0.95),
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning sx={{ fontSize: 40, color: theme.palette.error.main }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
              {t('notifications.emergencyAlert.crisisPopup.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {t('notifications.emergencyAlert.crisisPopup.subtitle')}
            </Typography>
          </Box>
          <Chip
            label={t(`notifications.emergencyAlert.severity.${severity}`)}
            color={severity === 'critical' ? 'error' : 'warning'}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('notifications.emergencyAlert.crisisPopup.message')}
        </Alert>

        {/* Helplines */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone sx={{ color: theme.palette.primary.main }} />
          {t('notifications.emergencyAlert.crisisPopup.helplines')}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : recommendations?.helplines ? (
          <List sx={{ mb: 3 }}>
            {recommendations.helplines.map((helpline, index) => (
              <ListItem
                key={index}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                  mb: 1,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <ListItemIcon>
                  <Phone sx={{ color: theme.palette.primary.main }} />
                </ListItemIcon>
                <ListItemText
                  primary={helpline.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      {helpline.number && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Phone />}
                          onClick={() => handleCallHelpline(helpline.number)}
                          sx={{ minWidth: 'auto' }}
                        >
                          {helpline.number}
                        </Button>
                      )}
                      {helpline.text && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleTextHelpline(helpline.text)}
                          sx={{ minWidth: 'auto' }}
                        >
                          {t('notifications.emergencyAlert.crisisPopup.text')} {helpline.text}
                        </Button>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('notifications.emergencyAlert.crisisPopup.noHelplines')}
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Emergency Number */}
        {recommendations?.emergencyNumber && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {t('notifications.emergencyAlert.crisisPopup.emergencyNumber')}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="error"
              size="large"
              startIcon={<Phone />}
              onClick={() => handleCallHelpline(recommendations.emergencyNumber)}
              sx={{ py: 1.5, fontSize: '1.2rem', fontWeight: 600 }}
            >
              {recommendations.emergencyNumber}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Therapist Resources */}
        {recommendations?.therapistResources && recommendations.therapistResources.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology sx={{ color: theme.palette.primary.main }} />
              {t('notifications.emergencyAlert.crisisPopup.therapistResources')}
            </Typography>
            <List>
              {recommendations.therapistResources.map((resource, index) => (
                <ListItem
                  key={index}
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    <LocalHospital sx={{ color: theme.palette.secondary.main }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={resource.name}
                    secondary={
                      resource.url ? (
                        <Link href={resource.url} target="_blank" rel="noopener">
                          {t('notifications.emergencyAlert.crisisPopup.viewDirectory')}
                        </Link>
                      ) : resource.contact?.phone ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Phone />}
                          onClick={() => handleCallHelpline(resource.contact.phone)}
                        >
                          {resource.contact.phone}
                        </Button>
                      ) : null
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Self-Help Resources */}
        {recommendations?.selfHelpResources && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SelfImprovement sx={{ color: theme.palette.primary.main }} />
              {t('notifications.emergencyAlert.crisisPopup.selfHelp')}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('notifications.emergencyAlert.crisisPopup.selfHelpMessage')}
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onDismiss} color="inherit">
          {t('notifications.emergencyAlert.crisisPopup.dismiss')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircle />}
          onClick={onClose}
        >
          {t('notifications.emergencyAlert.crisisPopup.understood')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CrisisAlertPopup;


import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  VisibilityOff as AnonymizeIcon,
  History as HistoryIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PrivacySettingsPage = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [mfaStatus, setMfaStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAnonymizeDialog, setShowAnonymizeDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, mfaRes, logsRes] = await Promise.all([
        apiService.getPrivacySettings(),
        apiService.getMFAStatus(),
        apiService.getAuditLogs(20, 0),
      ]);

      if (settingsRes.success) {
        setSettings(settingsRes.settings);
      }
      if (mfaRes.success) {
        setMfaStatus(mfaRes);
      }
      if (logsRes.success) {
        setAuditLogs(logsRes.logs);
      }
    } catch (error) {
      console.error('Error loading privacy data:', error);
      setMessage({ type: 'error', text: 'Failed to load privacy settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await apiService.updatePrivacySettings({
        dataRetentionDays: settings.data_retention_days,
        allowDataSharing: settings.allow_data_sharing,
        allowAnalytics: settings.allow_analytics,
        encryptionEnabled: settings.encryption_enabled,
        anonymizeData: settings.anonymize_data,
        gdprConsent: settings.gdpr_consent,
      });

      if (response.success) {
        setSettings(response.settings);
        setMessage({ type: 'success', text: t('privacy.settingsUpdated') });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: t('privacy.settingsUpdateFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleSetupMFA = async () => {
    try {
      const response = await apiService.setupMFA();
      if (response.success) {
        setMfaSetup(response);
        setMessage({ type: 'info', text: t('privacy.scanQR') });
      }
    } catch (error) {
      console.error('Error setting up MFA:', error);
      setMessage({ type: 'error', text: t('privacy.mfaSetupFailed') });
    }
  };

  const handleVerifyMFA = async () => {
    try {
      if (!mfaToken || mfaToken.length !== 6) {
        setMessage({ type: 'error', text: t('privacy.validCodeRequired') });
        return;
      }
      
      const response = await apiService.verifyMFA(mfaToken);
      if (response.success) {
        setMfaSetup(null);
        setMfaToken('');
        setMessage({ type: 'success', text: t('privacy.mfaEnabledSuccess') });
        await loadData();
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      const errorMessage = error.message || 'Invalid MFA token';
      if (errorMessage.includes('Invalid MFA token')) {
        setMessage({ type: 'error', text: t('privacy.invalidCode') });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
    }
  };

  const handleDisableMFA = async () => {
    try {
      const response = await apiService.disableMFA('');
      if (response.success) {
        setMessage({ type: 'success', text: t('privacy.mfaDisabledSuccess') });
        await loadData();
      }
    } catch (error) {
      console.error('Error disabling MFA:', error);
      setMessage({ type: 'error', text: t('privacy.mfaDisableFailed') });
    }
  };

  const handleRequestDeletion = async () => {
    try {
      const response = await apiService.requestDataDeletion(deleteReason);
      if (response.success) {
        setShowDeleteDialog(false);
        setDeleteReason('');
        setMessage({ type: 'success', text: t('privacy.deletionRequested') });
      }
    } catch (error) {
      console.error('Error requesting deletion:', error);
      setMessage({ type: 'error', text: t('privacy.deletionFailed') });
    }
  };

  const handleRequestAnonymization = async () => {
    try {
      const response = await apiService.requestDataAnonymization(deleteReason);
      if (response.success) {
        setShowAnonymizeDialog(false);
        setDeleteReason('');
        setMessage({ type: 'success', text: t('privacy.anonymizationRequested') });
      }
    } catch (error) {
      console.error('Error requesting anonymization:', error);
      setMessage({ type: 'error', text: t('privacy.anonymizationFailed') });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>{t('common.loading')}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        <SecurityIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        {t('privacy.privacySecurity')}
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Privacy Settings */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('privacy.title')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              {settings && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.encryption_enabled}
                        onChange={(e) => handleSettingChange('encryption_enabled', e.target.checked)}
                      />
                    }
                    label={t('privacy.encryption')}
                    sx={{ mb: 2, display: 'block' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 4 }}>
                    Encrypt your sensitive data during transmission and storage (HIPAA/GDPR compliant)
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.gdpr_consent}
                        onChange={(e) => handleSettingChange('gdpr_consent', e.target.checked)}
                      />
                    }
                    label={t('privacy.gdprConsent')}
                    sx={{ mb: 2, display: 'block' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 4 }}>
                    I consent to the processing of my personal data in accordance with GDPR regulations
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allow_data_sharing}
                        onChange={(e) => handleSettingChange('allow_data_sharing', e.target.checked)}
                      />
                    }
                    label={t('privacy.dataSharing')}
                    sx={{ mb: 2, display: 'block' }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allow_analytics}
                        onChange={(e) => handleSettingChange('allow_analytics', e.target.checked)}
                      />
                    }
                    label={t('privacy.analytics')}
                    sx={{ mb: 2, display: 'block' }}
                  />

                  <TextField
                    label={t('privacy.retentionDays')}
                    type="number"
                    value={settings.data_retention_days}
                    onChange={(e) => handleSettingChange('data_retention_days', parseInt(e.target.value))}
                    fullWidth
                    sx={{ mt: 2 }}
                  />

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveSettings}
                      disabled={saving}
                    >
                      {saving ? t('common.loading') : t('common.save')}
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* MFA Settings */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('privacy.mfa')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              {mfaStatus?.mfaEnabled ? (
                <Box>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={t('privacy.mfaEnabled')}
                    color="success"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Your account is protected with multi-factor authentication.
                  </Typography>
                  {mfaStatus?.unusedBackupCodes && mfaStatus.unusedBackupCodes.length > 0 && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Unused Backup Codes ({mfaStatus.unusedBackupCodes.length} remaining):
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {mfaStatus.unusedBackupCodes.map((code, index) => (
                          <span key={index} style={{ display: 'inline-block', margin: '2px', padding: '2px 6px', backgroundColor: '#fff', borderRadius: '3px' }}>
                            {code}
                          </span>
                        ))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Save these codes in a secure place. Once used, they cannot be reused.
                      </Typography>
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisableMFA}
                  >
                    {t('privacy.disableMFA')}
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add an extra layer of security to your account with MFA.
                  </Typography>
                  {!mfaSetup ? (
                    <Button
                      variant="contained"
                      startIcon={<QrCodeIcon />}
                      onClick={handleSetupMFA}
                    >
                      {t('privacy.setupMFA')}
                    </Button>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </Typography>
                      <Box sx={{ textAlign: 'center', my: 2 }}>
                        <img src={mfaSetup.qrCode} alt="MFA QR Code" style={{ maxWidth: '200px' }} />
                      </Box>
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, border: '2px solid', borderColor: 'warning.main' }}>
                        <Typography variant="subtitle2" color="error" sx={{ mb: 1, fontWeight: 'bold' }}>
                          ⚠️ IMPORTANT: Save These Backup Codes!
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                          If you lose access to your authenticator app, you'll need these codes to log in. 
                          <strong> Save them in a secure place now!</strong>
                        </Typography>
                        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, mb: 1 }}>
                          <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {mfaSetup.backupCodes.map((code, index) => (
                              <span key={index} style={{ display: 'inline-block', margin: '4px', padding: '4px 8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                {code}
                              </span>
                            ))}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const codesText = mfaSetup.backupCodes.join('\n');
                            navigator.clipboard.writeText(codesText);
                            setMessage({ type: 'success', text: 'Backup codes copied to clipboard!' });
                          }}
                          sx={{ mr: 1 }}
                        >
                          Copy All Codes
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const codesText = `PsycheMirror Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${mfaSetup.backupCodes.join('\n')}\n\nKeep these codes safe!`;
                            const blob = new Blob([codesText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'psychemirror-backup-codes.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                            setMessage({ type: 'success', text: 'Backup codes downloaded!' });
                          }}
                        >
                          Download as Text File
                        </Button>
                      </Box>
                      <TextField
                        label={t('privacy.enterCode')}
                        value={mfaToken}
                        onChange={(e) => setMfaToken(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                        inputProps={{ maxLength: 6 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleVerifyMFA}
                        disabled={mfaToken.length !== 6}
                      >
                        {t('privacy.verifyMFA')}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Data Control */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('privacy.dataControl')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowDeleteDialog(true)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {t('privacy.requestDeletion')}
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {t('privacy.deletionDescription')}
                </Typography>
              </Box>

              <Box>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<AnonymizeIcon />}
                  onClick={() => setShowAnonymizeDialog(true)}
                  fullWidth
                >
                  {t('privacy.requestAnonymization')}
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('privacy.anonymizationDescription')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Logs */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Activity
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                {auditLogs.slice(0, 10).map((log) => (
                  <ListItem key={log.id}>
                    <ListItemText
                      primary={log.action_type.replace(/_/g, ' ')}
                      secondary={new Date(log.created_at).toLocaleString()}
                    />
                  </ListItem>
                ))}
                {auditLogs.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No activity logs yet
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Request Data Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Warning: This action cannot be undone. All your data will be permanently deleted.
          </Typography>
          <TextField
            label={t('privacy.reason')}
            multiline
            rows={3}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleRequestDeletion} color="error" variant="contained">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Anonymize Dialog */}
      <Dialog open={showAnonymizeDialog} onClose={() => setShowAnonymizeDialog(false)}>
        <DialogTitle>Request Data Anonymization</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Your data will be anonymized but kept for research purposes. Personal identifiers will be removed.
          </Typography>
          <TextField
            label={t('privacy.reason')}
            multiline
            rows={3}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnonymizeDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleRequestAnonymization} color="warning" variant="contained">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrivacySettingsPage;


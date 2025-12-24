import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Person,
  CheckCircle,
  Cancel,
  Email,
  Phone,
  AttachMoney,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const PatientRequests = ({ onUpdate }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseForm, setResponseForm] = useState({
    status: 'accepted',
    consultationFee: '',
    sessionFee: '',
    notes: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getDoctorRequests();
      if (response.success) {
        setRequests(response.requests || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponseDialog = (request) => {
    setSelectedRequest(request);
    setResponseForm({
      status: 'accepted',
      consultationFee: request.consultation_fee || '',
      sessionFee: request.session_fee || '',
      notes: request.special_notes || ''
    });
    setResponseDialogOpen(true);
  };

  const handleCloseResponseDialog = () => {
    setResponseDialogOpen(false);
    setSelectedRequest(null);
    setResponseForm({
      status: 'accepted',
      consultationFee: '',
      sessionFee: '',
      notes: ''
    });
  };

  const handleSubmitResponse = async () => {
    try {
      if (!selectedRequest) return;

      // For rejections, use existing fees; for acceptances, use form values or existing
      let consultationFee, sessionFee;
      
      if (responseForm.status === 'rejected') {
        // When rejecting, keep existing fees
        consultationFee = selectedRequest.consultation_fee || null;
        sessionFee = selectedRequest.session_fee || null;
      } else {
        // When accepting, use form values or existing fees
        consultationFee = responseForm.consultationFee && responseForm.consultationFee !== '' 
          ? parseFloat(responseForm.consultationFee) 
          : (selectedRequest.consultation_fee || null);
        sessionFee = responseForm.sessionFee && responseForm.sessionFee !== '' 
          ? parseFloat(responseForm.sessionFee) 
          : (selectedRequest.session_fee || null);
      }

      const response = await api.updateRelationshipStatus(
        selectedRequest.relationship_id,
        responseForm.status,
        consultationFee,
        sessionFee,
        responseForm.notes || null
      );

      if (response.success) {
        handleCloseResponseDialog();
        loadRequests();
        if (onUpdate) onUpdate();
        alert(responseForm.status === 'accepted' 
          ? 'Request accepted successfully!' 
          : 'Request rejected successfully.');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert(`Failed to submit response: ${error.message || 'Please try again.'}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <CardContent>
          <Alert severity="info" sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            '& .MuiAlert-icon': {
              color: '#ffffff'
            }
          }}>
            {t('requests.noPendingPatientRequests')}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
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
            {t('requests.pendingPatientRequests')} ({requests.length})
          </Typography>
          <List>
            {requests.map((request, index) => (
              <motion.div
                key={request.relationship_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card sx={{ 
                  mb: 2,
                  bgcolor: alpha('#ffffff', 0.1),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.15),
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Avatar 
                        src={request.patient_profile_picture && request.patient_profile_picture !== 'undefined' 
                          ? request.patient_profile_picture 
                          : null}
                        sx={{ mr: 2, bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}
                      >
                        <Person />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ 
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          fontWeight: 600,
                          mb: 1
                        }}>
                          {request.patient_name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ 
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.9,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <Email sx={{ fontSize: 16 }} /> {request.patient_email}
                          </Typography>
                          {request.patient_phone && (
                            <Typography variant="body2" sx={{ 
                              color: '#ffffff',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                              opacity: 0.9,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <Phone sx={{ fontSize: 16 }} /> {request.patient_phone}
                            </Typography>
                          )}
                        </Box>
                        {request.special_notes && (
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha('#ffffff', 0.1), borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ 
                              color: '#ffffff',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                              opacity: 0.9,
                              fontStyle: 'italic'
                            }}>
                              "{request.special_notes}"
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {request.consultation_fee && (
                            <Chip
                              icon={<AttachMoney />}
                              label={t('fees.consultationFee') + ': $' + request.consultation_fee}
                              size="small"
                              sx={{
                                bgcolor: alpha('#ffffff', 0.2),
                                color: '#ffffff',
                              }}
                            />
                          )}
                          {request.session_fee && (
                            <Chip
                              icon={<AttachMoney />}
                              label={t('fees.individualSession') + ': $' + request.session_fee}
                              size="small"
                              sx={{
                                bgcolor: alpha('#ffffff', 0.2),
                                color: '#ffffff',
                              }}
                            />
                          )}
                          <Chip
                            label={t('requests.submittedDate') + ': ' + new Date(request.request_created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'de-DE')}
                            size="small"
                            sx={{
                              bgcolor: alpha('#ffffff', 0.2),
                              color: '#ffffff',
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleOpenResponseDialog(request)}
                            sx={{
                              bgcolor: alpha('#4caf50', 0.3),
                              color: '#ffffff',
                              '&:hover': {
                                bgcolor: alpha('#4caf50', 0.5),
                              }
                            }}
                          >
                            {t('requests.accept')}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => {
                              setSelectedRequest(request);
                              setResponseForm({
                                status: 'rejected',
                                consultationFee: request.consultation_fee || '',
                                sessionFee: request.session_fee || '',
                                notes: ''
                              });
                              setResponseDialogOpen(true);
                            }}
                            sx={{
                              borderColor: alpha('#f44336', 0.5),
                              color: '#ffffff',
                              '&:hover': {
                                borderColor: '#f44336',
                                bgcolor: alpha('#f44336', 0.2),
                              }
                            }}
                          >
                            {t('requests.reject')}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog 
        open={responseDialogOpen} 
        onClose={handleCloseResponseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#ffffff', 0.95),
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle>
          {responseForm.status === 'accepted' ? t('requests.accept') : t('requests.reject')} {t('requests.patientRequest')}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('schedule.patient')}: <strong>{selectedRequest.patient_name}</strong>
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            select
            label={t('schedule.status')}
            value={responseForm.status}
            onChange={(e) => setResponseForm(prev => ({ ...prev, status: e.target.value }))}
            sx={{ mt: 2 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="accepted">{t('requests.accept')}</option>
            <option value="rejected">{t('requests.reject')}</option>
          </TextField>
          <TextField
            fullWidth
            label={`${t('fees.consultationFee')} (USD)`}
            type="number"
            value={responseForm.consultationFee}
            onChange={(e) => setResponseForm(prev => ({ ...prev, consultationFee: e.target.value }))}
            sx={{ mt: 2 }}
            disabled={responseForm.status === 'rejected'}
          />
          <TextField
            fullWidth
            label={`${t('fees.individualSession')} (USD)`}
            type="number"
            value={responseForm.sessionFee}
            onChange={(e) => setResponseForm(prev => ({ ...prev, sessionFee: e.target.value }))}
            sx={{ mt: 2 }}
            disabled={responseForm.status === 'rejected'}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label={`${t('schedule.notes')} (${t('common.optional')})`}
            value={responseForm.notes}
            onChange={(e) => setResponseForm(prev => ({ ...prev, notes: e.target.value }))}
            sx={{ mt: 2 }}
            placeholder={t('schedule.notesPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResponseDialog}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleSubmitResponse} 
            variant="contained"
            color={responseForm.status === 'accepted' ? 'success' : 'error'}
          >
            {responseForm.status === 'accepted' ? t('requests.accept') : t('requests.reject')} {t('requests.request')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientRequests;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  Phone,
  Email,
  Person,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const EmergencyContactsPage = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'other',
    is_primary: false,
    notify_on_critical: true,
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/emergency-contacts');
      // API service returns data directly, not wrapped in response.data
      if (response && response.success) {
        setContacts(response.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setMessage({ type: 'error', text: t('notifications.emergencyContacts.fetchError') });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        relationship: contact.relationship || 'other',
        is_primary: contact.is_primary || false,
        notify_on_critical: contact.notify_on_critical !== undefined ? contact.notify_on_critical : true,
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        relationship: 'other',
        is_primary: false,
        notify_on_critical: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: 'other',
      is_primary: false,
      notify_on_critical: true,
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name || (!formData.phone && !formData.email)) {
        setMessage({ type: 'error', text: t('notifications.emergencyContacts.validationError') });
        return;
      }

      if (editingContact) {
        await api.put(`/notifications/emergency-contacts/${editingContact.id}`, formData);
        setMessage({ type: 'success', text: t('notifications.emergencyContacts.updateSuccess') });
      } else {
        await api.post('/notifications/emergency-contacts', formData);
        setMessage({ type: 'success', text: t('notifications.emergencyContacts.addSuccess') });
      }
      
      handleCloseDialog();
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      setMessage({ type: 'error', text: t('notifications.emergencyContacts.saveError') });
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm(t('notifications.emergencyContacts.deleteConfirm'))) {
      return;
    }

    try {
      await api.delete(`/notifications/emergency-contacts/${contactId}`);
      setMessage({ type: 'success', text: t('notifications.emergencyContacts.deleteSuccess') });
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      setMessage({ type: 'error', text: t('notifications.emergencyContacts.deleteError') });
    }
  };

  const relationships = [
    { value: 'family', label: t('notifications.emergencyContacts.relationships.family') },
    { value: 'friend', label: t('notifications.emergencyContacts.relationships.friend') },
    { value: 'doctor', label: t('notifications.emergencyContacts.relationships.doctor') },
    { value: 'therapist', label: t('notifications.emergencyContacts.relationships.therapist') },
    { value: 'other', label: t('notifications.emergencyContacts.relationships.other') },
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
      <AppBar
        position="sticky"
        sx={{
          bgcolor: alpha('#ffffff', 0.1),
          backdropFilter: 'blur(20px)',
          boxShadow: 'none',
          zIndex: 10,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#ffffff' }}>
            {t('notifications.emergencyContacts.title')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: '#ffffff',
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.9),
              }
            }}
          >
            {t('notifications.emergencyContacts.addContact')}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3, bgcolor: alpha('#ffffff', 0.1) }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <Card sx={{ 
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
              {t('notifications.emergencyContacts.description')}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#ffffff' }} />
              </Box>
            ) : contacts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Person sx={{ fontSize: 64, color: 'rgba(255,255,255,0.5)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                  {t('notifications.emergencyContacts.noContacts')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  {t('notifications.emergencyContacts.addFirstContact')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    bgcolor: '#ffffff',
                    color: theme.palette.primary.main,
                  }}
                >
                  {t('notifications.emergencyContacts.addContact')}
                </Button>
              </Box>
            ) : (
              <List>
                {contacts.map((contact, index) => (
                  <React.Fragment key={contact.id}>
                    <ListItem
                      sx={{
                        bgcolor: alpha('#ffffff', contact.is_primary ? 0.25 : 0.1),
                        borderRadius: 2,
                        mb: 1.5,
                        py: 2,
                        px: 2,
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                            {contact.name}
                          </Typography>
                          {contact.is_primary && (
                            <Chip
                              icon={<Star />}
                              label={t('notifications.emergencyContacts.primary')}
                              size="small"
                              sx={{
                                bgcolor: '#FFD700',
                                color: '#000',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          <Chip
                            label={relationships.find(r => r.value === contact.relationship)?.label || contact.relationship}
                            size="small"
                            sx={{
                              bgcolor: alpha('#ffffff', 0.2),
                              color: '#ffffff',
                            }}
                          />
                        </Box>
                        {contact.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Phone sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                              {contact.phone}
                            </Typography>
                          </Box>
                        )}
                        {contact.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                              {contact.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            edge="end"
                            onClick={() => handleOpenDialog(contact)}
                            sx={{
                              color: '#ffffff',
                              bgcolor: alpha('#ffffff', 0.2),
                              '&:hover': {
                                bgcolor: alpha('#ffffff', 0.3),
                              }
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(contact.id)}
                            sx={{
                              color: '#f44336',
                              bgcolor: alpha('#f44336', 0.2),
                              '&:hover': {
                                bgcolor: alpha('#f44336', 0.3),
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < contacts.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
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
          {editingContact ? t('notifications.emergencyContacts.editContact') : t('notifications.emergencyContacts.addContact')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label={t('notifications.emergencyContacts.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={t('notifications.emergencyContacts.phone')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              type="tel"
            />
            <TextField
              label={t('notifications.emergencyContacts.email')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>{t('notifications.emergencyContacts.relationship')}</InputLabel>
              <Select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                label={t('notifications.emergencyContacts.relationship')}
              >
                {relationships.map((rel) => (
                  <MenuItem key={rel.value} value={rel.value}>
                    {rel.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('notifications.emergencyContacts.notifyOnCritical')}</InputLabel>
              <Select
                value={formData.notify_on_critical ? 'yes' : 'no'}
                onChange={(e) => setFormData({ ...formData, notify_on_critical: e.target.value === 'yes' })}
                label={t('notifications.emergencyContacts.notifyOnCritical')}
              >
                <MenuItem value="yes">{t('common.yes')}</MenuItem>
                <MenuItem value="no">{t('common.no')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('notifications.emergencyContacts.setAsPrimary')}</InputLabel>
              <Select
                value={formData.is_primary ? 'yes' : 'no'}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.value === 'yes' })}
                label={t('notifications.emergencyContacts.setAsPrimary')}
              >
                <MenuItem value="yes">{t('common.yes')}</MenuItem>
                <MenuItem value="no">{t('common.no')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyContactsPage;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Rating,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DoctorSearch = ({ onContactDoctor, onViewRelationship }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Function to translate specialization
  const translateSpecialization = (specialization) => {
    if (!specialization) return t('register.specializations.general');
    const specLower = specialization.toLowerCase();
    const specMap = {
      'psychology': 'register.specializations.general',
      'clinical psychology': 'register.specializations.clinical',
      'clinical': 'register.specializations.clinical',
      'counseling psychology': 'register.specializations.counseling',
      'counseling': 'register.specializations.counseling',
      'psychiatry': 'register.specializations.psychiatry',
      'therapy': 'register.specializations.therapy',
      'general': 'register.specializations.general',
      'general psychology': 'register.specializations.general'
    };
    const translationKey = specMap[specLower] || 'register.specializations.general';
    return t(translationKey);
  };
  const [doctors, setDoctors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    specialization: '',
    experience: '',
    location: '',
    sortBy: ''
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    message: ''
  });

  // Initial load - fetch all doctors and pending requests
  useEffect(() => {
    fetchDoctors();
    fetchPendingRequests();
  }, []);

  // Auto-fetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [searchFilters.specialization, searchFilters.experience, searchFilters.location, searchFilters.sortBy]);

  const fetchDoctors = async () => {
    console.log('🔍 DoctorSearch: Starting to fetch doctors...');
    console.log('🔍 Current user:', currentUser);
    console.log('🔍 Search filters:', searchFilters);
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
          console.log(`🔍 Adding filter: ${key}=${value}`);
        }
      });

      const url = `/doctors/search?${queryParams.toString()}`;
      console.log('🔍 API URL:', url);
      
      const response = await api.request(url);
      console.log('🔍 API Response:', response);
      
      if (response && response.doctors) {
        console.log(`🔍 Found ${response.doctors.length} doctors:`, response.doctors.map(d => d.name));
        setDoctors(response.doctors);
      } else {
        console.log('🔍 No doctors in response or invalid response structure');
        setDoctors([]);
      }
    } catch (error) {
      console.error('🔍 Error fetching doctors:', error);
      console.error('🔍 Error details:', error.message);
      setDoctors([]);
    } finally {
      setLoading(false);
      console.log('🔍 Loading set to false');
    }
  };


  const fetchPendingRequests = async () => {
    try {
      const response = await api.request('/doctors/relationships/my');
      const allRelationships = response.relationships || [];
      // Filter only pending relationships
      const pending = allRelationships.filter(rel => rel.status === 'pending');
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
    }
  };

  // Refresh pending requests when tab becomes active or periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleContactDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setContactDialogOpen(true);
  };

  const handleSendContactRequest = async () => {
    try {
      const response = await api.request('/doctors/contact', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          message: contactForm.message
        })
      });

      if (response.success) {
        alert('Contact request sent successfully!');
        setContactDialogOpen(false);
        setContactForm({ message: '' });
        fetchDoctors(); // Refresh to update relationship status
        fetchPendingRequests(); // Refresh pending requests
        if (onContactDoctor) onContactDoctor();
      }
    } catch (error) {
      console.error('Error sending contact request:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        alert('You already have a relationship with this doctor. Please check your existing relationships.');
      } else if (error.message && error.message.includes('Relationship already exists')) {
        alert('You already have a relationship with this doctor. Please check your existing relationships.');
      } else {
        alert(`Failed to send contact request: ${error.message || 'Please try again.'}`);
      }
    }
  };

  const getSpecializationColor = (specialization) => {
    const colors = {
      'psychology': '#2196F3',
      'psychiatry': '#4CAF50',
      'therapy': '#FF9800',
      'counseling': '#9C27B0',
      'default': '#757575'
    };
    return colors[specialization?.toLowerCase()] || colors.default;
  };

  return (
    <Box>
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{ 
            mb: 3,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600
              }}>
                {t('doctorSearch.pendingRequests')}
              </Typography>
              <Grid container spacing={2}>
                {pendingRequests.map((request, index) => (
                  <Grid item xs={12} sm={6} md={4} key={request.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Card sx={{ 
                        bgcolor: alpha('#ffffff', 0.1),
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <PersonIcon sx={{ mr: 1, color: '#ffffff' }} />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" sx={{ 
                                color: '#ffffff',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                fontWeight: 600
                              }}>
                                Dr. {request.doctor_name}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: '#ffffff',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                opacity: 0.9
                              }}>
                                {translateSpecialization(request.doctor_specialization)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip
                              label={t('doctorSearch.pendingRequests')}
                              color="warning"
                              size="small"
                            />
                            {request.session_fee && (
                              <Chip
                                label={`$${request.session_fee}/${t('doctorSearch.sessionUnit')}`}
                                size="small"
                                variant="outlined"
                                sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
                              />
                            )}
                          </Box>

                          <Typography variant="body2" sx={{ 
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.9,
                            mb: 1
                          }}>
                            {t('doctorSearch.started')}: {new Date(request.created_at).toLocaleDateString()}
                          </Typography>

                          {request.special_notes && (
                            <Typography variant="body2" sx={{ 
                              mt: 1, 
                              fontStyle: 'italic',
                              color: '#ffffff',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                              opacity: 0.9
                            }}>
                              "{request.special_notes}"
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card sx={{ 
          mb: 3,
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600
            }}>
              <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('doctorSearch.findYourDoctor')}
            </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>{t('doctorSearch.specialization')}</InputLabel>
                <Select
                  value={searchFilters.specialization}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, specialization: e.target.value }))}
                  label={t('doctorSearch.specialization')}
                  sx={{ 
                    '& .MuiSelect-select': { 
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                      textOverflow: 'clip'
                    }
                  }}
                >
                  <MenuItem value="">{t('doctorSearch.allSpecializations')}</MenuItem>
                  <MenuItem value="Psychology">{t('register.specializations.general')}</MenuItem>
                  <MenuItem value="Psychiatry">{t('register.specializations.psychiatry')}</MenuItem>
                  <MenuItem value="Counseling">{t('register.specializations.counseling')}</MenuItem>
                  <MenuItem value="Therapy">{t('register.specializations.therapy')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>{t('doctorSearch.experience')}</InputLabel>
                <Select
                  value={searchFilters.experience}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, experience: e.target.value }))}
                  label={t('doctorSearch.experience')}
                  sx={{ 
                    '& .MuiSelect-select': { 
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                      textOverflow: 'clip'
                    }
                  }}
                >
                  <MenuItem value="">{t('doctorSearch.anyExperience')}</MenuItem>
                  <MenuItem value="1">1+ {t('doctorSearch.years')}</MenuItem>
                  <MenuItem value="3">3+ {t('doctorSearch.years')}</MenuItem>
                  <MenuItem value="5">5+ {t('doctorSearch.years')}</MenuItem>
                  <MenuItem value="10">10+ {t('doctorSearch.years')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>{t('doctorSearch.location')}</InputLabel>
                <Select
                  value={searchFilters.location}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                  label={t('doctorSearch.location')}
                  sx={{ 
                    '& .MuiSelect-select': { 
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                      textOverflow: 'clip'
                    }
                  }}
                >
                  <MenuItem value="">{t('doctorSearch.allLocations')}</MenuItem>
                  <MenuItem value="New York">{t('doctorSearch.newYork')}</MenuItem>
                  <MenuItem value="Los Angeles">{t('doctorSearch.losAngeles')}</MenuItem>
                  <MenuItem value="Chicago">{t('doctorSearch.chicago')}</MenuItem>
                  <MenuItem value="Houston">{t('doctorSearch.houston')}</MenuItem>
                  <MenuItem value="Phoenix">{t('doctorSearch.phoenix')}</MenuItem>
                  <MenuItem value="Miami">{t('doctorSearch.miami')}</MenuItem>
                  <MenuItem value="Seattle">{t('doctorSearch.seattle')}</MenuItem>
                  <MenuItem value="Denver">{t('doctorSearch.denver')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={6} lg={3}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>{t('doctorSearch.sortBy')}</InputLabel>
                <Select
                  value={searchFilters.sortBy}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  label={t('doctorSearch.sortBy')}
                  sx={{ 
                    '& .MuiSelect-select': { 
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                      textOverflow: 'clip'
                    }
                  }}
                >
                  <MenuItem value="">{t('doctorSearch.default')}</MenuItem>
                  <MenuItem value="experience">{t('doctorSearch.experienceHighToLow')}</MenuItem>
                  <MenuItem value="name">{t('doctorSearch.nameAtoZ')}</MenuItem>
                  <MenuItem value="patients">{t('doctorSearch.patientCount')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 500
            }}>
              {t('doctorSearch.filtersAppliedAuto')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      </motion.div>


      {/* Doctors List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#ffffff' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {doctors.map((doctor, index) => (
            <Grid item xs={12} sm={6} md={4} key={doctor.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    transition: 'all 0.3s ease-in-out'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={doctor.profile_picture}
                      sx={{ width: 60, height: 60, mr: 2 }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        fontWeight: 600
                      }}>
                        Dr. {doctor.name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        {translateSpecialization(doctor.specialization)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={translateSpecialization(doctor.specialization)}
                      size="small"
                      sx={{
                        bgcolor: getSpecializationColor(doctor.specialization),
                        color: 'white',
                        mb: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ 
                      mt: 1,
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9
                    }}>
                      <StarIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {doctor.experience || 0} {t('doctorSearch.years')} {t('doctorSearch.experience').toLowerCase()}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9
                    }}>
                      <ScheduleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {t('doctorSearch.patients', { count: doctor.patient_count || 0 })}
                    </Typography>
                    {(doctor.default_session_fee || doctor.avg_session_fee) && (
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        <MoneyIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        ${doctor.default_session_fee || doctor.avg_session_fee}/${t('doctorSearch.sessionUnit')}
                      </Typography>
                    )}
                    {(doctor.default_consultation_fee) && (
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        <MoneyIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        Consultation: ${doctor.default_consultation_fee}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {doctor.has_existing_relationship ? (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => onViewRelationship(doctor)}
                        startIcon={<MessageIcon />}
                        sx={{
                          color: '#ffffff',
                          borderColor: 'rgba(255,255,255,0.5)',
                          '&:hover': {
                            borderColor: '#ffffff',
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        {doctor.relationship_status === 'pending' ? t('requests.pending') : 
                         doctor.relationship_status === 'accepted' ? t('doctorSearch.viewChat') : t('doctorSearch.viewStatus')}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleContactDoctor(doctor)}
                        startIcon={<MessageIcon />}
                        sx={{
                          bgcolor: alpha('#ffffff', 0.2),
                          color: '#ffffff',
                          '&:hover': {
                            bgcolor: alpha('#ffffff', 0.3)
                          }
                        }}
                      >
                        {t('doctorSearch.contactDoctor')}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {doctors.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Alert severity="info" sx={{ 
            mt: 2,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            '& .MuiAlert-icon': {
              color: '#ffffff'
            }
          }}>
            {t('doctorSearch.noDoctorsFoundMessage')}
          </Alert>
        </motion.div>
      )}

      {/* Contact Dialog */}
      <Dialog 
        open={contactDialogOpen} 
        onClose={() => setContactDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#ffffff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          fontWeight: 600
        }}>
          {t('doctorSearch.contactDoctorTitle', { name: selectedDoctor?.name || '' })}
        </DialogTitle>
        <DialogContent>
          {selectedDoctor && (
            <Box sx={{ mb: 2, p: 2, bgcolor: alpha('#ffffff', 0.1), borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 1, fontWeight: 600 }}>
                Doctor's Pricing:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }}>
                    Consultation Fee:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    ${selectedDoctor.default_consultation_fee || 100}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#ffffff', opacity: 0.9 }}>
                    Session Fee:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    ${selectedDoctor.default_session_fee || selectedDoctor.avg_session_fee || 150}
                  </Typography>
                </Grid>
              </Grid>
              <Typography variant="caption" sx={{ color: '#ffffff', opacity: 0.7, mt: 1, display: 'block' }}>
                {t('doctorSearch.pricesNote')}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('doctorSearch.contactMessage')}
            value={contactForm.message}
            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
            placeholder={t('contactDoctor.messagePlaceholder')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setContactDialogOpen(false)}
            sx={{ 
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSendContactRequest} 
            variant="contained"
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3)
              }
            }}
          >
            {t('doctorSearch.sendRequest')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorSearch;

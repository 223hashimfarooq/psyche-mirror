import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  Cake,
  LocationOn,
  Emergency,
  MedicalServices
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PatientProfile = ({ open, onClose, onProfileUpdate }) => {
  const { currentUser, updateUser } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return t('profile.notProvided');
    try {
      // Handle ISO date strings
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };
  
  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    emergency_contact: '',
    medical_history: '',
    profile_picture: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && currentUser) {
      fetchProfileData();
    }
  }, [open, currentUser]);

  const fetchProfileData = async () => {
    if (!currentUser || !currentUser.id) {
      console.error('No current user found');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching profile for user ID:', currentUser.id);
      const response = await api.getUserProfile(currentUser.id);
      console.log('Profile data received:', response);
      setProfileData(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to user data from context if API fails
      const fallbackData = {
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        date_of_birth: currentUser.date_of_birth || '',
        gender: currentUser.gender || '',
        address: currentUser.address || '',
        emergency_contact: currentUser.emergency_contact || '',
        medical_history: currentUser.medical_history || '',
        profile_picture: currentUser.profile_picture || ''
      };
      console.log('Using fallback data:', fallbackData);
      setProfileData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size too large! Please select an image smaller than 5MB.');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({
          ...profileData,
          profile_picture: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !currentUser.id) {
      alert('User not found. Please refresh the page and try again.');
      return;
    }
    
    setSaving(true);
    try {
      console.log('Saving profile data:', profileData);
      console.log('Current user:', currentUser);
      const response = await api.updateUser(currentUser.id, profileData);
      console.log('Profile update response:', response);
      
      // Update the user context with new data
      if (updateUser) {
        updateUser({
          ...currentUser,
          ...profileData
        });
      }
      
      // Notify parent component about profile update
      if (onProfileUpdate) {
        onProfileUpdate(profileData);
      }
      
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to update profile: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfileData(); // Reset to original data
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: alpha('#ffffff', 0.1),
        borderBottom: '1px solid rgba(255,255,255,0.2)',
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Person sx={{ color: '#ffffff' }} />
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
            {currentUser?.role === 'doctor' ? t('profile.doctorProfile') : t('profile.patientProfile')}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ 
        bgcolor: 'transparent',
        p: 3,
      }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3,
            bgcolor: alpha('#ffffff', 0.1),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 2,
          }}
        >
          {/* Profile Picture Section */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box position="relative">
              <Avatar
                src={profileData.profile_picture}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  border: '3px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <Person sx={{ fontSize: 60, color: '#ffffff' }} />
              </Avatar>
              {isEditing && (
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: theme.palette.primary.main,
                    color: '#ffffff',
                    border: '2px solid rgba(255,255,255,0.3)',
                    '&:hover': { 
                      bgcolor: theme.palette.primary.dark,
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <Edit />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </IconButton>
              )}
            </Box>
            {isEditing ? (
              <TextField
                fullWidth
                value={profileData.name}
                onChange={handleInputChange('name')}
                variant="outlined"
                size="small"
                placeholder={t('register.fullName')}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: alpha('#ffffff', 0.1),
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
                  '& .MuiInputBase-input': {
                    color: '#ffffff',
                  },
                }}
              />
            ) : (
                <Typography variant="h5" gutterBottom sx={{ color: '#ffffff', fontWeight: 600, textTransform: 'uppercase' }}>
                {profileData.name || (currentUser?.role === 'doctor' ? t('profile.doctorProfile') : t('profile.patientProfile'))}
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

          {/* Personal Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Email sx={{ color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="subtitle2" sx={{ color: '#ffffff', opacity: 0.8 }}>
                  {t('profile.email')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={profileData.email}
                  onChange={handleInputChange('email')}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#ffffff', 0.1),
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
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              ) : (
                <Typography variant="body1" sx={{ color: '#ffffff' }}>{profileData.email}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Phone sx={{ color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="subtitle2" sx={{ color: '#ffffff', opacity: 0.8 }}>
                  {t('profile.phone')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={profileData.phone}
                  onChange={handleInputChange('phone')}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#ffffff', 0.1),
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
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              ) : (
                <Typography variant="body1" sx={{ color: '#ffffff' }}>{profileData.phone || t('profile.notProvided')}</Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Cake sx={{ color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="subtitle2" sx={{ color: '#ffffff', opacity: 0.8 }}>
                  {t('profile.dateOfBirth')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  type="date"
                  value={formatDateForInput(profileData.date_of_birth)}
                  onChange={handleInputChange('date_of_birth')}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#ffffff', 0.1),
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
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              ) : (
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  {formatDate(profileData.date_of_birth)}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Person sx={{ color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="subtitle2" sx={{ color: '#ffffff', opacity: 0.8 }}>
                  {t('profile.gender')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  select
                  value={profileData.gender}
                  onChange={handleInputChange('gender')}
                  variant="outlined"
                  size="small"
                  SelectProps={{ native: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#ffffff', 0.1),
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
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                >
                  <option value="">{t('profile.selectGender')}</option>
                  <option value="male">{t('profile.male')}</option>
                  <option value="female">{t('profile.female')}</option>
                  <option value="other">{t('profile.other')}</option>
                </TextField>
              ) : (
                <Typography variant="body1" sx={{ color: '#ffffff', textTransform: 'capitalize' }}>
                  {profileData.gender || t('profile.notProvided')}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocationOn sx={{ color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="subtitle2" sx={{ color: '#ffffff', opacity: 0.8 }}>
                  {t('profile.address')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={profileData.address}
                  onChange={handleInputChange('address')}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#ffffff', 0.1),
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
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              ) : (
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  {profileData.address || t('profile.notProvided')}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Emergency sx={{ color: '#ffffff', opacity: 0.9 }} />
                <Typography variant="subtitle2" sx={{ color: '#ffffff', opacity: 0.8 }}>
                  {t('profile.emergencyContact')}
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={profileData.emergency_contact}
                  onChange={handleInputChange('emergency_contact')}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#ffffff', 0.1),
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
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              ) : (
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  {profileData.emergency_contact || t('profile.notProvided')}
                </Typography>
              )}
            </Grid>

            {currentUser?.role !== 'doctor' && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MedicalServices sx={{ color: '#ffffff', opacity: 0.9 }} />
                  <Typography variant="subtitle2" sx={{ color: '#ffffff', opacity: 0.8 }}>
                    {t('profile.medicalHistory')}
                  </Typography>
                </Box>
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={profileData.medical_history}
                    onChange={handleInputChange('medical_history')}
                    variant="outlined"
                    size="small"
                    placeholder={t('profile.medicalHistory') + '...'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: alpha('#ffffff', 0.1),
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
                      '& .MuiInputBase-input': {
                        color: '#ffffff',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255,255,255,0.5)',
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ color: '#ffffff' }}>
                    {profileData.medical_history || t('profile.noMedicalHistory')}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ 
        bgcolor: alpha('#ffffff', 0.1),
        borderTop: '1px solid rgba(255,255,255,0.2)',
        p: 2,
      }}>
        {isEditing ? (
          <>
            <Button 
              onClick={handleCancel} 
              startIcon={<Cancel />}
              sx={{ 
                color: '#ffffff',
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.1),
                }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<Save />}
              disabled={saving}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: '#ffffff',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
                '&:disabled': {
                  bgcolor: alpha('#ffffff', 0.2),
                  color: alpha('#ffffff', 0.5),
                }
              }}
            >
              {saving ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={onClose}
              sx={{ 
                color: '#ffffff',
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.1),
                }
              }}
            >
              {t('common.close')}
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
              variant="contained"
              startIcon={<Edit />}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: '#ffffff',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                }
              }}
            >
              {t('profile.editProfile')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PatientProfile;

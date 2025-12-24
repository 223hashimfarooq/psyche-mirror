import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Button,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import DoctorSearch from './DoctorSearch';
import DoctorChat from './DoctorChat';
import api from '../services/api';

const DoctorTab = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [relationships, setRelationships] = useState([]);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [loading, setLoading] = useState(false);
  const activeTabRef = useRef(0);
  const selectedRelationshipRef = useRef(null);

  // Function to translate specialization
  const translateSpecialization = (specialization) => {
    if (!specialization) return t('register.specializations.general');
    const specLower = specialization.toLowerCase().trim();
    const specMap = {
      'psychology': 'register.specializations.general',
      'clinical psychology': 'register.specializations.clinical',
      'clinical': 'register.specializations.clinical',
      'counseling psychology': 'register.specializations.counseling',
      'counseling': 'register.specializations.counseling',
      'psychiatry': 'register.specializations.psychiatry',
      'therapy': 'register.specializations.therapy',
      'general': 'register.specializations.general',
      'general psychology': 'register.specializations.general',
      'psychologie générale': 'register.specializations.general',
      'psychologie general': 'register.specializations.general'
    };
    const translationKey = specMap[specLower] || 'register.specializations.general';
    return t(translationKey);
  };

  // Keep refs in sync with state
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  
  useEffect(() => {
    selectedRelationshipRef.current = selectedRelationship;
  }, [selectedRelationship]);

  useEffect(() => {
    fetchRelationships(true); // Initial load with loading indicator
    
    // Auto-refresh relationships every 20 seconds silently (no loading indicator)
    // Only refresh if user is not actively chatting
    const interval = setInterval(() => {
      // Use ref to check current state at the time of refresh
      if (activeTabRef.current === 0) {
        // Only refresh if on Find Doctors tab
        fetchRelationships(false);
      }
    }, 20000); // Increased to 20 seconds to reduce interruptions
    
    // Also refresh when window regains focus (but only if not chatting)
    const handleFocus = () => {
      if (activeTabRef.current === 0) {
        fetchRelationships(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Only run once on mount

  const fetchRelationships = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.request('/doctors/relationships/my');
      const allRelationships = response.relationships || [];
      
      // Only show active/accepted/completed relationships in Chat & Sessions tab
      // Pending relationships will be shown in the Find Doctors tab
      const activeRelationships = allRelationships
        .filter(rel => rel.status !== 'rejected' && rel.status !== 'pending')
        .sort((a, b) => {
          // Sort by status priority: active > accepted > completed
          const statusOrder = { 'active': 1, 'accepted': 2, 'completed': 3 };
          const orderA = statusOrder[a.status] || 99;
          const orderB = statusOrder[b.status] || 99;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // If same status, sort by created_at descending
          return new Date(b.created_at) - new Date(a.created_at);
        });
      
      setRelationships(activeRelationships);
      
      // Update the selected relationship data if one is already selected (silent update)
      // Don't automatically switch tabs or select relationships - let user control navigation
      const currentSelected = selectedRelationshipRef.current;
      const currentTab = activeTabRef.current;
      
      if (currentSelected) {
        // Update the selected relationship data if it still exists (silent update)
        const updatedRelationship = activeRelationships.find(
          rel => rel.id === currentSelected.id
        );
        if (updatedRelationship) {
          // Only update if status changed (to avoid unnecessary re-renders)
          if (updatedRelationship.status !== currentSelected.status) {
            setSelectedRelationship(updatedRelationship);
          }
        } else {
          // If selected relationship no longer exists, clear selection only if on chat tab
          if (currentTab === 1) {
            setSelectedRelationship(null);
          }
        }
      } else {
        // If no relationship is selected but we have active relationships, 
        // auto-select the first one to enable the Chat & Sessions tab
        // But don't automatically switch to the chat tab - let user control navigation
        if (activeRelationships.length > 0 && currentTab === 0) {
          setSelectedRelationship(activeRelationships[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleContactDoctor = (doctor) => {
    // Refresh relationships after contacting
    fetchRelationships();
  };

  const handleViewRelationship = (doctor) => {
    const relationship = relationships.find(rel => rel.doctor_id === doctor.id);
    if (relationship) {
      setSelectedRelationship(relationship);
      setActiveTab(1);
    }
  };

  const handleScheduleSession = () => {
    // Refresh relationships after scheduling
    fetchRelationships();
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'accepted': 'success',
      'rejected': 'error',
      'active': 'success',
      'completed': 'info'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': t('requests.pending'),
      'accepted': t('requests.accepted'),
      'rejected': t('requests.rejected'),
      'active': t('doctorPatientList.active'),
      'completed': t('schedule.completed')
    };
    return texts[status] || status;
  };

  const hasActiveRelationship = relationships.some(rel => rel.status === 'active' || rel.status === 'accepted');

  return (
    <Box>
      {/* Header */}
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
            <Typography variant="h5" sx={{ 
              mb: 2,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600
            }}>
              {t('dashboard.patient.doctorCommunication')}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9
            }}>
              {hasActiveRelationship 
                ? t('dashboard.patient.doctorCommunicationDescription')
                : t('dashboard.patient.doctorCommunicationDescriptionNoActive')
              }
            </Typography>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Relationship Cards - Only show active/accepted/completed */}
      {relationships.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {relationships.map((relationship, index) => (
            <Grid item xs={12} sm={6} md={4} key={`${relationship.id}-${i18n.language}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: alpha('#ffffff', 0.15),
                    backdropFilter: 'blur(10px)',
                    border: selectedRelationship?.id === relationship.id ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                      transition: 'all 0.3s ease-in-out'
                    }
                  }}
                  onClick={() => {
                    setSelectedRelationship(relationship);
                    setActiveTab(1);
                  }}
                >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: '#ffffff' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        fontWeight: 600
                      }}>
                        Dr. {relationship.doctor_name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        {translateSpecialization(relationship.doctor_specialization)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={getStatusText(relationship.status)}
                      color={getStatusColor(relationship.status)}
                      size="small"
                    />
                    {relationship.session_fee && (
                      <Chip
                        label={`$${relationship.session_fee}/${t('therapy.sessions').toLowerCase()}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ 
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.9
                  }}>
                    {t('dashboard.patient.started')}: {new Date(relationship.created_at).toLocaleDateString()}
                  </Typography>

                  {relationship.special_notes && (
                    <Typography variant="body2" sx={{ 
                      mt: 1, 
                      fontStyle: 'italic',
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9
                    }}>
                      "{relationship.special_notes}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tabs */}
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            centered
            sx={{ 
              '& .MuiTab-root': { 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 600,
                minHeight: 56,
                py: 1.25,
                minWidth: 0,
                flex: 1
              },
              '& .Mui-selected': { 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }
            }}
          >
            <Tab 
              icon={<SearchIcon />} 
              label={t('doctorSearch.title')} 
              iconPosition="start"
              sx={{ flex: 1, minWidth: 0 }}
            />
            <Tab 
              icon={<MessageIcon />} 
              label={t('dashboard.patient.chatSessions')} 
              iconPosition="start"
              sx={{ flex: 1, minWidth: 0 }}
              disabled={!selectedRelationship}
            />
          </Tabs>
        </Box>

        <CardContent>
          {activeTab === 0 && (
            <Box>
              <DoctorSearch 
                onContactDoctor={handleContactDoctor}
                onViewRelationship={handleViewRelationship}
              />
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress sx={{ color: '#ffffff' }} />
                </Box>
              ) : selectedRelationship ? (
                <DoctorChat 
                  relationship={selectedRelationship}
                  onScheduleSession={handleScheduleSession}
                />
              ) : (
                <Alert severity="info" sx={{ 
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  '& .MuiAlert-icon': {
                    color: '#ffffff'
                  }
                }}>
                  {t('dashboard.patient.selectDoctorToChat')}
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DoctorTab;

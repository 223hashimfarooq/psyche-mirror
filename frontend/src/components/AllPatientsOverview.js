import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person,
  ExpandMore,
  EmojiEmotions,
  Psychology,
  CalendarToday,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PatientDetailsView from './PatientDetailsView';

const AllPatientsOverview = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPatient, setExpandedPatient] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await api.getDoctorPatients();
      if (response.success) {
        setPatients(response.patients || []);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (patientId) => (event, isExpanded) => {
    setExpandedPatient(isExpanded ? patientId : null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  if (patients.length === 0) {
    return (
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            textAlign: 'center'
          }}>
            {t('dashboard.doctor.noActivePatients')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Typography variant="h5" sx={{ 
        mb: 3, 
        color: '#ffffff', 
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
        fontWeight: 600 
      }}>
        {t('dashboard.doctor.allPatientsOverview')}
      </Typography>

      <Grid container spacing={2} sx={{ width: '100%', margin: 0, maxWidth: '100%' }}>
        {patients.map((patient, index) => (
          <Grid item xs={12} key={patient.patient_id} sx={{ width: '100%', maxWidth: '100%', padding: '0 !important' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{ width: '100%' }}
            >
              <Accordion
                expanded={expandedPatient === patient.patient_id}
                onChange={handleAccordionChange(patient.patient_id)}
                sx={{
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: '100%',
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: '8px 0',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: '#ffffff' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                    <Avatar 
                      src={patient.patient_profile_picture && patient.patient_profile_picture !== 'undefined' 
                        ? patient.patient_profile_picture 
                        : null}
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        mr: 2,
                        bgcolor: alpha('#ffffff', 0.2) 
                      }}
                    >
                      <Person />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        fontWeight: 600,
                        mb: 0.5
                      }}>
                        {patient.patient_name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.9
                      }}>
                        {patient.patient_email}
                      </Typography>
                    </Box>
                    <Chip
                      label={t('doctorPatientList.active')}
                      color="success"
                      size="small"
                      sx={{
                        bgcolor: alpha('#4caf50', 0.2),
                        color: '#ffffff',
                        mr: 2
                      }}
                    />
                    {patient.session_fee && (
                      <Chip
                        label={`$${patient.session_fee}/${t('doctorSearch.sessionUnit')}`}
                        size="small"
                        sx={{
                          bgcolor: alpha('#ffffff', 0.2),
                          color: '#ffffff',
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, width: '100%', maxWidth: '100%', overflow: 'visible', m: 0 }}>
                  <PatientDetailsView 
                    key={`patient-details-${patient.patient_id}-${i18n.language}`}
                    patientId={patient.patient_id}
                    relationshipId={patient.relationship_id}
                  />
                </AccordionDetails>
              </Accordion>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AllPatientsOverview;


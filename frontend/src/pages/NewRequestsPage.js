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
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  PersonAdd,
  CheckCircle,
  Cancel,
  Search,
  Psychology,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const NewRequestsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Mock data for patient requests
  useEffect(() => {
    const mockRequests = [
      {
        id: '1',
        patientName: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567',
        age: 28,
        location: 'New York, NY',
        reason: 'Anxiety and stress management',
        urgency: 'medium',
        preferredTime: 'Evenings',
        insurance: 'Blue Cross Blue Shield',
        previousTherapy: 'Yes - 2 years ago',
        symptoms: ['Anxiety', 'Sleep issues', 'Work stress'],
        submittedDate: new Date('2024-01-15'),
        status: 'pending'
      },
      {
        id: '2',
        patientName: 'Mike Chen',
        email: 'mike.chen@email.com',
        phone: '+1 (555) 234-5678',
        age: 35,
        location: 'Los Angeles, CA',
        reason: 'Depression and relationship counseling',
        urgency: 'high',
        preferredTime: 'Weekends',
        insurance: 'Aetna',
        previousTherapy: 'No',
        symptoms: ['Depression', 'Relationship issues', 'Low motivation'],
        submittedDate: new Date('2024-01-14'),
        status: 'pending'
      },
      {
        id: '3',
        patientName: 'Emma Rodriguez',
        email: 'emma.rodriguez@email.com',
        phone: '+1 (555) 345-6789',
        age: 24,
        location: 'Chicago, IL',
        reason: 'PTSD and trauma therapy',
        urgency: 'high',
        preferredTime: 'Mornings',
        insurance: 'Cigna',
        previousTherapy: 'Yes - Currently in therapy',
        symptoms: ['PTSD', 'Nightmares', 'Panic attacks'],
        submittedDate: new Date('2024-01-13'),
        status: 'pending'
      },
      {
        id: '4',
        patientName: 'David Kim',
        email: 'david.kim@email.com',
        phone: '+1 (555) 456-7890',
        age: 42,
        location: 'Seattle, WA',
        reason: 'Career counseling and life transitions',
        urgency: 'low',
        preferredTime: 'Afternoons',
        insurance: 'UnitedHealth',
        previousTherapy: 'Yes - 5 years ago',
        symptoms: ['Career stress', 'Life transitions', 'Decision making'],
        submittedDate: new Date('2024-01-12'),
        status: 'pending'
      }
    ];
    setRequests(mockRequests);
    setFilteredRequests(mockRequests);
  }, []);

  useEffect(() => {
    const filtered = requests.filter(request =>
      request.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRequests(filtered);
  }, [searchTerm, requests]);

  const getUrgencyColor = (urgency) => {
    const colors = {
      high: '#FF5722',
      medium: '#FF9800',
      low: '#4CAF50',
    };
    return colors[urgency] || colors.medium;
  };

  const handleAcceptRequest = (requestId) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ));
    setOpenDialog(false);
    alert(t('requests.requestAccepted', { name: selectedRequest?.patientName }));
  };

  const handleRejectRequest = (requestId) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' } : req
    ));
    setOpenDialog(false);
    alert(t('requests.requestRejected', { name: selectedRequest?.patientName }));
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const pendingRequests = filteredRequests.filter(req => req.status === 'pending');
  const acceptedRequests = filteredRequests.filter(req => req.status === 'accepted');
  const rejectedRequests = filteredRequests.filter(req => req.status === 'rejected');

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
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/doctor/overview')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
            {t('requests.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            {pendingRequests.length} {t('requests.pending')} {t('requests.title')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card sx={{ 
                height: '100%',
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        bgcolor: alpha('#FF9800', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <PersonAdd sx={{ fontSize: 30, color: '#FF9800' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {pendingRequests.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        {t('requests.pending')} {t('requests.title')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={4}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card sx={{ 
                height: '100%',
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        bgcolor: alpha('#4CAF50', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 30, color: '#4CAF50' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {acceptedRequests.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        {t('requests.accepted')} {t('requests.title')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={4}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card sx={{ 
                height: '100%',
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        bgcolor: alpha('#FF5722', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <Cancel sx={{ fontSize: 30, color: '#FF5722' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {rejectedRequests.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        {t('requests.rejected')} {t('requests.title')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card sx={{ 
            mb: 3,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  {t('requests.newRequests')}
                </Typography>
                <TextField
                  size="small"
                  placeholder={t('requests.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 300 }}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <TableContainer 
                component={Paper} 
                variant="outlined"
                sx={{
                  bgcolor: alpha('#ffffff', 0.1),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#ffffff', 0.05) }}>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('requests.name')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('requests.reason')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('requests.urgency')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('requests.submittedDate')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('requests.status')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow 
                        key={request.id} 
                        hover
                        sx={{ 
                          '&:hover': {
                            bgcolor: alpha('#ffffff', 0.05),
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: alpha(theme.palette.primary.main, 0.2), border: `1px solid ${alpha('#ffffff', 0.3)}` }}>
                              {request.patientName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                {request.patientName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                {request.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          <Typography variant="body2">
                            {request.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`requests.${request.urgency}`)}
                            size="small"
                            sx={{
                              bgcolor: alpha(getUrgencyColor(request.urgency), 0.2),
                              color: getUrgencyColor(request.urgency),
                              fontWeight: 600,
                              border: `1px solid ${alpha(getUrgencyColor(request.urgency), 0.3)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          {request.submittedDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`requests.${request.status}`)}
                            size="small"
                            sx={{
                              bgcolor: alpha(
                                request.status === 'pending' ? '#FF9800' : 
                                request.status === 'accepted' ? '#4CAF50' : '#FF5722',
                                0.2
                              ),
                              color: request.status === 'pending' ? '#FF9800' : 
                                     request.status === 'accepted' ? '#4CAF50' : '#FF5722',
                              fontWeight: 600,
                              border: `1px solid ${alpha(
                                request.status === 'pending' ? '#FF9800' : 
                                request.status === 'accepted' ? '#4CAF50' : '#FF5722', 0.3
                              )}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewDetails(request)}
                            disabled={request.status !== 'pending'}
                            sx={{
                              color: '#ffffff',
                              borderColor: 'rgba(255,255,255,0.3)',
                              '&:hover': {
                                bgcolor: alpha('#ffffff', 0.1),
                                borderColor: 'rgba(255,255,255,0.5)',
                              },
                              '&:disabled': {
                                color: 'rgba(255,255,255,0.5)',
                                borderColor: 'rgba(255,255,255,0.2)',
                              },
                            }}
                          >
                            {t('requests.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Container>

      {/* Request Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('requests.patientDetails')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('requests.personalInfo')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.name')}</Typography>
                    <Typography variant="body1">{selectedRequest.patientName}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.email')}</Typography>
                    <Typography variant="body1">{selectedRequest.email}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.phone')}</Typography>
                    <Typography variant="body1">{selectedRequest.phone}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.age')}</Typography>
                    <Typography variant="body1">{selectedRequest.age} {t('requests.yearsOld')}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.location')}</Typography>
                    <Typography variant="body1">{selectedRequest.location}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('requests.therapyInfo')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.reason')}</Typography>
                    <Typography variant="body1">{selectedRequest.reason}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.urgency')}</Typography>
                    <Chip
                      label={t(`requests.${selectedRequest.urgency}`)}
                      size="small"
                      sx={{
                        bgcolor: alpha(getUrgencyColor(selectedRequest.urgency), 0.1),
                        color: getUrgencyColor(selectedRequest.urgency),
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.preferredTime')}</Typography>
                    <Typography variant="body1">{selectedRequest.preferredTime}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.insurance')}</Typography>
                    <Typography variant="body1">{selectedRequest.insurance}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">{t('requests.previousTherapy')}</Typography>
                    <Typography variant="body1">{selectedRequest.previousTherapy}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('requests.symptoms')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedRequest.symptoms.map((symptom, index) => (
                      <Chip
                        key={index}
                        label={symptom}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('common.close')}</Button>
          <Button
            onClick={() => handleRejectRequest(selectedRequest?.id)}
            color="error"
            variant="outlined"
          >
            {t('requests.reject')}
          </Button>
          <Button
            onClick={() => handleAcceptRequest(selectedRequest?.id)}
            color="success"
            variant="contained"
          >
            {t('requests.accept')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewRequestsPage;

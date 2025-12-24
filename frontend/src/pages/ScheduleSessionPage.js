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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  Schedule,
  Person,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const ScheduleSessionPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    duration: '60',
    type: 'individual',
    notes: '',
    status: 'scheduled'
  });

  // Mock data for patients
  useEffect(() => {
    const mockPatients = [
      { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com' },
      { id: '2', name: 'Mike Chen', email: 'mike@example.com' },
      { id: '3', name: 'Emma Rodriguez', email: 'emma@example.com' },
      { id: '4', name: 'David Kim', email: 'david@example.com' },
    ];
    setPatients(mockPatients);
  }, []);

  // Mock data for existing sessions
  useEffect(() => {
    const mockSessions = [
      {
        id: '1',
        patientId: '1',
        patientName: 'Sarah Johnson',
        date: '2024-01-20',
        time: '10:00',
        duration: '60',
        type: 'individual',
        notes: 'First session - anxiety management',
        status: 'scheduled'
      },
      {
        id: '2',
        patientId: '2',
        patientName: 'Mike Chen',
        date: '2024-01-21',
        time: '14:00',
        duration: '90',
        type: 'individual',
        notes: 'Depression counseling session',
        status: 'completed'
      },
      {
        id: '3',
        patientId: '3',
        patientName: 'Emma Rodriguez',
        date: '2024-01-22',
        time: '16:00',
        duration: '60',
        type: 'individual',
        notes: 'PTSD therapy session',
        status: 'scheduled'
      }
    ];
    setSessions(mockSessions);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSession) {
      // Update existing session
      setSessions(prev => prev.map(session => 
        session.id === editingSession.id 
          ? { ...session, ...formData, patientName: patients.find(p => p.id === formData.patientId)?.name }
          : session
      ));
      alert(t('schedule.sessionUpdated'));
    } else {
      // Create new session
      const newSession = {
        id: Date.now().toString(),
        ...formData,
        patientName: patients.find(p => p.id === formData.patientId)?.name
      };
      setSessions(prev => [...prev, newSession]);
      alert(t('schedule.sessionScheduled'));
    }
    
    setOpenDialog(false);
    setEditingSession(null);
    setFormData({
      patientId: '',
      date: '',
      time: '',
      duration: '60',
      type: 'individual',
      notes: '',
      status: 'scheduled'
    });
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      patientId: session.patientId,
      date: session.date,
      time: session.time,
      duration: session.duration,
      type: session.type,
      notes: session.notes,
      status: session.status
    });
    setOpenDialog(true);
  };

  const handleDelete = (sessionId) => {
    if (window.confirm(t('schedule.deleteConfirm'))) {
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      alert(t('schedule.sessionDeleted'));
    }
  };

  const handleStatusChange = (sessionId, newStatus) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, status: newStatus } : session
    ));
    alert(t('schedule.statusUpdated', { status: newStatus }));
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#FF9800',
      completed: '#4CAF50',
      cancelled: '#FF5722',
      rescheduled: '#2196F3',
    };
    return colors[status] || colors.scheduled;
  };

  const upcomingSessions = sessions.filter(session => 
    new Date(session.date) >= new Date() && session.status === 'scheduled'
  ).sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  const todaySessions = sessions.filter(session => 
    session.date === new Date().toISOString().split('T')[0]
  );

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
          <IconButton onClick={() => navigate('/doctor/overview')} sx={{ mr: 2, color: '#ffffff' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            {t('schedule.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              },
            }}
          >
            {t('schedule.addSession')}
          </Button>
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
                      <Schedule sx={{ fontSize: 30, color: '#FF9800' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {upcomingSessions.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        {t('schedule.upcomingSessions')}
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
                      <CalendarToday sx={{ fontSize: 30, color: '#4CAF50' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {todaySessions.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        {t('schedule.todaysSessions')}
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
                        bgcolor: alpha('#2196F3', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <Person sx={{ fontSize: 30, color: '#2196F3' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {patients.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        {t('schedule.totalPatients')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Sessions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card sx={{ 
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {t('schedule.scheduledSessions')}
              </Typography>
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
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('schedule.patient')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('schedule.dateTime')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('schedule.duration')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('schedule.type')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('schedule.status')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('schedule.notes')}</TableCell>
                      <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow 
                        key={session.id} 
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
                              {session.patientName.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {session.patientName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          <Typography variant="body2">
                            {new Date(session.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                            {session.time}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          {session.duration} {t('schedule.minutes')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`schedule.${session.type}`)}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.secondary.main, 0.2),
                              color: theme.palette.secondary.main,
                              fontWeight: 600,
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`schedule.${session.status}`)}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(session.status), 0.2),
                              color: getStatusColor(session.status),
                              fontWeight: 600,
                              border: `1px solid ${alpha(getStatusColor(session.status), 0.3)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {session.notes}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                              onClick={() => handleEdit(session)}
                              sx={{
                                color: '#ffffff',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '&:hover': {
                                  bgcolor: alpha('#ffffff', 0.1),
                                  borderColor: 'rgba(255,255,255,0.5)',
                                },
                              }}
                            >
                              {t('common.edit')}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Delete />}
                              onClick={() => handleDelete(session.id)}
                              sx={{
                                color: '#ffffff',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '&:hover': {
                                  bgcolor: alpha('#ffffff', 0.1),
                                  borderColor: 'rgba(255,255,255,0.5)',
                                },
                              }}
                            >
                              {t('common.delete')}
                            </Button>
                            {session.status === 'scheduled' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CheckCircle />}
                                onClick={() => handleStatusChange(session.id, 'completed')}
                                sx={{
                                  bgcolor: alpha('#4CAF50', 0.8),
                                  color: '#ffffff',
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  border: '1px solid rgba(76,175,80,0.3)',
                                  backdropFilter: 'blur(10px)',
                                  fontWeight: 600,
                                  '&:hover': {
                                    bgcolor: alpha('#4CAF50', 0.9),
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                                  },
                                }}
                              >
                                {t('schedule.complete')}
                              </Button>
                            )}
                          </Box>
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

      {/* Schedule Session Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingSession ? t('schedule.editSession') : t('schedule.scheduleSession')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('schedule.patient')}</InputLabel>
                  <Select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    label={t('schedule.patient')}
                    required
                  >
                    {patients.map((patient) => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="date"
                  label={t('schedule.date')}
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="time"
                  label={t('schedule.time')}
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('schedule.duration')}</InputLabel>
                  <Select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    label={t('schedule.duration')}
                  >
                    <MenuItem value="30">30 {t('schedule.minutes')}</MenuItem>
                    <MenuItem value="60">60 {t('schedule.minutes')}</MenuItem>
                    <MenuItem value="90">90 {t('schedule.minutes')}</MenuItem>
                    <MenuItem value="120">120 {t('schedule.minutes')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('schedule.sessionType')}</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    label={t('schedule.sessionType')}
                  >
                    <MenuItem value="individual">{t('schedule.individual')}</MenuItem>
                    <MenuItem value="group">{t('schedule.group')}</MenuItem>
                    <MenuItem value="couples">{t('schedule.couples')}</MenuItem>
                    <MenuItem value="family">{t('schedule.family')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="notes"
                  label={t('schedule.notes')}
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder={t('schedule.notesPlaceholder')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingSession(null);
            setFormData({
              patientId: '',
              date: '',
              time: '',
              duration: '60',
              type: 'individual',
              notes: '',
              status: 'scheduled'
            });
          }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            type="submit"
          >
            {editingSession ? t('schedule.updateSession') : t('schedule.scheduleSession')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleSessionPage;

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
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  MonetizationOn,
  CreditCard,
  AccountBalance,
  Save,
  Edit,
  Delete,
  Add,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const FeeSetupPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [feeSettings, setFeeSettings] = useState({
    individualSession: 150,
    groupSession: 100,
    couplesSession: 180,
    familySession: 200,
    consultationFee: 200,
    emergencySession: 250,
    currency: 'USD',
    paymentMethods: ['credit_card', 'bank_transfer', 'paypal'],
    autoInvoice: true,
    paymentTerms: '30',
    lateFeePercentage: 5,
    discountPercentage: 10,
    insuranceAccepted: true,
    slidingScale: false,
    minSlidingScaleFee: 50,
    maxSlidingScaleFee: 200
  });
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm, setMethodForm] = useState({
    type: '',
    name: '',
    accountNumber: '',
    routingNumber: '',
    isActive: true
  });

  // Mock payment methods data
  useEffect(() => {
    const mockMethods = [
      {
        id: '1',
        type: 'credit_card',
        name: 'Primary Credit Card',
        accountNumber: '**** **** **** 1234',
        routingNumber: '',
        isActive: true
      },
      {
        id: '2',
        type: 'bank_transfer',
        name: 'Business Checking Account',
        accountNumber: '**** 5678',
        routingNumber: '**** 9012',
        isActive: true
      },
      {
        id: '3',
        type: 'paypal',
        name: 'PayPal Business',
        accountNumber: 'doctor@psychemirror.com',
        routingNumber: '',
        isActive: false
      }
    ];
    setPaymentMethods(mockMethods);
  }, []);

  const handleFeeChange = (field, value) => {
    setFeeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = () => {
    // In a real app, this would save to Firebase
    alert(t('fees.settingsSaved'));
  };

  const handleMethodSubmit = (e) => {
    e.preventDefault();
    
    if (editingMethod) {
      // Update existing method
      setPaymentMethods(prev => prev.map(method => 
        method.id === editingMethod.id 
          ? { ...method, ...methodForm }
          : method
      ));
      alert(t('fees.methodUpdated'));
    } else {
      // Add new method
      const newMethod = {
        id: Date.now().toString(),
        ...methodForm
      };
      setPaymentMethods(prev => [...prev, newMethod]);
      alert(t('fees.methodAdded'));
    }
    
    setOpenDialog(false);
    setEditingMethod(null);
    setMethodForm({
      type: '',
      name: '',
      accountNumber: '',
      routingNumber: '',
      isActive: true
    });
  };

  const handleEditMethod = (method) => {
    setEditingMethod(method);
    setMethodForm({
      type: method.type,
      name: method.name,
      accountNumber: method.accountNumber,
      routingNumber: method.routingNumber,
      isActive: method.isActive
    });
    setOpenDialog(true);
  };

  const handleDeleteMethod = (methodId) => {
    if (window.confirm(t('fees.deleteConfirm'))) {
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      alert(t('fees.methodDeleted'));
    }
  };

  const getMethodTypeLabel = (type) => {
    const labels = {
      credit_card: t('fees.creditCard'),
      bank_transfer: t('fees.bankTransfer'),
      paypal: t('fees.paypal'),
      stripe: t('fees.stripe'),
      cash: t('fees.cash')
    };
    return labels[type] || type;
  };

  const getMethodIcon = (type) => {
    const icons = {
      credit_card: <CreditCard />,
      bank_transfer: <AccountBalance />,
      paypal: <MonetizationOn />,
      stripe: <CreditCard />,
      cash: <MonetizationOn />
    };
    return icons[type] || <MonetizationOn />;
  };

  const calculateMonthlyRevenue = () => {
    const sessionsPerMonth = 20; // Mock data
    const averageFee = (feeSettings.individualSession + feeSettings.groupSession + feeSettings.couplesSession) / 3;
    return sessionsPerMonth * averageFee;
  };

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
            {t('fees.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
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
            {t('fees.saveSettings')}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Revenue Overview */}
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
                        bgcolor: alpha('#4CAF50', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <MonetizationOn sx={{ fontSize: 30, color: '#4CAF50' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        ${calculateMonthlyRevenue().toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        Estimated Monthly Revenue
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
                        bgcolor: alpha('#2196F3', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <CreditCard sx={{ fontSize: 30, color: '#2196F3' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {paymentMethods.filter(m => m.isActive).length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        Active Payment Methods
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
                        bgcolor: alpha('#FF9800', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 30, color: '#FF9800' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {feeSettings.insuranceAccepted ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                        Insurance Accepted
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Fee Structure */}
          <Grid item xs={12} md={6}>
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
                    Session Fees
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.individualSession')}
                        type="number"
                        value={feeSettings.individualSession}
                        onChange={(e) => handleFeeChange('individualSession', parseInt(e.target.value))}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.groupSession')}
                        type="number"
                        value={feeSettings.groupSession}
                        onChange={(e) => handleFeeChange('groupSession', parseInt(e.target.value))}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.couplesSession')}
                        type="number"
                        value={feeSettings.couplesSession}
                        onChange={(e) => handleFeeChange('couplesSession', parseInt(e.target.value))}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.familySession')}
                        type="number"
                        value={feeSettings.familySession}
                        onChange={(e) => handleFeeChange('familySession', parseInt(e.target.value))}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.consultationFee')}
                        type="number"
                        value={feeSettings.consultationFee}
                        onChange={(e) => handleFeeChange('consultationFee', parseInt(e.target.value))}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.emergencySession')}
                        type="number"
                        value={feeSettings.emergencySession}
                        onChange={(e) => handleFeeChange('emergencySession', parseInt(e.target.value))}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Payment Settings */}
          <Grid item xs={12} md={6}>
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
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    Payment Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Currency</InputLabel>
                        <Select
                          value={feeSettings.currency}
                          onChange={(e) => handleFeeChange('currency', e.target.value)}
                          label={t('fees.currency')}
                          sx={{
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ffffff',
                            },
                            '& .MuiSvgIcon-root': {
                              color: '#ffffff',
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: alpha('#ffffff', 0.9),
                                backdropFilter: 'blur(10px)',
                              },
                            },
                          }}
                        >
                          <MenuItem value="USD">USD ($)</MenuItem>
                          <MenuItem value="EUR">EUR (€)</MenuItem>
                          <MenuItem value="GBP">GBP (£)</MenuItem>
                          <MenuItem value="CAD">CAD (C$)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.paymentTerms')}
                        type="number"
                        value={feeSettings.paymentTerms}
                        onChange={(e) => handleFeeChange('paymentTerms', e.target.value)}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('fees.lateFee')}
                        type="number"
                        value={feeSettings.lateFeePercentage}
                        onChange={(e) => handleFeeChange('lateFeePercentage', parseInt(e.target.value))}
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            bgcolor: alpha('#ffffff', 0.1),
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
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={feeSettings.autoInvoice}
                            onChange={(e) => handleFeeChange('autoInvoice', e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#ffffff',
                                '& + .MuiSwitch-track': {
                                  bgcolor: alpha('#ffffff', 0.3),
                                },
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                bgcolor: alpha('#ffffff', 0.5),
                              },
                              '& .MuiSwitch-track': {
                                bgcolor: alpha('#ffffff', 0.2),
                              },
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                            Auto-generate invoices
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={feeSettings.insuranceAccepted}
                            onChange={(e) => handleFeeChange('insuranceAccepted', e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#ffffff',
                                '& + .MuiSwitch-track': {
                                  bgcolor: alpha('#ffffff', 0.3),
                                },
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                bgcolor: alpha('#ffffff', 0.5),
                              },
                              '& .MuiSwitch-track': {
                                bgcolor: alpha('#ffffff', 0.2),
                              },
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                            Accept insurance
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={feeSettings.slidingScale}
                            onChange={(e) => handleFeeChange('slidingScale', e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#ffffff',
                                '& + .MuiSwitch-track': {
                                  bgcolor: alpha('#ffffff', 0.3),
                                },
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                bgcolor: alpha('#ffffff', 0.5),
                              },
                              '& .MuiSwitch-track': {
                                bgcolor: alpha('#ffffff', 0.2),
                              },
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                            Offer sliding scale fees
                          </Typography>
                        }
                      />
                    </Grid>
                    {feeSettings.slidingScale && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('fees.minFee')}
                            type="number"
                            value={feeSettings.minSlidingScaleFee}
                            onChange={(e) => handleFeeChange('minSlidingScaleFee', parseInt(e.target.value))}
                            sx={{
                              '& .MuiInputLabel-root': {
                                color: '#ffffff',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                              },
                              '& .MuiOutlinedInput-root': {
                                color: '#ffffff',
                                bgcolor: alpha('#ffffff', 0.1),
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
                            }}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label={t('fees.maxFee')}
                            type="number"
                            value={feeSettings.maxSlidingScaleFee}
                            onChange={(e) => handleFeeChange('maxSlidingScaleFee', parseInt(e.target.value))}
                            sx={{
                              '& .MuiInputLabel-root': {
                                color: '#ffffff',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                              },
                              '& .MuiOutlinedInput-root': {
                                color: '#ffffff',
                                bgcolor: alpha('#ffffff', 0.1),
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
                            }}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>$</Typography>
                            }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Payment Methods */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card sx={{ 
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      Payment Methods
                    </Typography>
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
                      Add Payment Method
                    </Button>
                  </Box>
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
                          <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>Type</TableCell>
                          <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>Account Details</TableCell>
                          <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentMethods.map((method) => (
                          <TableRow 
                            key={method.id} 
                            hover
                            sx={{ 
                              '&:hover': {
                                bgcolor: alpha('#ffffff', 0.05),
                              },
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getMethodIcon(method.type)}
                                <Typography variant="body2" sx={{ ml: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                  {getMethodTypeLabel(method.type)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                {method.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                {method.accountNumber}
                              </Typography>
                              {method.routingNumber && (
                                <Typography variant="caption" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                  Routing: {method.routingNumber}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={method.isActive ? t('fees.active') : t('fees.inactive')}
                                size="small"
                                sx={{
                                  bgcolor: alpha(method.isActive ? '#4CAF50' : '#F44336', 0.2),
                                  color: method.isActive ? '#4CAF50' : '#F44336',
                                  fontWeight: 600,
                                  border: `1px solid ${alpha(method.isActive ? '#4CAF50' : '#F44336', 0.3)}`,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Edit />}
                                  onClick={() => handleEditMethod(method)}
                                  sx={{
                                    color: '#ffffff',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    '&:hover': {
                                      bgcolor: alpha('#ffffff', 0.1),
                                      borderColor: 'rgba(255,255,255,0.5)',
                                    },
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Delete />}
                                  onClick={() => handleDeleteMethod(method.id)}
                                  sx={{
                                    color: '#ffffff',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    '&:hover': {
                                      bgcolor: alpha('#ffffff', 0.1),
                                      borderColor: 'rgba(255,255,255,0.5)',
                                    },
                                  }}
                                >
                                  Delete
                                </Button>
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
          </Grid>
        </Grid>
      </Container>

      {/* Add/Edit Payment Method Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleMethodSubmit} sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    name="type"
                    value={methodForm.type}
                    onChange={(e) => setMethodForm(prev => ({ ...prev, type: e.target.value }))}
                    label={t('fees.paymentType')}
                    required
                  >
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="stripe">Stripe</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="name"
                  label={t('fees.methodName')}
                  value={methodForm.name}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="accountNumber"
                  label={t('fees.accountNumber')}
                  value={methodForm.accountNumber}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  required
                />
              </Grid>
              {methodForm.type === 'bank_transfer' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="routingNumber"
                    label={t('fees.routingNumber')}
                    value={methodForm.routingNumber}
                    onChange={(e) => setMethodForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={methodForm.isActive}
                      onChange={(e) => setMethodForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label={t('fees.active')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingMethod(null);
            setMethodForm({
              type: '',
              name: '',
              accountNumber: '',
              routingNumber: '',
              isActive: true
            });
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleMethodSubmit}
            variant="contained"
            type="submit"
          >
            {editingMethod ? 'Update Method' : 'Add Method'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeeSetupPage;

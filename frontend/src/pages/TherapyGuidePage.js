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
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Psychology,
  Search,
  ExpandMore,
  PlayArrow,
  Download,
  Bookmark,
  Share,
  Favorite,
  School,
  Healing,
  SelfImprovement,
  Support,
  Lightbulb,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const TherapyGuidePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const categories = [
    { id: 'all', name: t('therapyGuide.allResources'), icon: <Psychology /> },
    { id: 'cbt', name: t('therapyGuide.cbt'), icon: <Lightbulb /> },
    { id: 'dbt', name: t('therapyGuide.dbt'), icon: <Healing /> },
    { id: 'mindfulness', name: t('therapyGuide.mindfulness'), icon: <SelfImprovement /> },
    { id: 'trauma', name: t('therapyGuide.trauma'), icon: <Support /> },
    { id: 'anxiety', name: t('therapyGuide.anxiety'), icon: <School /> },
  ];

  const therapyResources = [
    {
      id: '1',
      title: 'CBT Thought Record Worksheet',
      category: 'cbt',
      type: 'worksheet',
      description: 'A comprehensive worksheet to help patients identify and challenge negative thought patterns.',
      difficulty: 'beginner',
      duration: '15-20 minutes',
      tags: ['CBT', 'Thought Patterns', 'Worksheet'],
      content: 'This worksheet helps patients:\n1. Identify automatic negative thoughts\n2. Examine evidence for and against thoughts\n3. Develop balanced alternative thoughts\n4. Rate emotional intensity before and after',
      techniques: ['Thought challenging', 'Evidence evaluation', 'Cognitive restructuring'],
      whenToUse: 'Use when patients are experiencing negative thought patterns or cognitive distortions.',
      tips: 'Encourage patients to complete this daily for maximum benefit. Review together in sessions.'
    },
    {
      id: '2',
      title: 'DBT Distress Tolerance Skills',
      category: 'dbt',
      type: 'technique',
      description: 'Essential skills for managing emotional distress and crisis situations.',
      difficulty: 'intermediate',
      duration: '30-45 minutes',
      tags: ['DBT', 'Distress Tolerance', 'Crisis Management'],
      content: 'Key distress tolerance skills:\n1. TIPP (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation)\n2. STOP (Stop, Take a step back, Observe, Proceed mindfully)\n3. ACCEPTS (Activities, Contributing, Comparisons, Emotions, Pushing away, Thoughts, Sensations)',
      techniques: ['TIPP', 'STOP', 'ACCEPTS', 'Radical acceptance'],
      whenToUse: 'Use when patients are in crisis or experiencing overwhelming emotions.',
      tips: 'Practice these skills when calm to build muscle memory for crisis situations.'
    },
    {
      id: '3',
      title: 'Mindfulness Body Scan Meditation',
      category: 'mindfulness',
      type: 'meditation',
      description: 'A guided meditation to help patients develop body awareness and present-moment focus.',
      difficulty: 'beginner',
      duration: '20-30 minutes',
      tags: ['Mindfulness', 'Body Awareness', 'Meditation'],
      content: 'Body scan meditation steps:\n1. Find a comfortable position\n2. Focus on breathing\n3. Slowly scan from head to toe\n4. Notice sensations without judgment\n5. Return to breathing when mind wanders',
      techniques: ['Body awareness', 'Present moment focus', 'Non-judgmental observation'],
      whenToUse: 'Use for anxiety, stress, or when patients need grounding techniques.',
      tips: 'Start with shorter sessions and gradually increase duration. Practice regularly for best results.'
    },
    {
      id: '4',
      title: 'EMDR Trauma Processing Protocol',
      category: 'trauma',
      type: 'protocol',
      description: 'Step-by-step protocol for processing traumatic memories using EMDR techniques.',
      difficulty: 'advanced',
      duration: '60-90 minutes',
      tags: ['EMDR', 'Trauma', 'Memory Processing'],
      content: 'EMDR protocol phases:\n1. History taking and treatment planning\n2. Preparation and stabilization\n3. Assessment of target memory\n4. Desensitization\n5. Installation of positive cognition\n6. Body scan\n7. Closure\n8. Reevaluation',
      techniques: ['Bilateral stimulation', 'Memory processing', 'Positive cognition installation'],
      whenToUse: 'Use for patients with PTSD or trauma-related symptoms. Requires specialized training.',
      tips: 'Ensure patient has adequate coping skills before beginning trauma processing.'
    },
    {
      id: '5',
      title: 'Anxiety Exposure Hierarchy',
      category: 'anxiety',
      type: 'worksheet',
      description: 'A systematic approach to gradually exposing patients to anxiety-provoking situations.',
      difficulty: 'intermediate',
      duration: '45-60 minutes',
      tags: ['Exposure Therapy', 'Anxiety', 'Hierarchy'],
      content: 'Creating exposure hierarchy:\n1. List anxiety-provoking situations\n2. Rate anxiety level (0-100)\n3. Order from least to most anxiety-provoking\n4. Start with lowest anxiety item\n5. Gradually work up the hierarchy',
      techniques: ['Systematic desensitization', 'Gradual exposure', 'Anxiety rating'],
      whenToUse: 'Use for specific phobias, social anxiety, or avoidance behaviors.',
      tips: 'Ensure patient feels safe and has coping skills before beginning exposure work.'
    },
    {
      id: '6',
      title: 'Progressive Muscle Relaxation Script',
      category: 'mindfulness',
      type: 'script',
      description: 'A guided script for teaching patients progressive muscle relaxation techniques.',
      difficulty: 'beginner',
      duration: '25-35 minutes',
      tags: ['Relaxation', 'Muscle Tension', 'Stress Relief'],
      content: 'Progressive muscle relaxation steps:\n1. Tense each muscle group for 5-7 seconds\n2. Release tension and notice the difference\n3. Move through all major muscle groups\n4. Focus on the contrast between tension and relaxation',
      techniques: ['Muscle tension and release', 'Body awareness', 'Relaxation response'],
      whenToUse: 'Use for general anxiety, stress, or muscle tension issues.',
      tips: 'Practice regularly to develop the relaxation response. Can be shortened for daily use.'
    }
  ];

  const filteredResources = therapyResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewResource = (resource) => {
    setSelectedResource(resource);
    setOpenDialog(true);
  };

  const handleToggleFavorite = (resourceId) => {
    setFavorites(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      [t('therapyGuide.beginner')]: '#4CAF50',
      [t('therapyGuide.intermediate')]: '#FF9800',
      [t('therapyGuide.advanced')]: '#FF5722',
    };
    return colors[difficulty] || colors[t('therapyGuide.beginner')];
  };

  const getTypeIcon = (type) => {
    const icons = {
      worksheet: <School />,
      technique: <Psychology />,
      meditation: <SelfImprovement />,
      protocol: <Healing />,
      script: <Bookmark />,
    };
    return icons[type] || <Psychology />;
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
            {t('therapyGuide.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
            {filteredResources.length} {t('therapyGuide.resourcesAvailable')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Search and Categories */}
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
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder={t('therapyGuide.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                        '& input::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        icon={category.icon}
                        onClick={() => setSelectedCategory(category.id)}
                        sx={{
                          bgcolor: selectedCategory === category.id 
                            ? alpha('#ffffff', 0.3) 
                            : alpha('#ffffff', 0.1),
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          fontWeight: 600,
                          border: selectedCategory === category.id 
                            ? '2px solid rgba(255,255,255,0.5)' 
                            : '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: alpha('#ffffff', 0.2),
                            border: '1px solid rgba(255,255,255,0.5)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                          },
                          '& .MuiChip-icon': {
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resources Grid */}
        <Grid container spacing={3}>
          {filteredResources.map((resource, index) => (
            <Grid item xs={12} md={6} lg={4} key={resource.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
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
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ mr: 2, mt: 0.5, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        {getTypeIcon(resource.type)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                          {resource.title}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                          {resource.description}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(resource.id)}
                        sx={{
                          color: favorites.includes(resource.id) ? '#F44336' : '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          '&:hover': {
                            bgcolor: alpha('#ffffff', 0.1),
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        <Favorite />
                      </IconButton>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={t(`therapyGuide.${resource.difficulty}`)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getDifficultyColor(resource.difficulty), 0.2),
                          color: getDifficultyColor(resource.difficulty),
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          border: `2px solid ${alpha(getDifficultyColor(resource.difficulty), 0.4)}`,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                          mr: 1,
                        }}
                      />
                      <Chip
                        label={resource.duration}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          mr: 1,
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.3)',
                          bgcolor: alpha('#ffffff', 0.1),
                          backdropFilter: 'blur(10px)',
                        }}
                      />
                      <Chip
                        label={resource.type}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          fontWeight: 600,
                          border: '1px solid rgba(255,255,255,0.3)',
                          bgcolor: alpha('#ffffff', 0.1),
                          backdropFilter: 'blur(10px)',
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      {resource.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: alpha('#ffffff', 0.15),
                            color: '#ffffff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(10px)',
                            mr: 0.5,
                            mb: 0.5,
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleViewResource(resource)}
                      sx={{
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          bgcolor: alpha('#ffffff', 0.3),
                          border: '1px solid rgba(255,255,255,0.5)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                        },
                      }}
                    >
                      {t('therapyGuide.viewResource')}
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {filteredResources.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Psychology sx={{ fontSize: 64, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                  {t('therapyGuide.noResourcesFound')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                  {t('therapyGuide.noResourcesMessage')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Container>

      {/* Resource Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {selectedResource?.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => handleToggleFavorite(selectedResource?.id)}
                sx={{
                  color: favorites.includes(selectedResource?.id) ? '#F44336' : '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1),
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <Favorite />
              </IconButton>
              <IconButton sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                <Share />
              </IconButton>
              <IconButton sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                <Download />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedResource && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                {selectedResource.description}
              </Typography>

              <Accordion sx={{
                bgcolor: alpha('#ffffff', 0.1),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                mb: 2,
                '&:before': {
                  display: 'none',
                },
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('therapyGuide.resourceContent')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                    {selectedResource.content}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{
                bgcolor: alpha('#ffffff', 0.1),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                mb: 2,
                '&:before': {
                  display: 'none',
                },
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('therapyGuide.techniques')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {selectedResource.techniques.map((technique, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Psychology sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Typography sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                              {technique}
                            </Typography>
                          } 
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{
                bgcolor: alpha('#ffffff', 0.1),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                mb: 2,
                '&:before': {
                  display: 'none',
                },
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('therapyGuide.whenToUse')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                    {selectedResource.whenToUse}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{
                bgcolor: alpha('#ffffff', 0.1),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                mb: 2,
                '&:before': {
                  display: 'none',
                },
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    {t('therapyGuide.tips')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                    {selectedResource.tips}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
                border: '1px solid rgba(255,255,255,0.5)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              },
            }}
          >
            {t('common.close')}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            sx={{
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
                border: '1px solid rgba(255,255,255,0.5)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              },
            }}
          >
            {t('therapyGuide.download')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TherapyGuidePage;

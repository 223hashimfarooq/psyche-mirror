import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Psychology,
  SelfImprovement,
  Favorite,
  CheckCircle,
  PlayArrow,
  Pause,
  VolumeUp,
  TextFields,
  EmojiEmotions,
  TrendingUp,
  Timer,
  Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const TherapyRecommendation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [therapySession, setTherapySession] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    if (location.state?.analysisResult) {
      setAnalysisResult(location.state.analysisResult);
      generateTherapyRecommendation(location.state.analysisResult);
    } else {
      // If no analysis result, redirect back to dashboard
      navigate('/patient/dashboard');
    }
  }, [location.state, navigate]);

  const generateTherapyRecommendation = async (analysis) => {
    try {
      // Generate therapy recommendation based on analysis
      const therapyRecommendation = {
        emotion: analysis.emotion,
        severity: analysis.severity || 3,
        recommendedTherapy: getRecommendedTherapy(analysis.emotion, analysis.severity),
        estimatedDuration: getEstimatedDuration(analysis.severity),
        techniques: getTherapyTechniques(analysis.emotion),
        goals: getTherapyGoals(analysis.emotion)
      };

      setTherapySession(therapyRecommendation);
    } catch (error) {
      console.error('Error generating therapy recommendation:', error);
    }
  };

  const getRecommendedTherapy = (emotion, severity) => {
    const therapyMap = {
      'anxious': 'Cognitive Behavioral Therapy (CBT)',
      'stressed': 'Mindfulness-Based Stress Reduction',
      'sad': 'Positive Psychology Intervention',
      'angry': 'Anger Management Techniques',
      'depressed': 'Behavioral Activation Therapy',
      'neutral': 'Wellness Maintenance Program',
      'happy': 'Positive Reinforcement Therapy'
    };
    return therapyMap[emotion] || 'General Wellness Therapy';
  };

  const getEstimatedDuration = (severity) => {
    if (severity <= 2) return '15-20 minutes';
    if (severity <= 4) return '25-35 minutes';
    return '40-50 minutes';
  };

  const getTherapyTechniques = (emotion) => {
    const techniquesMap = {
      'anxious': [
        'Deep Breathing Exercises',
        'Progressive Muscle Relaxation',
        'Mindfulness Meditation',
        'Cognitive Restructuring'
      ],
      'stressed': [
        'Guided Imagery',
        'Body Scan Meditation',
        'Stress Ball Techniques',
        'Time Management Strategies'
      ],
      'sad': [
        'Gratitude Journaling',
        'Positive Affirmations',
        'Social Connection Activities',
        'Physical Exercise'
      ],
      'angry': [
        'Anger Logging',
        'Relaxation Techniques',
        'Communication Skills',
        'Conflict Resolution'
      ],
      'depressed': [
        'Behavioral Activation',
        'Mood Tracking',
        'Social Engagement',
        'Goal Setting'
      ]
    };
    return techniquesMap[emotion] || ['General Wellness Techniques', 'Mindfulness', 'Breathing Exercises'];
  };

  const getTherapyGoals = (emotion) => {
    const goalsMap = {
      'anxious': [
        'Reduce anxiety levels',
        'Improve coping strategies',
        'Increase emotional regulation',
        'Build confidence'
      ],
      'stressed': [
        'Lower stress levels',
        'Improve work-life balance',
        'Enhance relaxation skills',
        'Increase resilience'
      ],
      'sad': [
        'Improve mood',
        'Increase positive emotions',
        'Build social connections',
        'Develop hope and optimism'
      ],
      'angry': [
        'Manage anger triggers',
        'Improve emotional control',
        'Develop healthy expression',
        'Enhance communication'
      ],
      'depressed': [
        'Increase motivation',
        'Improve daily functioning',
                'Build positive activities',
        'Develop coping skills'
      ]
    };
    return goalsMap[emotion] || ['Improve overall well-being', 'Build emotional resilience', 'Develop healthy habits'];
  };

  const startTherapySession = () => {
    setIsSessionActive(true);
    setCurrentStep(0);
    setSessionProgress(0);
  };

  const pauseTherapySession = () => {
    setIsSessionActive(false);
  };

  const completeTherapySession = async () => {
    try {
      // Save therapy session data
      await api.post('/therapy/sessions', {
        patient_id: user.id,
        therapy_type: therapySession.recommendedTherapy,
        duration: sessionProgress,
        notes: sessionNotes,
        mood_before: analysisResult.emotion,
        mood_after: 'improved', // This would be assessed after session
        status: 'completed'
      });

      // Save emotional progress
      await api.post('/emotional-progress', {
        patient_id: user.id,
        session_date: new Date().toISOString().split('T')[0],
        emotional_score: Math.min(5, (analysisResult.severity || 3) + 1), // Assume improvement
        notes: sessionNotes
      });

      navigate('/patient/dashboard');
    } catch (error) {
      console.error('Error saving therapy session:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < therapySession.techniques.length - 1) {
      setCurrentStep(currentStep + 1);
      setSessionProgress(((currentStep + 1) / therapySession.techniques.length) * 100);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSessionProgress((currentStep / therapySession.techniques.length) * 100);
    }
  };

  if (!analysisResult || !therapySession) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box textAlign="center">
          <Typography variant="h6">Loading therapy recommendation...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            Personalized Therapy Session
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Based on your emotional analysis
          </Typography>
        </Box>

        {/* Analysis Summary */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Emotional Analysis Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1, width: 60, height: 60 }}>
                    <EmojiEmotions sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h6">{analysisResult.emotion}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detected Emotion
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary.main">
                    {analysisResult.severity || 3}/6
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Severity Level
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h6">{therapySession.estimatedDuration}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Duration
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Therapy Recommendation */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommended Therapy
                </Typography>
                <Typography variant="h5" color="primary.main" gutterBottom>
                  {therapySession.recommendedTherapy}
                </Typography>
                <Typography variant="body1" paragraph>
                  {analysisResult.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Therapy Goals
                </Typography>
                <List dense>
                  {therapySession.goals.map((goal, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={goal} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommended Techniques
                </Typography>
                <Grid container spacing={1}>
                  {therapySession.techniques.map((technique, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Chip
                        label={technique}
                        color={index === currentStep ? 'primary' : 'default'}
                        variant={index === currentStep ? 'filled' : 'outlined'}
                        sx={{ mb: 1, width: '100%' }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Therapy Session */}
        {isSessionActive && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Therapy Session Progress
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<Pause />}
                    onClick={pauseTherapySession}
                    sx={{ mr: 1 }}
                  >
                    Pause
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={completeTherapySession}
                  >
                    Complete Session
                  </Button>
                </Box>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={sessionProgress} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {Math.round(sessionProgress)}% Complete
              </Typography>

              <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
                {therapySession.techniques.map((technique, index) => (
                  <Step key={index}>
                    <StepLabel>{technique}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box textAlign="center" py={3}>
                <Typography variant="h5" gutterBottom>
                  {therapySession.techniques[currentStep]}
                </Typography>
                <Typography variant="body1" paragraph>
                  {getTechniqueDescription(therapySession.techniques[currentStep])}
                </Typography>
                
                <Box mt={3}>
                  <Button
                    variant="outlined"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    sx={{ mr: 2 }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="contained"
                    onClick={nextStep}
                    disabled={currentStep === therapySession.techniques.length - 1}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Session Notes */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Session Notes
            </Typography>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Record your thoughts and feelings during the session..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isSessionActive && (
          <Box textAlign="center" mt={4}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={startTherapySession}
              sx={{ px: 4, py: 2, fontSize: '1.1rem' }}
            >
              Start Therapy Session
            </Button>
          </Box>
        )}
      </motion.div>
    </Container>
  );
};

const getTechniqueDescription = (technique) => {
  const descriptions = {
    'Deep Breathing Exercises': 'Focus on slow, deep breaths. Inhale for 4 counts, hold for 4 counts, exhale for 6 counts. Repeat 5-10 times.',
    'Progressive Muscle Relaxation': 'Tense each muscle group for 5 seconds, then release. Start from your toes and work up to your head.',
    'Mindfulness Meditation': 'Focus on your breath and observe your thoughts without judgment. Let them pass like clouds in the sky.',
    'Cognitive Restructuring': 'Identify negative thoughts and challenge them with evidence. Replace with more balanced thinking.',
    'Guided Imagery': 'Close your eyes and imagine a peaceful place. Use all your senses to make it feel real.',
    'Body Scan Meditation': 'Slowly scan your body from head to toe, noticing any tension and releasing it.',
    'Gratitude Journaling': 'Write down three things you\'re grateful for today. Focus on specific details.',
    'Positive Affirmations': 'Repeat positive statements about yourself. "I am worthy of love and happiness."',
    'Anger Logging': 'Write down what triggered your anger, your thoughts, and how you responded.',
    'Behavioral Activation': 'Plan and engage in activities that bring you joy or a sense of accomplishment.'
  };
  return descriptions[technique] || 'Follow the guided instructions for this technique.';
};

export default TherapyRecommendation;

import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import notificationService from '../services/notificationService';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Psychology,
  CheckCircle,
  Warning,
  Info,
  ExpandMore,
  PlayArrow,
  Timer,
  SelfImprovement,
  Spa,
  MusicNote,
  FitnessCenter,
  Favorite,
  Healing,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const TherapyRecommendationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const analysisResult = location.state?.analysisResult;
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [interviewAnswers, setInterviewAnswers] = useState({});
  const [psychologicalAssessment, setPsychologicalAssessment] = useState(null);
  const [disorderDetected, setDisorderDetected] = useState(null);
  const [therapyPlan, setTherapyPlan] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [therapyDay, setTherapyDay] = useState(1);
  const [completedSessionsToday, setCompletedSessionsToday] = useState(0);
  const [totalSessionsCompleted, setTotalSessionsCompleted] = useState(0);
  const [therapyPlanProgress, setTherapyPlanProgress] = useState(0);

  // Typeform-style assessment state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPreviousButton, setShowPreviousButton] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'success', 'info', 'warning'
  const [isCompletingSession, setIsCompletingSession] = useState(false); // Prevent duplicate completion calls
  const [sessionCompletionHandled, setSessionCompletionHandled] = useState(false); // Track completion state
  const [allTherapiesCompleted, setAllTherapiesCompleted] = useState(false); // Track if all therapies are done
  const [assessmentId, setAssessmentId] = useState(null); // Store assessment ID for updating therapy plan
  const [completedTherapyIds, setCompletedTherapyIds] = useState([]); // Store completed therapy IDs to filter them out

  // Refs for managing intervals and preventing race conditions
  const progressIntervalRef = useRef(null);
  const completionHandledRef = useRef(false);
  const isCompletingRef = useRef(false);
  const currentActivityIdRef = useRef(null); // Store current activity ID to prevent loss during async operations

  // Compute available therapies dynamically (filtered and excluding active session)
  const availableTherapies = useMemo(() => {
    console.log('=== Computing available therapies ===');
    console.log('Therapy plan:', therapyPlan);
    console.log('Therapy plan activities:', therapyPlan?.activities);
    console.log('Completed therapy IDs:', completedTherapyIds);
    console.log('Active session:', activeSession);
    console.log('Show feedback:', showFeedback);
    
    if (!therapyPlan || !therapyPlan.activities) {
      console.log('No therapy plan or activities, returning empty array');
      return [];
    }
    
    // If there's an active session, don't show any therapies in the list
    // (the active session is shown separately above)
    if (activeSession && !showFeedback) {
      console.log('Active session in progress, returning empty array');
      return [];
    }
    
    // Filter out completed therapies
    const filtered = therapyPlan.activities.filter(
      activityId => {
        const isCompleted = completedTherapyIds.includes(activityId);
        console.log(`Activity ${activityId}: ${isCompleted ? 'COMPLETED' : 'AVAILABLE'}`);
        return !isCompleted;
      }
    );
    
    console.log('Filtered available therapies:', filtered);
    console.log('=== End computing available therapies ===');
    return filtered;
  }, [therapyPlan, completedTherapyIds, activeSession, showFeedback]);

  // Reset completion state when activeSession changes
  useEffect(() => {
    if (activeSession) {
      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setSessionCompletionHandled(false);
      completionHandledRef.current = false;
      setIsCompletingSession(false);
      isCompletingRef.current = false;
      setAllTherapiesCompleted(false);
    } else {
      // Clear interval when session ends
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [activeSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // Load therapy tracking data and completed therapies on component mount
  useEffect(() => {
    const loadTherapyData = async () => {
      try {
        // Load therapy tracking
        const trackingResponse = await apiService.getTherapyTracking();
        if (trackingResponse.success) {
          const tracking = trackingResponse.tracking;
          setTherapyDay(tracking.therapyDay);
          setCompletedSessionsToday(tracking.sessionsToday);
          setTotalSessionsCompleted(tracking.totalSessions);
          setTherapyPlanProgress(tracking.planProgress);
        }

        // Load completed therapy sessions today to filter them out (load first to use for filtering)
        const sessionsResponse = await apiService.getTherapySessions(100, 0);
        let completedToday = [];
        if (sessionsResponse.success && sessionsResponse.sessions) {
          console.log('=== LOADING COMPLETED THERAPIES ===');
          console.log('Total sessions received:', sessionsResponse.sessions.length);
          
          // Get completed therapy IDs from today
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          console.log('Today date string:', todayStr);
          
          completedToday = sessionsResponse.sessions
            .filter(session => {
              // Skip if not completed
              if (!session.completed) {
                console.log('Session not completed:', session.activityId);
                return false;
              }
              
              // Skip 'unknown' activity IDs - these are invalid and shouldn't be filtered
              if (!session.activityId || session.activityId === 'unknown') {
                console.warn('Skipping session with invalid activity ID:', session.activityId, session.activityName);
                return false;
              }
              
              // Handle different date formats
              let sessionDate;
              if (session.createdAt) {
                sessionDate = new Date(session.createdAt);
                if (isNaN(sessionDate.getTime())) {
                  console.warn('Invalid date:', session.createdAt);
                  return false;
                }
                const sessionDateStr = sessionDate.toISOString().split('T')[0];
                const matches = sessionDateStr === todayStr;
                console.log(`Session ${session.activityId}: ${sessionDateStr} === ${todayStr}? ${matches}`);
                return matches;
              }
              return false;
            })
            .map(session => {
              console.log('Adding completed therapy:', session.activityId, session.activityName);
              return session.activityId;
            })
            .filter(id => id && id !== 'unknown'); // Final filter to remove any 'unknown' IDs
          
          console.log('Completed therapies today (final):', completedToday);
          setCompletedTherapyIds(completedToday);
        } else {
          console.warn('Failed to load sessions or no sessions array:', sessionsResponse);
        }

        // Load latest assessment to get therapy plan and assessment ID
        const assessmentsResponse = await apiService.getTherapyAssessments();
        if (assessmentsResponse.success && assessmentsResponse.assessments.length > 0) {
          const latestAssessment = assessmentsResponse.assessments[0];
          setAssessmentId(latestAssessment.id);
          
          // If therapy plan exists, load it and filter out completed therapies
          if (latestAssessment.therapyPlan && latestAssessment.therapyPlan.activities) {
            // Filter out completed therapies from the plan
            const filteredActivities = latestAssessment.therapyPlan.activities.filter(
              activityId => !completedToday.includes(activityId)
            );
            
            const filteredPlan = {
              ...latestAssessment.therapyPlan,
              activities: filteredActivities
            };
            
            setTherapyPlan(filteredPlan);
            console.log('Loaded therapy plan with filtered activities:', filteredPlan);
          }
        }
      } catch (error) {
        console.error('Failed to load therapy data:', error);
      }
    };

    loadTherapyData();
  }, []);

  // Psychological interview questions - using translations
  const interviewQuestions = useMemo(() => [
    {
      id: 'mood_frequency',
      question: t('therapyRecommendation.questions.moodFrequency'),
      options: [
        { value: 'rarely', label: t('therapyRecommendation.questions.moodFrequencyOptions.rarely') },
        { value: 'occasionally', label: t('therapyRecommendation.questions.moodFrequencyOptions.occasionally') },
        { value: 'frequently', label: t('therapyRecommendation.questions.moodFrequencyOptions.frequently') },
        { value: 'constantly', label: t('therapyRecommendation.questions.moodFrequencyOptions.constantly') }
      ]
    },
    {
      id: 'sleep_patterns',
      question: t('therapyRecommendation.questions.sleepPatterns'),
      options: [
        { value: 'excellent', label: t('therapyRecommendation.questions.sleepOptions.excellent') },
        { value: 'good', label: t('therapyRecommendation.questions.sleepOptions.good') },
        { value: 'poor', label: t('therapyRecommendation.questions.sleepOptions.poor') },
        { value: 'severe', label: t('therapyRecommendation.questions.sleepOptions.severe') }
      ]
    },
    {
      id: 'anxiety_levels',
      question: t('therapyRecommendation.questions.anxietyLevels'),
      options: [
        { value: 'minimal', label: t('therapyRecommendation.questions.anxietyOptions.minimal') },
        { value: 'mild', label: t('therapyRecommendation.questions.anxietyOptions.mild') },
        { value: 'moderate', label: t('therapyRecommendation.questions.anxietyOptions.moderate') },
        { value: 'severe', label: t('therapyRecommendation.questions.anxietyOptions.severe') }
      ]
    },
    {
      id: 'social_interaction',
      question: t('therapyRecommendation.questions.socialInteraction'),
      options: [
        { value: 'very_comfortable', label: t('therapyRecommendation.questions.socialOptions.veryComfortable') },
        { value: 'comfortable', label: t('therapyRecommendation.questions.socialOptions.comfortable') },
        { value: 'uncomfortable', label: t('therapyRecommendation.questions.socialOptions.uncomfortable') },
        { value: 'avoidant', label: t('therapyRecommendation.questions.socialOptions.avoidant') }
      ]
    },
    {
      id: 'concentration',
      question: t('therapyRecommendation.questions.concentration'),
      options: [
        { value: 'excellent', label: t('therapyRecommendation.questions.concentrationOptions.excellent') },
        { value: 'good', label: t('therapyRecommendation.questions.concentrationOptions.good') },
        { value: 'poor', label: t('therapyRecommendation.questions.concentrationOptions.poor') },
        { value: 'severe', label: t('therapyRecommendation.questions.concentrationOptions.severe') }
      ]
    },
    {
      id: 'energy_levels',
      question: t('therapyRecommendation.questions.energyLevels'),
      options: [
        { value: 'high', label: t('therapyRecommendation.questions.energyOptions.high') },
        { value: 'moderate', label: t('therapyRecommendation.questions.energyOptions.moderate') },
        { value: 'low', label: t('therapyRecommendation.questions.energyOptions.low') },
        { value: 'very_low', label: t('therapyRecommendation.questions.energyOptions.veryLow') }
      ]
    },
    {
      id: 'appetite_changes',
      question: t('therapyRecommendation.questions.appetiteChanges'),
      options: [
        { value: 'normal', label: t('therapyRecommendation.questions.appetiteOptions.normal') },
        { value: 'increased', label: t('therapyRecommendation.questions.appetiteOptions.increased') },
        { value: 'decreased', label: t('therapyRecommendation.questions.appetiteOptions.decreased') },
        { value: 'irregular', label: t('therapyRecommendation.questions.appetiteOptions.irregular') }
      ]
    },
    {
      id: 'stress_triggers',
      question: t('therapyRecommendation.questions.stressTriggers'),
      options: [
        { value: 'work', label: t('therapyRecommendation.questions.stressOptions.work') },
        { value: 'relationships', label: t('therapyRecommendation.questions.stressOptions.relationships') },
        { value: 'health', label: t('therapyRecommendation.questions.stressOptions.health') },
        { value: 'financial', label: t('therapyRecommendation.questions.stressOptions.financial') }
      ]
    }
  ], [t]);

  // Psychological disorders knowledge base
  const disordersDatabase = {
    depression: {
      name: 'Major Depressive Disorder',
      symptoms: ['Persistent sadness', 'Loss of interest', 'Fatigue', 'Sleep disturbances', 'Appetite changes'],
      severity: 'moderate',
      description: 'A mood disorder characterized by persistent feelings of sadness and loss of interest.',
      therapyApproach: 'CBT, Interpersonal Therapy, Medication if severe'
    },
    anxiety: {
      name: 'Generalized Anxiety Disorder',
      symptoms: ['Excessive worry', 'Restlessness', 'Fatigue', 'Difficulty concentrating', 'Muscle tension'],
      severity: 'moderate',
      description: 'Characterized by excessive, uncontrollable worry about various aspects of life.',
      therapyApproach: 'CBT, Relaxation techniques, Mindfulness'
    },
    bipolar: {
      name: 'Bipolar Disorder',
      symptoms: ['Mood swings', 'High energy periods', 'Depressive episodes', 'Irritability', 'Sleep changes'],
      severity: 'severe',
      description: 'A mood disorder with alternating periods of mania and depression.',
      therapyApproach: 'Mood stabilizers, Psychoeducation, Regular monitoring'
    },
    ptsd: {
      name: 'Post-Traumatic Stress Disorder',
      symptoms: ['Flashbacks', 'Nightmares', 'Hypervigilance', 'Avoidance', 'Mood changes'],
      severity: 'severe',
      description: 'Develops after experiencing or witnessing a traumatic event.',
      therapyApproach: 'EMDR, Trauma-focused CBT, Exposure therapy'
    }
  };

  // Therapy activities database - using translations
  const therapyActivities = useMemo(() => ({
    breathing: {
      title: t('therapy.activities.breathing.title'),
      description: t('therapy.activities.breathing.description'),
      duration: 5,
      type: 'relaxation',
      icon: <Spa sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
      instructions: t('therapy.activities.breathing.instructions', { returnObjects: true })
    },
    mindfulness: {
      title: t('therapy.activities.mindfulness.title'),
      description: t('therapy.activities.mindfulness.description'),
      duration: 10,
      type: 'meditation',
      icon: <SelfImprovement sx={{ fontSize: 40 }} />,
      color: '#2196F3',
      instructions: t('therapy.activities.mindfulness.instructions', { returnObjects: true })
    },
    cbt: {
      title: t('therapy.activities.cbt.title'),
      description: t('therapy.activities.cbt.description'),
      duration: 15,
      type: 'cognitive',
      icon: <Psychology sx={{ fontSize: 40 }} />,
      color: '#FF9800',
      instructions: t('therapy.activities.cbt.instructions', { returnObjects: true })
    },
    progressive_relaxation: {
      title: t('therapy.activities.progressive_relaxation.title'),
      description: t('therapy.activities.progressive_relaxation.description'),
      duration: 12,
      type: 'physical',
      icon: <FitnessCenter sx={{ fontSize: 40 }} />,
      color: '#9C27B0',
      instructions: t('therapy.activities.progressive_relaxation.instructions', { returnObjects: true })
    },
    gratitude: {
      title: t('therapy.activities.gratitude.title'),
      description: t('therapy.activities.gratitude.description'),
      duration: 8,
      type: 'positive',
      icon: <Favorite sx={{ fontSize: 40 }} />,
      color: '#E91E63',
      instructions: t('therapy.activities.gratitude.instructions', { returnObjects: true })
    },
    music_therapy: {
      title: t('therapy.activities.music_therapy.title'),
      description: t('therapy.activities.music_therapy.description'),
      duration: 20,
      type: 'creative',
      icon: <MusicNote sx={{ fontSize: 40 }} />,
      color: '#FF5722',
      instructions: t('therapy.activities.music_therapy.instructions', { returnObjects: true })
    }
  }), [t]);

  // Assessment algorithm
  const assessPsychologicalState = (answers, emotionData) => {
    let score = 0;
    let riskFactors = [];
    let detectedDisorders = [];

    // Analyze answers
    Object.entries(answers).forEach(([questionId, answer]) => {
      switch (questionId) {
        case 'mood_frequency':
          if (answer === 'constantly') { score += 3; riskFactors.push('Frequent mood changes'); }
          else if (answer === 'frequently') { score += 2; }
          else if (answer === 'occasionally') { score += 1; }
          break;
        case 'sleep_patterns':
          if (answer === 'severe') { score += 3; riskFactors.push('Sleep disturbances'); }
          else if (answer === 'poor') { score += 2; }
          break;
        case 'anxiety_levels':
          if (answer === 'severe') { score += 3; riskFactors.push('Severe anxiety'); detectedDisorders.push('anxiety'); }
          else if (answer === 'moderate') { score += 2; }
          break;
        case 'social_interaction':
          if (answer === 'avoidant') { score += 2; riskFactors.push('Social isolation'); }
          break;
        case 'concentration':
          if (answer === 'severe') { score += 2; riskFactors.push('Concentration issues'); }
          break;
        case 'energy_levels':
          if (answer === 'very_low') { score += 2; riskFactors.push('Low energy'); }
          break;
        case 'appetite_changes':
          if (answer === 'irregular') { score += 1; riskFactors.push('Appetite changes'); }
          break;
      }
    });

    // Analyze emotion data
    if (emotionData) {
      if (emotionData.emotion === 'sad' && emotionData.confidence > 0.7) {
        score += 2;
        detectedDisorders.push('depression');
      }
      if (emotionData.emotion === 'angry' && emotionData.confidence > 0.7) {
        score += 1;
        riskFactors.push('Anger issues');
      }
      if (emotionData.confidence < 0.5) {
        score += 1;
        riskFactors.push('Emotional instability');
      }
    }

    // Determine severity and recommendations
    let severity = 'mild';
    let recommendations = [];

    if (score >= 8) {
      severity = 'severe';
      recommendations = ['Immediate professional help recommended', 'Consider medication evaluation', 'Regular therapy sessions'];
    } else if (score >= 5) {
      severity = 'moderate';
      recommendations = ['Regular therapy sessions', 'Self-help techniques', 'Monitor symptoms'];
    } else {
      severity = 'mild';
      recommendations = ['Self-help techniques', 'Regular check-ins', 'Preventive measures'];
    }

    return {
      score,
      severity,
      riskFactors,
      detectedDisorders: [...new Set(detectedDisorders)],
      recommendations
    };
  };

  // Generate personalized therapy plan
  const generateTherapyPlan = (assessment, emotionData) => {
    const plan = {
      duration: '4 weeks',
      sessions: [],
      goals: [],
      activities: [],
      monitoring: []
    };

    // Add goals based on assessment
    if (assessment.detectedDisorders.includes('depression')) {
      plan.goals.push('Improve mood and motivation');
      plan.goals.push('Establish healthy routines');
      plan.goals.push('Challenge negative thoughts');
    }
    if (assessment.detectedDisorders.includes('anxiety')) {
      plan.goals.push('Reduce anxiety levels');
      plan.goals.push('Learn relaxation techniques');
      plan.goals.push('Manage worry patterns');
    }
    if (assessment.severity === 'severe') {
      plan.goals.push('Crisis management');
      plan.goals.push('Professional support');
    }

    // Always add default goals if none were added
    if (plan.goals.length === 0) {
      plan.goals.push('Improve overall mental wellness');
      plan.goals.push('Develop healthy coping strategies');
      plan.goals.push('Enhance emotional awareness');
    }

    // Add activities based on needs
    if (assessment.detectedDisorders.includes('anxiety')) {
      plan.activities.push('breathing', 'mindfulness', 'progressive_relaxation');
    }
    if (assessment.detectedDisorders.includes('depression')) {
      plan.activities.push('cbt', 'gratitude', 'music_therapy');
    }
    
    // Add activities based on severity if no disorder-specific activities were added
    if (plan.activities.length === 0) {
      if (assessment.severity === 'severe') {
        plan.activities.push('breathing', 'mindfulness', 'progressive_relaxation', 'cbt');
      } else if (assessment.severity === 'moderate') {
        plan.activities.push('mindfulness', 'breathing', 'gratitude');
      } else {
        // Mild or no severity - always add default wellness activities
        plan.activities.push('mindfulness', 'breathing', 'gratitude');
      }
    }

    // Add monitoring
    plan.monitoring = [
      'Daily mood tracking',
      'Sleep pattern monitoring',
      'Weekly progress review',
      'Monthly assessment'
    ];

    console.log('Generated therapy plan:', plan);
    console.log('Activities count:', plan.activities.length);
    
    return plan;
  };

  // Handle interview answer
  const handleAnswerChange = (questionId, value) => {
    setInterviewAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Typeform-style assessment functions
  const handleAssessmentAnswer = (questionId, value) => {
    // Save answer
    setAssessmentAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Auto-advance to next question after a short delay for UX feedback
    const isLast = currentQuestionIndex >= interviewQuestions.length - 1;
    setTimeout(() => {
      if (isLast) {
        completeAssessment();
      } else {
        nextQuestion();
      }
    }, 150);
  };

  const startAssessment = () => {
    setShowWelcomeScreen(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setShowPreviousButton(true);
        setIsTransitioning(false);
      }, 300);
    } else {
      // All questions completed, proceed to assessment
      completeAssessment();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1);
        setShowPreviousButton(currentQuestionIndex - 1 > 0);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const completeAssessment = async () => {
    try {
      console.log('=== COMPLETING ASSESSMENT ===');
      console.log('Assessment answers:', assessmentAnswers);
      console.log('Analysis result:', analysisResult);
      
      // Complete psychological assessment
      const assessment = assessPsychologicalState(assessmentAnswers, analysisResult);
      console.log('Psychological assessment result:', assessment);
      setPsychologicalAssessment(assessment);
      
      if (assessment.detectedDisorders.length > 0) {
        const primaryDisorder = assessment.detectedDisorders[0];
        setDisorderDetected(disordersDatabase[primaryDisorder]);
      }
      
      // Generate therapy plan
      const plan = generateTherapyPlan(assessment, analysisResult);
      console.log('Generated therapy plan:', plan);
      console.log('Plan activities:', plan.activities);
      console.log('Plan activities length:', plan.activities?.length);
      setTherapyPlan(plan);

      // Save assessment to backend
      try {
        const response = await apiService.saveTherapyAssessment({
          interviewAnswers: assessmentAnswers,
          psychologicalAssessment: assessment,
          disorderDetected: assessment.detectedDisorders.length > 0 ? disordersDatabase[assessment.detectedDisorders[0]] : null,
          therapyPlan: plan,
          analysisResult
        });
        console.log('Therapy assessment saved successfully:', response);
        
        // Store assessment ID for future updates
        if (response.assessmentId) {
          setAssessmentId(response.assessmentId);
        }

        // Setup notifications for therapy reminders
        await setupTherapyNotifications(plan);
      } catch (error) {
        console.error('Failed to save therapy assessment:', error);
        // Don't block UI if save fails
      }

      // Move to next step (show diagnosis/results)
      console.log('Moving to step 1 (diagnosis)');
      setCurrentStep(1);
    } catch (error) {
      console.error('Error completing assessment:', error);
      setMessageText('Error completing assessment. Please try again.');
      setMessageType('error');
      setShowMessage(true);
    }
  };

  // Move to next step (for non-assessment steps)
  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  // Start therapy session
  const startSession = async (activityId) => {
    // Prevent starting if a session is already active
    if (activeSession || isCompletingRef.current) {
      console.log('Session already active or completing, cannot start new session');
      return;
    }

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    console.log('Starting session for activityId:', activityId);
    const activity = therapyActivities[activityId];
    console.log('Activity object:', activity);
    
    // Store activity ID in ref for reliable access during completion
    currentActivityIdRef.current = activityId;
    
    const sessionWithId = { ...activity, id: activityId };
    console.log('Session with ID:', sessionWithId);
    console.log('Stored activity ID in ref:', currentActivityIdRef.current);
    
    // Reset all state and refs
    setActiveSession(sessionWithId);
    setSessionProgress(0);
    setSessionCompleted(false);
    setShowFeedback(false);
    setSessionCompletionHandled(false);
    completionHandledRef.current = false;
    setIsCompletingSession(false);
    isCompletingRef.current = false;
    setAllTherapiesCompleted(false);
    
    // Save session start to backend
    try {
      await apiService.saveTherapySession({
        activityId,
        activityName: activity.title,
        duration: activity.duration,
        completed: false,
        progress: 0,
        notes: 'Session started'
      });
      console.log('Therapy session started and saved');
    } catch (error) {
      console.error('Failed to save therapy session:', error);
    }
    
    // Calculate realistic progress interval based on duration (TESTING: Make instant)
    const totalDurationMs = 1000; // 1 second for testing (was: activity.duration * 60 * 1000)
    const progressInterval = 10; // Update every 10ms for testing (was: totalDurationMs / 100)
    
    // Simulate realistic session progress
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += 1;
      
      // Update progress state
      setSessionProgress(currentProgress);
      
      // Check if reached 100% - clear interval immediately and call completion once
      if (currentProgress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        console.log('Progress reached 100%, calling completeSession...');
        completeSession();
      }
    }, progressInterval);
  };

  // Helper function to show messages
  const displayMessage = (text, type = 'info', duration = 4000) => {
    setMessageText(text);
    setMessageType(type);
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  };

  // Handle session completion with better state management
  const completeSession = () => {
    // Use ref for immediate synchronous check to prevent race conditions
    if (completionHandledRef.current) {
      console.log('Session already completed, skipping...');
      return;
    }
    
    // Set ref immediately to prevent duplicate calls
    completionHandledRef.current = true;
    setSessionCompletionHandled(true);
    
    // Clear interval if still running
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    console.log('Completing session...');
    
    setSessionProgress(100); // Ensure progress is at 100
    setSessionCompleted(true);
    setShowFeedback(true);
    
    // Handle completion after showing feedback
    setTimeout(() => {
      handleTherapyCompletion();
    }, 2000);
  };

  // Array-based therapy completion handler
  const handleTherapyCompletion = async () => {
    // Use ref for immediate synchronous check to prevent race conditions
    if (isCompletingRef.current) {
      console.log('Session completion already in progress, skipping...');
      return;
    }
    
    // Set ref immediately to prevent duplicate calls
    isCompletingRef.current = true;
    setIsCompletingSession(true);
    
    console.log('=== THERAPY COMPLETION START ===');
    console.log('Active session:', activeSession);
    console.log('Current activity ID from ref:', currentActivityIdRef.current);
    console.log('Current therapy plan:', therapyPlan);
    console.log('Current completed therapy IDs:', completedTherapyIds);
    
    // Store therapy info BEFORE clearing activeSession - use ref as primary source
    const completedActivityId = currentActivityIdRef.current || activeSession?.id || activeSession?.title || 'unknown';
    const therapyTitle = activeSession?.title || therapyActivities[completedActivityId]?.title || 'Therapy session';
    const therapyDuration = activeSession?.duration || therapyActivities[completedActivityId]?.duration || 5;
    
    console.log('Completed activity ID (final):', completedActivityId);
    console.log('Completed therapy title (final):', therapyTitle);
    console.log('Completed therapy duration (final):', therapyDuration);
    
    // Validate that we have a valid activity ID
    if (completedActivityId === 'unknown' || !therapyActivities[completedActivityId]) {
      console.error('ERROR: Invalid activity ID! Cannot complete therapy.', {
        completedActivityId,
        activeSessionId: activeSession?.id,
        refId: currentActivityIdRef.current,
        activeSession: activeSession,
        availableActivities: Object.keys(therapyActivities)
      });
      // Don't proceed with invalid ID - reset and show error
      setIsCompletingSession(false);
      isCompletingRef.current = false;
      displayMessage('Error: Could not identify therapy session. Please try again.', 'warning', 3000);
      return;
    }
    
    try {
      // Save session to database
      const sessionData = {
        activityId: completedActivityId,
        activityName: therapyTitle,
        duration: therapyDuration,
        completed: true,
        progress: 100,
        notes: 'Session completed successfully'
      };
      
      const response = await apiService.saveTherapySession(sessionData);
      console.log('=== SESSION SAVE RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response success:', response?.success);
      console.log('Response activityId:', response?.activityId);
      console.log('Response completed:', response?.completed);
      
      // ARRAY-BASED OPERATIONS - All done in one atomic operation
      if (therapyPlan && therapyPlan.activities) {
        console.log('Before - therapy activities:', therapyPlan.activities);
        console.log('Before - completed therapy IDs:', completedTherapyIds);
        
        // Create new activities array without the completed therapy
        const updatedActivities = therapyPlan.activities.filter(activityId => activityId !== completedActivityId);
        console.log('After - therapy activities:', updatedActivities);
        
        // Create new therapy plan with updated activities array
        const newTherapyPlan = {
          ...therapyPlan,
          activities: updatedActivities
        };
        
        // Update completedTherapyIds FIRST for immediate UI update
        const newCompletedIds = [...completedTherapyIds, completedActivityId];
        console.log('New completed therapy IDs:', newCompletedIds);
        setCompletedTherapyIds(newCompletedIds);
        
        // Update therapy plan state
        setTherapyPlan(newTherapyPlan);
        setCompletedSessionsToday(prev => prev + 1);
        setTotalSessionsCompleted(prev => prev + 1);
        setTherapyPlanProgress(prev => prev + 1);
        
        console.log('Updated therapy plan:', newTherapyPlan);
        console.log('Remaining activities count:', updatedActivities.length);
        console.log('Available therapies after update:', updatedActivities.filter(id => !newCompletedIds.includes(id)));
        
        // Update therapy plan in backend if assessmentId exists (async, don't wait)
        if (assessmentId) {
          apiService.updateTherapyPlan(assessmentId, newTherapyPlan)
            .then(() => console.log('Therapy plan updated in backend'))
            .catch(error => console.error('Failed to update therapy plan in backend:', error));
        }
        
        // Check if all therapies are completed (array is empty)
        if (updatedActivities.length === 0) {
          console.log('All therapies completed - showing dashboard button');
          setAllTherapiesCompleted(true);
          displayMessage(`🎉 Congratulations! You've completed all therapy sessions for today!`, 'success', 3000);
          // Reset session state but keep it visible for the completion message
          setTimeout(() => {
            setActiveSession(null);
            setSessionProgress(0);
            setSessionCompleted(false);
            setShowFeedback(false);
            completionHandledRef.current = false;
            isCompletingRef.current = false;
            currentActivityIdRef.current = null; // Clear the ref
          }, 3000);
        } else {
          console.log(`Therapy completed. ${updatedActivities.length} therapies remaining.`);
          console.log('Updated completed therapy IDs state:', newCompletedIds);
          console.log('Available therapies after completion:', updatedActivities.filter(id => !newCompletedIds.includes(id)));
          
          // Show message with therapy name
          const message = `Great! "${therapyTitle}" completed successfully. You have ${updatedActivities.length} more therapy session${updatedActivities.length > 1 ? 's' : ''} today.`;
          console.log('Displaying message:', message);
          displayMessage(message, 'success', 2000);
          
          setTimeout(() => {
            // Reset session state
            console.log('Resetting session state after completion');
            setActiveSession(null);
            setSessionProgress(0);
            setSessionCompleted(false);
            setShowFeedback(false);
            completionHandledRef.current = false;
            isCompletingRef.current = false;
            currentActivityIdRef.current = null; // Clear the ref
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error('Error in therapy completion:', error);
      displayMessage(`Session completed but failed to save. Please try again.`, 'warning', 3000);
      setTimeout(() => {
        setActiveSession(null);
        setSessionProgress(0);
        setSessionCompleted(false);
        setShowFeedback(false);
        completionHandledRef.current = false;
        isCompletingRef.current = false;
        currentActivityIdRef.current = null; // Clear the ref
      }, 3000);
    } finally {
      setIsCompletingSession(false);
      // Note: Don't reset isCompletingRef.current here - it's reset when session state is cleared
      console.log('=== THERAPY COMPLETION END ===');
    }
  };


  // Show daily completion message
  const showDailyCompletionMessage = () => {
    const message = `
      🎉 Congratulations! You've completed all therapy sessions for Day ${therapyDay}!
      
      ${therapyDay === 1 ? 
        "This is your first day of therapy - you're taking an important step towards better mental health!" :
        `You're making great progress! This is day ${therapyDay} of your therapy journey.`
      }
      
      Remember to continue your therapy plan regularly. Consistency is key to seeing positive results.
      
      ${therapyPlanProgress >= (therapyPlan?.activities.length || 1) * 7 ? 
        "🎊 Amazing! You've completed your full therapy plan! Take care and congratulations on your dedication!" :
        "Keep up the great work! Your mental health journey is important."
      }
    `;
    
    displayMessage(message, 'success', 6000);
    
    // Update therapy day for next session
    setTherapyDay(prev => prev + 1);
    setCompletedSessionsToday(0);
  };

  // Setup therapy notifications
  const setupTherapyNotifications = async (plan) => {
    try {
      // Request notification permission
      const hasPermission = await notificationService.requestPermission();
      
      if (hasPermission) {
        // Schedule daily therapy reminders
        notificationService.scheduleDailyReminders(plan);
        
        // Schedule weekly progress check
        notificationService.scheduleWeeklyProgressCheck();
        
        // Schedule therapy plan completion celebration (assuming 4-week plan)
        notificationService.schedulePlanCompletionCelebration(28);
        
        console.log('Therapy notifications scheduled successfully');
      } else {
        console.log('Notification permission denied - reminders will not be sent');
      }
    } catch (error) {
      console.error('Failed to setup therapy notifications:', error);
    }
  };

  const steps = [
    t('therapyRecommendation.psychologicalAssessment'),
    t('therapyRecommendation.diagnosisRecommendations'),
    t('therapyRecommendation.therapyPlan'),
    t('therapyRecommendation.startTherapy')
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      position: 'relative',
      backgroundImage: `url('https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
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
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/patient/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', ml: 2 }}>
            {t('therapyRecommendation.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Message Display */}
      {showMessage && (
        <Box sx={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          maxWidth: '90%',
          width: '500px'
        }}>
          <Card sx={{
            bgcolor: messageType === 'success' ? '#4CAF50' : 
                    messageType === 'warning' ? '#FF9800' : '#2196F3',
            color: '#ffffff',
            p: 2,
            boxShadow: 3,
            borderRadius: 2
          }}>
            <Typography variant="body1" sx={{ textAlign: 'center', fontWeight: 500 }}>
              {messageText}
            </Typography>
          </Card>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              {t('therapyRecommendation.comprehensiveAssessment')}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 500 }}>
              {t('therapyRecommendation.assessmentSubtitle')}
            </Typography>
          </Box>
        </motion.div>

        {/* Stepper */}
        <Card sx={{ 
          mb: 4,
          bgcolor: alpha('#ffffff', 0.15),
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <CardContent>
            <Stepper activeStep={currentStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel sx={{ color: '#ffffff', fontWeight: 600 }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Typeform-style Assessment */}
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minHeight: '500px',
            }}>
              <CardContent sx={{ p: 6 }}>
                {/* Welcome Screen */}
                {showWelcomeScreen ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          mb: 4, 
                          color: '#ffffff', 
                          fontWeight: 700, 
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)' 
                        }}
                      >
                        🧠 {t('therapyRecommendation.psychologicalAssessment')}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 6, 
                          color: '#ffffff', 
                          fontWeight: 500, 
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          maxWidth: '600px',
                          mx: 'auto',
                          lineHeight: 1.6
                        }}
                      >
                        {t('therapyRecommendation.assessmentDescription', { count: interviewQuestions.length })}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 6, 
                          color: alpha('#ffffff', 0.8), 
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          maxWidth: '500px',
                          mx: 'auto',
                          lineHeight: 1.5
                        }}
                      >
                        {t('therapyRecommendation.assessmentInstructions')}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={startAssessment}
                        sx={{
                          bgcolor: '#4CAF50',
                          color: '#ffffff',
                          px: 8,
                          py: 2,
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          borderRadius: 3,
                          '&:hover': {
                            bgcolor: '#45a049',
                            transform: 'translateY(-3px)',
                            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)',
                          },
                        }}
                      >
                        {t('therapyRecommendation.startAssessment')} →
                      </Button>
                    </Box>
                  </motion.div>
                ) : (
                  <>
                    {/* Progress Bar */}
                    <Box sx={{ mb: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {t('therapyRecommendation.question', { current: currentQuestionIndex + 1, total: interviewQuestions.length })}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {Math.round(((currentQuestionIndex + 1) / interviewQuestions.length) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={((currentQuestionIndex + 1) / interviewQuestions.length) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha('#ffffff', 0.2),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#4CAF50',
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                {/* Question Content */}
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {interviewQuestions[currentQuestionIndex] && (
                    <Box>
                      {/* Question Title */}
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          mb: 4, 
                          color: '#ffffff', 
                          fontWeight: 600, 
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          textAlign: 'center',
                          lineHeight: 1.4
                        }}
                      >
                        {interviewQuestions[currentQuestionIndex].question}
                      </Typography>

                      {/* Answer Options */}
                      <Box sx={{ mb: 6 }}>
                        <FormControl component="fieldset" sx={{ width: '100%' }}>
                          <RadioGroup
                            value={assessmentAnswers[interviewQuestions[currentQuestionIndex].id] || ''}
                            onChange={(e) => handleAssessmentAnswer(interviewQuestions[currentQuestionIndex].id, e.target.value)}
                            sx={{ gap: 2 }}
                          >
                            {interviewQuestions[currentQuestionIndex].options.map((option, optionIndex) => (
                              <motion.div
                                key={option.value}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: optionIndex * 0.1 }}
                              >
                                <Card
                                  sx={{
                                    cursor: 'pointer',
                                    bgcolor: assessmentAnswers[interviewQuestions[currentQuestionIndex].id] === option.value 
                                      ? alpha('#4CAF50', 0.3) 
                                      : alpha('#ffffff', 0.1),
                                    border: assessmentAnswers[interviewQuestions[currentQuestionIndex].id] === option.value 
                                      ? '2px solid #4CAF50' 
                                      : '1px solid rgba(255,255,255,0.2)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      bgcolor: alpha('#4CAF50', 0.2),
                                      border: '2px solid #4CAF50',
                                      transform: 'translateY(-2px)',
                                    },
                                  }}
                                  onClick={() => handleAssessmentAnswer(interviewQuestions[currentQuestionIndex].id, option.value)}
                                >
                                  <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Radio
                                        checked={assessmentAnswers[interviewQuestions[currentQuestionIndex].id] === option.value}
                                        sx={{ 
                                          color: '#ffffff',
                                          '&.Mui-checked': {
                                            color: '#4CAF50',
                                          },
                                        }}
                                      />
                                      <Typography 
                                        sx={{ 
                                          color: '#ffffff', 
                                          fontWeight: 500,
                                          fontSize: '1.1rem',
                                          ml: 1
                                        }}
                                      >
                                        {option.label}
                                      </Typography>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </Box>

                      {/* Navigation buttons removed: auto-advance on answer selection */}
                    </Box>
                  )}
                </motion.div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Diagnosis & Recommendations */}
        {currentStep === 1 && psychologicalAssessment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Grid container spacing={3}>
              {/* Assessment Results */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, color: '#ffffff', fontWeight: 600 }}>
                      {t('therapyRecommendation.assessmentResults')}
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#ffffff', mr: 1 }}>
                          {t('therapyRecommendation.severityLevel')}: 
                        </Typography>
                        <Chip 
                          label={psychologicalAssessment.severity.toUpperCase()} 
                          sx={{ 
                            bgcolor: psychologicalAssessment.severity === 'severe' ? '#F44336' : 
                                    psychologicalAssessment.severity === 'moderate' ? '#FF9800' : '#4CAF50',
                            color: '#ffffff',
                            fontWeight: 600
                          }} 
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#ffffff', mb: 1 }}>
                        {t('therapyRecommendation.riskScore')}: {psychologicalAssessment.score}/20
                      </Typography>
                    </Box>

                    {psychologicalAssessment.riskFactors.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#ffffff', mb: 1, fontWeight: 600 }}>
                          {t('therapyRecommendation.riskFactors')}:
                        </Typography>
                        {psychologicalAssessment.riskFactors.map((factor, index) => (
                          <Chip key={index} label={factor} sx={{ mr: 1, mb: 1, bgcolor: alpha('#FF9800', 0.3), color: '#ffffff' }} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Disorder Detection */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, color: '#ffffff', fontWeight: 600 }}>
                      {t('therapyRecommendation.psychologicalAssessment')}
                    </Typography>
                    
                    {disorderDetected ? (
                      <Box>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t('therapyRecommendation.disorderDetected')}: {disorderDetected.name}
                          </Typography>
                        </Alert>
                        <Typography variant="body2" sx={{ color: '#ffffff', mb: 2 }}>
                          {disorderDetected.description}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ffffff', mb: 1, fontWeight: 600 }}>
                          {t('therapyRecommendation.commonSymptoms')}:
                        </Typography>
                        {disorderDetected.symptoms.map((symptom, index) => (
                          <Chip key={index} label={symptom} sx={{ mr: 1, mb: 1, bgcolor: alpha('#F44336', 0.3), color: '#ffffff' }} />
                        ))}
                      </Box>
                    ) : (
                      <Alert severity="success">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t('therapyRecommendation.noDisorderDetected')}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recommendations */}
              <Grid item xs={12}>
                <Card sx={{ 
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, color: '#ffffff', fontWeight: 600 }}>
                      {t('therapyRecommendation.recommendations')}
                    </Typography>
                    {psychologicalAssessment.recommendations.map((rec, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle sx={{ color: '#4CAF50', mr: 2 }} />
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {rec}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                sx={{ px: 6, py: 2, fontSize: '1.2rem' }}
              >
                {t('therapyRecommendation.viewTherapyPlan')}
              </Button>
            </Box>
          </motion.div>
        )}

        {/* Therapy Plan */}
        {currentStep === 2 && therapyPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: '#ffffff', fontWeight: 600 }}>
                  {t('therapyRecommendation.therapyPlan')}
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                      {t('therapyRecommendation.duration')}: {therapyPlan.duration}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                      {t('therapyRecommendation.goals')}:
                    </Typography>
                    {therapyPlan.goals.map((goal, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CheckCircle sx={{ color: '#4CAF50', mr: 2, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {goal}
                        </Typography>
                      </Box>
                    ))}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
                      {t('therapyRecommendation.monitoring')}:
                    </Typography>
                    {therapyPlan.monitoring.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Info sx={{ color: '#2196F3', mr: 2, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                sx={{ px: 6, py: 2, fontSize: '1.2rem' }}
              >
                {t('therapyRecommendation.startTherapy')}
              </Button>
            </Box>
          </motion.div>
        )}

        {/* Therapy Sessions */}
        {currentStep === 3 && therapyPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Debug Info */}
            {console.log('=== THERAPY SESSIONS STEP DEBUG ===')}
            {console.log('Current step:', currentStep)}
            {console.log('Therapy plan:', therapyPlan)}
            {console.log('Therapy plan activities array:', therapyPlan?.activities)}
            {console.log('Therapy activities array length:', therapyPlan?.activities?.length)}
            {console.log('Active session:', activeSession)}
            {console.log('Show feedback:', showFeedback)}
            {console.log('Is completing session:', isCompletingSession)}
            {console.log('Session completion handled:', sessionCompletionHandled)}
            {console.log('=====================================')}
            {/* Session Completion Message */}
            {showFeedback && (
              <Card sx={{ 
                mb: 4,
                bgcolor: alpha('#4CAF50', 0.15),
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(76, 175, 80, 0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#ffffff', fontWeight: 600 }}>
                    🎉 {t('therapyRecommendation.sessionCompleted')}!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: '#ffffff', fontWeight: 500 }}>
                    {t('therapyRecommendation.sessionCompletedMessage', { title: activeSession?.title })}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 400 }}>
                    {t('therapyRecommendation.progressSaved')} 💪
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Active Session */}
            {activeSession && !showFeedback && (
              <Card sx={{ 
                mb: 4,
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ mr: 3, color: activeSession?.color || '#2196F3' }}>
                      {activeSession?.icon || <Spa sx={{ fontSize: 40 }} />}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: activeSession?.color || '#2196F3' }}>
                        {activeSession?.title || 'Therapy Session'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: activeSession?.color || '#2196F3' }}>
                        {activeSession?.duration || 0} minutes
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#ffffff' }}>
                      {t('therapyRecommendation.progress')}: {sessionProgress}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={sessionProgress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(activeSession?.color || '#2196F3', 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: activeSession?.color || '#2196F3',
                        },
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body1" sx={{ color: '#ffffff', mb: 2 }}>
                    {activeSession.description}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>
                    {t('therapyRecommendation.instructions')}:
                  </Typography>
                  {activeSession.instructions.map((instruction, index) => (
                    <Typography key={index} variant="body2" sx={{ color: '#ffffff', mb: 1, pl: 2 }}>
                      {index + 1}. {instruction}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* All Therapies Completed - Dashboard Button */}
            {allTherapiesCompleted && (
              <Card sx={{ 
                mb: 4,
                bgcolor: alpha('#4CAF50', 0.15),
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(76, 175, 80, 0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ mb: 3, color: '#ffffff', fontWeight: 600 }}>
                    🎉 {t('therapyRecommendation.allTherapiesCompleted')}!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: '#ffffff', fontWeight: 500 }}>
                    {t('therapyRecommendation.allTherapiesCompletedMessage')}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/patient/dashboard')}
                    sx={{
                      bgcolor: alpha('#4CAF50', 0.8),
                      color: '#ffffff',
                      px: 6,
                      py: 2,
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      '&:hover': {
                        bgcolor: alpha('#4CAF50', 0.9),
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    🏠 {t('therapyRecommendation.goToDashboard')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Available Activities - Only show when no active session or show feedback */}
            {(!activeSession || showFeedback) && !allTherapiesCompleted && (
              <Fragment>
                {availableTherapies.length === 0 ? (
                  <Card sx={{ 
                    bgcolor: alpha('#ffffff', 0.15),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    p: 4
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', fontWeight: 600 }}>
                        {t('therapyRecommendation.allTherapiesCompleted')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', mb: 3 }}>
                        {t('therapyRecommendation.allTherapiesCompletedMessage')}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/patient/dashboard')}
                        sx={{ px: 6, py: 2, fontSize: '1.2rem' }}
                      >
                        {t('therapyRecommendation.goToDashboard')}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Grid container spacing={3} key={`therapy-list-${availableTherapies.length}-${completedTherapyIds.length}`}>
                    {availableTherapies.map((activityId, index) => {
                      const activity = therapyActivities[activityId];
                      
                      // Skip rendering if activity is undefined or missing required properties
                      if (!activity || !activity.title || !activity.color) {
                        console.warn('Skipping invalid activity:', activityId, activity);
                        return null;
                      }
                      
                      const isDisabled = isCompletingSession || isCompletingRef.current;
                    
                      return (
                        <Grid item xs={12} sm={6} md={4} key={activityId}>
                          <Card
                            sx={{
                              height: '100%',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                              bgcolor: isDisabled ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.15),
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                              opacity: isDisabled ? 0.5 : 1,
                              '&:hover': isDisabled ? {} : {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                              },
                            }}
                            onClick={() => !isDisabled && startSession(activityId)}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Box sx={{ color: activity.color, mb: 2 }}>
                                  {activity.icon}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: activity.color }}>
                                  {activity.title}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2, color: activity.color }}>
                                  {activity.description}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Chip
                                  label={`${activity.duration} ${t('therapy.activities.durationUnit')}`}
                                  size="small"
                                  sx={{ 
                                    bgcolor: alpha(activity.color, 0.2), 
                                    color: activity.color,
                                    fontWeight: 700,
                                  }}
                                />
                                <Chip
                                  label={t(`therapy.activities.types.${activity.type}`)}
                                  size="small"
                                  sx={{ 
                                    bgcolor: alpha(activity.color, 0.2), 
                                    color: activity.color,
                                    fontWeight: 700,
                                  }}
                                />
                              </Box>
                              
                              <Button
                                fullWidth
                                variant="contained"
                                startIcon={<PlayArrow />}
                                disabled={isDisabled}
                                sx={{
                                  bgcolor: alpha(activity.color, 0.8),
                                  color: '#ffffff',
                                  fontWeight: 600,
                                  py: 1.5,
                                  '&:hover': !isDisabled ? {
                                    bgcolor: alpha(activity.color, 0.9),
                                    transform: 'translateY(-2px)',
                                  } : {},
                                  '&:disabled': {
                                    bgcolor: alpha('#ffffff', 0.1),
                                    color: alpha('#ffffff', 0.5),
                                  }
                                }}
                              >
                                {isDisabled ? t('common.loading') : t('therapyRecommendation.startSession')}
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Fragment>
            )}
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default TherapyRecommendationPage;

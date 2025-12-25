import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabPanel from '@mui/lab/TabPanel';
import {
  ArrowBack,
  CameraAlt,
  Mic,
  TextFields,
  Psychology,
  Stop,
  PlayArrow,
  EmojiEmotions,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Webcam from 'react-webcam';

const EmotionAnalysis = () => {
  const { saveEmotionData, currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('0');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  
  // Facial recognition states
  const webcamRef = useRef(null);
  const textInputRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Voice analysis states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  
  // Text analysis states
  const [textInput, setTextInput] = useState('');
  
  // Combined analysis
  const [combinedResults, setCombinedResults] = useState({
    facial: null,
    voice: null,
    text: null,
  });

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for live analysis
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = audioCtx.createAnalyser();
      const microphoneNode = audioCtx.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      microphoneNode.connect(analyserNode);
      
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      setMicrophone(microphoneNode);
      
      // Set up MediaRecorder for actual recording
      const mediaRecorderInstance = new MediaRecorder(stream);
      const audioChunks = [];
      
      mediaRecorderInstance.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorderInstance.onstop = () => {
        const audioBlobInstance = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlobInstance);
      };
      
      mediaRecorderInstance.start();
      setMediaRecorder(mediaRecorderInstance);
      setIsRecording(true);
      
      // Start waveform analysis
      startWaveformAnalysis();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    if (microphone) {
      microphone.disconnect();
    }
    
    if (audioContext) {
      audioContext.close();
    }
    
    setIsRecording(false);
    setAudioContext(null);
    setAnalyser(null);
    setMicrophone(null);
    setMediaRecorder(null);
    setWaveformData([]);
  };

  const startWaveformAnalysis = () => {
    const updateWaveform = () => {
      if (analyser && isRecording) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Convert to waveform data (simplified)
        const waveform = Array.from(dataArray).slice(0, 64);
        setWaveformData(waveform);
        
        requestAnimationFrame(updateWaveform);
      }
    };
    updateWaveform();
  };

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'facial') setActiveTab('0');
    else if (type === 'voice') setActiveTab('1');
    else if (type === 'text') setActiveTab('2');
  }, [searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);
  const analyzeFacialEmotion = async (imageData) => {
    // Use real API endpoint from backend/modules/face-emotion
    try {
      const response = await api.request('/emotions/analyze-facial', {
        method: 'POST',
        body: JSON.stringify({
          image: imageData,
          userId: currentUser?.id
        })
      });
      
      console.log('Facial analysis response:', response);
      
      // The backend returns {success: true, data: result}
      const result = response.data || response;
      
      // Ensure result has required fields with defaults
      if (!result) {
        throw new Error('No data received from facial analysis');
      }
      
      // Log the raw result to debug
      console.log('🔍 Raw facial analysis result from backend:', result);
      console.log('🔍 Emotion field:', result.emotion);
      console.log('🔍 Confidence field:', result.confidence);
      console.log('🔍 Details field:', result.details);
      
      // Normalize the response structure - preserve emotion from backend, only default if truly missing
      const normalizedEmotion = (result.emotion && result.emotion !== '') ? result.emotion : 'neutral';
      console.log('🔍 Normalized emotion:', normalizedEmotion);
      
      return {
        emotion: normalizedEmotion,
        confidence: result.confidence || 0.5,
        timestamp: result.timestamp || new Date(),
        details: result.details || {},
        face_detected: result.face_detected !== undefined ? result.face_detected : true,
        method: result.method || result.analysis_method || 'ai_analysis',
        ...result
      };
    } catch (error) {
      console.error('Facial analysis API error:', error);
      throw error;
    }
  };

  const analyzeVoiceEmotion = async (audioData) => {
    // Use real API endpoint from backend/modules/voice-emotion
    try {
      console.log('🔊 Voice Analysis: Starting analysis...');
      console.log('🔊 Voice Analysis: Audio data size:', audioData.size);
      console.log('🔊 Voice Analysis: User ID:', currentUser?.id);

      const result = await api.analyzeVoiceEmotion(audioData, currentUser?.id);
      const data = result.data || result;
      
      // Log the raw result to debug
      console.log('🔍 Raw voice analysis result from backend:', data);
      console.log('🔍 Emotion field:', data.emotion);
      console.log('🔍 Confidence field:', data.confidence);
      
      // Normalize the response structure - preserve emotion from backend, only default if truly missing
      const normalizedEmotion = (data.emotion && data.emotion !== '') ? data.emotion : 'neutral';
      console.log('🔍 Normalized emotion:', normalizedEmotion);
      
      return {
        emotion: normalizedEmotion,
        confidence: data.confidence || 0.5,
        timestamp: data.timestamp || new Date(),
        method: data.method || 'ai_analysis',
        ...data
      };
    } catch (error) {
      console.error('Voice analysis API error:', error);
      throw error;
    }
  };

  const analyzeTextEmotion = async (text) => {
    // Use real API endpoint from backend/modules/text-sentiment
    try {
      const response = await api.request('/emotions/analyze-text', {
        method: 'POST',
        body: JSON.stringify({
          text: text,
          userId: currentUser?.id,
          language: i18n.language || 'en'
        })
      });
      
      const result = response.data || response;
      
      // Log the raw result to debug
      console.log('🔍 Raw text analysis result from backend:', result);
      console.log('🔍 Emotion field:', result.emotion);
      console.log('🔍 Sentiment field:', result.sentiment);
      console.log('🔍 Confidence field:', result.confidence);
      
      // Normalize the response structure - preserve emotion from backend, only default if truly missing
      const normalizedEmotion = (result.emotion && result.emotion !== '') 
        ? result.emotion 
        : ((result.sentiment && result.sentiment !== '') ? result.sentiment : 'neutral');
      console.log('🔍 Normalized emotion:', normalizedEmotion);
      
      return {
        emotion: normalizedEmotion,
        confidence: result.confidence || 0.5,
        timestamp: result.timestamp || new Date(),
        details: result.details || {},
        ...result
      };
    } catch (error) {
      console.error('Text analysis API error:', error);
      throw error;
    }
  };

  const handleFacialAnalysis = async () => {
    if (!webcamRef.current) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const result = await analyzeFacialEmotion(imageSrc);
      
      // Validate and normalize result before setting state
      if (!result) {
        throw new Error('No data received from facial analysis API');
      }
      
      // Ensure emotion field exists, use default if missing
      const normalizedResult = {
        ...result,
        emotion: result.emotion || 'neutral',
        confidence: result.confidence || 0.5,
        timestamp: result.timestamp || new Date()
      };
      
      console.log('Normalized facial analysis result:', normalizedResult);
      
      setAnalysisResult(normalizedResult);
      setCombinedResults(prev => ({ ...prev, facial: normalizedResult }));
      
      // Save to Firebase
      try {
        await saveEmotionData({
          type: 'facial',
          emotion: normalizedResult.emotion,
          confidence: normalizedResult.confidence,
          imageData: imageSrc,
        });
      } catch (firebaseError) {
        console.log('Firebase not configured, using mock data');
      }
    } catch (error) {
      setError('Failed to analyze facial emotion: ' + error.message);
    }
    
    setIsAnalyzing(false);
  };

  const handleVoiceAnalysis = async () => {
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const result = await analyzeVoiceEmotion(audioBlob);
      setAnalysisResult(result);
      setCombinedResults(prev => ({ ...prev, voice: result }));
      
      // Save to Firebase
      try {
        await saveEmotionData({
          type: 'voice',
          emotion: result.emotion,
          confidence: result.confidence,
        });
      } catch (firebaseError) {
        console.log('Firebase not configured, using mock data');
      }
    } catch (error) {
      setError('Failed to analyze voice emotion: ' + error.message);
    }
    
    setIsAnalyzing(false);
  };

  const handleTextAnalysis = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const result = await analyzeTextEmotion(textInput);
      setAnalysisResult(result);
      setCombinedResults(prev => ({ ...prev, text: result }));
      
      // Save to Firebase
      try {
        await saveEmotionData({
          type: 'text',
          emotion: result.emotion,
          confidence: result.confidence,
          textContent: textInput,
        });
      } catch (firebaseError) {
        console.log('Firebase not configured, using mock data');
      }
    } catch (error) {
      setError('Failed to analyze text emotion: ' + error.message);
    }
    
    setIsAnalyzing(false);
  };

  const handleCombinedAnalysis = async () => {
    // Check if we have all three modalities
    if (!combinedResults.facial || !combinedResults.voice || !combinedResults.text) {
      setError('Please perform facial, voice, and text analysis before combining results');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      // Use real API endpoint from backend/modules/multimodal
      const response = await api.request('/emotions/analyze-combined', {
        method: 'POST',
        body: JSON.stringify({
          facialData: combinedResults.facial,
          voiceData: combinedResults.voice,
          textData: combinedResults.text,
          userId: currentUser?.id,
          language: i18n.language || 'en'
        })
      });
      
      const result = response.data || response;
      
      // Handle the response format from multimodal module
      const combinedResult = {
        emotion: result.emotion || result.combined_emotion,
        confidence: result.confidence || result.combined_confidence,
        timestamp: new Date(),
        individualResults: {
          facial: combinedResults.facial,
          voice: combinedResults.voice,
          text: combinedResults.text
        },
        analysis: result.analysis,
        recommendations: result.recommendations || result.analysis?.recommendations,
        therapyType: result.therapyType || result.analysis?.therapyType,
        emergencyAlert: result.emergencyAlert
      };
      
      setAnalysisResult(combinedResult);
      
      // Save combined result to Firebase
      try {
        await saveEmotionData({
          type: 'combined',
          emotion: combinedResult.emotion,
          confidence: combinedResult.confidence,
          individualResults: combinedResult.individualResults,
        });
      } catch (firebaseError) {
        console.log('Firebase not configured, using mock data');
      }
    } catch (error) {
      setError('Failed to combine analysis results: ' + error.message);
    }
    
    setIsAnalyzing(false);
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: theme.palette.secondary.main,
      sad: theme.palette.primary.main,
      angry: '#FF5722',
      anxious: '#FF9800',
      neutral: theme.palette.text.secondary,
    };
    return colors[emotion] || colors.neutral;
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      anxious: '😰',
      neutral: '😐',
    };
    return emojis[emotion] || emojis.neutral;
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
          <IconButton sx={{ color: '#ffffff' }} onClick={() => navigate('/patient/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', ml: 2 }}>
            Emotion Analysis
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {/* Analysis Tabs */}
        <TabContext value={activeTab}>
          <Card sx={{ 
            mb: 4,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&.Mui-selected': {
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#ffffff',
                    height: 3,
                  },
                }}
              >
                <Tab icon={<CameraAlt />} label="Facial Analysis" value="0" />
                <Tab icon={<Mic />} label="Voice Analysis" value="1" />
                <Tab icon={<TextFields />} label="Text Analysis" value="2" />
              </Tabs>
            </Box>

          {/* Facial Analysis Tab */}
          <TabPanel value="0">
            <Box sx={{ position: 'relative', width: '100%', height: '70vh', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
              <Webcam
                ref={webcamRef}
                width="100%"
                height="100%"
                screenshotFormat="image/jpeg"
                style={{ objectFit: 'cover' }}
              />
              {isCapturing && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: alpha('#000000', 0.5),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <CircularProgress sx={{ color: '#ffffff' }} />
                </Box>
              )}
            </Box>
            
            {/* Button outside camera with proper theme */}
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', textAlign: 'center' }}>
                  Camera Preview
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleFacialAnalysis}
                  disabled={isAnalyzing}
                  sx={{ 
                    bgcolor: alpha('#ffffff', 0.2),
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.3),
                      border: '1px solid rgba(255,255,255,0.5)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    },
                    '&:disabled': {
                      bgcolor: alpha('#ffffff', 0.1),
                      color: 'rgba(255,255,255,0.5)',
                    },
                  }}
                >
                  {isAnalyzing ? <CircularProgress size={24} /> : 'Analyze Facial Emotion'}
                </Button>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Voice Analysis Tab */}
          <TabPanel value="1">
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  Voice Emotion Analysis
                </Typography>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" sx={{ mb: 4, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    Record your voice to analyze emotional tone and sentiment
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <IconButton
                      size="large"
                      onClick={isRecording ? stopRecording : startRecording}
                      sx={{
                        bgcolor: isRecording ? '#f44336' : alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        width: 80,
                        height: 80,
                        border: '2px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: isRecording ? '#d32f2f' : alpha('#ffffff', 0.3),
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.3s ease',
                        zIndex: 2,
                      }}
                    >
                      {isRecording ? <Stop /> : <Mic />}
                    </IconButton>
                    {/* Recording Animation - Clickable Stop Button */}
                    {isRecording && (
                      <Box
                        onClick={stopRecording}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          border: '3px solid rgba(244, 67, 54, 0.4)',
                          cursor: 'pointer',
                          animation: 'pulse 1.2s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              transform: 'translate(-50%, -50%) scale(1)',
                              opacity: 0.8,
                            },
                            '50%': {
                              transform: 'translate(-50%, -50%) scale(1.1)',
                              opacity: 0.6,
                            },
                            '100%': {
                              transform: 'translate(-50%, -50%) scale(1.3)',
                              opacity: 0,
                            },
                          },
                          '&:hover': {
                            border: '3px solid rgba(244, 67, 54, 0.6)',
                            animation: 'pulse 0.8s infinite',
                          },
                        }}
                      />
                    )}
                  </Box>
                  
                  {/* Live Waveform Visualization */}
                  {isRecording && (
                    <Box sx={{ mt: 4, width: '100%', maxWidth: 500, mx: 'auto' }}>
                      <Typography variant="body2" sx={{ mb: 2, color: '#ffffff', textAlign: 'center', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                        Live Voice Input
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: 80,
                        gap: 2,
                        px: 2,
                      }}>
                        {waveformData.map((value, index) => (
                          <Box
                            key={index}
                            sx={{
                              width: 6,
                              height: Math.max(8, (value / 255) * 60 + 8),
                              bgcolor: `rgba(255, 255, 255, ${Math.max(0.4, value / 255)})`,
                              borderRadius: 3,
                              transition: 'height 0.05s ease, opacity 0.1s ease',
                              animation: 'waveform 0.3s ease-in-out infinite alternate',
                              animationDelay: `${index * 0.02}s`,
                              '@keyframes waveform': {
                                '0%': { 
                                  opacity: Math.max(0.4, value / 255),
                                  transform: 'scaleY(0.8)',
                                },
                                '100%': { 
                                  opacity: Math.max(0.8, value / 255),
                                  transform: 'scaleY(1.2)',
                                },
                              },
                            }}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        textAlign: 'center', 
                        mt: 1, 
                        color: 'rgba(255,255,255,0.7)', 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)' 
                      }}>
                        Click the red circle to stop recording
                      </Typography>
                    </Box>
                  )}
                  {isRecording && (
                    <Typography variant="h6" sx={{ mt: 2, color: '#f44336', fontWeight: 600, textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      Recording...
                    </Typography>
                  )}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleVoiceAnalysis}
                    disabled={isAnalyzing || !audioBlob}
                    sx={{ 
                      mt: 4, 
                      maxWidth: 300,
                      bgcolor: alpha('#ffffff', 0.2),
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: alpha('#ffffff', 0.3),
                        border: '1px solid rgba(255,255,255,0.5)',
                      },
                      '&:disabled': {
                        bgcolor: alpha('#ffffff', 0.1),
                        color: 'rgba(255,255,255,0.5)',
                      },
                    }}
                  >
                    {isAnalyzing ? <CircularProgress size={24} /> : 'Analyze Voice Emotion'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Text Analysis Tab */}
          <TabPanel value="2">
            <Card sx={{ 
              bgcolor: alpha('#ffffff', 0.15),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  Text Sentiment Analysis
                </Typography>
                <TextField
                  ref={textInputRef}
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Type your thoughts, feelings, or any text you'd like to analyze for emotional sentiment..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  sx={{ 
                    mb: 3,
                    '& .MuiInputLabel-root': {
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    },
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      backgroundColor: alpha('#ffffff', 0.1),
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
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255,255,255,0.7)',
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleTextAnalysis}
                  disabled={isAnalyzing || !textInput.trim()}
                >
                  {isAnalyzing ? <CircularProgress size={24} /> : 'Analyze Text Emotion'}
                </Button>
              </CardContent>
            </Card>
          </TabPanel>
        </Card>
        </TabContext>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Analysis Results */}
        {analysisResult && (
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
                <Typography variant="h6" sx={{ mb: 3, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                  Analysis Results
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                        {getEmotionEmoji(analysisResult.emotion || 'neutral')}
                      </Typography>
                      <Chip
                        label={analysisResult.emotion 
                          ? t(`emotions.${analysisResult.emotion}`, { 
                              defaultValue: analysisResult.emotion.charAt(0).toUpperCase() + analysisResult.emotion.slice(1) 
                            })
                          : 'Unknown Emotion'}
                        sx={{
                          bgcolor: alpha(getEmotionColor(analysisResult.emotion || 'neutral'), 0.15),
                          color: getEmotionColor(analysisResult.emotion || 'neutral'),
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          px: 3,
                          py: 1.5,
                          border: `2px solid ${alpha(getEmotionColor(analysisResult.emotion || 'neutral'), 0.3)}`,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                        Confidence Level
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#ffffff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontWeight: 700, fontSize: '1.1rem' }}>
                          {Math.round((analysisResult.confidence || 0) * 100)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(analysisResult.confidence || 0) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(getEmotionColor(analysisResult.emotion || 'neutral'), 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getEmotionColor(analysisResult.emotion || 'neutral'),
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ 
                        color: '#ffffff', 
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)', 
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}>
                        Analyzed on: {analysisResult.timestamp ? analysisResult.timestamp.toLocaleString() : new Date().toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Combined Analysis */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleCombinedAnalysis}
            disabled={isAnalyzing || Object.values(combinedResults).every(result => result === null)}
            sx={{ 
              px: 4,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 700,
              bgcolor: alpha('#ffffff', 0.2),
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              border: '2px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
                border: '2px solid rgba(255,255,255,0.5)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              },
              '&:disabled': {
                bgcolor: alpha('#ffffff', 0.1),
                color: 'rgba(255,255,255,0.5)',
                border: '2px solid rgba(255,255,255,0.1)',
              },
            }}
          >
            <Psychology sx={{ mr: 1, fontSize: '1.2rem' }} />
            Combine All Analyses
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default EmotionAnalysis;
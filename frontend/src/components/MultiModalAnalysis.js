import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  TextField,
  IconButton,
  alpha
} from '@mui/material';
import CameraAlt from '@mui/icons-material/CameraAlt';
import Mic from '@mui/icons-material/Mic';
import TextFields from '@mui/icons-material/TextFields';
import Psychology from '@mui/icons-material/Psychology';
import Refresh from '@mui/icons-material/Refresh';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import CrisisAlertPopup from './CrisisAlertPopup';

const MultiModalAnalysis = ({ onAnalysisComplete }) => {
  const { currentUser } = useAuth();
  const { i18n, t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0); // 0: facial, 1: voice, 2: text, 3: results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [isFacialAnalysisInProgress, setIsFacialAnalysisInProgress] = useState(false);
  const [isAnalysisInProgress, setIsAnalysisInProgress] = useState(false);
  const [showCrisisPopup, setShowCrisisPopup] = useState(false);
  const [crisisData, setCrisisData] = useState(null);
  
  // Use refs for synchronous state tracking to prevent race conditions
  const countdownStartedRef = useRef(false);
  const analysisInProgressRef = useRef(false);
  
  // Analysis results storage
  const [analysisResults, setAnalysisResults] = useState({
    facial: null,
    voice: null,
    text: null,
    combined: null
  });
  
  // Refs for media
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingActiveRef = useRef(true);
  const isVoiceAnalysisInProgressRef = useRef(false); // Prevent duplicate voice analysis calls
  const stopFunctionExecutedRef = useRef(false); // Prevent multiple stop() executions

  // Helper function to translate emotion with fallback
  const translateEmotion = (emotion) => {
    if (!emotion) return t('common.notAvailable');
    const translationKey = `emotions.${emotion}`;
    const translated = t(translationKey);
    // If translation returns the key itself, it means translation wasn't found
    // In that case, capitalize the emotion name as fallback
    if (translated === translationKey) {
      return emotion.charAt(0).toUpperCase() + emotion.slice(1);
    }
    return translated;
  };

  const steps = [
    { label: t('analysis.facial'), icon: <CameraAlt /> },
    { label: t('analysis.voice'), icon: <Mic /> },
    { label: t('analysis.text'), icon: <TextFields /> },
    { label: t('analysis.detailedAnalysis'), icon: <Psychology /> }
  ];

  useEffect(() => {
    // Auto-start facial analysis when component mounts
    if (currentStep === 0) {
      console.log('Starting facial analysis automatically...');
      startFacialAnalysis();
    }
    
    // Debug step changes
    console.log('Current step changed to:', currentStep);
    if (currentStep === 1) {
      console.log('Voice step reached - should show recording interface');
      // Ensure analyzing state is reset when moving to voice step
      setIsAnalyzing(false);
    }
    
    // Reset analyzing state when moving to text step to prevent false "analyzing" display
    // This ensures clean state when arriving at text step from previous step
    if (currentStep === 2) {
      console.log('Text step reached - resetting analyzing state');
      setIsAnalyzing(false);
    }
    
    // Don't reset analyzing state on step 3 (results) - let the analysis function handle it
    
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && typeof mediaRecorderRef.current.stop === 'function') {
        mediaRecorderRef.current.stop();
      }
      // Clean up audio context and stream
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioProcessorRef.current) {
        audioProcessorRef.current = null;
      }
    };
  }, [currentStep]);

  // Facial Analysis Functions
  const startFacialAnalysis = async () => {
    try {
      setError(null);
      setIsCameraLoading(true);
      setCountdownStarted(false); // Reset countdown flag
      
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      
      console.log('Camera stream received:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Stream assigned to video element');
        
        // Small delay to ensure video element is rendered
        setTimeout(async () => {
          // Force play the video
          try {
            await videoRef.current.play();
            console.log('Video play() successful');
          } catch (playError) {
            console.log('Video play() failed:', playError);
          }
          
          // Simple timeout approach - wait 1 second then start countdown
          setTimeout(() => {
            console.log('Timeout reached, starting countdown...');
            setIsCameraLoading(false);
            startCountdown();
          }, 1000);
          
          // Also try to detect when video is ready
          const checkVideoReady = () => {
            if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              console.log('Video ready detected, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
              setIsCameraLoading(false);
              startCountdown();
              return true;
            }
            return false;
          };
          
          // Check immediately and then every 100ms
          if (!checkVideoReady()) {
            const interval = setInterval(() => {
              if (checkVideoReady()) {
                clearInterval(interval);
              }
            }, 100);
            
            // Clear interval after 1 second
            setTimeout(() => clearInterval(interval), 1000);
          }
        }, 100); // Small delay to ensure video element is rendered
      }
      
    } catch (err) {
      console.error('Camera error:', err);
      setIsCameraLoading(false);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const startCountdown = () => {
    if (countdownStartedRef.current || analysisInProgressRef.current || isFacialAnalysisInProgress) {
      console.log('Countdown already started or analysis in progress, skipping...');
      console.log('Ref state - countdownStartedRef:', countdownStartedRef.current, 'analysisInProgressRef:', analysisInProgressRef.current, 'isFacialAnalysisInProgress:', isFacialAnalysisInProgress);
      return;
    }
    
    console.log('Starting countdown...');
    console.log('Current state - countdownStarted:', countdownStarted, 'isAnalysisInProgress:', isAnalysisInProgress, 'isFacialAnalysisInProgress:', isFacialAnalysisInProgress);
    console.log('Ref state - countdownStartedRef:', countdownStartedRef.current, 'analysisInProgressRef:', analysisInProgressRef.current);
    
    countdownStartedRef.current = true;
    setCountdownStarted(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          console.log('Countdown finished, starting analysis...');
          analyzeFacialExpression();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return null;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready for capture');
      return null;
    }
    
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image captured successfully, size:', imageData.length);
    
    return imageData;
  };

  const analyzeFacialExpression = async () => {
    // Prevent multiple simultaneous analyses
    if (analysisInProgressRef.current || isFacialAnalysisInProgress) {
      console.log('Analysis already in progress, skipping...');
      console.log('Ref state - analysisInProgressRef:', analysisInProgressRef.current, 'isFacialAnalysisInProgress:', isFacialAnalysisInProgress);
      return;
    }
    
    analysisInProgressRef.current = true;
    setIsAnalysisInProgress(true);
    setIsFacialAnalysisInProgress(true);
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting facial analysis...');
      
      // Wait a bit more to ensure video is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const imageData = captureImage();
      if (!imageData) {
        throw new Error('Failed to capture image. Please ensure camera is working and try again.');
      }

      console.log('Calling facial analysis API...');
      const response = await simulateFacialAnalysis(imageData);
      
      console.log('Facial analysis completed:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Facial details:', response?.details);
      console.log('Facial details type:', typeof response?.details);
      console.log('Facial details keys:', Object.keys(response?.details || {}));
      console.log('Full response structure:', JSON.stringify(response, null, 2));
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from facial analysis API');
      }
      
      // Check if this is a fallback result - if so, accept it
      console.log('Checking analysis method:', response.analysis_method);
      console.log('Face detected:', response.face_detected);
      
      if (response.analysis_method === 'fallback') {
        console.log('Fallback result detected - accepting and proceeding');
        // Accept fallback results and continue
      } else if (response.face_detected === false || response.face_detected === undefined || response.face_detected === null) {
        console.log('No face detected in non-fallback result, throwing error');
        const errorMessage = response.message || response.error || 'No face detected. Please ensure your face is visible and well-lit in the camera.';
        console.log('Error message:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check for critical errors (but not fallback reasons)
      console.log('Checking for critical errors:', response.error);
      if (response.error && response.error !== null && response.error !== '' && response.analysis_method !== 'fallback') {
        console.log('Critical error found, throwing error');
        throw new Error(response.error);
      }
      
      // If we reach here, everything succeeded (including fallback results)
      if (response.analysis_method === 'fallback') {
        console.log('Using fallback facial analysis result:', response.emotion, 'with confidence:', response.confidence);
      } else {
        console.log('Face detected and emotion analyzed successfully:', response.emotion);
      }
      console.log('Setting analysis results...');
      setAnalysisResults(prev => ({
        ...prev,
        facial: response
      }));
      
      console.log('All checks passed - proceeding to next step');
      
      // Clear page and move to next step immediately after successful analysis
      clearPage();
      
      // Move to next step immediately - user will manually start voice recording
      console.log('Moving to voice analysis step');
      console.log('Current isAnalyzing state before moving to voice step:', isAnalyzing);
      
      // Ensure isAnalyzing is false before moving to voice step
      setIsAnalyzing(false);
      setCurrentStep(1);
      
    } catch (err) {
      console.error('Facial analysis error caught:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      // Provide fallback analysis result and continue
      const fallbackResult = {
        emotion: 'neutral',
        confidence: 0.5,
        description: 'Facial analysis unavailable - using fallback result',
        face_detected: false,
        analysis_method: 'fallback'
      };
      
      console.log('Using fallback facial analysis result:', fallbackResult);
      setAnalysisResults(prev => ({
        ...prev,
        facial: fallbackResult
      }));
      
      // Clear page and proceed to next step with fallback result
      clearPage();
      console.log('Proceeding to voice analysis with fallback facial result');
      setIsAnalyzing(false);
      setCurrentStep(1);
    } finally {
      console.log('Finally block - clearing analysis progress (isAnalyzing already set to false)');
      analysisInProgressRef.current = false;
      setIsAnalysisInProgress(false);
      setIsFacialAnalysisInProgress(false);
      countdownStartedRef.current = false;
      setCountdownStarted(false);
    }
  };

  // Voice Analysis Functions
  const startVoiceAnalysis = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const startVoiceRecording = async () => {
    console.log('Starting voice recording...');
    // Reset the stop function guard when starting a new recording
    stopFunctionExecutedRef.current = false;
    isVoiceAnalysisInProgressRef.current = false;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      console.log('Microphone access granted, creating Web Audio API recorder...');
      
      // Use Web Audio API to record in WAV format (compatible with backend)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100
      });
      audioContextRef.current = audioContext;
      mediaStreamRef.current = stream;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      audioProcessorRef.current = processor;
      
      const audioChunks = [];
      audioChunksRef.current = audioChunks;
      
      // Use a local variable to track recording state (avoids closure issues with state)
      let isRecordingActive = true;
      
      processor.onaudioprocess = (e) => {
        if (!isRecordingActive) return; // Stop processing if recording stopped
        const inputData = e.inputBuffer.getChannelData(0);
        const buffer = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
          const s = Math.max(-1, Math.min(1, inputData[i]));
          buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        audioChunks.push(buffer);
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Create a stop function with guard to prevent multiple executions
      stopFunctionExecutedRef.current = false;
      mediaRecorderRef.current = {
        stop: () => {
          // Prevent multiple executions
          if (stopFunctionExecutedRef.current) {
            console.log('Stop function already executed, ignoring duplicate call');
            return;
          }
          stopFunctionExecutedRef.current = true;
          
          isRecordingActiveRef.current = false;
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach(track => track.stop());
          
          // Convert audio chunks to WAV
          const length = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
          if (length === 0) {
            console.error('No audio data recorded');
            setIsAnalyzing(false);
            return;
          }
          
          const wavBuffer = new ArrayBuffer(44 + length * 2);
          const view = new DataView(wavBuffer);
          
          // WAV header
          const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };
          
          writeString(0, 'RIFF');
          view.setUint32(4, 36 + length * 2, true);
          writeString(8, 'WAVE');
          writeString(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true); // PCM
          view.setUint16(22, 1, true); // Mono
          view.setUint32(24, 44100, true); // Sample rate
          view.setUint32(28, 44100 * 2, true); // Byte rate
          view.setUint16(32, 2, true); // Block align
          view.setUint16(34, 16, true); // Bits per sample
          writeString(36, 'data');
          view.setUint32(40, length * 2, true);
          
          // Write audio data
          let offset = 44;
          for (const chunk of audioChunks) {
            for (let i = 0; i < chunk.length; i++) {
              view.setInt16(offset, chunk[i], true);
              offset += 2;
            }
          }
          
          const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          console.log('Audio blob created (WAV format), size:', audioBlob.size);
          analyzeVoiceTone(audioBlob);
        }
      };
      
      setIsRecording(true);
      console.log('Voice recording started successfully (Web Audio API - WAV format)');
    } catch (err) {
      console.error('Recording error:', err);
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && typeof mediaRecorderRef.current.stop === 'function') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    // Clean up audio context and stream
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioProcessorRef.current) {
      audioProcessorRef.current = null;
    }
  };

  const analyzeVoiceTone = async (audioBlob) => {
    // Prevent duplicate calls - if analysis is already in progress, ignore this call
    if (isVoiceAnalysisInProgressRef.current) {
      console.log('Voice analysis already in progress, ignoring duplicate call');
      return;
    }
    
    console.log('Starting voice tone analysis...');
    console.log('Audio blob size:', audioBlob.size);
    isVoiceAnalysisInProgressRef.current = true;
    setIsAnalyzing(true);
    
    try {
      // Simulate API call - replace with actual API
      console.log('Calling simulateVoiceAnalysis...');
      const response = await simulateVoiceAnalysis(audioBlob);
      console.log('Voice analysis completed successfully:', response);
      
      setAnalysisResults(prev => ({
        ...prev,
        voice: response
      }));
      
      // Clear page first
      clearPage();
      
      // Reset analyzing state BEFORE moving to next step to prevent false "analyzing" display
      // Use setTimeout to ensure state update happens before step change
      setIsAnalyzing(false);
      
      // Use setTimeout to ensure isAnalyzing state is reset before rendering step 2
      setTimeout(() => {
        setCurrentStep(2);
      }, 0);
      
    } catch (err) {
      setError('Voice analysis failed: ' + err.message);
      setIsAnalyzing(false);
    } finally {
      // Always reset the ref when analysis completes (success or failure)
      isVoiceAnalysisInProgressRef.current = false;
    }
  };

  // Text Analysis Functions
  const analyzeTextSentiment = async () => {
    if (!textInput.trim()) {
      setError(t('analysis.textInputRequired'));
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate API call - replace with actual API
      const response = await simulateTextAnalysis(textInput);
      
      console.log('Text analysis completed:', response);
      console.log('Text response type:', typeof response);
      console.log('Text response keys:', Object.keys(response || {}));
      console.log('Text details:', response?.details);
      console.log('Text details type:', typeof response?.details);
      console.log('Text details keys:', Object.keys(response?.details || {}));
      console.log('Text sentiment:', response?.sentiment);
      console.log('Text emotion_scores:', response?.details?.emotion_scores);
      
      setAnalysisResults(prev => ({
        ...prev,
        text: response
      }));
      
      console.log('Text analysis state set, response:', response);
      console.log('Text analysis state set, response type:', typeof response);
      console.log('Text analysis state set, response keys:', Object.keys(response || {}));
      
      // Clear page and perform combined analysis immediately
      clearPage();
      
      // Pass the text data directly to combined analysis to avoid state timing issues
      // Note: performCombinedAnalysisWithText manages its own isAnalyzing state and step changes
      console.log('About to perform combined analysis with text data:', response);
      try {
        await performCombinedAnalysisWithText(response);
        // If combined analysis succeeds, it will set step to 3, so we don't need to do anything here
      } catch (combinedErr) {
        // Combined analysis error is handled inside performCombinedAnalysisWithText
        // Don't propagate it here to avoid resetting step to 2
        console.error('Combined analysis error caught in analyzeTextSentiment:', combinedErr);
        // The error and step handling is already done in performCombinedAnalysisWithText
      }
      
    } catch (err) {
      console.error('Text analysis error:', err);
      setError(t('analysis.textAnalysisFailed', { error: err.message }));
      setIsAnalyzing(false);
      // Stay on text step if text analysis fails (not combined analysis)
      setCurrentStep(2);
    }
  };

  // Combined Analysis
  const performCombinedAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      console.log('=== PERFORMING COMBINED ANALYSIS ===');
      console.log('Analysis results:', analysisResults);
      console.log('Facial data:', analysisResults.facial);
      console.log('Voice data:', analysisResults.voice);
      console.log('Text data:', analysisResults.text);
      console.log('Facial details:', analysisResults.facial?.details);
      console.log('Text details:', analysisResults.text?.details);
      
      // Simulate combined analysis - replace with actual API
      const response = await simulateCombinedAnalysis(analysisResults);
      
      setAnalysisResults(prev => ({
        ...prev,
        combined: response
      }));
      
      setCurrentStep(3);
      
    } catch (err) {
      setError('Combined analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Combined Analysis with Text Data
  const performCombinedAnalysisWithText = async (textData) => {
    setIsAnalyzing(true);
    
    try {
      console.log('=== PERFORMING COMBINED ANALYSIS WITH TEXT DATA ===');
      console.log('Analysis results:', analysisResults);
      console.log('Facial data:', analysisResults.facial);
      console.log('Voice data:', analysisResults.voice);
      console.log('Text data passed directly:', textData);
      console.log('Facial details:', analysisResults.facial?.details);
      console.log('Text details:', textData?.details);
      
      // Create combined results object with direct text data
      const combinedResults = {
        facial: analysisResults.facial,
        voice: analysisResults.voice,
        text: textData
      };
      
      console.log('Combined results object:', combinedResults);
      
      // Simulate combined analysis - replace with actual API
      const response = await simulateCombinedAnalysis(combinedResults);
      
      console.log('Combined analysis response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response emotion:', response?.emotion);
      console.log('Response confidence:', response?.confidence);
      console.log('Response description:', response?.description);
      console.log('Response recommendations:', response?.recommendations);
      
      // Validate response - be more flexible with validation
      if (!response) {
        throw new Error('No response received from combined analysis API');
      }
      
      // Check if we have at least some emotion data (could be emotion or final_emotion)
      const hasEmotion = response.emotion || response.final_emotion;
      if (!hasEmotion) {
        console.warn('Response missing emotion field, but proceeding with available data');
        // Don't throw error, just use default values
        response.emotion = response.emotion || response.final_emotion || 'neutral';
        response.confidence = response.confidence || 0.5;
      }
      
      // Ensure we have default values for required fields
      if (!response.description) {
        response.description = 'Analysis completed successfully.';
      }
      if (!response.recommendations) {
        response.recommendations = 'Based on the multimodal analysis, consider the following recommendations...';
      }
      
      // Debug the state update
      console.log('Final response being stored:', response);
      console.log('Response emotion field:', response?.emotion);
      console.log('Response confidence field:', response?.confidence);
      console.log('Response description field:', response?.description);
      console.log('Response recommendations field:', response?.recommendations);
      
      // Update analysis results with combined response
      setAnalysisResults(prev => {
        const newState = {
          ...prev,
          text: textData,
          combined: response
        };
        console.log('New analysis results state:', newState);
        console.log('New combined field:', newState.combined);
        return newState;
      });
      
      // Reset analyzing state and move to results step
      console.log('Combined analysis successful - moving to results step (3)');
      setIsAnalyzing(false);
      setCurrentStep(3);
      
      // Log confirmation
      console.log('Step set to 3, isAnalyzing set to false');
      
    } catch (err) {
      console.error('Combined analysis error:', err);
      setError('Combined analysis failed: ' + err.message);
      // Reset analyzing state and go back to text step on error
      setIsAnalyzing(false);
      // Only go back to text step if it's a critical error
      // If we have partial results, try to show them
      if (analysisResults.facial || analysisResults.voice || textData) {
        console.log('Partial results available, attempting to show results anyway');
        // Try to create a fallback combined result
        const fallbackResult = {
          emotion: textData?.emotion || analysisResults.voice?.emotion || analysisResults.facial?.emotion || 'neutral',
          confidence: textData?.confidence || analysisResults.voice?.confidence || analysisResults.facial?.confidence || 0.5,
          description: 'Analysis completed with partial results due to combined analysis error.',
          recommendations: 'Please try again or contact support if the issue persists.',
          error: err.message
        };
        setAnalysisResults(prev => ({
          ...prev,
          text: textData,
          combined: fallbackResult
        }));
        setIsAnalyzing(false);
        setCurrentStep(3);
      } else {
        // No results at all, go back to text step
        setCurrentStep(2);
      }
    }
  };

  // Utility Functions
  const clearPage = () => {
    // Stop all media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && typeof mediaRecorderRef.current.stop === 'function') {
      mediaRecorderRef.current.stop();
    }
    // Clean up audio context and stream
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setError(null);
    setIsRecording(false);
    setCountdown(0);
  };

  const resetAnalysis = () => {
    setCurrentStep(0);
    setAnalysisResults({
      facial: null,
      voice: null,
      text: null,
      combined: null
    });
    setTextInput('');
    setError(null);
    clearPage();
  };

  // Simulated API functions - replace with actual API calls
  const simulateFacialAnalysis = async (imageData) => {
    try {
      console.log('=== FACIAL ANALYSIS API CALL START ===');
      console.log('Image data length:', imageData ? imageData.length : 'undefined');
      console.log('Image data preview:', imageData ? imageData.substring(0, 100) + '...' : 'undefined');
      console.log('Current user ID:', currentUser.id);
      
      const requestBody = {
        image: imageData,
        userId: currentUser.id
      };
      
      console.log('Request body:', requestBody);
      
      const response = await api.request('/emotions/analyze-facial', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      console.log('=== FACIAL API RESPONSE RECEIVED ===');
      console.log('Full response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response.data:', response?.data);
      console.log('Response.data type:', typeof response?.data);
      console.log('Response.data keys:', Object.keys(response?.data || {}));
      console.log('Response.data.details:', response?.data?.details);
      console.log('Response.data.details type:', typeof response?.data?.details);
      console.log('Response.data.details keys:', Object.keys(response?.data?.details || {}));
      
      // The backend returns {success: true, data: result}
      // So we need to return response.data directly
      const result = response.data;
      console.log('=== FACIAL ANALYSIS API CALL END ===');
      console.log('🔍 Extracted data:', result);
      console.log('🔍 Data type:', typeof result);
      console.log('🔍 Data keys:', Object.keys(result || {}));
      console.log('🔍 Emotion field:', result?.emotion);
      console.log('🔍 Confidence field:', result?.confidence);
      console.log('🔍 Details field:', result?.details);
      console.log('🔍 Details type:', typeof result?.details);
      console.log('🔍 Details keys:', Object.keys(result?.details || {}));
      
      // CRITICAL: Verify emotion is not being overridden
      if (result && result.emotion) {
        console.log('✅ Emotion from backend preserved:', result.emotion);
      } else {
        console.warn('⚠️ WARNING: No emotion field in backend response!', result);
      }
      
      return result;
    } catch (error) {
      console.error('=== FACIAL ANALYSIS API ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== END ERROR ===');
      throw error;
    }
  };

  const simulateVoiceAnalysis = async (audioBlob) => {
    try {
      console.log('🔊 Voice Analysis: Starting analysis...');
      console.log('🔊 Voice Analysis: Audio blob size:', audioBlob.size);
      console.log('🔊 Voice Analysis: User ID:', currentUser.id);

      const result = await api.analyzeVoiceEmotion(audioBlob, currentUser.id);
      
      console.log('🔊 Voice Analysis: API response:', result);
      console.log('🔍 Voice result.data:', result.data);
      console.log('🔍 Voice emotion:', result.data?.emotion);
      console.log('🔍 Voice confidence:', result.data?.confidence);
      
      // CRITICAL: Verify emotion is not being overridden
      if (result.data && result.data.emotion) {
        console.log('✅ Voice emotion from backend preserved:', result.data.emotion);
      } else {
        console.warn('⚠️ WARNING: No emotion field in voice backend response!', result.data);
      }
      
      // Return the data directly from the backend response
      return result.data || result;
    } catch (error) {
      console.error('🔊 Voice Analysis: API error:', error);
      throw error;
    }
  };

  const simulateTextAnalysis = async (text) => {
    try {
      console.log('=== TEXT ANALYSIS API CALL START ===');
      console.log('Text to analyze:', text);
      
      const response = await api.request('/emotions/analyze-text', {
        method: 'POST',
        body: JSON.stringify({
          text: text,
          userId: currentUser.id,
          language: i18n.language || 'en'
        })
      });
      
      console.log('=== TEXT API RESPONSE RECEIVED ===');
      console.log('Full response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Response.data:', response?.data);
      console.log('Response.data type:', typeof response?.data);
      console.log('Response.data keys:', Object.keys(response?.data || {}));
      console.log('Response.data.details:', response?.data?.details);
      console.log('Response.data.details type:', typeof response?.data?.details);
      console.log('Response.data.details keys:', Object.keys(response?.data?.details || {}));
      
      // The backend returns {success: true, data: result}
      // So we need to return response.data directly
      const result = response.data;
      console.log('=== TEXT ANALYSIS API CALL END ===');
      console.log('🔍 Extracted data:', result);
      console.log('🔍 Data type:', typeof result);
      console.log('🔍 Data keys:', Object.keys(result || {}));
      console.log('🔍 Emotion field:', result?.emotion);
      console.log('🔍 Confidence field:', result?.confidence);
      console.log('🔍 Details field:', result?.details);
      console.log('🔍 Details type:', typeof result?.details);
      console.log('🔍 Details keys:', Object.keys(result?.details || {}));
      
      // CRITICAL: Verify emotion is not being overridden
      if (result && result.emotion) {
        console.log('✅ Text emotion from backend preserved:', result.emotion);
      } else {
        console.warn('⚠️ WARNING: No emotion field in text backend response!', result);
      }
      
      return result;
    } catch (error) {
      console.error('=== TEXT ANALYSIS API ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== END ERROR ===');
      throw error;
    }
  };

  const simulateCombinedAnalysis = async (results) => {
    try {
      const response = await api.request('/emotions/analyze-combined', {
        method: 'POST',
        body: JSON.stringify({
          facialData: results.facial,
          voiceData: results.voice,
          textData: results.text,
          userId: currentUser.id,
          language: i18n.language || 'en'
        })
      });
      
      console.log('Combined API response:', response);
      console.log('Combined API response type:', typeof response);
      console.log('Combined API response keys:', Object.keys(response || {}));
      console.log('Combined API response.data:', response?.data);
      console.log('Combined API response.data type:', typeof response?.data);
      console.log('Combined API response.data keys:', Object.keys(response?.data || {}));
      console.log('Full combined response structure:', JSON.stringify(response, null, 2));
      
      // Debug response structure
      console.log('Checking response.data:', response.data);
      console.log('Checking response.data.analysis:', response.data?.analysis);
      console.log('Response has analysis field:', !!(response.data && response.data.analysis));
      
      // Handle the new advanced response format
      if (response.data && response.data.analysis) {
        const result = {
          emotion: response.data.emotion,
          confidence: response.data.confidence,
          description: response.data.analysis.description,
          recommendations: response.data.analysis.recommendations,
          therapyType: response.data.analysis.therapyType,
          confidenceLevel: response.data.analysis.confidence_level,
          modalityAgreement: response.data.analysis.modality_agreement,
          emotionalIntensity: response.data.analysis.emotional_intensity,
          riskAssessment: response.data.analysis.risk_assessment,
          emergencyAlert: response.data.emergencyAlert
        };
        return result;
      }
      
      // Fallback to old format
      console.log('Using fallback format, returning:', response.data || response);
      
      // Handle the case where backend returns final_emotion instead of emotion
      const fallbackResponse = response.data || response;
      if (fallbackResponse.final_emotion) {
        return {
          emotion: fallbackResponse.final_emotion,
          confidence: fallbackResponse.confidence,
          description: "Analysis completed with basic results.",
          recommendations: "Based on the multimodal analysis, consider the following recommendations...",
          therapyType: "general",
          confidenceLevel: "moderate",
          modalityAgreement: "mixed",
          emotionalIntensity: "moderate",
          riskAssessment: "low",
          emergencyAlert: fallbackResponse.emergencyAlert || response.data?.emergencyAlert
        };
      }
      
      // Include emergencyAlert if present
      const finalResponse = { ...fallbackResponse };
      if (response.data?.emergencyAlert) {
        finalResponse.emergencyAlert = response.data.emergencyAlert;
      }
      
      return finalResponse;
    } catch (error) {
      console.error('Combined analysis API error:', error);
      throw error;
    }
  };

  // Check for emergency alert in combined results
  useEffect(() => {
    if (analysisResults.combined?.emergencyAlert?.triggered) {
      setCrisisData({
        fusionResult: {
          severity: analysisResults.combined.emergencyAlert.severity || 'high',
          isCrisis: analysisResults.combined.emergencyAlert.isCrisis || false,
          primaryEmotion: analysisResults.combined.emotion || 'distress'
        },
        recommendation: analysisResults.combined.emergencyAlert.recommendation
      });
      setShowCrisisPopup(true);
    }
  }, [analysisResults.combined]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Facial Analysis
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              mb: 3,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600
            }}>
              {t('analysis.facial')}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9,
              mb: 2
            }} paragraph>
              {t('analysis.facialInstructions')}
            </Typography>
            <Box sx={{
              bgcolor: alpha('#ffffff', 0.1),
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 2,
              p: 2,
              mb: 3,
              display: 'inline-block'
            }}>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                opacity: 0.9
              }}>
                💡 {t('analysis.facialTips')}
              </Typography>
            </Box>
            
            {/* Always render video element, but hide it when loading */}
            <Box sx={{ 
              mb: 3, 
              display: isCameraLoading ? 'none' : 'block',
              position: 'relative'
            }}>
              <Box sx={{
                bgcolor: alpha('#ffffff', 0.1),
                backdropFilter: 'blur(5px)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 3,
                p: 2,
                display: 'inline-block',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  style={{ 
                    width: '100%', 
                    maxWidth: 500, 
                    borderRadius: 8,
                    display: 'block'
                  }}
                />
              </Box>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
            
            {isCameraLoading ? (
              <Box sx={{ mb: 3 }}>
                <CircularProgress size={60} sx={{ color: '#ffffff' }} />
                <Typography variant="h6" sx={{ 
                  mt: 2,
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 500
                }}>
                  {t('analysis.startingCamera')}
                </Typography>
                <Typography variant="body2" sx={{ 
                  mt: 1,
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  opacity: 0.8
                }}>
                  {t('analysis.cameraPermissions')}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={startFacialAnalysis}
                  sx={{ 
                    mt: 2,
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: '#ffffff',
                      bgcolor: alpha('#ffffff', 0.1)
                    }
                  }}
                >
                  {t('analysis.retryCamera')}
                </Button>
              </Box>
            ) : countdown > 0 ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  width: 120,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                  <Typography variant="h2" sx={{ 
                    fontSize: '4rem', 
                    color: '#ffffff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontWeight: 700
                  }}>
                    {countdown}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ 
                  mt: 2,
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 500
                }}>
                  {t('analysis.getReady')} {countdown === 3 ? '📸' : countdown === 2 ? '📸' : '📸'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ 
                    mb: 2,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontWeight: 500
                  }}>
                    {t('analysis.cameraReady')}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={startFacialAnalysis}
                    startIcon={<CameraAlt />}
                    sx={{
                      bgcolor: alpha('#ffffff', 0.2),
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: alpha('#ffffff', 0.3),
                        border: '1px solid rgba(255,255,255,0.5)',
                      }
                    }}
                  >
                    {t('analysis.startCameraAgain')}
                  </Button>
                </Box>
              </Box>
            )}
            
            {isAnalyzing && (
              <Box sx={{ mb: 3 }}>
                <CircularProgress size={60} sx={{ color: '#ffffff' }} />
                <Typography variant="h6" sx={{ 
                  mt: 2,
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 500
                }}>
                  {t('analysis.analyzingFacial')}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 1: // Voice Analysis
        console.log('Rendering voice step - isRecording:', isRecording, 'isAnalyzing:', isAnalyzing);
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              mb: 3,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600
            }}>
              {t('analysis.voice')}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9,
              mb: 3
            }} paragraph>
              {t('analysis.voiceInstructions')}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{
                bgcolor: alpha('#ffffff', 0.15),
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: 120,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                boxShadow: isRecording ? '0 0 20px rgba(255,255,255,0.5)' : '0 4px 20px rgba(0,0,0,0.3)',
                animation: isRecording ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.5)'
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 30px rgba(255,255,255,0.7)'
                  }
                }
              }}>
                <IconButton
                  size="large"
                  sx={{ 
                    fontSize: '3rem',
                    color: '#ffffff',
                  }}
                >
                  <Mic />
                </IconButton>
              </Box>
            </Box>
            
            {!isRecording && !isAnalyzing && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={startVoiceRecording}
                sx={{ 
                  px: 4, 
                  py: 2,
                  bgcolor: alpha('#ffffff', 0.2),
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.3),
                    border: '1px solid rgba(255,255,255,0.5)',
                  }
                }}
              >
                {t('analysis.startRecording')}
              </Button>
            )}
            
            {isRecording && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Stop />}
                onClick={stopVoiceRecording}
                sx={{ 
                  px: 4, 
                  py: 2,
                  bgcolor: alpha('#f44336', 0.3),
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: alpha('#f44336', 0.4),
                    border: '1px solid rgba(255,255,255,0.5)',
                  }
                }}
              >
                {t('analysis.stopRecording')}
              </Button>
            )}
            
            {isAnalyzing && (
              <Box sx={{ mb: 3 }}>
                <CircularProgress size={60} sx={{ color: '#ffffff' }} />
                <Typography variant="h6" sx={{ 
                  mt: 2,
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 500
                }}>
                  {t('analysis.analyzingVoice')}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2: // Text Analysis
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              mb: 3,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600
            }}>
              {t('analysis.text')}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9,
              mb: 3
            }} paragraph>
              {t('analysis.textInstructions')}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t('analysis.textPlaceholder')}
              sx={{ 
                mb: 3, 
                maxWidth: 600,
                mx: 'auto',
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha('#ffffff', 0.1),
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
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
                }
              }}
            />
            
            {!isAnalyzing && (
              <Button
                variant="contained"
                size="large"
                startIcon={<TextFields />}
                onClick={analyzeTextSentiment}
                disabled={!textInput.trim()}
                sx={{ 
                  px: 4, 
                  py: 2,
                  bgcolor: alpha('#ffffff', 0.2),
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.3),
                    border: '1px solid rgba(255,255,255,0.5)',
                  },
                  '&:disabled': {
                    bgcolor: alpha('#ffffff', 0.1),
                    color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }
                }}
              >
                {t('analysis.analyzeText')}
              </Button>
            )}
            
            {isAnalyzing && (
              <Box sx={{ mb: 3 }}>
                <CircularProgress size={60} sx={{ color: '#ffffff' }} />
                <Typography variant="h6" sx={{ 
                  mt: 2,
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 500
                }}>
                  {t('analysis.analyzingText')}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 3: // Results
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ 
              textAlign: 'center', 
              mb: 4,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontWeight: 600
            }}>
              {t('analysis.detailedAnalysis')}
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Facial Analysis Results */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%',
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: 600
                    }}>
                      <CameraAlt sx={{ mr: 1, color: '#ffffff' }} />
                      {t('analysis.facial')}
                    </Typography>
                    <Chip
                      label={translateEmotion(analysisResults.facial?.emotion)}
                      sx={{ 
                        mb: 2,
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      {t('analysis.confidence')}: {(analysisResults.facial?.confidence * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      <strong>{t('analysis.method')}:</strong> {analysisResults.facial?.method || t('analysis.aiAnalysis')}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      <strong>{t('analysis.faceDetection')}:</strong> {analysisResults.facial?.face_detected ? t('analysis.detected') : t('analysis.notDetected')} 
                      {analysisResults.facial?.face_count && ` (${analysisResults.facial.face_count} ${t('analysis.faces', { count: analysisResults.facial.face_count })})`}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      mb: 1,
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: 600
                    }}>
                      <strong>{t('analysis.emotionBreakdown')}:</strong>
                    </Typography>
                    {analysisResults.facial?.details ? (
                      Object.entries(analysisResults.facial.details).map(([emotion, value]) => (
                        <Typography key={emotion} variant="caption" display="block" sx={{ 
                          ml: 1,
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          opacity: 0.9
                        }}>
                          <strong>{translateEmotion(emotion)}:</strong> {(value * 100).toFixed(1)}%
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="caption" display="block" sx={{ 
                        ml: 1, 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.7
                      }}>
                        {t('analysis.noBreakdownData')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Voice Analysis Results */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%',
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: 600
                    }}>
                      <Mic sx={{ mr: 1, color: '#ffffff' }} />
                      {t('analysis.voice')}
                    </Typography>
                    <Chip
                      label={translateEmotion(analysisResults.voice?.emotion)}
                      sx={{ 
                        mb: 2,
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      {t('analysis.confidence')}: {(analysisResults.voice?.confidence * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      <strong>{t('analysis.method')}:</strong> {analysisResults.voice?.method || t('analysis.aiAnalysis')}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: 600,
                      mb: 1
                    }}>
                      <strong>{t('analysis.voiceCharacteristics')}:</strong>
                    </Typography>
                    {analysisResults.voice?.details && Object.entries(analysisResults.voice.details).map(([key, value]) => {
                      // Skip nested objects (all_scores_10, all_scores_7) - they're too complex to display inline
                      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        return null;
                      }
                      
                      // Format the value for display
                      let displayValue = value;
                      if (typeof value === 'number') {
                        displayValue = (value * 100).toFixed(1) + '%';
                      } else if (typeof value === 'boolean') {
                        displayValue = value ? t('common.yes') : t('common.no');
                      }
                      
                      return (
                        <Typography key={key} variant="caption" display="block" sx={{ 
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          opacity: 0.9
                        }}>
                          <strong>{key}:</strong> {displayValue}
                        </Typography>
                      );
                    })}
                  </CardContent>
                </Card>
              </Grid>

              {/* Text Analysis Results */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%',
                  bgcolor: alpha('#ffffff', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: 600
                    }}>
                      <TextFields sx={{ mr: 1, color: '#ffffff' }} />
                      {t('analysis.text')}
                    </Typography>
                    <Chip
                      label={translateEmotion(analysisResults.text?.emotion)}
                      sx={{ 
                        mb: 2,
                        bgcolor: alpha('#ffffff', 0.2),
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      {t('analysis.confidence')}: {(analysisResults.text?.confidence * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      <strong>{t('analysis.sentiment')}:</strong> {analysisResults.text?.sentiment || t('common.notAvailable')}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      <strong>{t('analysis.processingMethod')}:</strong> {analysisResults.text?.details?.processing_method || t('analysis.enhancedNLP')}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      <strong>{t('analysis.wordCount')}:</strong> {analysisResults.text?.details?.word_count || t('common.notAvailable')}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      opacity: 0.9,
                      mb: 1
                    }} paragraph>
                      <strong>{t('analysis.confidenceLevel')}:</strong> {analysisResults.text?.details?.confidence_level?.replace('_', ' ').toUpperCase() || t('common.notAvailable')}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      mb: 1,
                      color: '#ffffff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      fontWeight: 600
                    }}>
                      <strong>{t('analysis.emotionScores')}:</strong>
                    </Typography>
                    {analysisResults.text?.details?.emotion_scores ? (
                      Object.entries(analysisResults.text.details.emotion_scores).map(([emotion, score]) => (
                        <Typography key={emotion} variant="caption" display="block" sx={{ 
                          ml: 1,
                          color: '#ffffff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          opacity: 0.9
                        }}>
                          <strong>{translateEmotion(emotion)}:</strong> {(score * 100).toFixed(1)}%
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="caption" display="block" sx={{ 
                        ml: 1, 
                        color: '#ffffff',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        opacity: 0.7
                      }}>
                        {t('analysis.noEmotionScores')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Combined Analysis Result */}
            <Card sx={{ 
              mb: 4, 
              bgcolor: alpha('#ffffff', 0.2),
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 600,
                  mb: 3
                }}>
                  <Psychology sx={{ mr: 1, color: '#ffffff' }} />
                  {t('analysis.actualEmotionalState')}
                </Typography>
                <Chip
                  label={analysisResults.combined?.emotion ? translateEmotion(analysisResults.combined.emotion) : t('analysis.analyzing')}
                  sx={{ 
                    mb: 2, 
                    fontSize: '1.1rem', 
                    px: 2, 
                    py: 1,
                    bgcolor: alpha('#4caf50', 0.3),
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                {/* Debug UI state */}
                {console.log('UI Debug - analysisResults.combined:', analysisResults.combined)}
                {console.log('UI Debug - analysisResults.combined?.emotion:', analysisResults.combined?.emotion)}
                {console.log('UI Debug - analysisResults.combined?.confidence:', analysisResults.combined?.confidence)}
                {console.log('UI Debug - isAnalyzing:', isAnalyzing)}
                {console.log('UI Debug - currentStep:', currentStep)}
                <Typography variant="h6" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  fontWeight: 500,
                  mb: 2
                }} paragraph>
                  {t('analysis.confidence')}: {(analysisResults.combined?.confidence * 100).toFixed(1)}%
                </Typography>
                
                {/* Additional Analysis Information */}
                {analysisResults.combined?.confidenceLevel && (
                  <Typography variant="body2" sx={{ 
                    mb: 1,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.9
                  }}>
                    <strong>{t('analysis.confidenceLevel')}:</strong> {analysisResults.combined.confidenceLevel.replace('_', ' ').toUpperCase()}
                  </Typography>
                )}
                
                {analysisResults.combined?.modalityAgreement && (
                  <Typography variant="body2" sx={{ 
                    mb: 1,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.9
                  }}>
                    <strong>{t('analysis.modalityAgreement')}:</strong> {analysisResults.combined.modalityAgreement.replace('_', ' ').toUpperCase()}
                  </Typography>
                )}
                
                {analysisResults.combined?.emotionalIntensity && (
                  <Typography variant="body2" sx={{ 
                    mb: 1,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.9
                  }}>
                    <strong>{t('analysis.emotionalIntensity')}:</strong> {analysisResults.combined.emotionalIntensity.replace('_', ' ').toUpperCase()}
                  </Typography>
                )}
                
                {analysisResults.combined?.riskAssessment && (
                  <Typography variant="body2" sx={{ 
                    mb: 2,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    opacity: 0.9
                  }}>
                    <strong>{t('analysis.riskAssessment')}:</strong> {analysisResults.combined.riskAssessment.replace('_', ' ').toUpperCase()}
                  </Typography>
                )}
                
                <Typography variant="body1" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  opacity: 0.9,
                  mb: 2
                }} paragraph>
                  {analysisResults.combined?.description}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  opacity: 0.9
                }}>
                  <strong>{t('analysis.recommendations')}:</strong> {analysisResults.combined?.recommendations}
                </Typography>
              </CardContent>
            </Card>

            {/* Get Therapy Button */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Psychology />}
                onClick={() => onAnalysisComplete && onAnalysisComplete(analysisResults.combined)}
                sx={{ 
                  px: 6, 
                  py: 2, 
                  fontSize: '1.2rem',
                  bgcolor: alpha('#ffffff', 0.2),
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.3),
                    border: '1px solid rgba(255,255,255,0.5)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {t('analysis.getTherapyRecommendation')}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <CrisisAlertPopup
        open={showCrisisPopup}
        onClose={() => setShowCrisisPopup(false)}
        onDismiss={() => setShowCrisisPopup(false)}
        distressData={crisisData}
      />
      <Box sx={{ 
      maxWidth: 1000, 
      mx: 'auto', 
      p: 3,
      position: 'relative',
      zIndex: 2
    }}>
      <Card sx={{ 
        bgcolor: alpha('#ffffff', 0.15),
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: 3,
        p: 4,
        minHeight: '80vh'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" sx={{ 
            color: '#ffffff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontWeight: 600
          }}>
            {t('analysis.multiModalTitle')}
          </Typography>
          <IconButton 
            onClick={resetAnalysis} 
            sx={{
              color: '#ffffff',
              bgcolor: alpha('#ffffff', 0.2),
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.3),
              }
            }}
          >
            <Refresh />
          </IconButton>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              bgcolor: alpha('#f44336', 0.2),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              '& .MuiAlert-icon': {
                color: '#ffffff'
              }
            }}
            action={
              <Button 
                size="small" 
                onClick={() => {
                  setError(null);
                  if (currentStep === 0) {
                    // Retry facial analysis
                    console.log('Retrying facial analysis...');
                    startFacialAnalysis();
                  }
                }}
                sx={{
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                {t('common.retry')}
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {isAnalyzing && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              sx={{
                bgcolor: alpha('#ffffff', 0.1),
                borderRadius: 1,
                height: 6,
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#ffffff',
                  borderRadius: 1
                }
              }}
            />
            <Typography variant="body2" sx={{ 
              mt: 1,
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9
            }}>
              {t('analysis.analyzingPleaseWait')}
            </Typography>
          </Box>
        )}

        <Box sx={{ minHeight: 500 }}>
          {renderStepContent()}
        </Box>
      </Card>
    </Box>
    </>
  );
};

export default MultiModalAnalysis;
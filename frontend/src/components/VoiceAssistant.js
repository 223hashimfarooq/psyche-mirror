import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
  Button,
  TextField,
  useTheme,
  alpha,
  Slide,
  LinearProgress,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Close,
  VolumeUp,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { pipeline, env, read_audio } from '@xenova/transformers';
import api from '../services/api';

// Disable local model files (use CDN)
env.allowLocalModels = false;

const VoiceAssistant = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const whisperPipelineRef = useRef(null);
  const synthRef = useRef(null);
  const streamRef = useRef(null);
  const monitorContextRef = useRef(null);
  const backgroundRecorderRef = useRef(null);
  const backgroundStreamRef = useRef(null);
  const wakeWordCheckIntervalRef = useRef(null);

  // Check if user is logged in (for background mode) and watch for changes
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('psychemirror_token');
      // Check if background mode is explicitly enabled by user
      const backgroundModeEnabled = localStorage.getItem('voice_assistant_background_mode') === 'true';
      
      if (token && backgroundModeEnabled) {
        // Enable background mode when logged in AND user has enabled it
        setIsBackgroundMode(true);
        console.log('✅ Background mode enabled - wake word detection active');
      } else {
        // Disable background mode
        setIsBackgroundMode(false);
        stopBackgroundListening();
        if (!backgroundModeEnabled && token) {
          console.log('ℹ️ Background mode disabled - enable in settings to use wake word');
        } else {
          console.log('❌ Background mode disabled - user logged out');
        }
      }
    };
    
    // Check on mount
    checkToken();
    
    // Listen for storage changes (login/logout - cross-tab only)
    const handleStorageChange = (e) => {
      if (e.key === 'psychemirror_token' || e.key === 'voice_assistant_background_mode') {
        checkToken();
      }
    };
    
    // Listen for custom events (same-tab setting changes)
    const handleCustomSettingChange = (e) => {
      if (e.detail && e.detail.key === 'voice_assistant_background_mode') {
        checkToken();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('voiceAssistantSettingChanged', handleCustomSettingChange);
    
    // Also check periodically in case token is set in same window (less frequently)
    const intervalId = setInterval(checkToken, 5000); // Reduced frequency
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('voiceAssistantSettingChanged', handleCustomSettingChange);
      clearInterval(intervalId);
    };
  }, []);

  // Initialize Whisper model
  useEffect(() => {
    const initWhisper = async () => {
      try {
        setModelLoading(true);
        console.log('🔄 Loading Whisper model...');
        
        // Use 'tiny' model for faster loading, or 'base' for better accuracy
        // Model options: 'tiny' (fast, ~50MB), 'base' (better accuracy, ~150MB), 'small' (best accuracy, ~500MB)
        // Using 'base' for better accuracy while still being reasonably fast
        // You can change this to 'tiny' for faster loading or 'small' for best accuracy
        const modelName = 'Xenova/whisper-base'; // Better accuracy than tiny
        
        whisperPipelineRef.current = await pipeline(
          'automatic-speech-recognition',
          modelName,
          {
            // Use WebAssembly backend for better browser compatibility
            device: 'wasm',
          }
        );
        
        setModelLoaded(true);
        setModelLoading(false);
        console.log('✅ Whisper model loaded successfully');
      } catch (err) {
        console.error('❌ Error loading Whisper model:', err);
        setError('Failed to load speech recognition model. Please refresh the page.');
        setModelLoading(false);
      }
    };

    initWhisper();

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      // Cleanup
      stopBackgroundListening();
      if (monitorContextRef.current) {
        try {
          monitorContextRef.current.source.disconnect();
          monitorContextRef.current.analyser.disconnect();
          monitorContextRef.current.context.close();
        } catch (e) {
          // Ignore cleanup errors
        }
        monitorContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Start background listening when model is loaded - with debouncing
  useEffect(() => {
    if (isBackgroundMode && modelLoaded && !isWakeWordActive) {
      // Wait longer before starting to ensure app is fully loaded
      const timeoutId = setTimeout(() => {
        // Only start if still in background mode and model is still loaded
        if (isBackgroundMode && modelLoaded && !isWakeWordActive) {
          startBackgroundListening();
        }
      }, 5000); // Increased to 5 seconds to let app stabilize
      
      return () => clearTimeout(timeoutId);
    }
  }, [isBackgroundMode, modelLoaded, isWakeWordActive]);

  // Start background listening for wake word - OPTIMIZED VERSION
  const startBackgroundListening = async () => {
    if (!isBackgroundMode || !modelLoaded || isWakeWordActive) return;
    
    try {
      console.log('🎤 Starting background listening for wake word...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });
      
      backgroundStreamRef.current = stream;
      setIsWakeWordActive(true);
      
      // Use a flag to prevent overlapping checks
      let isCheckingWakeWord = false;
      
      // Check for wake word less frequently (5 seconds) and use requestIdleCallback for non-blocking
      const scheduleNextCheck = () => {
        if (wakeWordCheckIntervalRef.current) {
          // Use setTimeout with longer interval to reduce load
          wakeWordCheckIntervalRef.current = setTimeout(() => {
            if (!wakeWordDetected && !isListening && !isProcessing && !isCheckingWakeWord) {
              // Use requestIdleCallback to defer heavy processing
              if (window.requestIdleCallback) {
                window.requestIdleCallback(() => {
                  checkForWakeWord(stream).finally(() => {
                    isCheckingWakeWord = false;
                    scheduleNextCheck();
                  });
                }, { timeout: 1000 });
              } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(() => {
                  checkForWakeWord(stream).finally(() => {
                    isCheckingWakeWord = false;
                    scheduleNextCheck();
                  });
                }, 100);
              }
            } else {
              scheduleNextCheck();
            }
          }, 5000); // Increased to 5 seconds to reduce load
        }
      };
      
      // Start the first check after a delay
      wakeWordCheckIntervalRef.current = setTimeout(() => {
        scheduleNextCheck();
      }, 3000);
      
    } catch (err) {
      console.error('❌ Error starting background listening:', err);
      setIsWakeWordActive(false);
    }
  };

  // Stop background listening
  const stopBackgroundListening = () => {
    if (wakeWordCheckIntervalRef.current) {
      clearTimeout(wakeWordCheckIntervalRef.current);
      wakeWordCheckIntervalRef.current = null;
    }
    if (backgroundStreamRef.current) {
      backgroundStreamRef.current.getTracks().forEach(track => track.stop());
      backgroundStreamRef.current = null;
    }
    setIsWakeWordActive(false);
    setWakeWordDetected(false);
  };

  // Check for wake word "hi psyche" - OPTIMIZED VERSION
  const checkForWakeWord = async (stream) => {
    if (!whisperPipelineRef.current || isListening || isProcessing || wakeWordDetected) {
      return false;
    }
    
    // Quick check: if we're already processing, skip
    if (backgroundRecorderRef.current && backgroundRecorderRef.current.state !== 'inactive') {
      return false;
    }
    
    try {
      // Record a shorter audio sample (1 second instead of 2) for faster processing
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000 // Lower bitrate for faster processing
      });
      
      backgroundRecorderRef.current = mediaRecorder;
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      return new Promise((resolve) => {
        let timeoutId;
        let resolved = false;
        
        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (backgroundRecorderRef.current === mediaRecorder) {
            backgroundRecorderRef.current = null;
          }
        };
        
        mediaRecorder.onstop = async () => {
          if (resolved) return;
          
          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            if (audioBlob.size < 500) { // Lower threshold for shorter recording
              resolved = true;
              cleanup();
              resolve(false);
              return;
            }
            
            // Use setTimeout to defer heavy processing and prevent blocking
            setTimeout(async () => {
              try {
                // Convert to audio data
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                let audioData = audioBuffer.getChannelData(0);
                
                // Resample to 16kHz if needed (optimized)
                if (audioBuffer.sampleRate !== 16000) {
                  const ratio = audioBuffer.sampleRate / 16000;
                  const newLength = Math.round(audioData.length / ratio);
                  const resampledData = new Float32Array(newLength);
                  // Use simpler resampling for speed
                  for (let i = 0; i < newLength; i++) {
                    const srcIndex = Math.round(i * ratio);
                    if (srcIndex < audioData.length) {
                      resampledData[i] = audioData[srcIndex];
                    }
                  }
                  audioData = resampledData;
                }
                
                // Only transcribe if we have enough audio data
                if (audioData.length < 1600) { // Less than 0.1 second at 16kHz
                  audioContext.close();
                  resolved = true;
                  cleanup();
                  resolve(false);
                  return;
                }
                
                // Transcribe with minimal options for speed
                const result = await whisperPipelineRef.current(audioData, {
                  task: 'transcribe',
                  return_timestamps: false,
                  temperature: 0.0,
                  chunk_length_s: 1, // Process in 1-second chunks
                });
                
                const transcribedText = (result?.text || '').toLowerCase().trim();
                audioContext.close();
                
                // Check for wake word (simplified matching)
                const wakeWords = ['hi psyche', 'hey psyche', 'hello psyche', 'psyche'];
                const detected = wakeWords.some(wakeWord => 
                  transcribedText.includes(wakeWord) || transcribedText.startsWith(wakeWord)
                );
                
                if (detected && !resolved) {
                  console.log('🔔 Wake word detected!', transcribedText);
                  resolved = true;
                  cleanup();
                  setWakeWordDetected(true);
                  // Start listening for command
                  setTimeout(() => {
                    startListening();
                  }, 500);
                  resolve(true);
                } else {
                  resolved = true;
                  cleanup();
                  resolve(false);
                }
              } catch (err) {
                console.error('Error processing wake word:', err);
                resolved = true;
                cleanup();
                resolve(false);
              }
            }, 50); // Small delay to prevent blocking
            
          } catch (err) {
            console.error('Error checking wake word:', err);
            resolved = true;
            cleanup();
            resolve(false);
          }
        };
        
        mediaRecorder.onerror = (err) => {
          console.error('MediaRecorder error:', err);
          resolved = true;
          cleanup();
          resolve(false);
        };
        
        try {
          mediaRecorder.start();
          // Record for 1 second (reduced from 2 seconds)
          timeoutId = setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 1000);
        } catch (err) {
          console.error('Error starting MediaRecorder:', err);
          resolved = true;
          cleanup();
          resolve(false);
        }
      });
    } catch (err) {
      console.error('Error in wake word check:', err);
      return false;
    }
  };

  const getLanguageCode = (lang) => {
    const codes = {
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de'
    };
    return codes[lang] || 'en';
  };

  // Post-process transcription to improve accuracy and fix common errors
  const cleanTranscription = (text) => {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Fix common transcription errors
    // Common word corrections (add more as needed)
    const corrections = {
      // Common misheard words
      'uh': '',
      'um': '',
      'er': '',
      'ah': '',
      // Fix common contractions
      'dont': "don't",
      'wont': "won't",
      'cant': "can't",
      'isnt': "isn't",
      'arent': "aren't",
      'wasnt': "wasn't",
      'werent': "weren't",
      'havent': "haven't",
      'hasnt': "hasn't",
      'hadnt': "hadn't",
      'wouldnt': "wouldn't",
      'couldnt': "couldn't",
      'shouldnt': "shouldn't",
      'its': "it's",
      'thats': "that's",
      'theres': "there's",
      'wheres': "where's",
      'whos': "who's",
      'whats': "what's",
      'lets': "let's",
      'youre': "you're",
      'were': "we're",
      'theyre': "they're",
      'im': "I'm",
      'ive': "I've",
      'ill': "I'll",
      'id': "I'd",
    };
    
    // Apply corrections (case-insensitive)
    Object.keys(corrections).forEach(wrong => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      cleaned = cleaned.replace(regex, corrections[wrong]);
    });
    
    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    // Remove trailing punctuation issues
    cleaned = cleaned.replace(/[.,;:]+$/g, '');
    
    // Ensure proper sentence ending
    if (cleaned.length > 0 && !cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }
    
    return cleaned.trim();
  };

  const getWhisperModel = (language) => {
    // All languages use the same multi-language model
    // The regular whisper-tiny model supports all languages
    return 'Xenova/whisper-tiny';
  };

  const startListening = async () => {
    if (!modelLoaded && !modelLoading) {
      setError('Speech recognition model is still loading. Please wait...');
      return;
    }

    if (modelLoading) {
      setError('Model is loading. Please wait...');
      return;
    }

    console.log('🎤 Starting audio recording...');
    setError('');
    setTranscript('');
    setResponse('');
    setIsListening(true);
    // Only open dialog if not in background mode or if explicitly opened
    if (!isBackgroundMode || isOpen) {
      setIsOpen(true);
    }
    audioChunksRef.current = [];

    try {
      // Request microphone access with optimized settings for better speech recognition
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono for better compatibility
          echoCancellation: true, // Remove echo
          noiseSuppression: true, // Remove background noise
          autoGainControl: true, // Normalize volume
          sampleRate: 48000, // High quality, will resample to 16kHz for Whisper
          // Additional constraints for better quality
          latency: 0.01, // Low latency
          googEchoCancellation: true, // Chrome-specific echo cancellation
          googNoiseSuppression: true, // Chrome-specific noise suppression
          googAutoGainControl: true, // Chrome-specific auto gain
          googHighpassFilter: true, // Remove low-frequency noise
        } 
      });
      
      streamRef.current = stream;
      console.log('✅ Microphone access granted');
      
      // Verify audio tracks are active
      const audioTracks = stream.getAudioTracks();
      console.log('📊 Audio tracks:', audioTracks.length);
      audioTracks.forEach((track, index) => {
        console.log(`  Track ${index}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label,
          settings: track.getSettings()
        });
        
        // Check if track is muted and try to handle it
        if (track.muted) {
          console.warn(`⚠️ Track ${index} is MUTED! This will cause silent recordings.`);
          // Try to unmute - note: this might not work for all browsers/devices
          // The muted state is usually controlled by the system, not the web app
          console.warn('💡 Please unmute your microphone in system settings or the browser.');
        }
        
        // Ensure track is enabled
        if (!track.enabled) {
          console.warn(`⚠️ Track ${index} is disabled. Enabling...`);
          track.enabled = true;
        }
      });
      
      if (audioTracks.length === 0) {
        setError('No audio tracks found. Please check your microphone.');
        setIsListening(false);
        return;
      }
      
      // Check if any track is muted
      const hasMutedTrack = audioTracks.some(track => track.muted);
      if (hasMutedTrack) {
        const mutedTracks = audioTracks.filter(track => track.muted);
        const trackNames = mutedTracks.map(t => t.label).join(', ');
        setError(`Microphone is muted: ${trackNames}. Please unmute your microphone in Windows settings or your audio software (Voicemeeter) and try again.`);
        setIsListening(false);
        // Stop the stream since it won't work
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Create MediaRecorder - try different formats for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use browser default
          }
        }
      }
      
      console.log('📊 Using MIME type:', mimeType || 'browser default');
      
      // Create an AudioContext to "consume" the stream - some browsers require this
      // for MediaRecorder to capture audio properly
      const monitorContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = monitorContext.createMediaStreamSource(stream);
      const analyser = monitorContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      // Store reference for cleanup
      monitorContextRef.current = { context: monitorContext, source, analyser };
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('📦 Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        setError(`Recording error: ${event.error?.message || 'Unknown error'}`);
        setIsListening(false);
        setIsTranscribing(false);
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing audio...');
        console.log('📦 Total audio chunks:', audioChunksRef.current.length);
        setIsListening(false);
        setIsTranscribing(true);

        try {
          // Wait a bit to ensure all data is available
          await new Promise(resolve => setTimeout(resolve, 100));

          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          console.log('📊 Audio blob size:', audioBlob.size, 'bytes');
          
          if (audioBlob.size < 1000) {
            setError('Recording too short. Please speak for at least 1-2 seconds.');
            setIsTranscribing(false);
            return;
          }
          
          console.log('🔄 Converting audio to raw format...');
          // Convert audio blob to raw audio data using Web Audio API
          // Use default sampleRate, then resample to 16kHz
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          
          console.log('📊 Decoding audio data, buffer size:', arrayBuffer.byteLength, 'bytes');
          let audioBuffer;
          try {
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0)); // Make a copy
            console.log('✅ Audio decoded successfully');
          } catch (decodeError) {
            console.error('❌ Error decoding audio:', decodeError);
            setError(`Failed to decode audio: ${decodeError.message}. Try a different browser or check audio format.`);
            setIsTranscribing(false);
            audioContext.close();
            return;
          }
          
          console.log('📊 Audio info:', {
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration,
            channels: audioBuffer.numberOfChannels,
            length: audioBuffer.length
          });
          
          // Get the audio data as Float32Array
          let audioData = audioBuffer.getChannelData(0); // Get first channel (mono)
          
          // More thorough check for audio data - check multiple samples across the entire buffer
          let hasAudio = false;
          let nonZeroSamples = 0;
          const checkInterval = Math.max(1, Math.floor(audioData.length / 100)); // Check ~100 samples
          
          for (let i = 0; i < audioData.length; i += checkInterval) {
            if (Math.abs(audioData[i]) > 0.00001) { // Lower threshold
              nonZeroSamples++;
              if (nonZeroSamples >= 5) { // Need at least 5 non-zero samples
                hasAudio = true;
                break;
              }
            }
          }
          
          // Also check RMS to see if there's any signal
          let sumSquares = 0;
          for (let i = 0; i < audioData.length; i++) {
            sumSquares += audioData[i] * audioData[i];
          }
          const rms = Math.sqrt(sumSquares / audioData.length);
          
          // Calculate max value without stack overflow (use loop instead of spread)
          let maxValue = 0;
          for (let i = 0; i < audioData.length; i++) {
            const absVal = Math.abs(audioData[i]);
            if (absVal > maxValue) maxValue = absVal;
          }
          
          console.log('📊 Audio validation:', {
            hasAudio,
            nonZeroSamples,
            rms: rms.toFixed(6),
            maxValue: maxValue.toFixed(6)
          });
          
          // Only reject if truly silent (very low RMS and no non-zero samples)
          if (!hasAudio && rms < 0.0001) {
            console.error('❌ Audio data appears to be all zeros - audio not captured properly');
            console.error('💡 This might be due to:');
            console.error('   1. Microphone is muted in system settings');
            console.error('   2. MediaRecorder not capturing audio properly');
            console.error('   3. Audio codec issue');
            setError('Audio was recorded but contains no sound. Please check your microphone is unmuted and try again.');
            setIsTranscribing(false);
            audioContext.close();
            return;
          }
          
          // If stereo, mix to mono
          if (audioBuffer.numberOfChannels > 1) {
            const mixedData = new Float32Array(audioData.length);
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
              const channelData = audioBuffer.getChannelData(i);
              for (let j = 0; j < channelData.length; j++) {
                mixedData[j] += channelData[j] / audioBuffer.numberOfChannels;
              }
            }
            audioData = mixedData;
          }
          
          // Check audio amplitude (volume) - calculate RMS (Root Mean Square) for better detection
          // This calculation skips silence at beginning/end for more accurate volume measurement
          let sumSquaresFiltered = 0;
          let maxAmplitude = 0;
          let sampleCount = 0;
          
          // Skip silence at the beginning and end
          const skipSamples = Math.floor(audioData.length * 0.1); // Skip first and last 10%
          for (let i = skipSamples; i < audioData.length - skipSamples; i++) {
            const absValue = Math.abs(audioData[i]);
            maxAmplitude = Math.max(maxAmplitude, absValue);
            sumSquaresFiltered += audioData[i] * audioData[i];
            sampleCount++;
          }
          
          const rmsFiltered = Math.sqrt(sumSquaresFiltered / sampleCount);
          const avgAmplitude = rmsFiltered;
          
          console.log('📊 Audio analysis:', {
            maxAmplitude: maxAmplitude.toFixed(4),
            rms: rmsFiltered.toFixed(4),
            avgAmplitude: avgAmplitude.toFixed(4),
            duration: (audioData.length / audioBuffer.sampleRate).toFixed(2) + 's'
          });
          
          // Very low threshold - only reject if truly silent
          // RMS < 0.001 means almost no audio signal
          if (rmsFiltered < 0.001 && maxAmplitude < 0.01) {
            console.warn('⚠️ Audio appears to be silent or very quiet');
            // Don't error out - let Whisper try anyway, it might still work
            // setError('Audio too quiet. Please speak louder or check your microphone.');
            // setIsTranscribing(false);
            // audioContext.close();
            // return;
          }
          
          // Only normalize if audio is extremely quiet (not just slightly quiet)
          // This prevents over-normalization of already good audio
          if (maxAmplitude > 0 && maxAmplitude < 0.05 && rmsFiltered < 0.01) {
            console.log('🔊 Normalizing very quiet audio');
            const normalizeFactor = Math.min(2.0, 0.3 / maxAmplitude); // Cap at 2x to avoid distortion
            for (let i = 0; i < audioData.length; i++) {
              audioData[i] = Math.max(-1, Math.min(1, audioData[i] * normalizeFactor));
            }
          }
          
          // Check for clipping and prevent it (use loop to avoid stack overflow)
          let maxVal = 0;
          for (let i = 0; i < audioData.length; i++) {
            const absVal = Math.abs(audioData[i]);
            if (absVal > maxVal) maxVal = absVal;
          }
          
          if (maxVal >= 0.99) {
            console.warn('⚠️ Audio may be clipping (max value:', maxVal, '), reducing gain');
            // Reduce gain slightly to prevent clipping
            for (let i = 0; i < audioData.length; i++) {
              audioData[i] = audioData[i] * 0.95; // Reduce by 5%
            }
          }
          
          // Resample to 16kHz if needed (Whisper expects 16kHz)
          let resampledData = audioData;
          if (audioBuffer.sampleRate !== 16000) {
            console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz to 16000Hz...`);
            const ratio = audioBuffer.sampleRate / 16000;
            const newLength = Math.round(audioData.length / ratio);
            resampledData = new Float32Array(newLength);
            
            // Better resampling using linear interpolation
            for (let i = 0; i < newLength; i++) {
              const srcIndex = i * ratio;
              const index = Math.floor(srcIndex);
              const fraction = srcIndex - index;
              
              if (index + 1 < audioData.length) {
                resampledData[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
              } else {
                resampledData[i] = audioData[index];
              }
            }
          }
          
          // Final check: ensure all values are in valid range [-1, 1]
          for (let i = 0; i < resampledData.length; i++) {
            if (resampledData[i] > 1.0) resampledData[i] = 1.0;
            if (resampledData[i] < -1.0) resampledData[i] = -1.0;
          }
          
          // Apply audio enhancement for better speech recognition accuracy
          // 1. High-pass filter to remove low-frequency noise (rumble, wind, etc.)
          const highPassCutoff = 80; // Hz - remove frequencies below this
          const sampleRate = 16000;
          const rc = 1.0 / (2.0 * Math.PI * highPassCutoff);
          const dt = 1.0 / sampleRate;
          const alpha = rc / (rc + dt);
          
          // Apply high-pass filter (removes low-frequency noise)
          let prevInput = resampledData[0];
          let prevOutput = resampledData[0];
          for (let i = 1; i < resampledData.length; i++) {
            const current = resampledData[i];
            const filtered = alpha * (prevOutput + current - prevInput);
            resampledData[i] = filtered;
            prevInput = current;
            prevOutput = filtered;
          }
          
          // Calculate audio statistics for normalization
          let audioMin = 0, audioMax = 0, audioSum = 0;
          for (let i = 0; i < resampledData.length; i++) {
            const val = resampledData[i];
            if (val < audioMin) audioMin = val;
            if (val > audioMax) audioMax = val;
            audioSum += Math.abs(val);
          }
          const audioMean = audioSum / resampledData.length;
          const audioRange = Math.max(Math.abs(audioMin), Math.abs(audioMax));
          
          // 2. Normalize audio to improve Whisper detection
          // Boost audio if it's too quiet (but not if it's already loud)
          if (audioRange > 0 && audioRange < 0.3 && audioMean < 0.05) {
            console.log('🔊 Boosting quiet audio for better Whisper detection');
            const boostFactor = Math.min(2.0, 0.5 / audioRange); // Boost up to 2x
            for (let i = 0; i < resampledData.length; i++) {
              resampledData[i] = Math.max(-1, Math.min(1, resampledData[i] * boostFactor));
            }
            console.log('   Boost factor:', boostFactor.toFixed(2));
          }
          
          // 3. Soft clipping to prevent harsh distortion while preserving dynamics
          for (let i = 0; i < resampledData.length; i++) {
            const val = resampledData[i];
            if (Math.abs(val) > 0.95) {
              // Soft clip extreme values to prevent harsh distortion
              resampledData[i] = Math.sign(val) * (0.95 + 0.05 * (1 - Math.exp(-10 * (Math.abs(val) - 0.95))));
            }
          }
          
          console.log('📊 Final audio data:', {
            length: resampledData.length,
            duration: resampledData.length / 16000,
            sampleRate: 16000,
            min: audioMin.toFixed(4),
            max: audioMax.toFixed(4),
            mean: audioMean.toFixed(4),
            range: audioRange.toFixed(4),
            enhanced: true
          });
          
          console.log('🔄 Transcribing with Whisper...');
          
          // Convert Float32Array to regular Array for Whisper (some versions need this)
          // Also ensure values are in [-1, 1] range
          const audioArray = Array.from(resampledData);
          
          // Log audio stats before transcription
          const audioStats = {
            length: audioArray.length,
            min: audioMin,
            max: audioMax,
            mean: audioMean,
            duration: audioArray.length / 16000
          };
          console.log('📊 Audio stats for Whisper:', audioStats);
          
          // Ensure audio is not too short (Whisper works better with at least 0.5s)
          if (audioStats.duration < 0.5) {
            console.warn('⚠️ Audio too short for Whisper:', audioStats.duration, 'seconds');
            setError('Recording too short. Please speak for at least 1 second.');
            setIsTranscribing(false);
            audioContext.close();
            return;
          }
          
          try {
            // Transcribe with Whisper using raw audio data
            // Whisper expects Float32Array with values in [-1, 1] range at 16kHz
            let result;
            
            console.log('🔍 Attempting Whisper transcription...');
            console.log('   Input type:', resampledData.constructor.name);
            console.log('   Input length:', resampledData.length);
            console.log('   Sample rate: 16000 Hz');
            
            // Try with Float32Array directly (preferred method)
            // First try with language specified, but also try without language parameter
            // Some Whisper models work better without explicit language
            const languageCode = getLanguageCode(i18n.language);
            console.log('   Attempting with language:', languageCode);
            
            try {
              // Try with language first, using optimized parameters for better accuracy
              result = await whisperPipelineRef.current(resampledData, {
                language: languageCode,
                task: 'transcribe',
                return_timestamps: false,
                // Optimize for accuracy
                temperature: 0.0, // Lower temperature = more deterministic, better accuracy
                condition_on_previous_text: true, // Use context from previous words
                compression_ratio_threshold: 2.4, // Filter out repetitive text
                logprob_threshold: -1.0, // Filter low-confidence predictions
                no_speech_threshold: 0.6, // Better silence detection
              });
              console.log('✅ Whisper transcription completed with optimized parameters');
            } catch (langError) {
              console.warn('⚠️ Transcription with language failed, trying without language:', langError.message);
              try {
                // Try without language (auto-detect) with optimized parameters
                result = await whisperPipelineRef.current(resampledData, {
                  task: 'transcribe',
                  return_timestamps: false,
                  temperature: 0.0,
                  condition_on_previous_text: true,
                  compression_ratio_threshold: 2.4,
                  logprob_threshold: -1.0,
                  no_speech_threshold: 0.6,
                });
                console.log('✅ Whisper transcription completed with auto-detect');
              } catch (autoDetectError) {
                console.warn('⚠️ Auto-detect failed, trying Array format:', autoDetectError.message);
                try {
                  // Try with regular array
                  result = await whisperPipelineRef.current(audioArray, {
                    task: 'transcribe',
                    return_timestamps: false,
                  });
                  console.log('✅ Whisper transcription completed with Array');
                } catch (arrayError) {
                  console.error('❌ All transcription attempts failed');
                  console.error('   Last error:', arrayError);
                  throw arrayError;
                }
              }
            }
            
            // If result is empty, try one more time with different parameters
            if (result && (!result.text || result.text.trim() === '')) {
              console.warn('⚠️ Whisper returned empty result, trying alternative approach...');
              try {
                // Try with return_timestamps to see if we get chunks
                const resultWithTimestamps = await whisperPipelineRef.current(resampledData, {
                  task: 'transcribe',
                  return_timestamps: true,
                });
                console.log('   Result with timestamps:', resultWithTimestamps);
                if (resultWithTimestamps && resultWithTimestamps.text) {
                  result = resultWithTimestamps;
                }
              } catch (e) {
                console.warn('   Alternative approach also failed:', e.message);
              }
            }

            // Clean up audio context
            audioContext.close();

            // Parse result - Whisper can return text in different formats
            let rawTranscribedText = '';
            
            if (result) {
              // Try different possible result structures
              if (typeof result === 'string') {
                rawTranscribedText = result.trim();
              } else if (result.text) {
                rawTranscribedText = result.text.trim();
              } else if (result.transcription) {
                rawTranscribedText = result.transcription.trim();
              } else if (result.chunks && result.chunks.length > 0) {
                // Extract text from chunks
                rawTranscribedText = result.chunks
                  .map(chunk => chunk.text || chunk.text || '')
                  .join(' ')
                  .trim();
              } else if (Array.isArray(result) && result.length > 0) {
                // Result might be an array
                rawTranscribedText = result.map(r => r.text || r).join(' ').trim();
              }
            }
            
            // Clean and post-process the transcription
            const transcribedText = cleanTranscription(rawTranscribedText);
            
            console.log('✅ Transcription result:', {
              raw: rawTranscribedText,
              cleaned: transcribedText,
              hasText: !!transcribedText,
              textLength: transcribedText.length,
              resultType: typeof result,
              resultKeys: result ? Object.keys(result) : [],
            });
            
            setTranscript(transcribedText);
            setIsTranscribing(false);

            if (transcribedText && transcribedText.length > 0) {
              // Reset wake word detection after processing
              setWakeWordDetected(false);
              // Stop background listening temporarily while processing
              if (wakeWordCheckIntervalRef.current) {
                clearTimeout(wakeWordCheckIntervalRef.current);
                wakeWordCheckIntervalRef.current = null;
              }
              // Process the command
              await processCommand(transcribedText);
              // Resume background listening after a delay
              if (isBackgroundMode && modelLoaded && !isOpen) {
                setTimeout(() => {
                  if (!isListening && !isProcessing) {
                    startBackgroundListening();
                  }
                }, 3000);
              }
            } else {
              // More detailed error message
              console.warn('⚠️ Whisper returned empty transcription');
              console.warn('   Audio stats:', audioStats);
              console.warn('   Result type:', typeof result);
              console.warn('   Result keys:', result ? Object.keys(result) : 'null');
              console.warn('   Full result:', JSON.stringify(result, null, 2));
              
              // Check if result has chunks or other data
              if (result?.chunks && result.chunks.length > 0) {
                console.log('   Found chunks:', result.chunks);
                console.log('   Chunk texts:', result.chunks.map(c => c.text || c));
              }
              
              setError('Could not transcribe audio. The audio was recorded but Whisper could not detect speech. Please try: speaking more clearly, speaking louder, ensuring your microphone is working, or try a longer recording (2-3 seconds).');
              setIsTranscribing(false);
            }
          } catch (whisperError) {
            console.error('❌ Whisper transcription error:', whisperError);
            audioContext.close();
            setError(`Transcription failed: ${whisperError.message}. Please try again.`);
            setIsTranscribing(false);
          }
        } catch (transcribeError) {
          console.error('❌ Transcription error:', transcribeError);
          setError(`Error transcribing audio: ${transcribeError.message}. Please try again.`);
          setIsTranscribing(false);
        } finally {
          // Clean up monitor context
          if (monitorContextRef.current) {
            try {
              monitorContextRef.current.source.disconnect();
              monitorContextRef.current.analyser.disconnect();
              monitorContextRef.current.context.close();
              monitorContextRef.current = null;
            } catch (e) {
              console.warn('Error closing monitor context:', e);
            }
          }
          
          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };

      // Ensure stream is active before starting
      const audioTracksActive = stream.getAudioTracks().some(track => 
        track.readyState === 'live' && track.enabled && !track.muted
      );
      
      if (!audioTracksActive) {
        console.warn('⚠️ Audio tracks not fully active, waiting...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Start recording with timeslice to ensure data is captured periodically
      // timeslice of 100ms ensures ondataavailable fires regularly
      try {
        mediaRecorder.start(100); // 100ms timeslice
        console.log('✅ Recording started with timeslice');
      } catch (startError) {
        console.error('❌ Error starting MediaRecorder:', startError);
        // Try without timeslice as fallback
        try {
          mediaRecorder.start();
          console.log('✅ Recording started (without timeslice)');
        } catch (fallbackError) {
          console.error('❌ Failed to start MediaRecorder:', fallbackError);
          setError(`Failed to start recording: ${fallbackError.message}`);
          setIsListening(false);
          stream.getTracks().forEach(track => track.stop());
          return;
        }
      }

    } catch (micError) {
      console.error('❌ Microphone access error:', micError);
      setError(t('voiceAssistant.errors.notAllowed') || 'Microphone permission denied. Please allow microphone access.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🛑 Stopping recording...');
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (text) => {
    console.log('🚀 Processing command:', text);
    setIsProcessing(true);
    setError('');

    try {
      const backendResponse = await api.processVoiceCommand({
        text,
        language: i18n.language || 'en'
      });

      console.log('📦 Backend response (full):', JSON.stringify(backendResponse, null, 2));
      console.log('📦 Backend response (parsed):', {
        success: backendResponse.success,
        action_required: backendResponse.action_required,
        action_type: backendResponse.action_type,
        action_params: backendResponse.action_params,
        response_text: backendResponse.response_text,
        intent: backendResponse.intent
      });

      if (backendResponse.success) {
        setResponse(backendResponse.response_text);
        
        // Handle action if required OR if action_type is set (some actions might not have action_required flag)
        if (backendResponse.action_type) {
          if (backendResponse.action_required || backendResponse.action_type === 'navigate') {
            console.log('🎯 Executing action:', backendResponse.action_type, backendResponse.action_params);
            handleAction(backendResponse.action_type, backendResponse.action_params);
          } else {
            console.log('⚠️ Action type present but action_required is false:', backendResponse.action_type);
          }
        } else {
          console.log('ℹ️ No action type in response');
        }
        
        speakResponse(backendResponse.response_text, backendResponse.language || i18n.language);
      } else {
        setError(backendResponse.message || t('voiceAssistant.errors.processingError'));
      }
    } catch (err) {
      console.error('❌ Error processing voice command:', err);
      setError(err.response?.data?.message || err.message || t('voiceAssistant.errors.networkError'));
    } finally {
      setIsProcessing(false);
      // Resume background listening after processing (with delay)
      if (isBackgroundMode && !isOpen && !isListening) {
        setWakeWordDetected(false);
        // Restart background listening after a delay
        setTimeout(() => {
          if (isBackgroundMode && modelLoaded && !isWakeWordActive && !isListening && !isProcessing) {
            startBackgroundListening();
          }
        }, 2000);
      }
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      processCommand(manualInput.trim());
      setManualInput('');
      setShowManualInput(false);
    }
  };

  const handleAction = (actionType, actionParams) => {
    console.log('🎯 handleAction called:', { actionType, actionParams });
    
    switch (actionType) {
      case 'navigate':
        if (actionParams?.route) {
          console.log('🧭 Navigating to:', actionParams.route);
          // Close the dialog first, then navigate (if open)
          if (isOpen) {
            setIsOpen(false);
            setTimeout(() => {
              navigate(actionParams.route);
            }, 300);
          } else {
            // If in background mode, navigate directly
            navigate(actionParams.route);
          }
        } else {
          console.warn('⚠️ Navigation action missing route:', actionParams);
        }
        break;
      case 'start_meditation':
        console.log('🧘 Starting meditation, navigating to therapy');
        if (isOpen) {
          setIsOpen(false);
          setTimeout(() => {
            navigate('/patient/therapy');
          }, 300);
        } else {
          navigate('/patient/therapy');
        }
        break;
      case 'start_breathing':
        console.log('🫁 Starting breathing exercise, navigating to therapy');
        if (isOpen) {
          setIsOpen(false);
          setTimeout(() => {
            navigate('/patient/therapy');
          }, 300);
        } else {
          navigate('/patient/therapy');
        }
        break;
      case 'start_emotion_analysis':
        console.log('📊 Starting emotion analysis, navigating to analyze page');
        if (isOpen) {
          setIsOpen(false);
          setTimeout(() => {
            navigate('/patient/analyze');
          }, 300);
        } else {
          navigate('/patient/analyze');
        }
        break;
      default:
        console.log('⚠️ Unknown action type:', actionType, actionParams);
    }
  };

  const speakResponse = (text, language = 'en') => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const langCodes = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    utterance.lang = langCodes[language] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  const handleClose = () => {
    if (isListening) {
      stopListening();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsOpen(false);
    setTranscript('');
    setResponse('');
    setError('');
    setIsSpeaking(false);
    setShowManualInput(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        aria-label="voice assistant"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          bgcolor: isWakeWordActive 
            ? alpha('#4CAF50', 0.8) 
            : alpha('#6B73FF', 0.8),
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          width: 64,
          height: 64,
          border: `1px solid ${isWakeWordActive ? 'rgba(76,175,80,0.5)' : 'rgba(107,115,255,0.5)'}`,
          boxShadow: isWakeWordActive
            ? '0 4px 20px rgba(76,175,80,0.4)'
            : '0 4px 20px rgba(107,115,255,0.4)',
          '&:hover': {
            bgcolor: isWakeWordActive
              ? alpha('#4CAF50', 0.9)
              : alpha('#6B73FF', 0.9),
            boxShadow: isWakeWordActive
              ? '0 6px 24px rgba(76,175,80,0.5)'
              : '0 6px 24px rgba(107,115,255,0.5)',
            transform: 'scale(1.05)',
            borderColor: isWakeWordActive
              ? 'rgba(76,175,80,0.7)'
              : 'rgba(107,115,255,0.7)',
          },
          transition: 'all 0.3s ease',
          animation: isWakeWordActive ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': {
              transform: 'scale(1)',
            },
            '50%': {
              transform: 'scale(1.05)',
            },
          },
        }}
        onClick={() => {
          setIsOpen(true);
          if (!isListening && modelLoaded) {
            startListening();
          }
        }}
        title={isWakeWordActive ? 'Voice assistant active - Say "Hi Psyche"' : 'Voice Assistant'}
      >
        <Mic sx={{ fontSize: 28 }} />
      </Fab>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: alpha('#ffffff', 0.15),
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 2,
            pt: 3,
            bgcolor: alpha('#ffffff', 0.1),
            borderBottom: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#ffffff',
                fontSize: '1.5rem',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {t('voiceAssistant.title')}
            </Typography>
            <IconButton 
              onClick={handleClose} 
              size="small"
              sx={{
                color: '#ffffff',
                bgcolor: alpha('#ffffff', 0.1),
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.2),
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: 'transparent', p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
            {/* Model Loading Status */}
            {modelLoading && (
              <Box sx={{ width: '100%', textAlign: 'center' }}>
                <CircularProgress 
                  size={50} 
                  sx={{ color: '#6B73FF' }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 2,
                    color: '#ffffff',
                    fontWeight: 500,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('voiceAssistant.loadingModel') || 'Loading speech recognition model... (first time only)'}
                </Typography>
                <LinearProgress 
                  sx={{ 
                    mt: 2,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha('#ffffff', 0.2),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#6B73FF',
                    }
                  }} 
                />
              </Box>
            )}

            {/* Microphone Button */}
            {!modelLoading && (
              <motion.div
                animate={{
                  scale: isListening ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: isListening ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              >
                <IconButton
                  onClick={toggleListening}
                  disabled={isProcessing || isTranscribing || !modelLoaded}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: isListening
                      ? alpha('#FF6B9D', 0.2)
                      : alpha('#6B73FF', 0.2),
                    border: `2px solid ${isListening ? 'rgba(255,107,157,0.5)' : 'rgba(107,115,255,0.5)'}`,
                    backdropFilter: 'blur(10px)',
                    boxShadow: isListening 
                      ? '0 0 30px rgba(255,107,157,0.4)'
                      : '0 4px 20px rgba(107,115,255,0.3)',
                    '&:hover': {
                      bgcolor: isListening
                        ? alpha('#FF6B9D', 0.3)
                        : alpha('#6B73FF', 0.3),
                      transform: 'scale(1.05)',
                      borderColor: isListening ? 'rgba(255,107,157,0.7)' : 'rgba(107,115,255,0.7)',
                    },
                    '&:disabled': {
                      bgcolor: alpha('#ffffff', 0.1),
                      borderColor: 'rgba(255,255,255,0.2)',
                      opacity: 0.5,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isListening ? (
                    <MicOff sx={{ fontSize: 48, color: '#FF6B9D' }} />
                  ) : (
                    <Mic sx={{ fontSize: 48, color: '#6B73FF' }} />
                  )}
                </IconButton>
              </motion.div>
            )}

            {/* Manual Input */}
            {showManualInput && (
              <Box sx={{ width: '100%', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label={t('voiceAssistant.typePlaceholder')}
                  variant="outlined"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit();
                    }
                  }}
                  disabled={isProcessing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha('#ffffff', 0.1),
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(107,115,255,0.5)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#6B73FF',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleManualSubmit}
                  disabled={isProcessing || !manualInput.trim()}
                  sx={{
                    bgcolor: alpha('#6B73FF', 0.8),
                    color: '#ffffff',
                    fontWeight: 600,
                    px: 3,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(107,115,255,0.5)',
                    '&:hover': {
                      bgcolor: alpha('#6B73FF', 0.9),
                      borderColor: 'rgba(107,115,255,0.7)',
                    },
                    '&:disabled': {
                      bgcolor: alpha('#ffffff', 0.1),
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.5)',
                    }
                  }}
                >
                  {t('common.submit')}
                </Button>
              </Box>
            )}

            {/* Status */}
            <Box sx={{ textAlign: 'center' }}>
              {isListening && (
                <Chip
                  label={t('voiceAssistant.status.listening')}
                  sx={{ 
                    mb: 1,
                    bgcolor: alpha('#FF6B9D', 0.3),
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    height: 32,
                    border: '1px solid rgba(255,107,157,0.5)',
                    backdropFilter: 'blur(10px)',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                />
              )}
              {isTranscribing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
                  <CircularProgress size={24} sx={{ color: '#6B73FF' }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#ffffff',
                      fontWeight: 500,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {t('voiceAssistant.transcribing') || 'Transcribing...'}
                  </Typography>
                </Box>
              )}
              {isProcessing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
                  <CircularProgress size={24} sx={{ color: '#FF6B9D' }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#ffffff',
                      fontWeight: 500,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {t('voiceAssistant.status.processing')}
                  </Typography>
                </Box>
              )}
              {isSpeaking && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
                  <VolumeUp sx={{ fontSize: 24, color: '#FF6B9D' }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#ffffff',
                      fontWeight: 500,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {t('voiceAssistant.status.speaking')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Transcript */}
            {transcript && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  width: '100%',
                  bgcolor: alpha('#6B73FF', 0.15),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(107,115,255,0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 1,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('voiceAssistant.transcript')}
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{
                    color: '#ffffff',
                    lineHeight: 1.6,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {transcript}
                </Typography>
              </Paper>
            )}

            {/* Response */}
            {response && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  width: '100%',
                  bgcolor: alpha('#FF6B9D', 0.15),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,107,157,0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 1,
                    fontWeight: 600,
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('voiceAssistant.response')}
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{
                    color: '#ffffff',
                    lineHeight: 1.6,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {response}
                </Typography>
              </Paper>
            )}

            {/* Error */}
            {error && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  width: '100%',
                  bgcolor: alpha('#f44336', 0.15),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(244,67,54,0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textAlign: 'center',
                    color: '#ffffff',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {error}
                </Typography>
              </Paper>
            )}

            {/* Instructions */}
            {!transcript && !response && !error && !showManualInput && !modelLoading && (
              <Box sx={{ textAlign: 'center', mt: 2, width: '100%' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: '#ffffff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('voiceAssistant.instructions')}
                </Typography>
                
                {/* Example Commands */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    width: '100%',
                    bgcolor: alpha('#ffffff', 0.1),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    mt: 2,
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#ffffff',
                      mb: 1.5,
                      fontSize: '0.875rem',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {t('voiceAssistant.trySaying') || 'Try saying:'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[
                      t('voiceAssistant.commands.emotionQuery'),
                      t('voiceAssistant.commands.moodHistory'),
                      t('voiceAssistant.commands.relaxationAdvice'),
                      t('voiceAssistant.commands.startMeditation')
                    ].map((example, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          color: '#ffffff',
                          fontSize: '0.875rem',
                          fontStyle: 'italic',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                          '&:before': {
                            content: '"• "',
                            color: '#FF6B9D',
                            fontWeight: 'bold',
                            mr: 0.5,
                          }
                        }}
                      >
                        {example}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
                
                {isListening && (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      display: 'block', 
                      mt: 2, 
                      fontWeight: 600,
                      color: '#FF6B9D',
                      fontSize: '1rem',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {t('voiceAssistant.status.speakNow')}
                  </Typography>
                )}
              </Box>
            )}

            {/* Manual Input Option */}
            {!isListening && !isProcessing && !isTranscribing && !modelLoading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                {!showManualInput ? (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setShowManualInput(true)}
                  sx={{ 
                    mb: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    bgcolor: alpha('#ffffff', 0.1),
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      bgcolor: alpha('#ffffff', 0.2),
                    }
                  }}
                >
                  {t('voiceAssistant.typeInstead')}
                </Button>
                ) : (
                  <Button
                    variant="text"
                    fullWidth
                    onClick={() => {
                      setShowManualInput(false);
                      setManualInput('');
                    }}
                    sx={{
                      color: '#ffffff',
                      '&:hover': {
                        bgcolor: alpha('#ffffff', 0.1),
                      }
                    }}
                  >
                    {t('voiceAssistant.useVoiceInstead') || 'Use voice instead'}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceAssistant;

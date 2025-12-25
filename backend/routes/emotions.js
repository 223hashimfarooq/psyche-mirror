const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

// Request deduplication: Track in-flight voice analysis requests by file hash
// This prevents race conditions when the same file is processed multiple times
const inFlightVoiceRequests = new Map();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Helper function to extract JSON from Python script output
// Python scripts may print debug messages before the JSON output
// The output may contain multiple JSON objects - we need the last complete one
const extractJSON = (output) => {
  // The Python script outputs:
  // "Result: {"emotion": "fearful", ...}\n{"emotion": "fearful", ...}\n=== VOICE EMOTION ANALYSIS END ==="
  // We want the last complete JSON object before the "===" marker
  
  // Find the end marker to limit our search
  const endMarker = output.indexOf('=== VOICE EMOTION ANALYSIS END ===');
  const searchEnd = endMarker !== -1 ? endMarker : output.length;
  const relevantOutput = output.substring(0, searchEnd);
  
  // Find all potential JSON objects by looking for standalone JSON (lines that start with '{')
  // We'll try to extract the last complete JSON object
  const lines = relevantOutput.split('\n');
  let lastValidJSON = null;
  
  // Scan lines from the end backwards to find the last complete JSON
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      // Try to parse this line as JSON
      try {
        JSON.parse(line);
        lastValidJSON = line;
        break;
      } catch (e) {
        // Not valid JSON, continue
      }
    }
  }
  
  if (lastValidJSON) {
    return lastValidJSON;
  }
  
  // Fallback: Find the last complete JSON object by matching braces
  let lastBrace = relevantOutput.lastIndexOf('}');
  if (lastBrace === -1) {
    lastBrace = output.lastIndexOf('}');
    if (lastBrace === -1) {
      return output; // No JSON found
    }
  }
  
  // Find the matching opening brace by counting braces backwards
  let braceCount = 0;
  let firstBrace = lastBrace;
  const searchText = lastBrace < relevantOutput.length ? relevantOutput : output;
  
  for (let i = lastBrace; i >= 0; i--) {
    if (searchText[i] === '}') braceCount++;
    if (searchText[i] === '{') {
      braceCount--;
      if (braceCount === 0) {
        firstBrace = i;
        break;
      }
    }
  }
  
  if (braceCount === 0 && firstBrace < lastBrace) {
    const jsonString = searchText.substring(firstBrace, lastBrace + 1);
    // Validate it's valid JSON
    try {
      JSON.parse(jsonString);
      return jsonString;
    } catch (e) {
      // Not valid JSON
    }
  }
  
  // Last resort: return original output
  return output;
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'No token provided' 
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'psychemirror-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token is invalid or expired' 
    });
  }
};

// Helper function to run Python scripts
const runPythonScript = (scriptPath, args) => {
  return new Promise((resolve, reject) => {
    console.log('Starting Python process with args:', args);
    const pythonCmd = process.env.PYTHON_CMD || 'python';
    let pythonProcess;
    try {
      pythonProcess = spawn(pythonCmd, [scriptPath, ...args]);
    } catch (spawnError) {
      console.error('Failed to spawn python process:', spawnError);
      return reject(new Error('Failed to start Python process. Ensure Python is installed and available in PATH.'));
    }
    let output = '';
    let error = '';

    pythonProcess.on('error', (err) => {
      console.error('Python process error event:', err);
      reject(new Error('Python process error: ' + err.message));
    });

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Log in real-time for debugging voice analysis
      if (scriptPath.includes('voice-emotion')) {
        console.log('Voice Python stdout:', text);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      // Log in real-time for debugging voice analysis
      if (scriptPath.includes('voice-emotion')) {
        console.error('Voice Python stderr:', text);
      }
    });

    pythonProcess.on('close', (code) => {
      console.log('Python process completed with code:', code);
      console.log('Python stdout:', output);
      console.log('Python stderr:', error);
      
      if (code === 0) {
        try {
          // Extract JSON from output (may contain debug messages)
          const jsonString = extractJSON(output);
          const result = JSON.parse(jsonString);
          console.log('Parsed result:', result);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse output:', parseError);
          console.error('Raw output:', output);
          reject(new Error('Failed to parse Python script output: ' + output));
        }
      } else {
        console.error('Python script failed with code:', code);
        reject(new Error('Python script failed: ' + error));
      }
    });
  });
};

// Helper function to run Python scripts with file input (for large data)
const runPythonScriptWithFile = (scriptPath, data, tempFileName) => {
  return new Promise((resolve, reject) => {
    // Always write temp files inside a dedicated temp directory to avoid nodemon restarts
    const tempDir = path.join(__dirname, '..', 'temp');
    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    } catch (dirErr) {
      console.error('Failed to create temp directory:', dirErr);
      return reject(new Error('Server temp directory unavailable'));
    }
    const uniqueName = tempFileName || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    const tempFilePath = path.join(tempDir, uniqueName);
    
    console.log('Writing data to temp file:', tempFilePath);
    console.log('Data length:', data.length);
    
    // Write data to temporary file
    fs.writeFileSync(tempFilePath, data);
    
    console.log('Starting Python process...');
    const pythonCmd = process.env.PYTHON_CMD || 'python';
    let pythonProcess;
    try {
      pythonProcess = spawn(pythonCmd, [scriptPath, tempFilePath]);
    } catch (spawnError) {
      console.error('Failed to spawn python process:', spawnError);
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
      return reject(new Error('Failed to start Python process. Ensure Python is installed and available in PATH.'));
    }
    let output = '';
    let error = '';
    pythonProcess.on('error', (err) => {
      console.error('Python process error event:', err);
      // Clean up temporary file
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
      reject(new Error('Python process error: ' + err.message));
    });


    // Set a timeout to prevent hanging (90 seconds to allow for model loading and prediction)
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
      reject(new Error('Python script timeout - analysis taking too long'));
    }, 90000); // 90 second timeout to allow models to load and predict

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Log in real-time for debugging voice analysis
      if (scriptPath.includes('voice-emotion')) {
        console.log('Voice Python stdout:', text);
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      // Log in real-time for debugging voice analysis
      if (scriptPath.includes('voice-emotion')) {
        console.error('Voice Python stderr:', text);
      }
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      console.log('Python process completed with code:', code);
      console.log('Python stdout:', output);
      console.log('Python stderr:', error);
      
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temp file cleaned up');
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
      
      if (code === 0) {
        try {
          console.log('Raw Python output length:', output.length);
          console.log('Raw Python output:', output);
          console.log('Raw Python output (first 500 chars):', output.substring(0, 500));
          console.log('Raw Python output (last 500 chars):', output.substring(Math.max(0, output.length - 500)));
          
          // Extract JSON from output (may contain debug messages)
          const jsonString = extractJSON(output);
          console.log('Extracted JSON string:', jsonString);
          
          const result = JSON.parse(jsonString);
          console.log('Parsed result:', result);
          console.log('Parsed result keys:', Object.keys(result || {}));
          console.log('Parsed result details:', result?.details);
          console.log('Parsed result details keys:', Object.keys(result?.details || {}));
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse output:', parseError);
          console.error('Raw output:', output);
          reject(new Error('Failed to parse Python script output: ' + output));
        }
      } else {
        console.error('Python script failed with code:', code);
        reject(new Error('Python script failed: ' + error));
      }
    });
  });
};

// Facial Emotion Analysis Route
router.post('/analyze-facial', verifyToken, async (req, res) => {
  try {
    const { image, userId } = req.body;
    
    console.log('Facial analysis request received');
    console.log('Image data length:', image ? image.length : 'undefined');
    console.log('Image data preview:', image ? image.substring(0, 100) + '...' : 'undefined');
    
    if (!image) {
      return res.status(400).json({ 
        error: 'Missing image data',
        message: 'Image data is required for facial analysis' 
      });
    }

    // Use the face-emotion module from backend/modules
    const scriptPath = path.join(__dirname, '..', 'modules', 'face-emotion', 'face_emotion_integration.py');
    console.log('Running Python script:', scriptPath);
    
    // Use unique filename to prevent conflicts with multiple simultaneous requests
    const tempFileName = `temp_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.txt`;
    console.log('Using temp file:', tempFileName);
    
    // Add timeout protection (90 seconds to allow for model loading and prediction)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout - taking too long')), 90000);
    });
    
    const result = await Promise.race([
      runPythonScriptWithFile(scriptPath, image, tempFileName),
      timeoutPromise
    ]);
    
    console.log('Python script result:', result);
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result || {}));
    console.log('Result details:', result?.details);
    console.log('Full result structure:', JSON.stringify(result, null, 2));

    if (result.error) {
      console.error('Python script error:', result.error);
      return res.status(500).json({ 
        error: 'Facial analysis failed',
        message: result.error 
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Facial analysis error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    // Log detailed error information for debugging
    if (error.message.includes('timeout')) {
      console.error('❌ Facial analysis timed out - model may not be loading correctly');
    } else if (error.message.includes('Python')) {
      console.error('❌ Python script execution failed - check Python environment and model files');
    } else {
      console.error('❌ Unexpected error during facial analysis');
    }
    
    // Return error instead of silent fallback - let frontend handle it
    return res.status(500).json({ 
      success: false,
      error: 'Facial analysis failed',
      message: error.message,
      details: {
        error_type: error.name,
        error_message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

// Voice Emotion Analysis Route
router.post('/analyze-voice', verifyToken, upload.single('audio'), async (req, res) => {
  let audioFilePath = null;
  let requestKey = null;
  
  try {
    console.log('Voice analysis request received');
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('No audio file provided');
      return res.status(400).json({ 
        error: 'Missing audio file',
        message: 'Audio file is required for voice analysis' 
      });
    }

    console.log('Audio file path:', req.file.path);
    console.log('Audio file size:', req.file.size);
    console.log('Audio file mimetype:', req.file.mimetype);
    console.log('Audio file originalname:', req.file.originalname);
    
    // Detect and rename file with correct extension if needed
    audioFilePath = req.file.path;
    const fileBuffer = fs.readFileSync(audioFilePath);
    
    // Create a request key based on file size and first few bytes to deduplicate identical files
    const fileHash = `${req.file.size}-${fileBuffer.slice(0, 100).toString('hex').substring(0, 20)}`;
    requestKey = `voice-${fileHash}`;
    
    // Check if this exact file is already being processed
    if (inFlightVoiceRequests.has(requestKey)) {
      console.log('Duplicate voice analysis request detected, waiting for existing request...');
      // Wait for the existing request to complete and return its result
      try {
        const existingResult = await inFlightVoiceRequests.get(requestKey);
        // Clean up this duplicate file since we're using the existing request
        fs.unlink(audioFilePath, (err) => {
          if (err) console.error('Error deleting duplicate file:', err);
        });
        return res.json({
          success: true,
          data: existingResult
        });
      } catch (existingError) {
        // If existing request failed, remove it and continue with new request
        inFlightVoiceRequests.delete(requestKey);
        console.log('Existing request failed, processing new request');
      }
    }
    
    // Check file header (magic bytes) to determine format
    let fileExtension = '.wav'; // Default
    if (fileBuffer.length >= 4) {
      // Check for WAV format (RIFF header)
      if (fileBuffer[0] === 0x52 && fileBuffer[1] === 0x49 && fileBuffer[2] === 0x46 && fileBuffer[3] === 0x46) {
        fileExtension = '.wav';
        console.log('Detected WAV format from file header');
      }
      // Check for WebM format (starts with 0x1A 0x45 0xDF 0xA3)
      else if (fileBuffer[0] === 0x1A && fileBuffer[1] === 0x45 && fileBuffer[2] === 0xDF && fileBuffer[3] === 0xA3) {
        fileExtension = '.webm';
        console.log('Detected WebM format from file header');
      }
      // Check for OGG format (starts with "OggS")
      else if (fileBuffer[0] === 0x4F && fileBuffer[1] === 0x67 && fileBuffer[2] === 0x67 && fileBuffer[3] === 0x53) {
        fileExtension = '.ogg';
        console.log('Detected OGG format from file header');
      }
    }
    
    // Rename file with correct extension if it doesn't have one
    if (!audioFilePath.toLowerCase().endsWith('.wav') && 
        !audioFilePath.toLowerCase().endsWith('.webm') && 
        !audioFilePath.toLowerCase().endsWith('.ogg')) {
      const newPath = audioFilePath + fileExtension;
      fs.renameSync(audioFilePath, newPath);
      audioFilePath = newPath;
      console.log(`Renamed audio file to: ${audioFilePath}`);
    }

    // Use the voice-emotion module from backend/modules
    const scriptPath = path.join(__dirname, '..', 'modules', 'voice-emotion', 'voice_emotion_integration.py');
    console.log('Running Python script:', scriptPath);
    console.log('Script arguments:', [audioFilePath]);
    
    // Create a promise for this request and store it to deduplicate concurrent requests
    const analysisPromise = (async () => {
      // Protect long-running analysis with a timeout (90 seconds to allow for model loading and prediction)
      let result;
      try {
        result = await Promise.race([
          runPythonScript(scriptPath, [audioFilePath]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Voice analysis timeout')), 90000))
        ]);
        console.log('Python script result:', result);
        console.log('Result emotion:', result?.emotion);
        console.log('Result confidence:', result?.confidence);
        console.log('Result error:', result?.error);
        return result;
      } catch (timeoutError) {
        console.error('Voice analysis timeout or error:', timeoutError);
        throw timeoutError;
      }
    })();
    
    // Store the promise to deduplicate concurrent requests
    inFlightVoiceRequests.set(requestKey, analysisPromise);
    
    // Wait for the analysis to complete
    let result;
    try {
      result = await analysisPromise;
    } finally {
      // Remove from in-flight requests after completion (success or failure)
      inFlightVoiceRequests.delete(requestKey);
    }

    // Clean up uploaded file
    fs.unlink(audioFilePath, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
      else console.log('Uploaded file cleaned up successfully');
    });

    if (result.error) {
      console.error('Python script error:', result.error);
      console.error('Full result:', JSON.stringify(result, null, 2));
      // Still return the result so frontend can see the error
      return res.json({
        success: true,
        data: result
      });
    }

    console.log('Voice analysis successful, returning result');
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Voice analysis error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    // Log detailed error information for debugging
    if (error.message.includes('timeout')) {
      console.error('❌ Voice analysis timed out - model may not be loading correctly');
    } else if (error.message.includes('Python')) {
      console.error('❌ Python script execution failed - check Python environment and model files');
    } else {
      console.error('❌ Unexpected error during voice analysis');
    }
    
    // Clean up file on error
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error('Error deleting file on error:', err);
      });
    }
    
    // Remove from in-flight requests on error
    if (requestKey) {
      inFlightVoiceRequests.delete(requestKey);
    }
    
    // Return error instead of silent fallback - let frontend handle it
    return res.status(500).json({ 
      success: false,
      error: 'Voice analysis failed',
      message: error.message,
      details: {
        error_type: error.name,
        error_message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

// Text Sentiment Analysis Route
router.post('/analyze-text', verifyToken, async (req, res) => {
  try {
    const { text, userId, language = 'en' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        error: 'Missing text data',
        message: 'Text data is required for sentiment analysis' 
      });
    }

    // Use the text_sentiment_integration.py which supports multi-language
    const scriptPath = path.join(__dirname, '..', 'modules', 'text-sentiment', 'text_sentiment_integration.py');
    const result = await runPythonScript(scriptPath, [text, language]);

    if (result.error) {
      return res.status(500).json({ 
        error: 'Text analysis failed',
        message: result.error 
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ 
      error: 'Text analysis failed',
      message: error.message 
    });
  }
});

// Combined Multimodal Analysis Route
router.post('/analyze-combined', verifyToken, async (req, res) => {
  try {
    const { facialData, voiceData, textData, userId, language = 'en' } = req.body;
    
    if (!facialData || !voiceData || !textData) {
      return res.status(400).json({ 
        error: 'Missing analysis data',
        message: 'Facial, voice, and text data are required for combined analysis' 
      });
    }

    // Use the multimodal module from backend/modules
    const scriptPath = path.join(__dirname, '..', 'modules', 'multimodal', 'multimodal_integration.py');
    
    // Create a combined data object for the multimodal analysis
    const combinedData = {
      facial: facialData,
      voice: voiceData,
      text: textData,
      userId: userId,
      language: language
    };
    
    console.log('Combined data for multimodal analysis:', JSON.stringify(combinedData, null, 2));
    
    const result = await runPythonScriptWithFile(scriptPath, JSON.stringify(combinedData), undefined);

    if (result.error) {
      return res.status(500).json({ 
        error: 'Combined analysis failed',
        message: result.error 
      });
    }

    // Trigger notification hook for emotion detection
    try {
      const emotionNotificationHook = require('../modules/notifications_module/integration/emotionNotificationHook');
      const userId = req.user.userId;
      const emotionData = {
        emotion: result.emotion || result.combined_emotion,
        combined_emotion: result.emotion || result.combined_emotion,
        confidence: result.confidence || result.combined_confidence,
        combined_confidence: result.confidence || result.combined_confidence,
        ...result
      };
      await emotionNotificationHook.processEmotionDetection(userId, emotionData);
    } catch (notifError) {
      console.error('Error processing emotion notification (non-critical):', notifError);
      // Don't fail the request if notification fails
    }

    // Trigger emergency alert detection
    try {
      const DistressDetectionService = require('../modules/emergency_alert_module/services/DistressDetectionService');
      const EmergencyAlertService = require('../modules/emergency_alert_module/services/EmergencyAlertService');
      const EmergencyPreferenceService = require('../modules/emergency_alert_module/services/EmergencyPreferenceService');
      
      const distressDetection = new DistressDetectionService();
      const alertService = new EmergencyAlertService();
      const preferenceService = new EmergencyPreferenceService();
      
      const userId = req.user.userId;
      
      // Check if emergency detection is enabled
      const isEnabled = await preferenceService.isDetectionEnabled(userId);
      
      if (isEnabled) {
        // Analyze distress from emotion data
        const distressResult = await distressDetection.analyzeDistress(userId, result);
        
        if (distressResult.shouldAlert) {
          // Get user preferences for alert methods
          const preferences = await preferenceService.getPreferences(userId);
          const alertMethods = preferences.alert_methods || ['sms', 'email'];
          
          // Send emergency alerts
          await alertService.sendEmergencyAlerts(userId, distressResult, alertMethods);
          
          // Store distress result in response for frontend to show crisis popup
          result.emergencyAlert = {
            triggered: true,
            severity: distressResult.fusionResult?.severity,
            isCrisis: distressResult.fusionResult?.isCrisis,
            recommendation: distressResult.recommendation
          };
        }
      }
    } catch (emergencyError) {
      console.error('Error processing emergency alert detection (non-critical):', emergencyError);
      // Don't fail the request if emergency detection fails
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Combined analysis error:', error);
    // Provide a graceful fallback so the UI continues to work during model training
    const fallbackCombined = {
      emotion: 'neutral',
      confidence: 0.5,
      analysis: {
        description: 'Combined analysis unavailable - using simulated result while models are training.',
        recommendations: 'Practice mindful breathing and short walks. Keep a brief mood journal.',
        therapyType: 'general_support',
        confidence_level: 'moderate',
        modality_agreement: 'mixed',
        emotional_intensity: 'moderate',
        risk_assessment: 'low'
      }
    };
    res.json({
      success: true,
      data: fallbackCombined,
      message: 'Combined analysis completed with fallback result'
    });
  }
});

// Therapy Recommendation Route
router.post('/therapy-recommendation', verifyToken, async (req, res) => {
  try {
    const { emotionalState, userId } = req.body;
    
    if (!emotionalState) {
      return res.status(400).json({ 
        error: 'Missing emotional state data',
        message: 'Emotional state data is required for therapy recommendations' 
      });
    }

    const scriptPath = path.join(__dirname, '..', 'modules', 'therapy', 'therapy_integration.py');
    const result = await runPythonScript(scriptPath, [JSON.stringify(emotionalState)]);

    if (result.error) {
      return res.status(500).json({ 
        error: 'Therapy recommendation failed',
        message: result.error 
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Therapy recommendation error:', error);
    res.status(500).json({ 
      error: 'Therapy recommendation failed',
      message: error.message 
    });
  }
});

// Save Emotion to Database
router.post('/save', verifyToken, async (req, res) => {
  try {
    const pool = require('../config/database');
    const userId = req.user.userId;
    const { 
      emotion_type, 
      emotion_value, 
      confidence, 
      facial_data, 
      voice_data, 
      text_data, 
      combined_score 
    } = req.body;

    if (!emotion_type || !emotion_value) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'emotion_type and emotion_value are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO emotions (
        user_id, emotion_type, emotion_value, confidence, 
        facial_data, voice_data, text_data, combined_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        emotion_type,
        emotion_value,
        confidence ? parseFloat(confidence) : null,
        facial_data ? JSON.stringify(facial_data) : null,
        voice_data ? JSON.stringify(voice_data) : null,
        text_data ? JSON.stringify(text_data) : null,
        combined_score ? parseFloat(combined_score) : null
      ]
    );

    // Trigger notification hook for saved emotion
    try {
      const emotionNotificationHook = require('../modules/notifications_module/integration/emotionNotificationHook');
      const emotionData = {
        emotion: emotion_value,
        confidence: confidence,
        emotion_type: emotion_type
      };
      await emotionNotificationHook.processEmotionDetection(userId, emotionData);
    } catch (notifError) {
      console.error('Error processing emotion notification (non-critical):', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      emotion: result.rows[0],
      message: 'Emotion saved successfully'
    });

  } catch (error) {
    console.error('Error saving emotion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save emotion',
      message: error.message
    });
  }
});

// Get Emotion History
router.get('/history', verifyToken, async (req, res) => {
  try {
    const pool = require('../config/database');
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT * FROM emotions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM emotions WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      emotions: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching emotion history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emotion history',
      message: error.message
    });
  }
});

module.exports = router;
#!/usr/bin/python3
# -*- coding: utf-8 -*-

### General imports ###
from __future__ import division
import numpy as np
import pandas as pd
import time
import re
import os
from collections import Counter
import altair as alt

### Flask imports
import requests
from flask import Flask, render_template, session, request, redirect, flash, Response, jsonify

### Video imports ###
import cv2
from scipy.ndimage import zoom
import imutils

### Audio imports ###
import pyaudio
import wave
import librosa

### Text imports ###
import joblib

### Multimodal imports ###
from library.advanced_psychological_predictor import AdvancedPsychologicalStatePredictor

# Flask config
app = Flask(__name__)
app.secret_key = b'(\xee\x00\xd4\xce"\xcf\xe8@\r\xde\xfc\xbdJ\x08W'
app.config['UPLOAD_FOLDER'] = '/Upload'

# Initialize the advanced psychological predictor
multimodal_predictor = AdvancedPsychologicalStatePredictor()

# Global variables for session management
current_step = 1  # 1: Video+Audio, 2: Text, 3: Analysis
face_emotions = None
voice_emotions = None
text_emotions = None
psychological_state = None

################################################################################
################################## INDEX #######################################
################################################################################

# Home page
@app.route('/', methods=['GET'])
def index():
    global current_step, face_emotions, voice_emotions, text_emotions, psychological_state
    # Reset session
    current_step = 1
    face_emotions = None
    voice_emotions = None
    text_emotions = None
    psychological_state = None
    return render_template('sequential_index.html', 
                          current_step=current_step,
                          face_emotions=face_emotions,
                          voice_emotions=voice_emotions,
                          text_emotions=text_emotions,
                          psychological_state=psychological_state)

################################################################################
############################### STEP 1: VIDEO + AUDIO #########################
################################################################################

def generate_frames():
    """Generate video frames with real-time face emotion detection and audio recording"""
    global current_step, face_emotions, voice_emotions, start_recording
    
    # Start video capture
    video_capture = cv2.VideoCapture(0)
    
    # Face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Audio recording setup
    try:
        p = pyaudio.PyAudio()
        
        # List available audio devices
        print("Available audio devices:")
        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                print(f"  Device {i}: {info['name']}")
        
        # Try to open audio stream
        audio_stream = p.open(format=pyaudio.paInt16,
                             channels=1,
                             rate=16000,
                             input=True,
                             frames_per_buffer=1024,
                             input_device_index=None)  # Use default device
        print("✓ Microphone access granted")
    except Exception as e:
        print(f"❌ Microphone access failed: {e}")
        audio_stream = None
        p = None
    
    # Variables for audio recording
    audio_frames = []
    recording_duration = 10  # seconds
    recording_start_time = None
    recording_progress = 0
    
    # Variables for face emotion detection
    face_detection_count = 0
    face_emotions_list = []
    
    while current_step == 1:
        ret, frame = video_capture.read()
        if not ret:
            break
            
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # Process each detected face
        for (x, y, w, h) in faces:
            # Extract face region
            face = gray[y:y+h, x:x+w]
            face_resized = cv2.resize(face, (48, 48))
            
            # Draw rectangle around face
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Add face emotion prediction
            try:
                face_emotion_probs = multimodal_predictor.predict_face_emotions(face_resized)
                dominant_emotion_idx = np.argmax(face_emotion_probs)
                emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
                dominant_emotion = emotion_labels[dominant_emotion_idx]
                confidence = face_emotion_probs[dominant_emotion_idx]
                
                # Store face emotions for analysis
                face_emotions_list.append(face_emotion_probs)
                face_detection_count += 1
                
                # Display emotion on frame
                cv2.putText(frame, f"Face: {dominant_emotion} ({confidence:.2f})", 
                           (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                cv2.putText(frame, f"Detections: {face_detection_count}", 
                           (x, y+h+20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            except Exception as e:
                cv2.putText(frame, "Face: Processing...", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Audio recording logic
        current_time = time.time()
        
        if start_recording and audio_stream is not None:
            if recording_start_time is None:
                recording_start_time = current_time
                audio_frames = []
                recording_progress = 0
                print("🎤 Started recording audio...")
            
            # Record audio data
            try:
                audio_data = audio_stream.read(1024, exception_on_overflow=False)
                audio_frames.append(audio_data)
                
                # Calculate recording progress
                recording_progress = (current_time - recording_start_time) / recording_duration
                
                # Check if recording duration is complete
                if current_time - recording_start_time >= recording_duration:
                    # Save recorded audio
                    audio_filename = f"tmp/live_audio_{int(current_time)}.wav"
                    wf = wave.open(audio_filename, 'w')
                    wf.setnchannels(1)
                    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
                    wf.setframerate(16000)
                    wf.writeframes(b''.join(audio_frames))
                    wf.close()
                    
                    print(f"🎤 Audio saved: {audio_filename}")
                    
                    # Process voice emotions
                    try:
                        voice_emotion_probs = multimodal_predictor.predict_voice_emotions(audio_filename)
                        voice_emotions = voice_emotion_probs.tolist()
                        print(f"🎤 Voice emotions detected: {voice_emotions}")
                    except Exception as e:
                        print(f"Voice processing error: {e}")
                        voice_emotions = [0.14] * 7
                    
                    # Reset recording
                    start_recording = False
                    recording_start_time = None
                    audio_frames = []
                    recording_progress = 0
                    
            except Exception as e:
                print(f"Audio recording error: {e}")
                start_recording = False
        
        # Display current status
        if audio_stream is None:
            status_text = "❌ Microphone Not Available"
            cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        elif start_recording:
            status_text = f"🎤 Recording... {int(recording_progress * 100)}%"
            cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Draw recording progress bar
            bar_width = 300
            bar_height = 20
            bar_x = 10
            bar_y = 60
            
            # Background bar
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height), (50, 50, 50), -1)
            # Progress bar
            progress_width = int(bar_width * recording_progress)
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + progress_width, bar_y + bar_height), (0, 255, 0), -1)
            # Border
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height), (255, 255, 255), 2)
            
            # Recording indicator (pulsing red circle)
            center_x = frame.shape[1] - 50
            center_y = 50
            pulse_size = int(20 + 10 * np.sin(current_time * 10))
            cv2.circle(frame, (center_x, center_y), pulse_size, (0, 0, 255), -1)
            cv2.circle(frame, (center_x, center_y), pulse_size, (255, 255, 255), 2)
        else:
            status_text = "⏸️ Ready to Record"
            cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Display progress
        cv2.putText(frame, f"Step 1: Video + Audio Analysis", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(frame, f"Face Detections: {face_detection_count}", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    # Clean up
    video_capture.release()
    if audio_stream is not None:
        audio_stream.stop_stream()
        audio_stream.close()
    if p is not None:
        p.terminate()
    
    # Calculate average face emotions
    if face_emotions_list:
        face_emotions = np.mean(face_emotions_list, axis=0).tolist()
        print(f"🎥 Average face emotions: {face_emotions}")

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_recording', methods=['POST'])
def start_recording():
    """Start audio recording"""
    global start_recording
    start_recording = True
    return jsonify({'status': 'recording_started'})

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    """Stop audio recording"""
    global start_recording
    start_recording = False
    return jsonify({'status': 'recording_stopped'})

@app.route('/complete_step1', methods=['POST'])
def complete_step1():
    """Complete step 1 and move to step 2"""
    global current_step, face_emotions, voice_emotions
    current_step = 2
    return jsonify({
        'status': 'step1_completed',
        'current_step': current_step,
        'face_emotions': face_emotions,
        'voice_emotions': voice_emotions
    })

################################################################################
############################### STEP 2: TEXT INPUT ############################
################################################################################

@app.route('/process_text', methods=['POST'])
def process_text():
    """Process text input for emotion analysis"""
    global text_emotions
    text = request.form.get('text', '')
    
    try:
        if text.strip():
            text_emotion_probs = multimodal_predictor.predict_text_emotions(text)
            text_emotions = text_emotion_probs.tolist()
            print(f"📝 Text emotions detected: {text_emotions}")
        else:
            text_emotions = [0.14] * 7
            
        return jsonify({
            'status': 'text_processed',
            'text_emotions': text_emotions
        })
    except Exception as e:
        print(f"Text processing error: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        })

@app.route('/complete_step2', methods=['POST'])
def complete_step2():
    """Complete step 2 and move to step 3"""
    global current_step
    current_step = 3
    return jsonify({
        'status': 'step2_completed',
        'current_step': current_step
    })

################################################################################
############################### STEP 3: PSYCHOLOGICAL ANALYSIS ###############
################################################################################

@app.route('/analyze_psychological_state', methods=['POST'])
def analyze_psychological_state():
    """Analyze final psychological state"""
    global psychological_state, face_emotions, voice_emotions, text_emotions
    
    try:
        if face_emotions and voice_emotions and text_emotions:
            print(f"Face emotions: {face_emotions}")
            print(f"Voice emotions: {voice_emotions}")
            print(f"Text emotions: {text_emotions}")
            
            # Use the advanced method for psychological state prediction
            result = multimodal_predictor.predict_advanced_psychological_state(
                face_emotions, voice_emotions, text_emotions
            )
            
            psychological_state = {
                'state': result['psychological_state'],
                'confidence': result['confidence'],
                'all_probabilities': result['all_probabilities'],
                'deception_type': result['deception_type'],
                'deception_confidence': result['deception_confidence'],
                'deception_probabilities': result['deception_probabilities'],
                'consistency_score': result['consistency_score']
            }
            
            print(f"🧠 Final Psychological State: {result['psychological_state']} (Confidence: {result['confidence']:.3f})")
            print(f"🎭 Deception Type: {result['deception_type']} (Confidence: {result['deception_confidence']:.3f})")
            print(f"📊 Consistency Score: {result['consistency_score']:.3f}")
            
            return jsonify({
                'status': 'analysis_complete',
                'psychological_state': psychological_state,
                'face_emotions': face_emotions,
                'voice_emotions': voice_emotions,
                'text_emotions': text_emotions
            })
        else:
            missing = []
            if not face_emotions: missing.append("face")
            if not voice_emotions: missing.append("voice")
            if not text_emotions: missing.append("text")
            
            return jsonify({
                'status': 'error',
                'message': f'Missing emotion data: {", ".join(missing)}. Please complete all steps.'
            })
            
    except Exception as e:
        print(f"Psychological analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': str(e)
        })

################################################################################
################################# MAIN ########################################
################################################################################

if __name__ == '__main__':
    # Create tmp directory if it doesn't exist
    if not os.path.exists('tmp'):
        os.makedirs('tmp')
    
    # Global variables for audio recording
    start_recording = False
    
    print("🚀 Starting Sequential Multimodal Psychological State Predictor...")
    print("📱 Open your browser and go to: http://127.0.0.1:5000")
    print("📋 Workflow:")
    print("   1️⃣ Step 1: Live video + Audio recording (10 seconds)")
    print("   2️⃣ Step 2: Text input for sentiment analysis")
    print("   3️⃣ Step 3: Final psychological state analysis")
    
    app.run(debug=True, host='127.0.0.1', port=5000)

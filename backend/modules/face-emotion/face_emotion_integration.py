#!/usr/bin/env python3
"""
Face Emotion Analysis Integration Script
Integrates the face emotion detection module with the Node.js backend
"""

import sys
import os
import json
import base64
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import tensorflow as tf
import time

# Add the face-emotion module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'face-emotion', 'src'))

class FaceEmotionAnalyzer:
    _model_instance = None
    _cascade_instance = None
    
    def __init__(self):
        self.model = None
        self.face_cascade = None
        self.emotion_labels = ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised']
        self._ensure_models_loaded()
    
    def _ensure_models_loaded(self):
        """Ensure models are loaded, using singleton pattern to avoid reloading"""
        if FaceEmotionAnalyzer._model_instance is None or FaceEmotionAnalyzer._cascade_instance is None:
            if not self.load_model():
                raise RuntimeError("Failed to load face emotion models")
        else:
            self.model = FaceEmotionAnalyzer._model_instance
            self.face_cascade = FaceEmotionAnalyzer._cascade_instance
    
    def load_model(self):
        """Load the pre-trained emotion detection model"""
        try:
            # Script is in backend/modules/face-emotion/, so src/ is in the same directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(script_dir, 'src', 'model.h5')
            cascade_path = os.path.join(script_dir, 'src', 'haarcascade_frontalface_default.xml')
            
            print(f"Looking for model at: {model_path}")
            print(f"Looking for cascade at: {cascade_path}")
            
            # Load model - model.h5 contains weights only, need to build architecture first
            if os.path.exists(model_path):
                try:
                    # First try loading as full model (in case it was saved as complete model)
                    try:
                        self.model = load_model(model_path, compile=False)
                        print("Face emotion model loaded successfully (full model)")
                        FaceEmotionAnalyzer._model_instance = self.model
                    except Exception:
                        # If that fails, build architecture and load weights
                        print("Model file appears to be weights-only, building architecture...")
                        import tensorflow as tf
                        
                        # Build the model architecture (matching emotions.py)
                        self.model = tf.keras.models.Sequential([
                            tf.keras.layers.Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(48,48,1)),
                            tf.keras.layers.Conv2D(64, kernel_size=(3, 3), activation='relu'),
                            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
                            tf.keras.layers.Dropout(0.25),
                            tf.keras.layers.Conv2D(128, kernel_size=(3, 3), activation='relu'),
                            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
                            tf.keras.layers.Conv2D(128, kernel_size=(3, 3), activation='relu'),
                            tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),
                            tf.keras.layers.Dropout(0.25),
                            tf.keras.layers.Flatten(),
                            tf.keras.layers.Dense(1024, activation='relu'),
                            tf.keras.layers.Dropout(0.5),
                            tf.keras.layers.Dense(7, activation='softmax')
                        ])
                        
                        # Load weights
                        self.model.load_weights(model_path)
                        print("Face emotion model loaded successfully (architecture + weights)")
                        FaceEmotionAnalyzer._model_instance = self.model
                except Exception as load_error:
                    print(f"ERROR loading model: {load_error}")
                    import traceback
                    traceback.print_exc()
                    return False
            else:
                print(f"ERROR: Model file not found at: {model_path}")
                # Try alternative path
                alt_path = os.path.join(script_dir, 'model.h5')
                if os.path.exists(alt_path):
                    try:
                        self.model = load_model(alt_path, compile=False)
                        print(f"Found model at alternative path: {alt_path}")
                        FaceEmotionAnalyzer._model_instance = self.model
                    except Exception as alt_error:
                        print(f"ERROR loading from alternative path: {alt_error}")
                        return False
                else:
                    print(f"ERROR: Model not found at alternative path either: {alt_path}")
                    return False
            
            # Load cascade
            if os.path.exists(cascade_path):
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                if self.face_cascade.empty():
                    print(f"WARNING: Cascade file exists but failed to load: {cascade_path}")
                    raise ValueError("Cascade file is empty or invalid")
                print("Face cascade classifier loaded successfully")
                FaceEmotionAnalyzer._cascade_instance = self.face_cascade
            else:
                print(f"ERROR: Cascade file not found at: {cascade_path}")
                # Try using OpenCV's built-in cascade
                try:
                    builtin_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                    self.face_cascade = cv2.CascadeClassifier(builtin_path)
                    if self.face_cascade.empty():
                        raise ValueError("Built-in cascade is empty")
                    print("Using OpenCV built-in cascade classifier")
                    FaceEmotionAnalyzer._cascade_instance = self.face_cascade
                except Exception as cascade_error:
                    print(f"ERROR: Could not load cascade classifier: {cascade_error}")
                    return False
            
            # Verify model is actually loaded
            if self.model is None:
                print("ERROR: Model is None after loading attempt")
                return False
            
            # Test model with a dummy input to verify it works
            try:
                test_input = np.zeros((1, 48, 48, 1))
                _ = self.model.predict(test_input, verbose=0)
                print("Model verification test passed")
            except Exception as test_error:
                print(f"WARNING: Model loaded but verification test failed: {test_error}")
                # Don't fail completely, but log the warning
            
            return True
        except Exception as e:
            print(f"Error loading face emotion model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def preprocess_image(self, image_data):
        """Preprocess image for emotion detection"""
        try:
            # Decode base64 image
            if isinstance(image_data, str):
                # Remove data URL prefix if present
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Could not decode image")
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces with default parameters
            faces = self.face_cascade.detectMultiScale(gray)
            
            if len(faces) == 0:
                raise ValueError("No face detected in image")
            
            # Use the first detected face
            (x, y, w, h) = faces[0]
            face = gray[y:y+h, x:x+w]
            
            # Resize to 48x48 for the model
            face_resized = cv2.resize(face, (48, 48), interpolation=cv2.INTER_AREA)
            
            # Apply basic contrast stretching (standard preprocessing, not fine-tuning)
            min_val, max_val = np.min(face_resized), np.max(face_resized)
            if max_val > min_val:
                face_resized = ((face_resized - min_val) * 255.0 / (max_val - min_val)).astype(np.uint8)
            
            # Normalize pixel values
            face_normalized = face_resized.astype('float32') / 255.0
            
            # Reshape for model input
            face_reshaped = face_normalized.reshape(1, 48, 48, 1)
            
            return face_reshaped
            
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def analyze_emotion(self, image_data):
        """Analyze emotion from image data"""
        try:
            if self.model is None or self.face_cascade is None:
                error_msg = "Model not loaded" if self.model is None else "Cascade not loaded"
                print(f"ERROR: {error_msg}")
                return {
                    "error": error_msg,
                    "emotion": "neutral",
                    "confidence": 0.0
                }
            
            # Preprocess image
            processed_image = self.preprocess_image(image_data)
            if processed_image is None:
                print("ERROR: Could not process image")
                return {
                    "error": "Could not process image - no face detected or image decode failed",
                    "emotion": "neutral", 
                    "confidence": 0.0
                }
            
            # Predict emotion with verbose output
            print("Running model prediction...")
            predictions = self.model.predict(processed_image, verbose=0)
            emotion_scores = predictions[0]
            
            # #region agent log
            try:
                workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
                log_dir = os.path.join(workspace_root, '.cursor')
                if not os.path.exists(log_dir):
                    os.makedirs(log_dir, exist_ok=True)
                log_path = os.path.join(log_dir, 'debug.log')
                with open(log_path, 'a', encoding='utf-8') as f:
                    f.write(json.dumps({"id":f"log_{int(time.time()*1000)}_face_raw","timestamp":int(time.time()*1000),"location":"face_emotion_integration.py:231","message":"Raw model predictions before processing","data":{"raw_scores":emotion_scores.tolist(),"scores_sum":float(np.sum(emotion_scores)),"emotion_labels":self.emotion_labels},"sessionId":"debug-session","runId":"run1","hypothesisId":"A"}) + "\n")
            except Exception as e:
                print(f"DEBUG LOG ERROR: {e}", file=sys.stderr)
            # #endregion
            
            print(f"Raw emotion scores: {emotion_scores}")
            
            # Get the emotion with highest confidence (raw model output)
            emotion_index = np.argmax(emotion_scores)
            confidence = float(emotion_scores[emotion_index])
            emotion = self.emotion_labels[emotion_index]
            
            print(f"Predicted emotion: {emotion} with confidence: {confidence:.4f}")
            
            # Create detailed results
            details = {}
            for i, label in enumerate(self.emotion_labels):
                details[label] = float(emotion_scores[i])
            
            # #region agent log
            try:
                workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
                log_dir = os.path.join(workspace_root, '.cursor')
                if not os.path.exists(log_dir):
                    os.makedirs(log_dir, exist_ok=True)
                log_path = os.path.join(log_dir, 'debug.log')
                with open(log_path, 'a', encoding='utf-8') as f:
                    f.write(json.dumps({"id":f"log_{int(time.time()*1000)}_face_final","timestamp":int(time.time()*1000),"location":"face_emotion_integration.py:323","message":"Final emotion selection","data":{"final_emotion":emotion,"final_confidence":confidence,"all_scores":details},"sessionId":"debug-session","runId":"run1","hypothesisId":"A"}) + "\n")
            except Exception as e:
                print(f"DEBUG LOG ERROR: {e}", file=sys.stderr)
            # #endregion
            
            return {
                "emotion": emotion,
                "confidence": confidence,
                "details": details,
                "face_detected": True,
                "error": None
            }
            
        except Exception as e:
            print(f"ERROR analyzing emotion: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "emotion": "neutral",
                "confidence": 0.0
            }

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python face_emotion_integration.py <base64_image_data_or_file_path>"}))
        sys.exit(1)
    
    input_data = sys.argv[1]
    
    # Check if input is a file path (contains path separators or ends with .txt/.json)
    # Otherwise treat as base64 image data
    if os.path.exists(input_data) and (input_data.endswith('.txt') or input_data.endswith('.json')):
        # Read from file
        try:
            with open(input_data, 'r', encoding='utf-8') as f:
                image_data = f.read().strip()
        except Exception as e:
            print(json.dumps({"error": f"Failed to read file: {str(e)}", "emotion": "neutral", "confidence": 0.0}))
            sys.exit(1)
    else:
        # Treat as base64 image data directly
        image_data = input_data
    
    try:
        analyzer = FaceEmotionAnalyzer()
        # Verify model is loaded
        if analyzer.model is None or analyzer.face_cascade is None:
            error_msg = "Model not loaded" if analyzer.model is None else "Cascade not loaded"
            print(json.dumps({"error": error_msg, "emotion": "neutral", "confidence": 0.0}))
            sys.exit(1)
        
        result = analyzer.analyze_emotion(image_data)
        print(json.dumps(result))
    except RuntimeError as e:
        print(json.dumps({"error": str(e), "emotion": "neutral", "confidence": 0.0}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}", "emotion": "neutral", "confidence": 0.0}))
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

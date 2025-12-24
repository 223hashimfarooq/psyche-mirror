import sys
import os
import numpy as np
import cv2
import tensorflow as tf
import time

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
tf.get_logger().setLevel('ERROR')

# Check command line arguments
if len(sys.argv) > 1:
    mode = sys.argv[1]
    
    # Define the model architecture
    def create_model():
        model = tf.keras.models.Sequential()
        model.add(tf.keras.layers.Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(48,48,1)))
        model.add(tf.keras.layers.Conv2D(64, kernel_size=(3, 3), activation='relu'))
        model.add(tf.keras.layers.MaxPooling2D(pool_size=(2, 2)))
        model.add(tf.keras.layers.Dropout(0.25))
        
        model.add(tf.keras.layers.Conv2D(128, kernel_size=(3, 3), activation='relu'))
        model.add(tf.keras.layers.MaxPooling2D(pool_size=(2, 2)))
        model.add(tf.keras.layers.Conv2D(128, kernel_size=(3, 3), activation='relu'))
        model.add(tf.keras.layers.MaxPooling2D(pool_size=(2, 2)))
        model.add(tf.keras.layers.Dropout(0.25))
        
        model.add(tf.keras.layers.Flatten())
        model.add(tf.keras.layers.Dense(1024, activation='relu'))
        model.add(tf.keras.layers.Dropout(0.5))
        model.add(tf.keras.layers.Dense(7, activation='softmax'))
        
        return model
    
    # Load the model
    print("Loading model...")
    model = create_model()
    try:
        model.load_weights('model.h5')
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)
    
    # Define the emotion detector class
    class EmotionDetector:
        def __init__(self):
            # Emotion window for temporal smoothing
            self.emotion_window = []
            self.max_window_size = 5
            
            # Dictionary mapping emotion indices to labels
            self.emotion_dict = {0: "Angry", 1: "Disgusted", 2: "Fearful", 3: "Happy", 4: "Neutral", 5: "Sad", 6: "Surprised"}
            
            # Calibration factors to balance emotion bias - adjusted to fix detection issues
            self.calibration_factors = {
                0: 0.3,   # Angry (reduced even more to prevent getting stuck on angry)
                1: 8.0,   # Disgusted (increased significantly more to improve detection)
                2: 4.0,   # Fearful (increased significantly to improve detection)
                3: 2.0,   # Happy (increased more to balance with angry/sad)
                4: 1.5,   # Neutral (increased more)
                5: 0.2,   # Sad (reduced even more to prevent getting stuck on sad)
                6: 4.0    # Surprised (increased significantly to improve detection)
            }
            
            # Track multiple preprocessing methods performance
            self.method_performance = {
                'standard': 0,
                'enhanced': 0,
                'adaptive': 0,
                'edge': 0
            }
            
            # Track detected emotions for auto-calibration
            self.emotion_counts = {i: 0 for i in range(7)}
            
        def preprocess_standard(self, face_img):
            # Standard preprocessing: resize and normalize with contrast enhancement
            resized = cv2.resize(face_img, (48, 48))
            # Apply contrast stretching for better feature visibility
            min_val, max_val = np.min(resized), np.max(resized)
            if max_val > min_val:
                stretched = (resized - min_val) * 255.0 / (max_val - min_val)
            else:
                stretched = resized
            normalized = stretched / 255.0
            return np.expand_dims(np.expand_dims(normalized, -1), 0)
        
        def preprocess_enhanced(self, face_img):
            # Enhanced preprocessing with histogram equalization and sharpening
            img = cv2.resize(face_img, (48, 48))
            img = cv2.equalizeHist(img)
            
            # Apply sharpening kernel
            kernel = np.array([[-1,-1,-1], 
                              [-1, 9,-1],
                              [-1,-1,-1]])
            img = cv2.filter2D(img, -1, kernel)
            
            # Apply contrast stretching for better feature visibility
            min_val, max_val = np.min(img), np.max(img)
            if max_val > min_val:
                img = (img - min_val) * 255.0 / (max_val - min_val)
            
            img = img.astype('float32') / 255.0
            return np.expand_dims(np.expand_dims(img, -1), 0)
        
        def preprocess_adaptive(self, face_img):
            # Adaptive preprocessing with local contrast enhancement
            img = cv2.resize(face_img, (48, 48))
            
            # Create CLAHE object with limited contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
            img = clahe.apply(img)
            
            img = img.astype('float32') / 255.0
            return np.expand_dims(np.expand_dims(img, -1), 0)
            
        def preprocess_edge_enhanced(self, face_img):
            # Edge-enhanced preprocessing
            img = cv2.resize(face_img, (48, 48))
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(img, (3, 3), 0)
            
            # Apply Sobel edge detection
            sobelx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
            edges = cv2.magnitude(sobelx, sobely)
            
            # Normalize edges and combine with original
            edges = cv2.normalize(edges, None, 0, 1, cv2.NORM_MINMAX)
            enhanced = img.astype('float32') / 255.0 + 0.3 * edges
            enhanced = np.clip(enhanced, 0, 1)
            
            return np.expand_dims(np.expand_dims(enhanced.astype('float32'), -1), 0)
            
        def get_ensemble_prediction(self, face_img):
            # Get predictions with different preprocessing techniques
            # Using all four preprocessing methods for better accuracy
            pred1 = model.predict(self.preprocess_standard(face_img), verbose=0)
            pred2 = model.predict(self.preprocess_enhanced(face_img), verbose=0)
            pred3 = model.predict(self.preprocess_adaptive(face_img), verbose=0)
            pred4 = model.predict(self.preprocess_edge_enhanced(face_img), verbose=0)
            
            # Give more weight to enhanced preprocessing for better disgusted detection
            weights = [0.2, 0.4, 0.2, 0.2]  # Higher weight for enhanced preprocessing
            
            ensemble_pred = (weights[0] * pred1 + 
                            weights[1] * pred2 + 
                            weights[2] * pred3 + 
                            weights[3] * pred4)
            
            # Apply calibration factors to adjust for model bias
            for i in range(len(ensemble_pred[0])):
                ensemble_pred[0][i] *= self.calibration_factors[i]
            
            # Normalize to ensure sum is 1
            ensemble_pred = ensemble_pred / np.sum(ensemble_pred)
            
            return ensemble_pred[0]
        
        def get_smoothed_prediction(self, current_prediction):
            # Add current prediction to window
            self.emotion_window.append(current_prediction)
            
            # Keep window size limited
            if len(self.emotion_window) > self.max_window_size:
                self.emotion_window.pop(0)
            
            # Weighted average with more weight on recent predictions
            weights = np.linspace(0.5, 1.0, len(self.emotion_window))
            weights = weights / np.sum(weights)  # Normalize weights
            
            weighted_preds = np.zeros_like(current_prediction)
            for i, pred in enumerate(self.emotion_window):
                weighted_preds += weights[i] * pred
                
            # Update emotion counts for auto-calibration
            max_emotion = np.argmax(weighted_preds)
            self.emotion_counts[max_emotion] += 1
            
            # Auto-calibrate if one emotion is dominating
            total_frames = sum(self.emotion_counts.values())
            if total_frames > 100:  # After 100 frames
                for emotion, count in self.emotion_counts.items():
                    if count / total_frames > 0.7:  # If one emotion appears >70% of the time
                        # Reduce its calibration factor
                        self.calibration_factors[emotion] *= 0.9
                        print(f"Auto-calibrating: reducing {self.emotion_dict[emotion]} factor")
                    elif count / total_frames < 0.05:  # If emotion appears <5% of the time
                        # Increase its calibration factor
                        self.calibration_factors[emotion] *= 1.1
                        print(f"Auto-calibrating: increasing {self.emotion_dict[emotion]} factor")
                # Reset counts
                self.emotion_counts = {i: 0 for i in range(7)}
            
            return weighted_preds
    
    if mode == 'display':
        # Create detector instance
        detector = EmotionDetector()
        
        # Start the webcam feed with optimized settings
        print("Starting webcam...")
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # Use DirectShow API for better performance
        
        # Set camera properties for better performance
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        if not cap.isOpened():
            print("Error: Could not open webcam.")
            sys.exit()
        
        print("Webcam started successfully!")
        
        # Load face cascade
        facecasc = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
        
        try:
            print("Press 'q' to exit the application")
            while True:
                # Capture frame-by-frame
                ret, frame = cap.read()
                
                if not ret or frame is None:
                    print("Error: Failed to capture frame.")
                    continue
                
                # Convert to grayscale
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Try multiple face detection approaches
                faces = []
                
                # Approach 1: Standard detection
                faces = facecasc.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                
                # Approach 2: Try with equalized histogram if no faces detected
                if len(faces) == 0:
                    equalized = cv2.equalizeHist(gray)
                    faces = facecasc.detectMultiScale(equalized, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                
                # Approach 3: Try with different parameters if still no faces
                if len(faces) == 0:
                    faces = facecasc.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=3, minSize=(30, 30))
                    
                # Approach 4: Try with blurred image to reduce noise
                if len(faces) == 0:
                    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                    faces = facecasc.detectMultiScale(blurred, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
                
                # Display message if no faces are detected
                if len(faces) == 0:
                    cv2.putText(frame, "No face detected", (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                
                for (x, y, w, h) in faces:
                    try:
                        # Draw rectangle around face
                        cv2.rectangle(frame, (x, y-30), (x+w, y+h+10), (255, 0, 0), 2)
                        
                        # Extract face region
                        roi_gray = gray[y:y + h, x:x + w]
                        
                        # Check if face is too small for reliable detection
                        if w < 60 or h < 60:
                            cv2.putText(frame, "Move closer", (x, y-40), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
                            continue
                        
                        # Get ensemble prediction using the detector
                        ensemble_prediction = detector.get_ensemble_prediction(roi_gray)
                        
                        # Apply temporal smoothing
                        smoothed_prediction = detector.get_smoothed_prediction(ensemble_prediction)
                        
                        # Update method performance based on confidence
                        maxindex = int(np.argmax(smoothed_prediction))
                        confidence = float(smoothed_prediction[maxindex])
                        
                        # Get the predicted emotion
                        maxindex = int(np.argmax(smoothed_prediction))
                        confidence = float(smoothed_prediction[maxindex]) * 100
                        
                        # Display emotion text with confidence
                        emotion_text = f"{detector.emotion_dict[maxindex]} ({confidence:.1f}%)"
                        
                        # Color-code confidence level
                        if confidence > 70:
                            text_color = (0, 255, 0)  # Green for high confidence
                        else:
                            text_color = (0, 0, 255)  # Red for low confidence
                            
                        cv2.putText(frame, emotion_text, (x+5, y-40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, text_color, 2, cv2.LINE_AA)
                        
                        # Display top 3 emotions only
                        y_offset = 30
                        top_indices = np.argsort(smoothed_prediction)[-3:]
                        for i in reversed(top_indices):
                            emotion = detector.emotion_dict[i]
                            prob = smoothed_prediction[i]*100
                            prob_text = f"{emotion}: {prob:.1f}%"
                            
                            # Choose color based on emotion
                            if i == maxindex:
                                text_color = (0, 255, 0)  # Green for detected emotion
                            else:
                                text_color = (255, 255, 255)  # White for others
                                
                            # Draw text
                            cv2.putText(frame, prob_text, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1, cv2.LINE_AA)
                            y_offset += 20
                            
                    except Exception as e:
                        print(f"Error processing face: {e}")
                
                # Display the resulting frame at a lower resolution to reduce processing load
                try:
                    display_frame = cv2.resize(frame, (800, 600), interpolation=cv2.INTER_LINEAR)
                    # Add message about how to exit
                    cv2.putText(display_frame, "Press 'q' to exit", (10, display_frame.shape[0] - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
                    cv2.imshow('Emotion Detection', display_frame)
                except Exception as e:
                    print(f"Error displaying frame: {e}")
                    break
                    
                # Press 'q' to exit
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("Exiting application...")
                    break
            
            # Release resources
            print("Releasing resources...")
            cap.release()
            cv2.destroyAllWindows()
            print("Application closed successfully!")
            
        except Exception as e:
            print(f"An error occurred: {e}")
            if 'cap' in locals() and cap is not None:
                cap.release()
            cv2.destroyAllWindows()
    
    elif mode == 'train':
        print("Training mode not implemented in this version.")
    
    else:
        print(f"Unknown mode: {mode}")
        print("Please use 'train' or 'display' mode.")
else:
    print("Please specify mode: train or display")
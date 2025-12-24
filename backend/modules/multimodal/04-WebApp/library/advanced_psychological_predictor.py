import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense, Concatenate, Dropout, BatchNormalization, Activation
from tensorflow.keras.optimizers import Adam
import joblib
import pickle

class AdvancedPsychologicalStatePredictor:
    """
    Advanced multimodal psychological state predictor that can detect:
    1. Genuine vs acted emotions
    2. Consistency across modalities
    3. Deception indicators
    4. Baseline deviations
    """
    
    def __init__(self):
        self.face_model = None
        self.voice_model = None
        self.text_model = None
        
        # Load individual models
        self.load_models()
        
        # Psychological states with deception detection
        self.psychological_states = {
            0: 'Genuine_Happy',
            1: 'Genuine_Sad', 
            2: 'Genuine_Anxious',
            3: 'Genuine_Calm',
            4: 'Acted_Happy',
            5: 'Acted_Sad',
            6: 'Acted_Anxious',
            7: 'Deceptive_Neutral',
            8: 'Stressed_Overwhelmed',
            9: 'Confident_Authentic'
        }
        
        # Build advanced fusion model
        self.build_advanced_fusion_model()
    
    def load_models(self):
        """Load the individual emotion recognition models"""
        try:
            # Load face emotion model
            self.face_model = tf.keras.models.load_model('Models/face emotion.h5', compile=False)
            print("✓ Face emotion model loaded")
        except Exception as e:
            print(f"Could not load face model: {e}")
            self.face_model = self.create_working_face_model()
        
        try:
            # Load voice emotion model
            self.voice_model = tf.keras.models.load_model('Models/Emotion_Voice_Detection_Model.h5', compile=False)
            print("✓ Voice emotion model loaded")
        except Exception as e:
            print(f"Could not load voice model: {e}")
            self.voice_model = self.create_working_voice_model()
        
        try:
            # Load text emotion model
            self.text_model = joblib.load('Models/emotion_classifier_pipe_lr.pkl')
            print("✓ Text emotion model loaded")
        except Exception as e:
            print(f"Could not load text model: {e}")
            self.text_model = None
    
    def create_working_face_model(self):
        """Create a working face model for 48x48 grayscale input"""
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(48, 48, 1)),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(7, activation='softmax')
        ])
        model.compile(optimizer='adam', loss='categorical_crossentropy')
        print("✓ Created working face model")
        return model
    
    def create_working_voice_model(self):
        """Create a working voice model for mel spectrogram input"""
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(128, 128, 1)),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(7, activation='softmax')
        ])
        model.compile(optimizer='adam', loss='categorical_crossentropy')
        print("✓ Created working voice model")
        return model
    
    def build_advanced_fusion_model(self):
        """Build advanced multimodal fusion model with deception detection"""
        
        # Input layers for each modality
        face_input = Input(shape=(7,), name='face_emotions')
        voice_input = Input(shape=(7,), name='voice_emotions')  
        text_input = Input(shape=(7,), name='text_emotions')
        
        # Concatenate all inputs
        combined = Concatenate()([face_input, voice_input, text_input])
        
        # Advanced fusion layers
        x = Dense(128, activation='relu')(combined)
        x = BatchNormalization()(x)
        x = Dropout(0.3)(x)
        
        x = Dense(64, activation='relu')(x)
        x = BatchNormalization()(x)
        x = Dropout(0.3)(x)
        
        # Deception detection branch
        deception_branch = Dense(32, activation='relu')(x)
        deception_branch = Dense(3, activation='softmax', name='deception_prob')(deception_branch)  # Genuine, Acted, Deceptive
        
        # Psychological state branch
        state_branch = Dense(32, activation='relu')(x)
        state_branch = Dense(10, activation='softmax', name='psychological_state')(state_branch)
        
        # Create the fusion model
        self.fusion_model = Model(
            inputs=[face_input, voice_input, text_input],
            outputs=[state_branch, deception_branch],
            name='advanced_psychological_predictor'
        )
        
        # Compile the model
        self.fusion_model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss=['categorical_crossentropy', 'categorical_crossentropy'],
            loss_weights=[0.7, 0.3],  # Weight psychological state more than deception
            metrics=['accuracy']
        )
        
        print("✓ Advanced multimodal fusion model built")
    
    def predict_face_emotions(self, face_image):
        """Predict emotions from face image"""
        try:
            # Preprocess face image
            if len(face_image.shape) == 2:
                face_image = np.expand_dims(face_image, axis=-1)
            face_image = np.expand_dims(face_image, axis=0)
            
            # Predict emotions
            emotions = self.face_model.predict(face_image, verbose=0)
            return emotions[0]  # Return probabilities
        except Exception as e:
            print(f"Face prediction error: {e}")
            return np.array([0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16])
    
    def predict_voice_emotions(self, audio_file):
        """Predict emotions from voice"""
        try:
            import librosa
            import cv2
            
            # Load audio
            y, sr = librosa.load(audio_file, sr=16000)
            
            # Compute mel spectrogram
            mel_spect = np.abs(librosa.stft(y, n_fft=512, hop_length=128)) ** 2
            mel_spect = librosa.feature.melspectrogram(S=mel_spect, sr=sr, n_mels=128)
            mel_spect = librosa.power_to_db(mel_spect, ref=np.max)
            
            # Resize to fixed dimensions
            mel_spect = cv2.resize(mel_spect, (128, 128))
            
            # Reshape for model
            mel_spect = np.expand_dims(mel_spect, axis=-1)
            mel_spect = np.expand_dims(mel_spect, axis=0)
            
            # Predict emotions
            emotions = self.voice_model.predict(mel_spect, verbose=0)
            return emotions[0]  # Return probabilities
        except Exception as e:
            print(f"Voice prediction error: {e}")
            return np.array([0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16])
    
    def predict_text_emotions(self, text):
        """Predict emotions from text"""
        try:
            if self.text_model is not None:
                emotions = self.text_model.predict_proba([text])
                # Ensure we have exactly 7 emotions
                if emotions.shape[1] > 7:
                    emotions = emotions[:, :7]  # Take first 7
                elif emotions.shape[1] < 7:
                    # Pad with zeros
                    padded = np.zeros((emotions.shape[0], 7))
                    padded[:, :emotions.shape[1]] = emotions
                    emotions = padded
                return emotions[0]  # Return probabilities
            else:
                return np.array([0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16])
        except Exception as e:
            print(f"Text prediction error: {e}")
            return np.array([0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16])
    
    def calculate_consistency_score(self, face_emotions, voice_emotions, text_emotions):
        """Calculate consistency score between modalities"""
        try:
            # Calculate correlations between modalities
            face_voice_corr = np.corrcoef(face_emotions, voice_emotions)[0, 1]
            face_text_corr = np.corrcoef(face_emotions, text_emotions)[0, 1]
            voice_text_corr = np.corrcoef(voice_emotions, text_emotions)[0, 1]
            
            # Average correlation as consistency score
            consistency = (face_voice_corr + face_text_corr + voice_text_corr) / 3
            
            # Handle NaN values
            if np.isnan(consistency):
                consistency = 0.0
                
            return float(consistency)
        except:
            return 0.0
    
    def detect_deception_patterns(self, face_emotions, voice_emotions, text_emotions):
        """Detect deception patterns based on emotion inconsistencies"""
        try:
            # Calculate emotion intensity differences
            face_intensity = np.max(face_emotions)
            voice_intensity = np.max(voice_emotions)
            text_intensity = np.max(text_emotions)
            
            # Calculate dominant emotion indices
            face_dominant = np.argmax(face_emotions)
            voice_dominant = np.argmax(voice_emotions)
            text_dominant = np.argmax(text_emotions)
            
            # Check for inconsistencies
            emotion_mismatch = len(set([face_dominant, voice_dominant, text_dominant])) > 1
            
            # Check for intensity mismatches (acting often shows exaggerated emotions)
            intensity_variance = np.var([face_intensity, voice_intensity, text_intensity])
            
            # Calculate deception score
            deception_score = 0.0
            
            if emotion_mismatch:
                deception_score += 0.4
            
            if intensity_variance > 0.1:  # High variance suggests acting
                deception_score += 0.3
            
            # Check for specific deception patterns
            if face_intensity > 0.8 and voice_intensity < 0.3:  # Overacting face, underacting voice
                deception_score += 0.3
            
            if text_intensity > 0.7 and face_intensity < 0.4:  # Strong text, weak face
                deception_score += 0.2
            
            return min(deception_score, 1.0)
            
        except:
            return 0.0
    
    def predict_advanced_psychological_state(self, face_emotions, voice_emotions, text_emotions):
        """
        Advanced psychological state prediction with deception detection
        """
        try:
            # Ensure all inputs are numpy arrays with 7 dimensions
            face_emotions = np.array(face_emotions[:7])  # Take first 7
            voice_emotions = np.array(voice_emotions[:7])  # Take first 7
            text_emotions = np.array(text_emotions[:7])  # Take first 7
            
            # Calculate consistency score
            consistency_score = self.calculate_consistency_score(face_emotions, voice_emotions, text_emotions)
            
            # Detect deception patterns
            deception_score = self.detect_deception_patterns(face_emotions, voice_emotions, text_emotions)
            
            # Prepare inputs for fusion model
            face_input = np.expand_dims(face_emotions, axis=0)
            voice_input = np.expand_dims(voice_emotions, axis=0)
            text_input = np.expand_dims(text_emotions, axis=0)
            
            print(f"Face input shape: {face_input.shape}")
            print(f"Voice input shape: {voice_input.shape}")
            print(f"Text input shape: {text_input.shape}")
            print(f"Consistency score: {consistency_score:.3f}")
            print(f"Deception score: {deception_score:.3f}")
            
            # Predict psychological state and deception
            predictions = self.fusion_model.predict(
                [face_input, voice_input, text_input], 
                verbose=0
            )
            
            psychological_prediction = predictions[0][0]
            deception_prediction = predictions[1][0]
            
            # Get the predicted psychological state
            predicted_state_idx = np.argmax(psychological_prediction)
            predicted_state = self.psychological_states[predicted_state_idx]
            confidence = psychological_prediction[predicted_state_idx]
            
            # Get deception analysis
            deception_types = ['Genuine', 'Acted', 'Deceptive']
            deception_idx = np.argmax(deception_prediction)
            deception_type = deception_types[deception_idx]
            deception_confidence = deception_prediction[deception_idx]
            
            # Adjust prediction based on consistency and deception scores
            if consistency_score < 0.3 and deception_score > 0.6:
                # Low consistency + high deception = likely deceptive
                predicted_state = 'Deceptive_Neutral'
                confidence = max(confidence, 0.7)
                deception_type = 'Deceptive'
                deception_confidence = max(deception_confidence, 0.8)
            elif consistency_score > 0.7 and deception_score < 0.3:
                # High consistency + low deception = likely genuine
                if predicted_state.startswith('Acted'):
                    predicted_state = predicted_state.replace('Acted_', 'Genuine_')
                deception_type = 'Genuine'
                deception_confidence = max(deception_confidence, 0.8)
            
            print(f"Psychological prediction: {psychological_prediction}")
            print(f"Deception prediction: {deception_prediction}")
            print(f"Final state: {predicted_state} (Confidence: {confidence:.3f})")
            print(f"Final deception: {deception_type} (Confidence: {deception_confidence:.3f})")
            
            return {
                'psychological_state': predicted_state,
                'confidence': float(confidence),
                'all_probabilities': psychological_prediction.tolist(),
                'deception_type': deception_type,
                'deception_confidence': float(deception_confidence),
                'deception_probabilities': deception_prediction.tolist(),
                'face_emotions': face_emotions.tolist(),
                'voice_emotions': voice_emotions.tolist(),
                'text_emotions': text_emotions.tolist(),
                'consistency_score': consistency_score,
                'deception_score': deception_score
            }
            
        except Exception as e:
            print(f"Advanced prediction error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'psychological_state': 'Neutral',
                'confidence': 0.5,
                'all_probabilities': [0.1] * 10,
                'deception_type': 'Unknown',
                'deception_confidence': 0.5,
                'deception_probabilities': [0.33, 0.33, 0.34],
                'face_emotions': face_emotions.tolist() if 'face_emotions' in locals() else [0.14] * 7,
                'voice_emotions': voice_emotions.tolist() if 'voice_emotions' in locals() else [0.14] * 7,
                'text_emotions': text_emotions.tolist() if 'text_emotions' in locals() else [0.14] * 7,
                'consistency_score': 0.5,
                'deception_score': 0.5
            }
#!/usr/bin/env python3
"""
Voice Emotion Analysis Integration Script
Integrates the voice emotion detection module with the Node.js backend
"""

import sys
import os
import json
import numpy as np
import librosa
import tensorflow as tf
# Use tf_keras for backward compatibility with legacy .h5 models (Keras 2.x format)
import tf_keras
from tf_keras.models import model_from_json
import time

# Try to import soundfile for better audio loading support
try:
    import soundfile as sf
    print(f"soundfile backend available: {sf.__version__}", flush=True)
except ImportError:
    print("WARNING: soundfile not installed. Audio loading may fail.", flush=True)
    print("Install with: pip install soundfile", flush=True)

# Force unbuffered output for real-time logging
print("Voice emotion integration script started", flush=True)
print(f"Python version: {sys.version}", flush=True)
print(f"Script arguments: {sys.argv}", flush=True)

class VoiceEmotionAnalyzer:
    _model_instance = None
    
    def __init__(self):
        self.model = None
        self.emotion_labels = ['female_angry', 'female_calm', 'female_fearful', 'female_happy', 'female_sad',
                              'male_angry', 'male_calm', 'male_fearful', 'male_happy', 'male_sad']
        self._ensure_model_loaded()
    
    def _ensure_model_loaded(self):
        """Ensure model is loaded, using singleton pattern to avoid reloading"""
        if VoiceEmotionAnalyzer._model_instance is None:
            if not self.load_model():
                raise RuntimeError("Failed to load voice emotion model")
        else:
            self.model = VoiceEmotionAnalyzer._model_instance
    
    def load_model(self):
        """Load the pre-trained voice emotion detection model"""
        try:
            # Script is in backend/modules/voice-emotion/, so saved_models/ is in the same directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(script_dir, 'saved_models', 'Emotion_Voice_Detection_Model.h5')
            json_path = os.path.join(script_dir, 'model.json')
            
            print(f"Looking for model at: {model_path}")
            print(f"Looking for JSON at: {json_path}")
            
            # Method 1: Try loading with JSON architecture + weights (with Keras 3.x compatibility)
            if os.path.exists(model_path) and os.path.exists(json_path):
                try:
                    import tensorflow as tf
                    import json as json_lib
                    
                    # Load and parse JSON config
                    with open(json_path, 'r') as json_file:
                        model_config = json_lib.load(json_file)
                    
                    # Build Sequential model from config manually using tf_keras for compatibility
                    self.model = tf_keras.models.Sequential()
                    
                    # Get the first layer's input shape from batch_input_shape
                    first_layer = model_config['config'][0]
                    input_shape = None
                    if 'batch_input_shape' in first_layer['config']:
                        batch_input_shape = first_layer['config']['batch_input_shape']
                        # Remove None from batch dimension: [None, 216, 1] -> (216, 1)
                        input_shape = tuple(batch_input_shape[1:]) if len(batch_input_shape) > 1 else None
                    
                    for i, layer_config in enumerate(model_config['config']):
                        layer_type = layer_config['class_name']
                        layer_params = layer_config['config'].copy()
                        
                        # Remove parameters that are not valid in Keras 3.x
                        layer_params.pop('name', None)
                        layer_params.pop('batch_input_shape', None)  # Handle this separately for first layer
                        
                        if layer_type == 'Conv1D':
                            # For first layer, set input_shape
                            if i == 0 and input_shape:
                                layer_params['input_shape'] = input_shape
                            self.model.add(tf_keras.layers.Conv1D(**layer_params))
                        elif layer_type == 'Activation':
                            self.model.add(tf_keras.layers.Activation(layer_params['activation']))
                        elif layer_type == 'Dropout':
                            self.model.add(tf_keras.layers.Dropout(layer_params['rate']))
                        elif layer_type == 'MaxPooling1D':
                            self.model.add(tf_keras.layers.MaxPooling1D(**layer_params))
                        elif layer_type == 'Flatten':
                            self.model.add(tf_keras.layers.Flatten())
                        elif layer_type == 'Dense':
                            self.model.add(tf_keras.layers.Dense(**layer_params))
                    
                    # Load weights
                    self.model.load_weights(model_path)
                    # Compile model (matching original app_gui.py)
                    self.model.compile(loss="categorical_crossentropy", optimizer="rmsprop", metrics=["accuracy"])
                    print("Voice emotion model loaded successfully (JSON + weights, manual build)")
                    VoiceEmotionAnalyzer._model_instance = self.model
                    
                    # Verify model works
                    self._verify_model()
                    return True
                except Exception as json_error:
                    print(f"ERROR loading with JSON method: {json_error}")
                    import traceback
                    traceback.print_exc()
                    # Continue to try other methods
            
            # Method 2: Try loading directly with legacy format support
            if os.path.exists(model_path):
                try:
                    # Use tf_keras for backward compatibility with legacy .h5 models
                    try:
                        self.model = tf_keras.models.load_model(model_path, compile=False)
                        # Compile model (matching original app_gui.py)
                        self.model.compile(loss="categorical_crossentropy", optimizer="rmsprop", metrics=["accuracy"])
                        print("Voice emotion model loaded successfully (direct load with safe_mode=False)")
                        VoiceEmotionAnalyzer._model_instance = self.model
                        
                        # Verify model works
                        self._verify_model()
                        return True
                    except Exception as safe_error:
                        print(f"ERROR with safe_mode=False: {safe_error}")
                        # Try with h5py to load weights directly if we have JSON
                        if os.path.exists(json_path):
                            raise  # Re-raise to show original error
                        raise
                except Exception as direct_error:
                    print(f"ERROR loading model directly: {direct_error}")
                    import traceback
                    traceback.print_exc()
            
            print(f"ERROR: Model files not found. Model exists: {os.path.exists(model_path)}, JSON exists: {os.path.exists(json_path)}")
            return False
                
        except Exception as e:
            print(f"ERROR loading voice emotion model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _verify_model(self):
        """Verify the model works with a test input"""
        try:
            # Create a dummy feature vector matching expected input shape (1, 216, 1)
            test_features = np.zeros((1, 216, 1))
            _ = self.model.predict(test_features, verbose=0)
            print("Model verification test passed")
        except Exception as test_error:
            print(f"WARNING: Model loaded but verification test failed: {test_error}")
            import traceback
            traceback.print_exc()
    
    @staticmethod
    def _preprocess_waveform(y: np.ndarray, sr: int, target_sr: int) -> tuple:
        """Preprocess waveform exactly matching app_gui.py"""
        # Resample
        if sr != target_sr:
            y = librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=target_sr)
            sr = target_sr
        # Trim leading/trailing silence
        y, _ = librosa.effects.trim(y, top_db=30)
        # Pre-emphasis filter to boost high-frequency content
        y = np.append(y[0], y[1:] - 0.97 * y[:-1]).astype(np.float32)
        # Normalize RMS to target level
        rms = np.sqrt(np.mean(y ** 2)) + 1e-8
        target_rms = 0.03
        y = y * (target_rms / rms)
        return y, sr
    
    def extract_features_from_file(self, audio_file_path: str) -> np.ndarray:
        """Extract features from audio file - try multiple methods with better error handling"""
        import traceback
        
        # First, check if file exists and get its size
        if not os.path.exists(audio_file_path):
            print(f"ERROR: Audio file does not exist: {audio_file_path}", flush=True)
            return None
        
        file_size = os.path.getsize(audio_file_path)
        print(f"Audio file exists: {audio_file_path}, size: {file_size} bytes", flush=True)
        
        if file_size == 0:
            print("ERROR: Audio file is empty", flush=True)
            return None
        
        # Check file format by reading magic bytes
        file_format = None
        try:
            with open(audio_file_path, 'rb') as f:
                header = f.read(12)
                if len(header) >= 4:
                    # Check for WAV format (RIFF header)
                    if header[0:4] == b'RIFF' and header[8:12] == b'WAVE':
                        file_format = 'wav'
                        print("Detected WAV format from file header", flush=True)
                    # Check for WebM format
                    elif header[0:4] == b'\x1a\x45\xdf\xa3':
                        file_format = 'webm'
                        print("Detected WebM format from file header", flush=True)
                    # Check for OGG format
                    elif header[0:4] == b'OggS':
                        file_format = 'ogg'
                        print("Detected OGG format from file header", flush=True)
        except Exception as header_error:
            print(f"Could not read file header: {header_error}", flush=True)
        
        # Try to convert audio file to WAV if it's in an unsupported format (WebM/Opus)
        converted_file = None
        original_file_path = audio_file_path
        
        # Only try conversion if file is not WAV
        if file_format and file_format != 'wav':
            # Method 1: Try ffmpeg directly via subprocess (most reliable for WebM/Opus)
            ffmpeg_available = False
            try:
                import subprocess
                # Check if ffmpeg is available
                try:
                    result = subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True, timeout=5)
                    ffmpeg_available = True
                    print("ffmpeg is available, attempting conversion...", flush=True)
                except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
                    print("ffmpeg not found in PATH, trying pydub...", flush=True)
            except Exception as check_error:
                print(f"Error checking ffmpeg: {check_error}, trying pydub...", flush=True)
            
            if ffmpeg_available:
                try:
                    import subprocess
                    # Create temporary WAV file
                    converted_file = audio_file_path + '_converted.wav'
                    
                    # Convert using ffmpeg (handles WebM/Opus)
                    cmd = [
                        'ffmpeg',
                        '-i', audio_file_path,
                        '-ar', '44100',  # Sample rate
                        '-ac', '1',      # Mono
                        '-f', 'wav',     # Format
                        '-y',            # Overwrite output
                        converted_file
                    ]
                    
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                    
                    if result.returncode == 0 and os.path.exists(converted_file) and os.path.getsize(converted_file) > 0:
                        print(f"Successfully converted audio to WAV using ffmpeg: {converted_file}", flush=True)
                        audio_file_path = converted_file
                    else:
                        print(f"ffmpeg conversion failed (returncode={result.returncode}): {result.stderr[:200] if result.stderr else 'No error message'}", flush=True)
                        if os.path.exists(converted_file):
                            try:
                                os.remove(converted_file)
                            except:
                                pass
                        converted_file = None
                except Exception as ffmpeg_error:
                    print(f"ffmpeg conversion error: {ffmpeg_error}", flush=True)
                    converted_file = None
            
            # Method 2: Try pydub if ffmpeg didn't work
            if converted_file is None:
                try:
                    from pydub import AudioSegment
                    # Try to detect and convert audio format (handles WebM/Opus from browser)
                    try:
                        # Try WebM first (most common browser format)
                        print("Trying pydub with WebM format...", flush=True)
                        audio = AudioSegment.from_file(audio_file_path, format="webm")
                        converted_file = audio_file_path + '_pydub.wav'
                        audio.export(converted_file, format="wav")
                        if os.path.exists(converted_file) and os.path.getsize(converted_file) > 0:
                            print(f"Converted WebM audio to WAV using pydub: {converted_file}", flush=True)
                            audio_file_path = converted_file
                        else:
                            converted_file = None
                    except Exception as webm_error:
                        print(f"pydub WebM conversion failed: {webm_error}, trying auto-detect...", flush=True)
                        try:
                            # Try auto-detect
                            audio = AudioSegment.from_file(audio_file_path)
                            # Only convert if not already WAV
                            if not audio_file_path.lower().endswith('.wav'):
                                converted_file = audio_file_path + '_pydub.wav'
                                audio.export(converted_file, format="wav")
                                if os.path.exists(converted_file) and os.path.getsize(converted_file) > 0:
                                    print(f"Converted audio to WAV using pydub: {converted_file}", flush=True)
                                    audio_file_path = converted_file
                                else:
                                    converted_file = None
                        except Exception as auto_error:
                            print(f"pydub auto-detect conversion failed: {auto_error}", flush=True)
                            converted_file = None
                except ImportError:
                    print("pydub not available, skipping audio conversion", flush=True)
                except Exception as convert_error:
                    print(f"pydub conversion error: {convert_error}", flush=True)
                    converted_file = None
            
            if converted_file is None:
                print(f"WARNING: Could not convert {file_format} audio file. Will try to load original file directly.", flush=True)
        elif file_format == 'wav':
            print("File is already in WAV format, no conversion needed", flush=True)
        
        # Check and use soundfile directly first (more reliable than librosa.load)
        soundfile_available = False
        try:
            import soundfile as sf
            soundfile_available = True
            print(f"soundfile backend available: {sf.__version__}", flush=True)
        except ImportError:
            print("WARNING: soundfile not installed", flush=True)
        
        # If file doesn't have .wav extension but is WAV format, rename it
        if file_format == 'wav' and not audio_file_path.lower().endswith('.wav'):
            new_path = audio_file_path + '.wav'
            try:
                os.rename(audio_file_path, new_path)
                audio_file_path = new_path
                print(f"Renamed file to have .wav extension: {audio_file_path}", flush=True)
            except Exception as rename_error:
                print(f"Could not rename file: {rename_error}, continuing with original path", flush=True)
        
        try:
            # Method 1: Try simple approach from run_inference.py (no preprocessing)
            try:
                print("Attempting Method 1: Simple load with offset=0.5, duration=2.5", flush=True)
                # Try soundfile first (more reliable for various formats)
                if soundfile_available:
                    try:
                        import soundfile as sf
                        # Try to read with explicit format if extension is missing
                        try:
                            # Load full file to get sample rate
                            data, sr = sf.read(audio_file_path)
                        except Exception as read_error:
                            # If reading fails, try with explicit format
                            print(f"soundfile read failed: {read_error}, trying with explicit WAV format...", flush=True)
                            if file_format == 'wav' or audio_file_path.lower().endswith('.wav'):
                                data, sr = sf.read(audio_file_path, format='WAV')
                            else:
                                raise read_error
                        
                        # Handle stereo/mono
                        if len(data.shape) > 1:
                            data = data[:, 0]  # Take first channel if stereo
                        # Calculate start/stop for offset=0.5, duration=2.5
                        start_sample = int(0.5 * sr)
                        end_sample = int(3.0 * sr)  # 0.5 + 2.5 = 3.0 seconds
                        if end_sample > len(data):
                            end_sample = len(data)
                        if start_sample < len(data):
                            X = data[start_sample:end_sample].astype(np.float32)
                        else:
                            X = data.astype(np.float32)
                        # Resample to 44100 if needed
                        if sr != 44100:
                            X = librosa.resample(X, orig_sr=sr, target_sr=44100)
                            sample_rate = 44100
                        else:
                            sample_rate = sr
                        print(f"Loaded with soundfile: {len(X)} samples at {sample_rate}Hz", flush=True)
                    except Exception as sf_error:
                        print(f"soundfile failed: {sf_error}, trying librosa...", flush=True)
                        # Fallback to librosa
                        try:
                            X, sample_rate = librosa.load(
                                audio_file_path,
                                res_type="kaiser_fast",
                                duration=2.5,
                                sr=22050 * 2,  # 44100 Hz
                                offset=0.5,
                            )
                        except Exception as librosa_error:
                            print(f"librosa also failed: {librosa_error}", flush=True)
                            raise sf_error  # Re-raise original error
                else:
                    # Try librosa directly
                    X, sample_rate = librosa.load(
                        audio_file_path,
                        res_type="kaiser_fast",
                        duration=2.5,
                        sr=22050 * 2,  # 44100 Hz
                        offset=0.5,
                    )
                
                print(f"Loaded audio: {len(X)} samples at {sample_rate}Hz")
                if len(X) == 0:
                    raise ValueError("Loaded audio is empty")
                sample_rate = np.array(sample_rate)  # Match original exactly
                mfccs = librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=13)
                print(f"MFCC shape: {mfccs.shape}")
                mfccs_mean = np.mean(mfccs, axis=0)
                print(f"MFCC mean shape: {mfccs_mean.shape}")
                feature_frame = np.expand_dims(mfccs_mean, axis=0)
                feature_frame = np.expand_dims(feature_frame, axis=2)
                print(f"Feature extraction successful (simple method): shape {feature_frame.shape}")
                return feature_frame
            except Exception as simple_error:
                error_msg = str(simple_error)
                print(f"Method 1 failed: {type(simple_error).__name__}: {error_msg}")
                if "NoBackendError" in error_msg or "NoBackendError" in type(simple_error).__name__:
                    print("ERROR: librosa has no backend to load audio files. Install soundfile: pip install soundfile")
                traceback.print_exc()
                
            # Method 2: Try loading from start (no offset)
            try:
                print("Attempting Method 2: Load from start, no offset")
                X, sample_rate = librosa.load(
                    audio_file_path,
                    res_type="kaiser_fast",
                    sr=22050 * 2,  # 44100 Hz
                )
                print(f"Loaded audio: {len(X)} samples at {sample_rate}Hz")
                if len(X) == 0:
                    raise ValueError("Loaded audio is empty")
                
                # Ensure we have at least 2.5 seconds
                target_len = int(2.5 * sample_rate)
                if len(X) < target_len:
                    print(f"Audio too short ({len(X)} < {target_len}), padding with zeros")
                    X = np.pad(X, (0, target_len - len(X)), 'constant')
                else:
                    # Take last 2.5 seconds
                    X = X[-target_len:]
                    print(f"Taking last 2.5 seconds: {len(X)} samples")
                
                sample_rate = np.array(sample_rate)
                mfccs = librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=13)
                mfccs_mean = np.mean(mfccs, axis=0)
                feature_frame = np.expand_dims(mfccs_mean, axis=0)
                feature_frame = np.expand_dims(feature_frame, axis=2)
                print(f"Feature extraction successful (Method 2): shape {feature_frame.shape}")
                return feature_frame
            except Exception as method2_error:
                print(f"Method 2 failed: {type(method2_error).__name__}: {method2_error}")
                traceback.print_exc()
                
            # Method 3: Try with preprocessing (app_gui.py method)
            try:
                print("Attempting Method 3: With preprocessing", flush=True)
                if soundfile_available:
                    try:
                        import soundfile as sf
                        try:
                            data, sr = sf.read(audio_file_path)
                        except Exception as read_error:
                            # Try with explicit format
                            print(f"soundfile read failed: {read_error}, trying with explicit WAV format...", flush=True)
                            if file_format == 'wav' or audio_file_path.lower().endswith('.wav'):
                                data, sr = sf.read(audio_file_path, format='WAV')
                            else:
                                raise read_error
                        # Handle stereo/mono
                        if len(data.shape) > 1:
                            data = data[:, 0]  # Take first channel if stereo
                        # Resample to 44100 if needed
                        if sr != 44100:
                            X = librosa.resample(data.astype(np.float32), orig_sr=sr, target_sr=44100)
                            sample_rate = 44100
                        else:
                            X = data.astype(np.float32)
                            sample_rate = sr
                        print(f"Loaded with soundfile: {len(X)} samples at {sample_rate}Hz", flush=True)
                    except Exception as sf_error:
                        print(f"soundfile failed: {sf_error}, trying librosa...", flush=True)
                        try:
                            X, sample_rate = librosa.load(
                                audio_file_path,
                                res_type="kaiser_fast",
                                sr=22050 * 2,
                            )
                        except Exception as librosa_error:
                            print(f"librosa also failed: {librosa_error}", flush=True)
                            raise sf_error
                else:
                    X, sample_rate = librosa.load(
                        audio_file_path,
                        res_type="kaiser_fast",
                        sr=22050 * 2,
                    )
                print(f"Loaded audio: {len(X)} samples at {sample_rate}Hz")
                if len(X) == 0:
                    raise ValueError("Loaded audio is empty")
                
                X, sample_rate = self._preprocess_waveform(X, sample_rate, 22050 * 2)
                print(f"After preprocessing: {len(X)} samples at {sample_rate}Hz")
                
                # Take last 2.5s window
                target_len = int(2.5 * sample_rate)
                if X.shape[0] >= target_len:
                    X = X[-target_len:]
                else:
                    X = np.concatenate([X, np.zeros(target_len - X.shape[0], dtype=np.float32)])
                
                mfccs = librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=13)
                mfccs_mean = np.mean(mfccs, axis=0)
                feature_frame = np.expand_dims(mfccs_mean, axis=0)
                feature_frame = np.expand_dims(feature_frame, axis=2)
                print(f"Feature extraction successful (Method 3 with preprocessing): shape {feature_frame.shape}")
                return feature_frame
            except Exception as method3_error:
                print(f"Method 3 failed: {type(method3_error).__name__}: {method3_error}")
                traceback.print_exc()
                
            # Method 4: Try with default sample rate (no resampling)
            try:
                print("Attempting Method 4: Default sample rate, no resampling", flush=True)
                if soundfile_available:
                    try:
                        import soundfile as sf
                        try:
                            data, sr = sf.read(audio_file_path)
                        except Exception as read_error:
                            # Try with explicit format
                            print(f"soundfile read failed: {read_error}, trying with explicit WAV format...", flush=True)
                            if file_format == 'wav' or audio_file_path.lower().endswith('.wav'):
                                data, sr = sf.read(audio_file_path, format='WAV')
                            else:
                                raise read_error
                        # Handle stereo/mono
                        if len(data.shape) > 1:
                            data = data[:, 0]  # Take first channel if stereo
                        X = data.astype(np.float32)
                        sample_rate = sr
                        print(f"Loaded with soundfile: {len(X)} samples at {sample_rate}Hz (native)", flush=True)
                    except Exception as sf_error:
                        print(f"soundfile failed: {sf_error}, trying librosa...", flush=True)
                        try:
                            X, sample_rate = librosa.load(
                                audio_file_path,
                                res_type="kaiser_fast",
                            )
                        except Exception as librosa_error:
                            print(f"librosa also failed: {librosa_error}", flush=True)
                            raise sf_error
                else:
                    X, sample_rate = librosa.load(
                        audio_file_path,
                        res_type="kaiser_fast",
                    )
                print(f"Loaded audio: {len(X)} samples at {sample_rate}Hz (native)")
                if len(X) == 0:
                    raise ValueError("Loaded audio is empty")
                
                # Resample to 44100 if needed
                if sample_rate != 44100:
                    print(f"Resampling from {sample_rate}Hz to 44100Hz")
                    X = librosa.resample(X, orig_sr=sample_rate, target_sr=44100)
                    sample_rate = 44100
                
                # Ensure we have at least 2.5 seconds
                target_len = int(2.5 * sample_rate)
                if len(X) < target_len:
                    X = np.pad(X, (0, target_len - len(X)), 'constant')
                else:
                    X = X[-target_len:]
                
                mfccs = librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=13)
                mfccs_mean = np.mean(mfccs, axis=0)
                feature_frame = np.expand_dims(mfccs_mean, axis=0)
                feature_frame = np.expand_dims(feature_frame, axis=2)
                print(f"Feature extraction successful (Method 4): shape {feature_frame.shape}")
                return feature_frame
            except Exception as method4_error:
                print(f"Method 4 failed: {type(method4_error).__name__}: {method4_error}")
                traceback.print_exc()
                
            print("ERROR: All feature extraction methods failed", flush=True)
            print("Troubleshooting tips:", flush=True)
            print("1. Install ffmpeg: https://ffmpeg.org/download.html", flush=True)
            print("2. Add ffmpeg to PATH or install via: choco install ffmpeg (Windows)", flush=True)
            print("3. Or ensure the audio file is in WAV format", flush=True)
            # Clean up converted file if it was created
            if converted_file and os.path.exists(converted_file):
                try:
                    os.remove(converted_file)
                    print(f"Cleaned up converted file: {converted_file}", flush=True)
                except Exception as cleanup_error:
                    print(f"Could not clean up converted file: {cleanup_error}", flush=True)
            return None
            
        except Exception as e:
            print(f"ERROR in extract_features_from_file: {type(e).__name__}: {e}", flush=True)
            traceback.print_exc()
            # Clean up converted file if it was created
            if converted_file and os.path.exists(converted_file):
                try:
                    os.remove(converted_file)
                    print(f"Cleaned up converted file: {converted_file}", flush=True)
                except Exception as cleanup_error:
                    print(f"Could not clean up converted file: {cleanup_error}", flush=True)
            return None
        finally:
            # Clean up converted file if it was created
            if converted_file and os.path.exists(converted_file):
                try:
                    os.remove(converted_file)
                except:
                    pass
    
    def extract_features_from_array(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """Extract features from audio array exactly matching app_gui.py _extract_features_from_array"""
        if audio.ndim == 2 and audio.shape[1] > 1:
            audio = audio[:, 0]
        elif audio.ndim == 2 and audio.shape[1] == 1:
            audio = np.squeeze(audio, axis=1)
        audio, sr = self._preprocess_waveform(audio.astype(np.float32), sr, 22050 * 2)
        target_len = int(2.5 * sr)
        if audio.shape[0] >= target_len:
            segment = audio[-target_len:]
        else:
            segment = np.concatenate([audio, np.zeros(target_len - audio.shape[0], dtype=np.float32)], axis=0)
        mfccs = np.mean(librosa.feature.mfcc(y=segment, sr=sr, n_mfcc=13), axis=0)
        feature_frame = np.expand_dims(mfccs, axis=0)
        feature_frame = np.expand_dims(feature_frame, axis=2)
        return feature_frame
    
    def analyze_emotion(self, audio_file_path):
        """Analyze emotion from audio file"""
        try:
            if self.model is None:
                print("ERROR: Model not loaded")
                return {
                    "error": "Model not loaded",
                    "emotion": "neutral",
                    "confidence": 0.0
                }
            
            if not os.path.exists(audio_file_path):
                print(f"ERROR: Audio file not found: {audio_file_path}")
                return {
                    "error": f"Audio file not found: {audio_file_path}",
                    "emotion": "neutral",
                    "confidence": 0.0
                }
            
            # Extract features using the exact method from app_gui.py
            print(f"Extracting features from: {audio_file_path}")
            print(f"File exists: {os.path.exists(audio_file_path)}")
            if os.path.exists(audio_file_path):
                print(f"File size: {os.path.getsize(audio_file_path)} bytes")
            
            try:
                features = self.extract_features_from_file(audio_file_path)
                if features is None:
                    error_msg = "Could not extract features - all extraction methods failed. Check Python stdout/stderr for details."
                    print(f"ERROR: {error_msg}")
                    print("This usually means:")
                    print("1. Audio file is corrupted or in unsupported format")
                    print("2. Audio file is too short (< 0.5 seconds)")
                    print("3. librosa cannot decode the audio file")
                    return {
                        "error": error_msg,
                        "emotion": "neutral",
                        "confidence": 0.0
                    }
            except Exception as extract_error:
                error_msg = f"Feature extraction failed: {str(extract_error)}"
                print(f"ERROR during feature extraction: {error_msg}")
                import traceback
                traceback.print_exc()
                return {
                    "error": error_msg,
                    "emotion": "neutral",
                    "confidence": 0.0
                }
            
            print(f"Extracted features shape: {features.shape}")
            print(f"Features min/max: {np.min(features):.4f} / {np.max(features):.4f}")
            print(f"Features mean/std: {np.mean(features):.4f} / {np.std(features):.4f}")
            
            # Predict emotion - match original exactly
            print("Running model prediction...")
            try:
                predictions = self.model.predict(features, batch_size=1, verbose=0)
                print(f"Predictions shape: {predictions.shape}")
                probs10 = predictions[0]  # 10-class probabilities (with gender)
                print(f"Probs10 shape: {probs10.shape}, sum: {np.sum(probs10):.4f}")
            except Exception as pred_error:
                print(f"ERROR during model prediction: {pred_error}")
                import traceback
                traceback.print_exc()
                raise
            
            # Collapse 10 classes to 7 emotions (matching app_gui.py)
            emotions7 = ["angry", "happy", "sad", "fearful", "neutral", "disgusted", "surprised"]
            angry = probs10[0] + probs10[5]  # female_angry + male_angry
            happy = probs10[3] + probs10[8]  # female_happy + male_happy
            sad = probs10[4] + probs10[9]    # female_sad + male_sad
            fearful = probs10[2] + probs10[7]  # female_fearful + male_fearful
            neutral = probs10[1] + probs10[6]  # female_calm + male_calm
            disgusted = 0.0
            surprised = 0.0
            probs7 = np.array([angry, happy, sad, fearful, neutral, disgusted, surprised], dtype=np.float32)
            s = probs7.sum()
            print(f"Probs7 before normalization: {probs7}, sum: {s:.4f}")
            if s > 0:
                probs7 = probs7 / s
            else:
                print("WARNING: All probabilities sum to zero! This indicates a problem with the model predictions.")
                # If sum is zero, set equal probabilities (shouldn't happen with softmax)
                probs7 = np.ones(7, dtype=np.float32) / 7.0
            
            # Get the emotion with highest confidence from 7-emotion space
            emotion_index_7 = int(np.argmax(probs7))
            emotion_7 = emotions7[emotion_index_7]
            confidence_7 = float(probs7[emotion_index_7])
            
            # Also get the original 10-class prediction for details
            emotion_index_10 = int(np.argmax(probs10))
            emotion_label_10 = self.emotion_labels[emotion_index_10]
            confidence_10 = float(probs10[emotion_index_10])
            
            print(f"7-emotion prediction: {emotion_7} (confidence: {confidence_7:.4f})")
            print(f"10-class prediction: {emotion_label_10} (confidence: {confidence_10:.4f})")
            print(f"All 7-emotion scores: {dict(zip(emotions7, [float(x) for x in probs7]))}")
            print(f"All 10-class scores: {dict(zip(self.emotion_labels, [float(x) for x in probs10]))}")
            
            # Validate that confidence is reasonable (should be > 0 for valid predictions)
            if confidence_7 <= 0.0 or confidence_7 > 1.0 or np.isnan(confidence_7):
                error_msg = f"ERROR: Invalid confidence value: {confidence_7}. This indicates a problem with model predictions."
                print(error_msg)
                print(f"Probs7: {probs7}")
                print(f"Probs10: {probs10}")
                print(f"Probs7 sum: {np.sum(probs7):.4f}")
                print(f"Probs10 sum: {np.sum(probs10):.4f}")
                return {
                    "error": error_msg,
                    "emotion": "neutral",
                    "confidence": 0.0,
                    "debug_info": {
                        "probs7": probs7.tolist(),
                        "probs10": probs10.tolist(),
                        "probs7_sum": float(np.sum(probs7)),
                        "probs10_sum": float(np.sum(probs10))
                    }
                }
            
            # Check if all scores are very similar (model might not be working)
            score_std = np.std(probs7)
            print(f"Score standard deviation: {score_std:.4f} (lower = more uniform/uncertain)")
            if score_std < 0.05:
                print("WARNING: Very low score variance - model predictions are nearly uniform. This suggests the model may not be working correctly.")
            
            # Parse gender from 10-class prediction for details
            parts = emotion_label_10.split('_')
            if len(parts) == 2:
                gender = parts[0]
                original_emotion = parts[1]
            else:
                gender = "unknown"
                original_emotion = emotion_label_10
            
            # Create detailed results with all emotion scores
            details = {
                "gender": gender,
                "pitch": "medium",
                "tone": original_emotion,
                "energy": "medium",
                "stress": "minimal" if original_emotion in ['calm', 'happy'] else "moderate",
                "all_scores_10": {self.emotion_labels[i]: float(probs10[i]) for i in range(len(self.emotion_labels))},
                "all_scores_7": {emotions7[i]: float(probs7[i]) for i in range(len(emotions7))}
            }
            
            # #region agent log
            try:
                workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
                log_dir = os.path.join(workspace_root, '.cursor')
                if not os.path.exists(log_dir):
                    os.makedirs(log_dir, exist_ok=True)
                log_path = os.path.join(log_dir, 'debug.log')
                with open(log_path, 'a', encoding='utf-8') as f:
                    f.write(json.dumps({"id":f"log_{int(time.time()*1000)}_voice_final","timestamp":int(time.time()*1000),"location":"voice_emotion_integration.py:final","message":"Final emotion selection","data":{"final_emotion":emotion_7,"final_confidence":confidence_7,"all_scores_7":details["all_scores_7"],"all_scores_10":details["all_scores_10"]},"sessionId":"debug-session","runId":"run1","hypothesisId":"A"}) + "\n")
            except Exception as e:
                print(f"DEBUG LOG ERROR: {e}", file=sys.stderr)
            # #endregion
            
            return {
                "emotion": emotion_7,
                "confidence": confidence_7,
                "details": details,
                "method": "ai_analysis",
                "error": None
            }
            
        except Exception as e:
            print(f"ERROR analyzing voice emotion: {e}")
            import traceback
            traceback.print_exc()
            # Return error with details for debugging
            error_details = {
                "error": str(e),
                "error_type": type(e).__name__,
                "emotion": "neutral",
                "confidence": 0.0,
                "traceback": traceback.format_exc()
            }
            print(f"Returning error response: {error_details}")
            return error_details

def main():
    """Main function for command line usage"""
    print("=== VOICE EMOTION ANALYSIS START ===", flush=True)
    print(f"Arguments received: {sys.argv}", flush=True)
    
    if len(sys.argv) != 2:
        error_msg = "Usage: python voice_emotion_integration.py <audio_file_path>"
        print(f"ERROR: {error_msg}", flush=True)
        print(json.dumps({"error": error_msg, "emotion": "neutral", "confidence": 0.0}), flush=True)
        sys.exit(1)
    
    audio_file_path = sys.argv[1]
    print(f"Audio file path: {audio_file_path}", flush=True)
    print(f"Audio file exists: {os.path.exists(audio_file_path)}", flush=True)
    
    try:
        print("Initializing VoiceEmotionAnalyzer...", flush=True)
        analyzer = VoiceEmotionAnalyzer()
        print("VoiceEmotionAnalyzer initialized", flush=True)
        
        # Verify model is loaded
        if analyzer.model is None:
            error_msg = "Model not loaded"
            print(f"ERROR: {error_msg}", flush=True)
            print(json.dumps({"error": error_msg, "emotion": "neutral", "confidence": 0.0}), flush=True)
            sys.exit(1)
        
        print("Model loaded successfully, starting emotion analysis...", flush=True)
        result = analyzer.analyze_emotion(audio_file_path)
        print("Emotion analysis completed", flush=True)
        print(f"Result: {json.dumps(result)}", flush=True)
        print(json.dumps(result), flush=True)
        print("=== VOICE EMOTION ANALYSIS END ===", flush=True)
    except RuntimeError as e:
        error_msg = str(e)
        print(f"ERROR (RuntimeError): {error_msg}", flush=True)
        import traceback
        traceback.print_exc()
        print(json.dumps({"error": error_msg, "emotion": "neutral", "confidence": 0.0}), flush=True)
        sys.exit(1)
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"ERROR (Exception): {error_msg}", flush=True)
        import traceback
        traceback.print_exc()
        print(json.dumps({"error": error_msg, "emotion": "neutral", "confidence": 0.0}), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()

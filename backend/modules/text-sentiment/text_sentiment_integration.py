#!/usr/bin/env python3
"""
Text Sentiment Analysis Integration Script
Simplified version that works with basic sentiment analysis
"""

import sys
import os
import json
import re
import joblib

class TextSentimentAnalyzer:
    _model_instance = None  # Singleton pattern for model
    _instances = {}  # Cache instances by language for efficiency
    
    def __init__(self, language='en'):
        # Validate language
        if language not in ['en', 'es', 'fr', 'de']:
            print(f"WARNING: Unsupported language '{language}', defaulting to 'en'")
            language = 'en'
        
        self.language = language
        self.emotion_labels = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'shame', 'surprise']
        self.model = None
        
        # Load ML model
        self._ensure_model_loaded()
        
        # Multi-language keyword-based emotion detection (fallback)
        self.emotion_keywords = self._get_keywords_for_language(language)
        
        print(f"TextSentimentAnalyzer initialized for language: {language}")
    
    def _ensure_model_loaded(self):
        """Ensure ML model is loaded, using singleton pattern"""
        if TextSentimentAnalyzer._model_instance is None:
            if not self.load_model():
                print("WARNING: ML model not loaded, falling back to keyword-based analysis")
        else:
            self.model = TextSentimentAnalyzer._model_instance
    
    def load_model(self):
        """Load the pre-trained text emotion classification model"""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Try multiple possible paths
            model_paths = [
                os.path.join(script_dir, 'models', 'emotion_classifier_pipe_lr.pkl'),
                os.path.join(script_dir, 'emotion_classifier_pipe_lr.pkl'),
                os.path.join(script_dir, '..', 'text-sentiment', 'models', 'emotion_classifier_pipe_lr.pkl'),
                os.path.join(script_dir, '..', 'text-sentiment', 'emotion_classifier_pipe_lr.pkl')
            ]
            
            model_path = None
            for path in model_paths:
                if os.path.exists(path):
                    model_path = path
                    break
            
            if model_path is None:
                print(f"ERROR: Model file not found. Tried paths: {model_paths}")
                return False
            
            print(f"Loading text sentiment model from: {model_path}")
            self.model = joblib.load(open(model_path, "rb"))
            TextSentimentAnalyzer._model_instance = self.model
            print("Text sentiment model loaded successfully")
            
            # Verify model works
            try:
                test_prediction = self.model.predict(["test"])
                print(f"Model verification test passed. Model classes: {self.model.classes_ if hasattr(self.model, 'classes_') else 'N/A'}")
            except Exception as test_error:
                print(f"WARNING: Model loaded but verification test failed: {test_error}")
            
            return True
        except Exception as e:
            print(f"ERROR loading text sentiment model: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _get_keywords_for_language(self, lang):
        """Get emotion keywords for the specified language"""
        keywords = {
            'en': {
                'joy': ['happy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'enjoy', 'pleased', 'delighted', 'ecstatic', 'thrilled', 'cheerful', 'joyful', 'blissful', 'elated'],
                'sadness': ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'crying', 'tears', 'hurt', 'broken', 'lonely', 'grief', 'sorrow', 'melancholy', 'dejected', 'heartbroken'],
                'anger': ['angry', 'mad', 'furious', 'rage', 'hate', 'annoyed', 'irritated', 'frustrated', 'upset', 'disgusted', 'enraged', 'livid', 'outraged'],
                'fear': ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'nervous', 'panic', 'frightened', 'concerned', 'alarmed', 'apprehensive', 'dread'],
                'surprise': ['surprised', 'shocked', 'amazed', 'wow', 'unexpected', 'sudden', 'astonished', 'stunned', 'bewildered', 'startled'],
                'disgust': ['disgusted', 'revolted', 'sick', 'nauseous', 'repulsed', 'gross', 'awful', 'terrible', 'horrible'],
                'shame': ['ashamed', 'embarrassed', 'guilty', 'regret', 'sorry', 'humiliated', 'mortified'],
                'neutral': ['okay', 'fine', 'normal', 'regular', 'average', 'standard', 'typical', 'alright']
            },
            'es': {
                'joy': ['feliz', 'contento', 'alegre', 'emocionado', 'encantado', 'maravilloso', 'fantástico', 'amor', 'disfrutar', 'placer', 'éxtasis', 'eufórico', 'jubiloso'],
                'sadness': ['triste', 'deprimido', 'abatido', 'infeliz', 'miserable', 'llorando', 'lágrimas', 'herido', 'roto', 'solitario', 'dolor', 'pena', 'melancolía'],
                'anger': ['enojado', 'furioso', 'rabia', 'odio', 'molesto', 'irritado', 'frustrado', 'disgustado', 'enfurecido', 'indignado'],
                'fear': ['asustado', 'aterrorizado', 'preocupado', 'ansioso', 'nervioso', 'pánico', 'alarmado', 'aprensivo', 'miedo'],
                'surprise': ['sorprendido', 'impactado', 'asombrado', 'inesperado', 'repentino', 'aturdido', 'desconcertado'],
                'disgust': ['disgustado', 'asqueado', 'enfermo', 'nauseabundo', 'repugnante', 'horrible', 'terrible'],
                'shame': ['avergonzado', 'culpable', 'arrepentido', 'humillado', 'mortificado'],
                'neutral': ['bien', 'normal', 'regular', 'promedio', 'estándar', 'típico', 'de acuerdo']
            },
            'fr': {
                'joy': ['heureux', 'content', 'joyeux', 'excité', 'ravi', 'merveilleux', 'fantastique', 'amour', 'profiter', 'plaisir', 'extatique', 'euphorique', 'jubilant'],
                'sadness': ['triste', 'déprimé', 'malheureux', 'misérable', 'pleurant', 'larmes', 'blessé', 'cassé', 'solitaire', 'chagrin', 'mélancolie'],
                'anger': ['en colère', 'furieux', 'rage', 'haine', 'énervé', 'irrité', 'frustré', 'dégoûté', 'enragé', 'indigné'],
                'fear': ['effrayé', 'terrifié', 'inquiet', 'anxieux', 'nerveux', 'panique', 'alarmé', 'appréhensif', 'peur'],
                'surprise': ['surpris', 'choqué', 'étonné', 'inattendu', 'soudain', 'abasourdi', 'déconcerté'],
                'disgust': ['dégoûté', 'révolté', 'malade', 'nauséeux', 'répugnant', 'horrible', 'terrible'],
                'shame': ['honteux', 'coupable', 'regret', 'humilié', 'mortifié'],
                'neutral': ['d\'accord', 'bien', 'normal', 'régulier', 'moyen', 'standard', 'typique']
            },
            'de': {
                'joy': ['glücklich', 'froh', 'freudig', 'aufgeregt', 'begeistert', 'wunderbar', 'fantastisch', 'liebe', 'genießen', 'freude', 'ekstatisch', 'euphorisch', 'jubelnd'],
                'sadness': ['traurig', 'deprimiert', 'unglücklich', 'elend', 'weinend', 'tränen', 'verletzt', 'gebrochen', 'einsam', 'kummer', 'melancholie'],
                'anger': ['wütend', 'zornig', 'wut', 'hass', 'verärgert', 'irritiert', 'frustriert', 'angeekelt', 'wütend', 'empört'],
                'fear': ['ängstlich', 'erschrocken', 'besorgt', 'nervös', 'panik', 'alarmiert', 'besorgt', 'angst'],
                'surprise': ['überrascht', 'schockiert', 'erstaunt', 'unerwartet', 'plötzlich', 'verblüfft', 'verwirrt'],
                'disgust': ['angeekelt', 'empört', 'krank', 'übel', 'widerlich', 'schrecklich', 'furchtbar'],
                'shame': ['beschämt', 'schuldig', 'reue', 'gedemütigt', 'mortifiziert'],
                'neutral': ['okay', 'gut', 'normal', 'regulär', 'durchschnittlich', 'standard', 'typisch']
            }
        }
        return keywords.get(lang, keywords['en'])
    
    def preprocess_text(self, text):
        """Preprocess text for emotion detection"""
        try:
            # Convert to lowercase
            text = text.lower()
            
            # Language-specific preprocessing
            if self.language in ['es', 'fr', 'de']:
                # For non-English languages, preserve accented characters
                if self.language == 'es':
                    text = re.sub(r'[^a-záéíóúñü\s]', '', text)
                elif self.language == 'fr':
                    text = re.sub(r'[^a-zàâäéèêëïîôùûüÿç\s]', '', text)
                elif self.language == 'de':
                    text = re.sub(r'[^a-zäöüß\s]', '', text)
            else:
                # English: remove special characters and digits
                text = re.sub(r'[^a-zA-Z\s]', '', text)
            
            # Remove extra whitespaces
            text = ' '.join(text.split())
            
            return text
            
        except Exception as e:
            print(f"Error preprocessing text: {e}")
            return text
    
    def analyze_emotion(self, text):
        """Analyze emotion from text using ML model or keyword matching as fallback"""
        try:
            # Validate input
            if text is None:
                return {
                    "error": "Text input is None",
                    "emotion": "neutral",
                    "confidence": 0.0
                }
            
            if not isinstance(text, str):
                text = str(text)
            
            # Preprocess text
            processed_text = self.preprocess_text(text)
            
            if not processed_text.strip():
                return {
                    "error": "Empty text after preprocessing",
                    "emotion": "neutral",
                    "confidence": 0.0
                }
            
            # Try using ML model first
            if self.model is not None:
                try:
                    # Use ML model for prediction
                    prediction = self.model.predict([text])[0]
                    probabilities = self.model.predict_proba([text])[0]
                    
                    # Get emotion labels from model
                    if hasattr(self.model, 'classes_'):
                        model_labels = list(self.model.classes_)
                    else:
                        # Fallback to our labels
                        model_labels = self.emotion_labels
                    
                    # Find the predicted emotion index
                    if prediction in model_labels:
                        emotion_index = list(model_labels).index(prediction)
                        confidence = float(probabilities[emotion_index])
                        emotion = prediction
                    else:
                        # Prediction not in labels, use highest probability
                        emotion_index = probabilities.argmax()
                        emotion = model_labels[emotion_index] if emotion_index < len(model_labels) else 'neutral'
                        confidence = float(probabilities[emotion_index])
                    
                    # Create emotion scores dictionary
                    emotion_scores = {}
                    for i, label in enumerate(model_labels):
                        if i < len(probabilities):
                            emotion_scores[label] = float(probabilities[i])
                    
                    # Normalize emotion to our standard set
                    emotion_mapping = {
                        'happy': 'joy',
                        'sad': 'sadness',
                        'angry': 'anger'
                    }
                    emotion = emotion_mapping.get(emotion.lower(), emotion.lower())
                    
                    # Determine sentiment polarity
                    positive_emotions = ['joy', 'surprise', 'happy']
                    negative_emotions = ['anger', 'disgust', 'fear', 'sadness', 'shame', 'sad', 'angry']
                    
                    if emotion in positive_emotions:
                        sentiment = 'positive'
                    elif emotion in negative_emotions:
                        sentiment = 'negative'
                    else:
                        sentiment = 'neutral'
                    
                    print(f"ML model prediction: {emotion} with confidence: {confidence:.4f}")
                    
                    return {
                        "emotion": emotion,
                        "confidence": confidence,
                        "sentiment": sentiment,
                        "details": emotion_scores,
                        "error": None,
                        "method": "ml_model"
                    }
                except Exception as model_error:
                    print(f"WARNING: ML model prediction failed: {model_error}, falling back to keyword matching")
                    # Fall through to keyword matching
            
            # Fallback to keyword-based analysis
            # Count keyword matches for each emotion
            emotion_scores = {}
            words = processed_text.split()
            
            for emotion, keywords in self.emotion_keywords.items():
                score = 0
                for keyword in keywords:
                    if keyword in words:
                        score += 1
                emotion_scores[emotion] = score
            
            # Find the emotion with highest score
            max_score = max(emotion_scores.values())
            if max_score == 0:
                # No keywords found - try to infer from context with improved heuristics
                # Check for punctuation and sentence structure
                if '!' in processed_text:
                    # Excitement
                    emotion = 'joy'
                    confidence = 0.45
                elif '?' in processed_text:
                    # Questioning - could be surprise or concern
                    emotion = 'surprise'
                    confidence = 0.4
                elif len(words) < 3:
                    # Very short text - try to infer from common short phrases
                    if any(word in processed_text for word in ['yes', 'yeah', 'ok', 'okay', 'sure']):
                        emotion = 'neutral'
                        confidence = 0.5
                    elif any(word in processed_text for word in ['no', 'nah', 'nope']):
                        emotion = 'sadness'
                        confidence = 0.4
                    else:
                        emotion = 'neutral'
                        confidence = 0.5
                else:
                    # Try to detect sentiment from common patterns and context
                    negative_words = ['not', 'no', 'never', 'nothing', 'bad', 'worst', 'terrible', 'awful', 'hate', 'dislike']
                    positive_words = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'like', 'best', 'fantastic']
                    
                    negative_count = sum(1 for word in negative_words if word in processed_text)
                    positive_count = sum(1 for word in positive_words if word in processed_text)
                    
                    if negative_count > positive_count:
                        emotion = 'sadness'
                        confidence = 0.4 + min(negative_count * 0.1, 0.2)
                    elif positive_count > negative_count:
                        emotion = 'joy'
                        confidence = 0.45 + min(positive_count * 0.1, 0.2)
                    else:
                        # Check for question words that might indicate surprise or concern
                        question_words = ['what', 'why', 'how', 'when', 'where', 'who']
                        if any(word in processed_text for word in question_words):
                            emotion = 'surprise'
                            confidence = 0.4
                        else:
                            emotion = 'neutral'
                            confidence = 0.5
            else:
                emotion = max(emotion_scores, key=emotion_scores.get)
                
                # Apply aggressive bias reduction: if neutral has highest score but it's close to other emotions,
                # prefer the strongest non-neutral emotion
                neutral_score = emotion_scores.get('neutral', 0)
                non_neutral_scores = {k: v for k, v in emotion_scores.items() if k != 'neutral'}
                if non_neutral_scores:
                    max_non_neutral_emotion = max(non_neutral_scores, key=non_neutral_scores.get)
                    max_non_neutral_score = non_neutral_scores[max_non_neutral_emotion]
                    
                    # More aggressive override conditions:
                    # 1. If neutral is predicted but score is low (< 2 matches) and a non-neutral has at least 1 match, prefer non-neutral
                    # 2. If neutral is predicted but a non-neutral emotion is within 1 match, prefer non-neutral
                    # 3. If neutral score < 1, prefer any non-neutral emotion with > 0 matches
                    should_override = False
                    if emotion == 'neutral':
                        if neutral_score < 2 and max_non_neutral_score >= 1:
                            # Neutral is weak and another emotion has matches
                            should_override = True
                        elif neutral_score < 1 and max_non_neutral_score > 0:
                            # Neutral is very weak, prefer any non-neutral
                            should_override = True
                        elif max_non_neutral_score >= (neutral_score - 1) and max_non_neutral_score > 0:
                            # Non-neutral is close to neutral (within 1 match)
                            should_override = True
                    
                    if should_override:
                        emotion = max_non_neutral_emotion
                        max_score = max_non_neutral_score
                        print(f"Overriding neutral with {emotion} (score: {max_score} vs neutral: {neutral_score})")
                
                # Calculate confidence based on keyword density and total matches
                keyword_count = emotion_scores[emotion]
                total_matches = sum(emotion_scores.values())
                confidence = min(0.5 + (keyword_count / max(len(words), 1)) * 0.5, 0.95)
                # Boost confidence if multiple keywords match
                if keyword_count > 1:
                    confidence = min(confidence + 0.1 * (keyword_count - 1), 0.95)
                
                # Boost confidence if there's a clear winner (much higher than second place)
                if total_matches > 0:
                    sorted_scores = sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)
                    if len(sorted_scores) > 1:
                        top_score = sorted_scores[0][1]
                        second_score = sorted_scores[1][1]
                        if top_score > second_score * 2:  # Clear winner
                            confidence = min(confidence * 1.15, 0.95)
            
            # Normalize scores to probabilities
            total_score = sum(emotion_scores.values())
            if total_score > 0:
                for key in emotion_scores:
                    emotion_scores[key] = emotion_scores[key] / total_score
            else:
                emotion_scores['neutral'] = 1.0
            
            # Determine sentiment polarity
            positive_emotions = ['joy', 'surprise']
            negative_emotions = ['anger', 'disgust', 'fear', 'sadness', 'shame']
            
            if emotion in positive_emotions:
                sentiment = 'positive'
            elif emotion in negative_emotions:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            return {
                "emotion": emotion,
                "confidence": confidence,
                "sentiment": sentiment,
                "details": emotion_scores,
                "error": None,
                "method": "keyword_matching"
            }
            
        except Exception as e:
            print(f"Error analyzing text emotion: {e}")
            return {
                "error": str(e),
                "emotion": "neutral",
                "confidence": 0.0
            }

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python text_sentiment_integration.py <text> [language]", "emotion": "neutral", "confidence": 0.0}))
        sys.exit(1)
    
    try:
        text = sys.argv[1]
        language = sys.argv[2] if len(sys.argv) > 2 else 'en'
        
        # Validate input
        if not text or not text.strip():
            print(json.dumps({"error": "Empty text input", "emotion": "neutral", "confidence": 0.0}))
            sys.exit(1)
        
        analyzer = TextSentimentAnalyzer(language=language)
        result = analyzer.analyze_emotion(text)
        
        # Validate result
        if result is None:
            print(json.dumps({"error": "Analysis returned None", "emotion": "neutral", "confidence": 0.0}))
            sys.exit(1)
        
        # Ensure required fields are present
        if 'emotion' not in result:
            result['emotion'] = 'neutral'
        if 'confidence' not in result:
            result['confidence'] = 0.0
        
        print(json.dumps(result))
    except KeyboardInterrupt:
        print(json.dumps({"error": "Interrupted by user", "emotion": "neutral", "confidence": 0.0}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}", "emotion": "neutral", "confidence": 0.0}))
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

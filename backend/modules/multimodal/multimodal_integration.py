#!/usr/bin/env python3
"""
Multimodal Analysis Integration Script
Combines facial, voice, and text emotion analysis results
"""

import sys
import os
import json
import numpy as np

class MultimodalAnalyzer:
    _instance = None  # Singleton pattern for consistency
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MultimodalAnalyzer, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Only initialize once
        if hasattr(self, '_initialized'):
            return
        self._initialized = True
        
        self.emotion_mapping = {
            # Face emotions (7)
            'angry': 'anger',
            'disgusted': 'disgust', 
            'fearful': 'fear',
            'happy': 'joy',
            'neutral': 'neutral',
            'sad': 'sadness',
            'surprised': 'surprise',
            
            # Voice emotions (5)
            'angry': 'anger',
            'calm': 'neutral',
            'fearful': 'fear', 
            'happy': 'joy',
            'sad': 'sadness',
            
            # Text emotions (8)
            'anger': 'anger',
            'disgust': 'disgust',
            'fear': 'fear',
            'joy': 'joy',
            'neutral': 'neutral',
            'sadness': 'sadness',
            'shame': 'shame',
            'surprise': 'surprise'
        }
        
        self.final_emotions = ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'shame', 'surprise']
    
    def normalize_emotion(self, emotion, modality):
        """Normalize emotions from different modalities to common scale"""
        return self.emotion_mapping.get(emotion, 'neutral')
    
    def weighted_average(self, facial_data, voice_data, text_data):
        """Calculate weighted average of emotion scores with confidence weighting"""
        # Dynamic weights based on confidence and availability
        base_weights = {
            'facial': 0.4,
            'voice': 0.3, 
            'text': 0.3
        }
        
        # Adjust weights based on confidence and availability
        available_modalities = []
        if facial_data and facial_data.get('confidence', 0) > 0.1:
            available_modalities.append('facial')
        if voice_data and voice_data.get('confidence', 0) > 0.1:
            available_modalities.append('voice')
        if text_data and text_data.get('confidence', 0) > 0.1:
            available_modalities.append('text')
        
        # Normalize weights if some modalities are missing
        if len(available_modalities) == 0:
            # All neutral - return default
            return {emotion: 0.0 if emotion != 'neutral' else 1.0 for emotion in self.final_emotions}
        
        # Redistribute weights among available modalities
        total_weight = sum(base_weights[m] for m in available_modalities)
        weights = {m: base_weights[m] / total_weight for m in available_modalities}
        
        # Initialize emotion scores
        emotion_scores = {emotion: 0.0 for emotion in self.final_emotions}
        
        # Process facial data with confidence weighting
        if 'facial' in weights and facial_data and 'details' in facial_data:
            facial_emotion = facial_data.get('emotion', 'neutral')
            facial_confidence = facial_data.get('confidence', 0.5)
            weight = weights['facial'] * facial_confidence
            
            # If facial emotion is neutral but confidence is low, look for non-neutral signals in details
            if facial_emotion == 'neutral' and facial_confidence < 0.6:
                # Check details for non-neutral emotions with reasonable scores
                non_neutral_details = {k: v for k, v in facial_data['details'].items() if k != 'neutral' and v > 0.15}
                if non_neutral_details:
                    # Use the strongest non-neutral emotion instead
                    strongest_facial = max(non_neutral_details, key=non_neutral_details.get)
                    facial_emotion = strongest_facial
                    facial_confidence = non_neutral_details[strongest_facial]
                    weight = weights['facial'] * facial_confidence
                    print(f"Overriding facial neutral with {facial_emotion} (confidence: {facial_confidence:.3f})")
            
            for emotion, score in facial_data['details'].items():
                normalized_emotion = self.normalize_emotion(emotion, 'facial')
                emotion_scores[normalized_emotion] += score * weight
        
        # Process voice data with confidence weighting
        if 'voice' in weights and voice_data:
            voice_emotion = voice_data.get('emotion', 'neutral')
            normalized_emotion = self.normalize_emotion(voice_emotion, 'voice')
            confidence = voice_data.get('confidence', 0.0)
            weight = weights['voice'] * confidence
            
            # If voice emotion is neutral/calm but confidence is low, look for non-neutral signals in details
            if normalized_emotion == 'neutral' and confidence < 0.6 and 'details' in voice_data:
                # Check all_scores for non-neutral emotions
                if 'all_scores' in voice_data['details']:
                    non_neutral_scores = {k: v for k, v in voice_data['details']['all_scores'].items() if 'calm' not in k.lower()}
                    if non_neutral_scores:
                        # Use the strongest non-neutral emotion instead
                        strongest_voice = max(non_neutral_scores, key=non_neutral_scores.get)
                        voice_emotion = strongest_voice.split('_')[-1] if '_' in strongest_voice else strongest_voice
                        normalized_emotion = self.normalize_emotion(voice_emotion, 'voice')
                        confidence = non_neutral_scores[strongest_voice]
                        weight = weights['voice'] * confidence
                        print(f"Overriding voice neutral with {normalized_emotion} (confidence: {confidence:.3f})")
            
            emotion_scores[normalized_emotion] += weight
            # Also add from details if available
            if 'details' in voice_data and 'all_scores' in voice_data['details']:
                for emotion, score in voice_data['details']['all_scores'].items():
                    # Map voice emotion labels to common set
                    mapped_emotion = self.normalize_emotion(emotion.split('_')[-1] if '_' in emotion else emotion, 'voice')
                    emotion_scores[mapped_emotion] += score * weight * 0.5
        
        # Process text data with confidence weighting
        if 'text' in weights and text_data and 'details' in text_data:
            text_emotion = text_data.get('emotion', 'neutral')
            text_confidence = text_data.get('confidence', 0.5)
            weight = weights['text'] * text_confidence
            
            # If text emotion is neutral but confidence is low, look for non-neutral signals in details
            if text_emotion == 'neutral' and text_confidence < 0.6:
                # Check details for non-neutral emotions with reasonable scores
                non_neutral_details = {k: v for k, v in text_data['details'].items() if k != 'neutral' and v > 0.15}
                if non_neutral_details:
                    # Use the strongest non-neutral emotion instead
                    strongest_text = max(non_neutral_details, key=non_neutral_details.get)
                    text_emotion = strongest_text
                    text_confidence = non_neutral_details[strongest_text]
                    weight = weights['text'] * text_confidence
                    print(f"Overriding text neutral with {text_emotion} (confidence: {text_confidence:.3f})")
            
            for emotion, score in text_data['details'].items():
                normalized_emotion = self.normalize_emotion(emotion, 'text')
                emotion_scores[normalized_emotion] += score * weight
        
        # Normalize scores to sum to 1
        total_score = sum(emotion_scores.values())
        if total_score > 0:
            emotion_scores = {k: v / total_score for k, v in emotion_scores.items()}
        else:
            # Fallback to neutral if all scores are zero
            emotion_scores['neutral'] = 1.0
        
        return emotion_scores
    
    def analyze_multimodal(self, facial_data, voice_data, text_data):
        """Analyze combined emotional state from all modalities"""
        try:
            # Validate input data
            if facial_data is None:
                facial_data = {}
            if voice_data is None:
                voice_data = {}
            if text_data is None:
                text_data = {}
            
            # Log input data for debugging
            print(f"Multimodal analysis input - Facial: {facial_data.get('emotion', 'N/A')}, Voice: {voice_data.get('emotion', 'N/A')}, Text: {text_data.get('emotion', 'N/A')}")
            
            # Calculate weighted emotion scores
            emotion_scores = self.weighted_average(facial_data, voice_data, text_data)
            
            # Find the emotion with highest score
            final_emotion = max(emotion_scores, key=emotion_scores.get)
            final_confidence = emotion_scores[final_emotion]
            
            # Very aggressive bias reduction: prefer non-neutral emotions even if neutral is slightly higher
            # This helps overcome the tendency of individual models to predict neutral
            neutral_score = emotion_scores.get('neutral', 0)
            non_neutral_scores = {k: v for k, v in emotion_scores.items() if k != 'neutral'}
            
            if non_neutral_scores:
                strongest_non_neutral = max(non_neutral_scores, key=non_neutral_scores.get)
                strongest_non_neutral_score = non_neutral_scores[strongest_non_neutral]
                
                # More aggressive override conditions:
                # 1. If neutral confidence < 0.6 and a non-neutral emotion has > 0.2, prefer non-neutral
                # 2. If neutral confidence < 0.5, prefer any non-neutral emotion with > 0.15 confidence
                # 3. If a non-neutral emotion is within 0.25 (increased from 0.15) of neutral and has at least 0.15 confidence, prefer it
                should_override = False
                if final_emotion == 'neutral':
                    if final_confidence < 0.6 and strongest_non_neutral_score > 0.2:
                        # Neutral is weak and another emotion is reasonably strong
                        should_override = True
                    elif final_confidence < 0.5:
                        # Neutral is very weak, prefer any reasonable non-neutral
                        if strongest_non_neutral_score > 0.15:
                            should_override = True
                    elif strongest_non_neutral_score > (neutral_score - 0.25) and strongest_non_neutral_score > 0.15:
                        # Non-neutral is close to neutral (within 0.25) and has minimum confidence
                        should_override = True
                
                if should_override:
                    final_emotion = strongest_non_neutral
                    final_confidence = strongest_non_neutral_score
                    print(f"Overriding neutral with {final_emotion} (confidence: {final_confidence:.3f} vs neutral: {neutral_score:.3f})")
            
            # Additional boost: if multiple modalities agree on a non-neutral emotion, increase confidence
            if final_emotion != 'neutral':
                agreement_count = 0
                if facial_data and facial_data.get('emotion') == final_emotion:
                    agreement_count += 1
                if voice_data and voice_data.get('emotion') == final_emotion:
                    agreement_count += 1
                if text_data and text_data.get('emotion') == final_emotion:
                    agreement_count += 1
                
                # Boost confidence if at least 2 modalities agree
                if agreement_count >= 2:
                    final_confidence = min(final_confidence * 1.2, 0.95)
                    print(f"Boosted confidence due to modality agreement ({agreement_count} modalities agree on {final_emotion})")
            
            print(f"Final multimodal emotion: {final_emotion} with confidence: {final_confidence:.3f}")
            print(f"All emotion scores: {emotion_scores}")
            
            # Generate description based on results
            description = self.generate_description(facial_data, voice_data, text_data, final_emotion, final_confidence)
            
            # Generate recommendations
            recommendations = self.generate_recommendations(final_emotion, final_confidence)
            
            # Determine therapy type
            therapy_type = self.determine_therapy_type(final_emotion, final_confidence)
            
            return {
                "emotion": final_emotion,
                "confidence": final_confidence,
                "description": description,
                "recommendations": recommendations,
                "therapyType": therapy_type,
                "details": {
                    "facial": facial_data,
                    "voice": voice_data,
                    "text": text_data,
                    "combined_scores": emotion_scores
                },
                "error": None
            }
            
        except Exception as e:
            print(f"Error in multimodal analysis: {e}")
            return {
                "error": str(e),
                "emotion": "neutral",
                "confidence": 0.0
            }
    
    def generate_description(self, facial_data, voice_data, text_data, final_emotion, confidence):
        """Generate human-readable description of emotional state"""
        descriptions = {
            'anger': f"Based on comprehensive analysis, you appear to be experiencing anger with {confidence:.1%} confidence. This emotional state may be indicated by facial tension, elevated voice tone, and negative language patterns.",
            'disgust': f"The analysis suggests you're feeling disgusted with {confidence:.1%} confidence. This emotion is often associated with facial expressions of aversion and negative sentiment in your communication.",
            'fear': f"Your emotional state indicates fear with {confidence:.1%} confidence. This may be reflected in anxious facial expressions, nervous voice patterns, and worrisome thoughts.",
            'joy': f"Great news! The analysis shows you're experiencing joy with {confidence:.1%} confidence. This positive emotional state is reflected in your facial expressions, voice tone, and positive language.",
            'neutral': f"The analysis indicates a neutral emotional state with {confidence:.1%} confidence. You appear to be in a balanced state without strong emotional fluctuations.",
            'sadness': f"The comprehensive analysis suggests you're feeling sad with {confidence:.1%} confidence. This emotional state may be reflected in facial expressions, voice tone, and language patterns.",
            'shame': f"Your emotional state indicates shame with {confidence:.1%} confidence. This complex emotion may be affecting your overall well-being and self-perception.",
            'surprise': f"The analysis shows you're experiencing surprise with {confidence:.1%} confidence. This emotional state is often associated with unexpected events or revelations."
        }
        
        return descriptions.get(final_emotion, f"Based on the comprehensive analysis, you appear to be in a {final_emotion} emotional state with {confidence:.1%} confidence.")
    
    def generate_recommendations(self, emotion, confidence):
        """Generate recommendations based on emotional state"""
        recommendations = {
            'anger': "Consider practicing deep breathing exercises, progressive muscle relaxation, or engaging in physical activity to help manage anger. Mindfulness meditation can also be beneficial.",
            'disgust': "Try to identify the source of your discomfort and address it directly. Engaging in activities that bring you joy can help counteract negative feelings.",
            'fear': "Practice grounding techniques, such as the 5-4-3-2-1 method, to help manage anxiety. Consider talking to someone you trust about your concerns.",
            'joy': "Continue engaging in activities that bring you happiness. Consider sharing your positive energy with others or documenting what's making you feel good.",
            'neutral': "Maintain your emotional balance by continuing healthy routines. Consider exploring new activities or hobbies to add variety to your life.",
            'sadness': "Allow yourself to feel your emotions while also engaging in self-care activities. Consider talking to a trusted friend or professional if sadness persists.",
            'shame': "Practice self-compassion and remind yourself that everyone makes mistakes. Consider talking to a counselor or trusted person about your feelings.",
            'surprise': "Take time to process any unexpected events. Consider journaling about your thoughts and feelings regarding the surprise."
        }
        
        return recommendations.get(emotion, "Consider engaging in activities that promote emotional well-being and self-care.")
    
    def determine_therapy_type(self, emotion, confidence):
        """Determine appropriate therapy type based on emotional state"""
        therapy_mapping = {
            'anger': 'anger_management',
            'disgust': 'cognitive_behavioral',
            'fear': 'anxiety_therapy',
            'joy': 'positive_psychology',
            'neutral': 'mindfulness',
            'sadness': 'depression_therapy',
            'shame': 'trauma_therapy',
            'surprise': 'adjustment_therapy'
        }
        
        return therapy_mapping.get(emotion, 'general_therapy')

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python multimodal_integration.py <combined_json_or_file_path> [facial_json] [voice_json] [text_json]", "emotion": "neutral", "confidence": 0.0}))
        sys.exit(1)
    
    try:
        input_data = sys.argv[1]
        
        # Check if input is a file path
        if os.path.exists(input_data) and (input_data.endswith('.txt') or input_data.endswith('.json')):
            # Read from file
            try:
                with open(input_data, 'r', encoding='utf-8') as f:
                    combined_data = json.loads(f.read())
                
                # Extract individual data from combined object
                facial_data = combined_data.get('facial', {})
                voice_data = combined_data.get('voice', {})
                text_data = combined_data.get('text', {})
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON in file: {str(e)}", "emotion": "neutral", "confidence": 0.0}))
                sys.exit(1)
            except Exception as e:
                print(json.dumps({"error": f"Failed to read file: {str(e)}", "emotion": "neutral", "confidence": 0.0}))
                sys.exit(1)
        elif len(sys.argv) == 4:
            # Three separate JSON arguments
            try:
                facial_data = json.loads(sys.argv[1])
                voice_data = json.loads(sys.argv[2])
                text_data = json.loads(sys.argv[3])
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON in arguments: {str(e)}", "emotion": "neutral", "confidence": 0.0}))
                sys.exit(1)
        else:
            # Single JSON string argument
            try:
                combined_data = json.loads(input_data)
                facial_data = combined_data.get('facial', {})
                voice_data = combined_data.get('voice', {})
                text_data = combined_data.get('text', {})
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON format: {str(e)}", "emotion": "neutral", "confidence": 0.0}))
                sys.exit(1)
        
        # Validate that we have at least some data
        if not facial_data and not voice_data and not text_data:
            print(json.dumps({"error": "No input data provided (facial, voice, or text)", "emotion": "neutral", "confidence": 0.0}))
            sys.exit(1)
        
        analyzer = MultimodalAnalyzer()
        result = analyzer.analyze_multimodal(facial_data, voice_data, text_data)
        
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

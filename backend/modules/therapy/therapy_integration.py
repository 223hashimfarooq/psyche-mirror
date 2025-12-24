#!/usr/bin/env python3
"""
Therapy Recommendation Integration Script
Provides therapy recommendations based on emotional state analysis
"""

import sys
import os
import json

class TherapyRecommender:
    def __init__(self):
        self.therapy_database = {
            'anger': {
                'therapyType': 'anger_management',
                'recommendations': [
                    'Practice deep breathing exercises for 5-10 minutes daily',
                    'Engage in physical exercise to release tension',
                    'Try progressive muscle relaxation techniques',
                    'Use cognitive restructuring to challenge angry thoughts',
                    'Practice mindfulness meditation'
                ],
                'duration': '4-6 weeks',
                'intensity': 'moderate',
                'techniques': ['CBT', 'Mindfulness', 'Physical Activity', 'Breathing Exercises']
            },
            'disgust': {
                'therapyType': 'cognitive_behavioral',
                'recommendations': [
                    'Identify triggers that cause disgust reactions',
                    'Practice exposure therapy with gradual desensitization',
                    'Use cognitive restructuring to reframe negative thoughts',
                    'Engage in activities that promote positive emotions',
                    'Practice grounding techniques when feeling overwhelmed'
                ],
                'duration': '6-8 weeks',
                'intensity': 'moderate',
                'techniques': ['CBT', 'Exposure Therapy', 'Grounding', 'Positive Psychology']
            },
            'fear': {
                'therapyType': 'anxiety_therapy',
                'recommendations': [
                    'Practice the 5-4-3-2-1 grounding technique',
                    'Use systematic desensitization for specific fears',
                    'Learn and practice relaxation techniques',
                    'Challenge catastrophic thinking patterns',
                    'Build a support network of trusted individuals'
                ],
                'duration': '8-12 weeks',
                'intensity': 'moderate',
                'techniques': ['CBT', 'Exposure Therapy', 'Relaxation', 'Support Groups']
            },
            'joy': {
                'therapyType': 'positive_psychology',
                'recommendations': [
                    'Continue engaging in activities that bring happiness',
                    'Practice gratitude journaling daily',
                    'Share positive experiences with others',
                    'Set meaningful goals to maintain motivation',
                    'Help others to amplify positive emotions'
                ],
                'duration': '2-4 weeks',
                'intensity': 'low',
                'techniques': ['Positive Psychology', 'Gratitude Practice', 'Goal Setting', 'Social Connection']
            },
            'neutral': {
                'therapyType': 'mindfulness',
                'recommendations': [
                    'Practice mindfulness meditation for 10-15 minutes daily',
                    'Engage in activities that promote emotional awareness',
                    'Try new hobbies or activities to add variety',
                    'Practice emotional regulation techniques',
                    'Maintain healthy daily routines'
                ],
                'duration': '3-4 weeks',
                'intensity': 'low',
                'techniques': ['Mindfulness', 'Emotional Awareness', 'Routine Building', 'Self-Care']
            },
            'sadness': {
                'therapyType': 'depression_therapy',
                'recommendations': [
                    'Engage in regular physical exercise',
                    'Maintain social connections with supportive people',
                    'Practice self-compassion and self-care',
                    'Consider behavioral activation therapy',
                    'Establish a consistent sleep schedule'
                ],
                'duration': '8-12 weeks',
                'intensity': 'moderate',
                'techniques': ['CBT', 'Behavioral Activation', 'Social Support', 'Physical Activity']
            },
            'shame': {
                'therapyType': 'trauma_therapy',
                'recommendations': [
                    'Practice self-compassion exercises',
                    'Work on challenging shame-based thoughts',
                    'Build self-esteem through positive affirmations',
                    'Consider individual therapy for deeper issues',
                    'Practice forgiveness towards yourself'
                ],
                'duration': '12-16 weeks',
                'intensity': 'high',
                'techniques': ['Trauma Therapy', 'Self-Compassion', 'CBT', 'Individual Therapy']
            },
            'surprise': {
                'therapyType': 'adjustment_therapy',
                'recommendations': [
                    'Take time to process unexpected events',
                    'Practice stress management techniques',
                    'Maintain flexibility in your thinking',
                    'Build resilience through challenging situations',
                    'Seek support from friends and family'
                ],
                'duration': '4-6 weeks',
                'intensity': 'moderate',
                'techniques': ['Adjustment Therapy', 'Stress Management', 'Resilience Building', 'Social Support']
            }
        }
    
    def get_therapy_recommendation(self, emotional_state_data):
        """Get therapy recommendations based on emotional state"""
        try:
            emotion = emotional_state_data.get('emotion', 'neutral')
            confidence = emotional_state_data.get('confidence', 0.0)
            
            # Get base therapy information
            therapy_info = self.therapy_database.get(emotion, self.therapy_database['neutral'])
            
            # Adjust recommendations based on confidence level
            recommendations = self.adjust_recommendations_by_confidence(
                therapy_info['recommendations'], 
                confidence
            )
            
            # Add personalized elements based on confidence
            personalized_note = self.generate_personalized_note(emotion, confidence)
            
            return {
                "therapyType": therapy_info['therapyType'],
                "recommendations": recommendations,
                "duration": therapy_info['duration'],
                "intensity": therapy_info['intensity'],
                "techniques": therapy_info['techniques'],
                "personalizedNote": personalized_note,
                "confidence": confidence,
                "emotion": emotion,
                "error": None
            }
            
        except Exception as e:
            print(f"Error generating therapy recommendations: {e}")
            return {
                "error": str(e),
                "therapyType": "general_therapy",
                "recommendations": ["Consider consulting with a mental health professional"],
                "duration": "4-6 weeks",
                "intensity": "moderate"
            }
    
    def adjust_recommendations_by_confidence(self, base_recommendations, confidence):
        """Adjust recommendations based on confidence level"""
        if confidence >= 0.8:
            # High confidence - provide more specific recommendations
            return base_recommendations + [
                "Consider professional therapy for optimal results",
                "Track your progress with a mood journal"
            ]
        elif confidence >= 0.6:
            # Medium confidence - standard recommendations
            return base_recommendations
        else:
            # Low confidence - general recommendations
            return base_recommendations[:3] + [
                "Consider consulting with a mental health professional for personalized guidance"
            ]
    
    def generate_personalized_note(self, emotion, confidence):
        """Generate personalized note based on analysis"""
        if confidence >= 0.8:
            return f"Based on the comprehensive analysis, the {emotion} emotional state was detected with high confidence. The recommended therapy approach should be particularly effective for your current situation."
        elif confidence >= 0.6:
            return f"The analysis indicates a {emotion} emotional state with moderate confidence. The recommended therapy approach should help address your current emotional needs."
        else:
            return f"While the analysis suggests a {emotion} emotional state, the confidence level is lower. Consider consulting with a mental health professional for a more detailed assessment."

def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print("Usage: python therapy_integration.py <emotional_state_json>")
        sys.exit(1)
    
    emotional_state_data = json.loads(sys.argv[1])
    recommender = TherapyRecommender()
    result = recommender.get_therapy_recommendation(emotional_state_data)
    print(json.dumps(result))

if __name__ == "__main__":
    main()

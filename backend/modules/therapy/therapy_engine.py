import random

# Therapy Recommendation Engine
class TherapyRecommendationEngine:
    def __init__(self):
        self.emotional_states = {
            'anxious': {
                'relaxation_activities': [
                    {
                        'name': 'Deep Breathing Exercise',
                        'description': '4-7-8 breathing technique to calm your nervous system',
                        'duration': 5,
                        'steps': [
                            'Sit comfortably and close your eyes',
                            'Breathe in through your nose for 4 counts',
                            'Hold your breath for 7 counts',
                            'Exhale through your mouth for 8 counts',
                            'Repeat 4-5 times'
                        ],
                        'multimedia': 'breathing_animation.gif'
                    },
                    {
                        'name': 'Progressive Muscle Relaxation',
                        'description': 'Systematically tense and relax muscle groups',
                        'duration': 15,
                        'steps': [
                            'Start with your toes, tense for 5 seconds',
                            'Release and feel the relaxation',
                            'Move up to calves, thighs, abdomen',
                            'Continue with arms, shoulders, neck',
                            'Finish with facial muscles'
                        ],
                        'multimedia': 'muscle_relaxation.mp4'
                    }
                ],
                'cbt_techniques': [
                    {
                        'name': 'Thought Challenge',
                        'description': 'Question negative thoughts and find evidence',
                        'steps': [
                            'Identify the anxious thought',
                            'Ask: "What evidence supports this?"',
                            'Ask: "What evidence contradicts this?"',
                            'Consider alternative explanations',
                            'Reframe the thought positively'
                        ],
                        'interactive_questions': [
                            'What specific thought is making you anxious?',
                            'What evidence do you have that supports this thought?',
                            'What evidence contradicts this thought?',
                            'What would you tell a friend who had this thought?',
                            'How can you reframe this thought more positively?'
                        ]
                    },
                    {
                        'name': 'Grounding Technique 5-4-3-2-1',
                        'description': 'Use your senses to ground yourself in the present',
                        'steps': [
                            'Name 5 things you can see',
                            'Name 4 things you can touch',
                            'Name 3 things you can hear',
                            'Name 2 things you can smell',
                            'Name 1 thing you can taste'
                        ],
                        'interactive_questions': [
                            'Look around and name 5 things you can see',
                            'Touch 4 different objects and describe how they feel',
                            'Listen carefully and name 3 sounds you can hear',
                            'Take a deep breath and identify 2 scents',
                            'Taste something or imagine tasting something'
                        ]
                    }
                ],
                'mindfulness_exercises': [
                    {
                        'name': 'Body Scan Meditation',
                        'description': 'Mindfully scan your body for tension',
                        'duration': 10,
                        'steps': [
                            'Lie down comfortably',
                            'Start at the top of your head',
                            'Slowly scan down to your toes',
                            'Notice any tension without judgment',
                            'Breathe into areas of tension'
                        ]
                    }
                ],
                'journaling_prompts': [
                    'What specific thoughts are making me feel anxious right now?',
                    'What would I tell a friend who was feeling this way?',
                    'What coping strategies have worked for me in the past?',
                    'What am I grateful for today, despite feeling anxious?'
                ]
            },
            'depressed': {
                'relaxation_activities': [
                    {
                        'name': 'Guided Meditation - Self-Compassion',
                        'description': 'Practice kindness towards yourself',
                        'duration': 10,
                        'steps': [
                            'Find a quiet, comfortable space',
                            'Close your eyes and take deep breaths',
                            'Repeat: "May I be kind to myself"',
                            'Imagine giving yourself a warm hug',
                            'Extend this compassion to others'
                        ],
                        'multimedia': 'self_compassion_meditation.mp3'
                    }
                ],
                'cbt_techniques': [
                    {
                        'name': 'Behavioral Activation',
                        'description': 'Engage in activities that bring joy',
                        'steps': [
                            'List 3 activities you used to enjoy',
                            'Choose one small activity to do today',
                            'Schedule it at a specific time',
                            'Do the activity mindfully',
                            'Reflect on how it made you feel'
                        ]
                    },
                    {
                        'name': 'Cognitive Restructuring',
                        'description': 'Challenge negative thought patterns',
                        'steps': [
                            'Write down the negative thought',
                            'Rate how much you believe it (1-10)',
                            'Look for evidence against the thought',
                            'Consider alternative perspectives',
                            'Rate your belief again'
                        ]
                    }
                ],
                'mindfulness_exercises': [
                    {
                        'name': 'Mindful Walking',
                        'description': 'Practice mindfulness while walking',
                        'duration': 15,
                        'steps': [
                            'Walk slowly and deliberately',
                            'Feel each step connecting with the ground',
                            'Notice the rhythm of your breathing',
                            'Observe your surroundings without judgment',
                            'Return to the present moment when distracted'
                        ]
                    }
                ],
                'journaling_prompts': [
                    'What small thing brought me joy today?',
                    'What am I proud of accomplishing recently?',
                    'Who are the people that care about me?',
                    'What would I like to do when I feel better?'
                ]
            },
            'stressed': {
                'relaxation_activities': [
                    {
                        'name': 'Quick Stress Relief Breathing',
                        'description': 'Rapid stress reduction technique',
                        'duration': 3,
                        'steps': [
                            'Sit up straight',
                            'Breathe in for 4 counts',
                            'Hold for 4 counts',
                            'Breathe out for 6 counts',
                            'Repeat 3-4 times'
                        ],
                        'multimedia': 'stress_relief_breathing.gif'
                    },
                    {
                        'name': 'Tension Release Exercise',
                        'description': 'Quick physical tension release',
                        'duration': 5,
                        'steps': [
                            'Stand up and shake your hands',
                            'Roll your shoulders backward',
                            'Gently roll your neck',
                            'Stretch your arms overhead',
                            'Take 3 deep breaths'
                        ]
                    }
                ],
                'cbt_techniques': [
                    {
                        'name': 'Stress Inoculation',
                        'description': 'Prepare for stressful situations',
                        'steps': [
                            'Identify the stressor',
                            'Plan coping strategies',
                            'Practice relaxation techniques',
                            'Visualize handling the situation well',
                            'Reflect on past successes'
                        ]
                    }
                ],
                'mindfulness_exercises': [
                    {
                        'name': 'Mindful Breathing',
                        'description': 'Focus on breath to reduce stress',
                        'duration': 5,
                        'steps': [
                            'Sit comfortably',
                            'Focus on your natural breathing',
                            'Count breaths from 1 to 10',
                            'Start over when you reach 10',
                            'Notice when your mind wanders'
                        ]
                    }
                ],
                'journaling_prompts': [
                    'What is causing me the most stress right now?',
                    'What can I control in this situation?',
                    'What would I do if I had unlimited resources?',
                    'How can I break this problem into smaller parts?'
                ]
            },
            'angry': {
                'relaxation_activities': [
                    {
                        'name': 'Cooling Down Breathing',
                        'description': 'Calm breathing to reduce anger',
                        'duration': 7,
                        'steps': [
                            'Breathe in slowly through your nose',
                            'Hold for 3 counts',
                            'Exhale slowly through pursed lips',
                            'Imagine cooling air entering your body',
                            'Repeat until you feel calmer'
                        ],
                        'multimedia': 'cooling_breathing.mp4'
                    }
                ],
                'cbt_techniques': [
                    {
                        'name': 'Anger Management STOP',
                        'description': 'Stop, Think, Options, Proceed',
                        'steps': [
                            'STOP: Pause before reacting',
                            'THINK: What am I really feeling?',
                            'OPTIONS: What are my choices?',
                            'PROCEED: Choose the best response'
                        ]
                    }
                ],
                'mindfulness_exercises': [
                    {
                        'name': 'Mindful Anger Observation',
                        'description': 'Observe anger without acting on it',
                        'duration': 8,
                        'steps': [
                            'Acknowledge the anger without judgment',
                            'Notice where you feel it in your body',
                            'Breathe into those areas',
                            'Watch the anger rise and fall',
                            'Remember: feelings are temporary'
                        ]
                    }
                ],
                'journaling_prompts': [
                    'What triggered my anger?',
                    'What need of mine is not being met?',
                    'How can I express this need constructively?',
                    'What would a wise friend advise me?'
                ]
            }
        }

    def get_recommendations(self, emotional_state, intensity='medium'):
        """Get personalized recommendations based on emotional state"""
        if emotional_state not in self.emotional_states:
            emotional_state = 'anxious'  # Default fallback
        
        recommendations = self.emotional_states[emotional_state]
        
        # Add intensity-based modifications
        if intensity == 'high':
            # Prioritize immediate relief techniques
            recommendations['priority'] = 'immediate_relief'
        elif intensity == 'low':
            # Focus on long-term techniques
            recommendations['priority'] = 'long_term_wellness'
        else:
            recommendations['priority'] = 'balanced'
        
        return recommendations

    def get_random_activity(self, emotional_state, activity_type):
        """Get a random activity of specific type"""
        recommendations = self.get_recommendations(emotional_state)
        if activity_type in recommendations:
            return random.choice(recommendations[activity_type])
        return None

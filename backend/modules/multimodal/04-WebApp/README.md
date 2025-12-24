# Sequential Multimodal Psychological State Predictor

## Overview
Advanced psychological state prediction system that combines face, voice, and text emotions to detect genuine vs acted emotions with deception detection capabilities.

## Features
- **Sequential Workflow**: Step-by-step analysis process
- **Live Video Feed**: Real-time face emotion detection
- **Audio Recording**: 10-second voice emotion analysis
- **Text Sentiment**: Written emotion analysis
- **Deception Detection**: Identifies acting vs genuine emotions
- **Consistency Analysis**: Cross-modal correlation detection

## Files Structure
```
├── sequential_main.py              # Main Flask application
├── library/
│   └── advanced_psychological_predictor.py  # Core prediction logic
├── Models/
│   ├── emotion_classifier_pipe_lr.pkl       # Text emotion model
│   ├── Emotion_Voice_Detection_Model.h5     # Voice emotion model
│   └── face emotion.h5                      # Face emotion model
├── templates/
│   └── sequential_index.html                # Main interface
├── static/
│   └── CSS/
│       ├── style.css                        # Styling
│       └── images/                          # UI images
├── tmp/                                     # Temporary files
└── requirements.txt                         # Dependencies
```

## Usage
1. Install dependencies: `pip install -r requirements.txt`
2. Run application: `python sequential_main.py`
3. Open browser: `http://127.0.0.1:5000`
4. Follow the 3-step sequential workflow

## Workflow
1. **Step 1**: Live video + Audio recording (10 seconds)
2. **Step 2**: Text input for sentiment analysis
3. **Step 3**: Final psychological state analysis with deception detection

## Psychological States Detected
- Genuine_Happy/Sad/Anxious/Calm
- Acted_Happy/Sad/Anxious
- Deceptive_Neutral
- Stressed_Overwhelmed
- Confident_Authentic

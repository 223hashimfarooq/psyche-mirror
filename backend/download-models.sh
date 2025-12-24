#!/bin/bash
# Download or verify essential ML models

set -e

echo "📥 Checking and downloading ML models..."

# Create necessary directories
mkdir -p backend/modules/face-emotion/src
mkdir -p backend/modules/voice-emotion/saved_models
mkdir -p backend/modules/text-sentiment/models
mkdir -p backend/modules/multimodal/Models

# Function to download file if missing
download_if_missing() {
    local file_path=$1
    local url=$2
    
    if [ ! -f "$file_path" ]; then
        echo "Downloading $file_path from $url..."
        curl -L -o "$file_path" "$url" || {
            echo "⚠️  Warning: Could not download $file_path"
            return 1
        }
    else
        echo "✅ $file_path already exists"
    fi
}

# Note: For now, we'll keep models that are already in the repo
# If you want to download from external source, uncomment and add URLs:

# Face emotion model (if you have it hosted somewhere)
# download_if_missing "backend/modules/face-emotion/src/model.h5" "YOUR_MODEL_URL"

# Voice emotion model
# download_if_missing "backend/modules/voice-emotion/saved_models/Emotion_Voice_Detection_Model.h5" "YOUR_MODEL_URL"

# Text sentiment model
# download_if_missing "backend/modules/text-sentiment/models/emotion_classifier_pipe_lr.pkl" "YOUR_MODEL_URL"

# Verify essential files exist
ESSENTIAL_FILES=(
    "backend/modules/face-emotion/src/haarcascade_frontalface_default.xml"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Warning: Essential file missing: $file"
        echo "   This file is required for face detection to work."
    else
        echo "✅ Found: $file"
    fi
done

echo "✅ Model check complete!"


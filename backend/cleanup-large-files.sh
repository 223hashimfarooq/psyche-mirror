#!/bin/bash
# Clean up large files to reduce Docker image size

echo "🧹 Cleaning up large files to reduce image size..."

# Remove large model files (if they exist, models should be downloaded at runtime)
find . -type f \( -name "*.h5" -o -name "*.hdf5" -o -name "*.pkl" -o -name "*.p" -o -name "*.dat" -o -name "*.model" \) -delete 2>/dev/null || true

# Remove PDFs and documentation
find . -type f -name "*.pdf" -delete 2>/dev/null || true
find . -type f -name "*.docx" -delete 2>/dev/null || true
find . -type f -name "*.pages" -delete 2>/dev/null || true

# Remove notebooks
find . -type f -name "*.ipynb" -delete 2>/dev/null || true
find . -type d -name ".ipynb_checkpoints" -exec rm -rf {} + 2>/dev/null || true

# Remove large image directories (keep only essential)
find . -type d -path "*/Images" -exec rm -rf {} + 2>/dev/null || true
find . -type d -path "*/imgs" -exec rm -rf {} + 2>/dev/null || true
find . -type d -path "*/00-Presentation" -exec rm -rf {} + 2>/dev/null || true
find . -type d -path "*/Resources" -exec rm -rf {} + 2>/dev/null || true

# Remove data files
find . -type f -name "*.csv" -delete 2>/dev/null || true
find . -type f -name "*.db" -delete 2>/dev/null || true

# Remove audio/video files
find . -type f \( -name "*.wav" -o -name "*.mp3" -o -name "*.mp4" -o -name "*.avi" -o -name "*.gif" \) -delete 2>/dev/null || true

# Remove saved models directories
find . -type d -name "saved_models" -exec rm -rf {} + 2>/dev/null || true
find . -type d -path "*/Models" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true

# Remove __pycache__
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true

# Remove uploads and temp
rm -rf uploads/* 2>/dev/null || true
rm -rf temp/* 2>/dev/null || true

echo "✅ Cleanup complete!"


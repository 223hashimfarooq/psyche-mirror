#!/bin/bash
set -e

# Activate virtual environment
source venv/bin/activate

# Set Python command to use venv Python
export PYTHON_CMD=venv/bin/python3

# Start Node.js server
node server.js


#!/bin/bash
set -e

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
  export PYTHON_CMD=venv/bin/python3
  echo "Using virtual environment Python: $PYTHON_CMD"
else
  export PYTHON_CMD=python3
  echo "Using system Python: $PYTHON_CMD"
fi

# Start Node.js server
node server.js


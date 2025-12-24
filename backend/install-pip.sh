#!/bin/bash
set -e

# Download and install pip
curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py --user

# Add pip to PATH
export PATH=$HOME/.local/bin:$PATH

# Verify pip installation
python3 -m pip --version


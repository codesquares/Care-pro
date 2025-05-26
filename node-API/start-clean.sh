#!/bin/bash
# Script to ensure clean start by killing any processes using port 3000

# Find PID using port 3000 and kill it
echo "Checking for processes using port 3000..."
PID=$(lsof -i :3000 -t)

if [ -z "$PID" ]; then
  echo "No process found using port 3000"
else
  echo "Killing process $PID using port 3000..."
  kill -9 $PID
  sleep 1
fi

# Start the application
echo "Starting API server..."
npm start

#!/bin/bash

# Define the ports used by your applications
FRONTEND_PORT=5173    # Vite default port
BACKEND_PORT=3000     # Node-API port
AZURE_PORT=7198       # ASP.NET Core API port
AZURE_HTTPS_PORT=5001 # ASP.NET Core HTTPS port

echo "====== CarePro Startup Script ======"
echo "$(date)"
echo "=================================="

# Function to check and kill processes on a specific port
kill_process_on_port() {
    local PORT=$1
    local PROCESS_NAME=$2
    
    echo "Checking for processes on port $PORT ($PROCESS_NAME)..."
    
    # Find PID using the port
    local PID=$(lsof -t -i:$PORT)
    
    if [ -n "$PID" ]; then
        echo "Found process with PID $PID using port $PORT. Killing it..."
        kill -9 $PID
        echo "Process killed successfully."
    else
        echo "No process found using port $PORT."
    fi
}

# Kill processes on all used ports
kill_process_on_port $FRONTEND_PORT "Vite Frontend"
kill_process_on_port $BACKEND_PORT "Node-API Backend"
kill_process_on_port $AZURE_PORT "ASP.NET Core API"
kill_process_on_port $AZURE_HTTPS_PORT "ASP.NET Core API (HTTPS)"

# Clear terminal for better readability
clear

echo "====== Starting CarePro Services ======"
echo "$(date)"
echo "======================================"

# Start the frontend (Vite) in the background
echo "Starting Vite Frontend Server..."
cd /home/labber/Care-pro/frontend/vite-project && npm run dev &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

# Wait a moment to ensure frontend starts properly
sleep 2

# Start the Node-API backend in the background
echo "Starting Node-API Backend Server..."
cd /home/labber/Care-pro/node-API && npm start &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Print URLs for easy access
echo ""
echo "====== CarePro Services Information ======"
echo "Frontend server running at: http://localhost:$FRONTEND_PORT"
echo "Backend server running at: http://localhost:$BACKEND_PORT"
echo "Azure API endpoint: https://carepro-api20241118153443.azurewebsites.net/api"
echo "=========================================="
echo ""
echo "To stop all servers, press Ctrl+C or run: kill -9 $FRONTEND_PID $BACKEND_PID"
echo ""

# Keep the script running to see logs and allow for Ctrl+C to kill both processes
wait

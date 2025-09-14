#!/bin/bash
# JANMITRA Docker startup script
# Starts both backend and AI services

echo "🚀 Starting JANMITRA services..."

# Start AI services in background
echo "🤖 Starting AI services..."
cd /app/ai-services
python app.py &
AI_PID=$!

# Wait a moment for AI services to start
sleep 3

# Start backend
echo "🔧 Starting backend..."
cd /app/backend
npm start &
BACKEND_PID=$!

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $AI_PID $BACKEND_PID
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Wait for processes
wait $AI_PID $BACKEND_PID

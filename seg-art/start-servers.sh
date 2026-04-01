#!/bin/bash

# Start both Python backend and React frontend servers

echo "🚀 Starting Segment Art with Roboflow Integration"
echo "=================================================="
echo ""

# Check if Python backend dependencies are installed
if [ ! -f "python-backend/.env" ]; then
    echo "⚠️  WARNING: python-backend/.env not found!"
    echo "   Copy python-backend/.env.example to .env and add your ROBOFLOW_API_KEY"
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python backend in background
echo "📦 Starting Python backend (port 5000)..."
cd python-backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Python backend started (PID: $BACKEND_PID)"
else
    echo "❌ Failed to start Python backend"
    exit 1
fi

# Start React frontend
echo "⚛️  Starting React frontend (port 3000)..."
cd demo-app
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ React frontend started (PID: $FRONTEND_PID)"
else
    echo "❌ Failed to start React frontend"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo "=================================================="
echo "✨ Both servers are running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🐍 Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=================================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

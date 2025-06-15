#!/bin/bash

# Kỳ Sử Lạc Hồng - Development Startup Script
echo "🎮 Starting Kỳ Sử Lạc Hồng Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking required ports..."
check_port 3000 || echo "   Server port 3000 is busy"
check_port 8080 || echo "   Client port 8080 is busy"
check_port 27018 || echo "   MongoDB port 27017 is busy"

# Start MongoDB with Docker
echo "🗄️  Starting MongoDB..."
docker compose up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Check if MongoDB is ready
until docker exec ky-su-lac-hong-mongodb mongosh --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
    echo "   Still waiting for MongoDB..."
    sleep 2
done
echo "✅ MongoDB is ready!"

# Install dependencies if needed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Start server in background
echo "🚀 Starting server..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Start client in background
echo "🎨 Starting client..."
cd client
npm start &
CLIENT_PID=$!
cd ..

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    
    # Kill client and server
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null
        echo "   Client stopped"
    fi
    
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "   Server stopped"
    fi
    
    # Stop MongoDB container
    docker stop ky-su-lac-hong-mongodb 2>/dev/null
    echo "   MongoDB stopped"
    
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Show status
echo ""
echo "🎉 Kỳ Sử Lạc Hồng is starting up!"
echo "📊 Services:"
echo "   🗄️  MongoDB: http://localhost:27018"
echo "   🚀 Server:   http://localhost:3000"
echo "   🎨 Client:   http://localhost:8080"
echo ""
echo "🎮 Open your browser and go to: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait

#!/bin/bash

# Wedding Jump Docker Compose with automatic rebuild
# This script ensures the Docker image is rebuilt every time

echo "🏗️  Rebuilding Wedding Jump Docker container..."

# Stop existing containers
docker-compose down

# Build and start with --build flag to force rebuild
docker-compose up --build -d

echo "✅ Wedding Jump is running with fresh build!"
echo "🌐 Frontend: http://localhost:8000"
echo "🔌 WebSocket: ws://localhost:8001"
echo "📡 API: http://localhost:8002"
echo ""
echo "📋 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
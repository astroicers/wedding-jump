#!/bin/bash

# Wedding Jump Docker Compose with automatic rebuild
# This script ensures the Docker image is rebuilt every time
# Can be run from any directory

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

echo "Rebuilding Wedding Jump Docker container..."

# Stop existing containers
docker compose -f "$COMPOSE_FILE" down

# Build and start with --build flag to force rebuild
docker compose -f "$COMPOSE_FILE" up --build -d

echo "Wedding Jump is running with fresh build!"
echo "Frontend: http://localhost:8000"
echo "WebSocket: ws://localhost:8001"
echo "API: http://localhost:8002"
echo ""
echo "View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "Stop: docker compose -f $COMPOSE_FILE down"

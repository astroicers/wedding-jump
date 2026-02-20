#!/bin/bash

# Start Wedding Jump Docker containers
# Can be run from any directory

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker/docker-compose.yml"

echo "Starting Wedding Jump..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Wedding Jump is running!"
echo "Frontend: http://localhost:8000"
echo "WebSocket: ws://localhost:8001"
echo "API: http://localhost:8002"

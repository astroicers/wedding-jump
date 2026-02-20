#!/bin/bash

# Stop Wedding Jump Docker containers
# Can be run from any directory

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker/docker-compose.yml"

echo "Stopping Wedding Jump..."
docker compose -f "$COMPOSE_FILE" down
echo "Wedding Jump stopped."

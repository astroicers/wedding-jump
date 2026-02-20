#!/bin/bash

# View Wedding Jump Docker logs
# Can be run from any directory
# Usage: ./scripts/docker-logs.sh [-f]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker/docker-compose.yml"

docker compose -f "$COMPOSE_FILE" logs "$@"

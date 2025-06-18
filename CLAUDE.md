# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wedding Jump is a real-time multiplayer quiz game built with Nuxt 3, Express, and WebSockets. Players join the game, move around a game board, and participate in timed quiz questions with live scoring.

## Architecture

The application consists of three main components:
- **Nuxt 3 Frontend** (port 3000): Vue.js SPA with pages for game board, quiz master interface, and home
- **Express API Server** (port 3002): REST API that serves quiz questions from CSV file
- **WebSocket Server** (port 3001): Real-time communication for player movement, scoring, and game state

Key files:
- `server/api.js`: Express server that reads questions from `server/questions.csv`
- `server/ws-server.js`: WebSocket server handling player connections, movement, and score updates
- `plugins/ws-client.js`: Nuxt plugin providing WebSocket client connection
- `pages/game.vue`: Game board where players move and answer questions
- `pages/quiz.vue`: Quiz master interface for controlling questions and viewing leaderboard
- `server/questions.csv`: Question database with format: 題目,倒數時間,正確答案,分數

## Development Commands

**Docker deployment (recommended):**
```bash
./scripts/docker-start.sh          # Start with Docker
./scripts/docker-logs.sh -f        # View logs
./scripts/docker-stop.sh           # Stop containers
```

**Start all services in development:**
```bash
npm run dev  # Nuxt frontend only
```

**Start individual services:**
```bash
node server/api.js      # API server on port 3002
node server/ws-server.js # WebSocket server on port 3001
```

**Production deployment:**
```bash
npm run build
npm start  # Uses PM2 with ecosystem.config.cjs

# Or with Docker:
./scripts/docker-start.sh --with-nginx
```

## Game Data Flow

1. Players join via home page, connect to WebSocket server
2. Quiz master loads questions from API server (`/questions` endpoint)
3. Player movements and answers broadcast through WebSocket
4. Scores calculated and updated in real-time across all connected clients
5. Questions are Chinese text with O/X (True/False) answers

## Configuration

- Frontend uses `nuxt.config.js` with API base URL pointing to port 3002
- WebSocket connections hardcoded to `ws://localhost:3001` in client plugin
- PM2 ecosystem configuration manages all three services in production
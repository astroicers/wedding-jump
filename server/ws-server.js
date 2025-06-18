import { WebSocketServer } from 'ws';
import https from 'https';
import fs from 'fs';

const PORT = process.env.WS_PORT || 3001;
let players = new Map();
let gameState = {
  currentQuestion: null,
  questionStartTime: null,
  scores: new Map()
};

// Try to create HTTPS server for WSS, fallback to regular WS
let server;
try {
  if (fs.existsSync('./ssl/cert.pem') && fs.existsSync('./ssl/key.pem')) {
    const httpsServer = https.createServer({
      cert: fs.readFileSync('./ssl/cert.pem'),
      key: fs.readFileSync('./ssl/key.pem')
    });
    server = { server: httpsServer };
    console.log('Using secure WebSocket server (WSS)');
  } else {
    server = {};
    console.log('Using insecure WebSocket server (WS)');
  }
} catch (error) {
  server = {};
  console.log('Fallback to insecure WebSocket server (WS)');
}

const wss = new WebSocketServer({ ...server, port: PORT });

function broadcast(data, excludePlayer = null) {
  const message = JSON.stringify(data);
  let successCount = 0;
  let failCount = 0;
  
  players.forEach((player, playerId) => {
    if (excludePlayer && playerId === excludePlayer) return;
    
    try {
      if (player.ws.readyState === player.ws.OPEN) {
        player.ws.send(message);
        successCount++;
      } else {
        // Remove disconnected players
        players.delete(playerId);
        failCount++;
      }
    } catch (error) {
      console.error(`Failed to send message to player ${playerId}:`, error);
      players.delete(playerId);
      failCount++;
    }
  });
  
  const recipients = Array.from(players.keys()).filter(id => !excludePlayer || id !== excludePlayer);
  console.log(`📡 Broadcast: ${data.type} to ${successCount} players (${failCount} failed) - Recipients: ${recipients.join(', ')}`);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, 50).replace(/[<>"'&]/g, '');
}

function validatePlayerName(name) {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 20) return false; // 增加到20字符以支持quiz_master
  if (!/^[\w\u4e00-\u9fff\s]+$/.test(name)) return false;
  return true;
}

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`New client connected from ${clientIP}`);
  
  // Set up ping-pong for connection health
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data.type, 'from', data.id || data.name || ws.playerId || 'unknown');
      
      switch (data.type) {
        case 'join':
          handlePlayerJoin(ws, data);
          break;
          
        case 'move':
          handlePlayerMove(ws, data);
          break;
          
        case 'scoreUpdate':
          handleScoreUpdate(ws, data);
          break;
          
        case 'answer':
          handleAnswerBroadcast(ws, data);
          break;
          
        case 'requestExistingPlayers':
          handleExistingPlayersRequest(ws);
          break;
          
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      sendError(ws, 'Invalid message format');
    }
  });
  
  ws.on('close', (code, reason) => {
    handlePlayerDisconnect(ws, code, reason);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    handlePlayerDisconnect(ws, 1006, 'Connection error');
  });
});

function handlePlayerJoin(ws, data) {
  const playerName = sanitizeInput(data.name);
  
  if (!validatePlayerName(playerName)) {
    sendError(ws, '無效的玩家名稱');
    return;
  }
  
  if (players.has(playerName)) {
    sendError(ws, '玩家名稱已被使用');
    return;
  }
  
  const player = {
    ws: ws,
    id: playerName,
    x: 50,
    y: 50,
    joinTime: Date.now(),
    lastActive: Date.now()
  };
  
  ws.playerId = playerName;
  players.set(playerName, player);
  
  console.log(`${playerName === 'quiz_master' ? '🎮 Quiz Master' : '👤 Player'} ${playerName} joined. Total players: ${players.size}`);
  
  // Send join confirmation to the new player
  ws.send(JSON.stringify({
    type: 'newPlayer',
    id: playerName,
    name: playerName,
    x: player.x,
    y: player.y
  }));
  
  // Send existing players to new player
  const existingPlayers = Array.from(players.values())
    .filter(p => p.id !== playerName)
    .map(p => ({ type: 'newPlayer', id: p.id, name: p.id, x: p.x, y: p.y }));
  
  existingPlayers.forEach(playerData => {
    ws.send(JSON.stringify(playerData));
  });
  
  // Broadcast new player to existing players
  broadcast({
    type: 'newPlayer',
    id: playerName,
    name: playerName,
    x: player.x,
    y: player.y
  }, playerName);
}

function handlePlayerMove(ws, data) {
  const playerId = ws.playerId;
  if (!playerId || !players.has(playerId)) {
    sendError(ws, '未授權的移動');
    return;
  }
  
  const player = players.get(playerId);
  const x = Math.max(0, Math.min(100, parseFloat(data.x) || 0));
  const y = Math.max(0, Math.min(100, parseFloat(data.y) || 0));
  
  player.x = x;
  player.y = y;
  player.lastActive = Date.now();
  
  broadcast({
    type: 'positionUpdate',
    id: playerId,
    x: x,
    y: y
  }, playerId);
}

function handleScoreUpdate(ws, data) {
  const playerId = sanitizeInput(data.id);
  const score = parseInt(data.score) || 0;
  
  if (!playerId || score < 0) {
    console.warn('Invalid score update:', data);
    return;
  }
  
  const newTotal = (gameState.scores.get(playerId) || 0) + score;
  console.log(`🎯 Score update from ${ws.playerId}: ${playerId} += ${score} (new total: ${newTotal})`);
  
  if (gameState.scores.has(playerId)) {
    gameState.scores.set(playerId, gameState.scores.get(playerId) + score);
  } else {
    gameState.scores.set(playerId, score);
  }
  
  // 廣播分數更新到所有連接的客戶端（包括quiz_master）
  broadcast({
    type: 'scoreUpdate',
    id: playerId,
    score: score,
    totalScore: gameState.scores.get(playerId)
  }); // 不排除任何玩家，讓quiz_master也能收到分數更新
}

function handleAnswerBroadcast(ws, data) {
  console.log(`📢 Answer broadcast attempt from: ${ws.playerId || 'undefined'}`);
  if (ws.playerId !== 'quiz_master') {
    console.warn(`❌ Non-quiz master attempted to broadcast answer. playerId: ${ws.playerId}`);
    return;
  }
  
  gameState.currentQuestion = {
    correctAnswer: data.correctAnswer,
    score: parseInt(data.score) || 0,
    timestamp: Date.now()
  };
  
  console.log('Broadcasting answer from quiz master:', data);
  broadcast({
    type: 'answer',
    correctAnswer: data.correctAnswer,
    score: data.score
  });
}

function handleExistingPlayersRequest(ws) {
  const playerNames = Array.from(players.keys()).filter(name => name !== 'quiz_master');
  console.log(`Sending existing players list to quiz master: ${playerNames.join(', ')}`);
  
  // 為每個現有玩家發送newPlayer消息
  playerNames.forEach(playerName => {
    const player = players.get(playerName);
    if (player) {
      ws.send(JSON.stringify({
        type: 'newPlayer',
        id: playerName,
        name: playerName,
        x: player.x,
        y: player.y
      }));
    }
  });
  
  // 也發送傳統的existingPlayers消息以保持兼容性
  ws.send(JSON.stringify({
    type: 'existingPlayers',
    names: playerNames,
    count: playerNames.length
  }));
}

function handlePlayerDisconnect(ws, code, reason) {
  const playerId = ws.playerId;
  if (playerId && players.has(playerId)) {
    players.delete(playerId);
    console.log(`Player ${playerId} disconnected (${code}). Total players: ${players.size}`);
    
    if (playerId !== 'quiz_master') {
      broadcast({ type: 'playerLeft', id: playerId });
    }
  }
}

function sendError(ws, message) {
  try {
    ws.send(JSON.stringify({
      type: 'error',
      message: message
    }));
  } catch (error) {
    console.error('Failed to send error message:', error);
  }
}

// Health check and cleanup
const healthCheckInterval = setInterval(() => {
  const now = Date.now();
  const inactivePlayers = [];
  
  players.forEach((player, playerId) => {
    if (now - player.lastActive > 300000) { // 5 minutes
      inactivePlayers.push(playerId);
    }
  });
  
  inactivePlayers.forEach(playerId => {
    console.log(`Removing inactive player: ${playerId}`);
    const player = players.get(playerId);
    if (player) {
      player.ws.close(1000, 'Inactive timeout');
      players.delete(playerId);
    }
  });
  
  // Ping all connections
  players.forEach((player) => {
    if (!player.ws.isAlive) {
      player.ws.terminate();
      players.delete(player.id);
      return;
    }
    
    player.ws.isAlive = false;
    player.ws.ping();
  });
}, 30000); // Every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  clearInterval(healthCheckInterval);
  
  players.forEach((player) => {
    player.ws.close(1000, 'Server shutting down');
  });
  
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
console.log('Server started at:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV || 'development');
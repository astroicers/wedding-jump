import { WebSocketServer, WebSocket } from 'ws';
import https from 'https';
import fs from 'fs';
import roomManager from './room-manager.js';

const PORT = process.env.WS_PORT || 3001;

// Try to create HTTPS server for WSS, fallback to regular WS
let server = {};
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

const wss = new WebSocketServer({ ...server, port: Number(PORT) });

function globalBroadcast(data, excludePlayer = null) {
  console.warn('⚠️ Using deprecated global broadcast - consider using room-based broadcasting');
  const message = JSON.stringify(data);
  let successCount = 0;
  return successCount;
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, 50).replace(/[<>"'&]/g, '');
}

function validatePlayerName(name) {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 20) return false;
  if (!/^[\w\u4e00-\u9fff\s]+$/.test(name)) return false;
  return true;
}

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`New client connected from ${clientIP}`);
  
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data.type, 'from', data.playerName || data.id || data.name || ws.playerId || 'unknown', 'playerId:', data.playerId || 'none');
      
      switch (data.type) {
        case 'createRoom':
          handleCreateRoom(ws, data);
          break;
          
        case 'joinRoom':
          handleJoinRoom(ws, data);
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
          
        case 'requestLeaderboard':
          handleLeaderboardRequest(ws, data);
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
    handlePlayerDisconnect(ws, code, reason.toString());
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    handlePlayerDisconnect(ws, 1006, 'Connection error');
  });
});

function handleCreateRoom(ws, data) {
  const quizMasterName = sanitizeInput(data.quizMaster);
  
  if (!validatePlayerName(quizMasterName)) {
    sendError(ws, '無效的Quiz Master名稱');
    return;
  }
  
  try {
    // Generate a unique ID for the quiz master, using the name as base
    const quizMasterPlayerId = `quiz_master_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const room = roomManager.createRoom(quizMasterName, quizMasterPlayerId);
    const player = roomManager.joinRoom(room.id, quizMasterName, ws, quizMasterPlayerId);
    
    ws.playerId = quizMasterPlayerId;
    ws.playerName = quizMasterName;
    ws.roomId = room.id;
    
    ws.send(JSON.stringify({
      type: 'roomCreated',
      roomId: room.id,
      quizMaster: quizMasterName,
      playerId: quizMasterPlayerId,
      playerName: quizMasterName,
      isQuizMaster: true
    }));
    
    console.log(`🎮 Quiz Master ${quizMasterName} created room ${room.id}`);
  } catch (error) {
    sendError(ws, error instanceof Error ? error.message : 'Unknown error');
  }
}

function handleJoinRoom(ws, data) {
  const playerName = sanitizeInput(data.playerName);
  const playerId = sanitizeInput(data.playerId);
  const roomId = parseInt(String(data.roomId));
  
  console.log(`🎯 HandleJoinRoom - playerName: ${playerName}, playerId: ${playerId}, roomId: ${roomId}`);
  
  if (!validatePlayerName(playerName)) {
    console.log(`❌ Invalid player name: ${playerName}`);
    sendError(ws, '無效的玩家名稱');
    return;
  }
  
  if (!playerId) {
    console.log(`❌ Missing player ID: ${playerId}`);
    sendError(ws, '無效的玩家ID');
    return;
  }
  
  if (!roomId) {
    console.log(`❌ Invalid room ID: ${roomId}`);
    sendError(ws, '無效的房間號');
    return;
  }
  
  try {
    // 如果房間不存在，嘗試重新載入持久化數據
    if (!roomManager.getRoom(roomId)) {
      console.log(`⚠️ Room ${roomId} not found in memory, attempting to reload from storage...`);
      roomManager.reloadPersistedData();
    }
    
    const player = roomManager.joinRoom(roomId, playerName, ws, playerId);
    
    ws.playerId = playerId;
    ws.playerName = playerName;
    ws.roomId = roomId;
    
    ws.send(JSON.stringify({
      type: 'joinedRoom',
      roomId: roomId,
      playerId: playerId,
      playerName: playerName,
      isQuizMaster: player.isQuizMaster,
      x: player.x,
      y: player.y
    }));
    
    const room = roomManager.getRoom(roomId);
    if (room) {
      room.players.forEach((existingPlayer, existingPlayerId) => {
        if (existingPlayerId !== playerId) {
          ws.send(JSON.stringify({
            type: 'newPlayer',
            id: existingPlayer.name || existingPlayerId,
            playerId: existingPlayerId,
            name: existingPlayer.name || existingPlayerId,
            x: existingPlayer.x,
            y: existingPlayer.y,
            isQuizMaster: existingPlayer.isQuizMaster
          }));
        }
      });
    }
    
    roomManager.broadcastToRoom(roomId, {
      type: 'newPlayer',
      id: playerName,
      playerId: playerId,
      name: playerName,
      x: player.x,
      y: player.y,
      isQuizMaster: player.isQuizMaster
    }, playerId);
    
    console.log(`👤 Player ${playerName} joined room ${roomId}`);
  } catch (error) {
    sendError(ws, error instanceof Error ? error.message : 'Unknown error');
  }
}

function handlePlayerMove(ws, data) {
  const playerId = ws.playerId;
  const roomId = ws.roomId;
  
  if (!playerId || !roomId) {
    sendError(ws, '未授權的移動');
    return;
  }
  
  const room = roomManager.getRoom(roomId);
  if (!room || !room.players.has(playerId)) {
    sendError(ws, '玩家不在房間中');
    return;
  }
  
  const player = room.players.get(playerId);
  const x = Math.max(0, Math.min(100, parseFloat(String(data.x)) || 0));
  const y = Math.max(0, Math.min(100, parseFloat(String(data.y)) || 0));
  
  player.x = x;
  player.y = y;
  player.lastActive = Date.now();
  
  roomManager.broadcastToRoom(roomId, {
    type: 'positionUpdate',
    id: player.name || playerId,
    playerId: playerId,
    x: x,
    y: y
  }, playerId);
}

function handleScoreUpdate(ws, data) {
  const playerName = sanitizeInput(data.id);
  const playerId = sanitizeInput(data.playerId) || ws.playerId;
  const roomId = ws.roomId;
  const score = parseInt(String(data.score)) || 0;
  
  if (!playerId || !roomId || score < 0) {
    console.warn('Invalid score update:', data);
    return;
  }
  
  try {
    const scoreResult = roomManager.updateScore(playerId, score);
    if (scoreResult) {
      roomManager.broadcastToRoom(roomId, {
        type: 'scoreUpdate',
        id: playerName,
        playerId: playerId,
        score: score,
        totalScore: scoreResult.totalScore
      });
      
      const leaderboard = roomManager.getLeaderboard(roomId);
      roomManager.broadcastToRoom(roomId, {
        type: 'leaderboardUpdate',
        leaderboard: leaderboard
      });
    }
  } catch (error) {
    console.error('Error updating score:', error);
  }
}

function handleAnswerBroadcast(ws, data) {
  const playerId = ws.playerId;
  const roomId = ws.roomId;
  
  console.log(`📢 Answer broadcast attempt from: ${playerId || 'undefined'} in room ${roomId}`);
  
  if (!roomId) {
    sendError(ws, 'Quiz Master必須在房間中');
    return;
  }
  
  const room = roomManager.getRoom(roomId);
  if (!room) {
    sendError(ws, '房間不存在');
    return;
  }
  
  if (playerId !== room.quizMasterPlayerId) {
    console.warn(`❌ Non-quiz master attempted to broadcast answer. playerId: ${playerId}, expected: ${room.quizMasterPlayerId}`);
    sendError(ws, '只有Quiz Master可以廣播答案');
    return;
  }
  
  room.gameState.currentQuestion = {
    correctAnswer: data.correctAnswer || '',
    score: parseInt(String(data.score)) || 0,
    timestamp: Date.now()
  };
  
  console.log(`Broadcasting answer from quiz master in room ${roomId}:`, data);
  roomManager.broadcastToRoom(roomId, {
    type: 'answer',
    correctAnswer: data.correctAnswer,
    score: data.score
  });
}

function handleExistingPlayersRequest(ws) {
  const roomId = ws.roomId;
  
  if (!roomId) {
    sendError(ws, '必須在房間中才能請求玩家列表');
    return;
  }
  
  const room = roomManager.getRoom(roomId);
  if (!room) {
    sendError(ws, '房間不存在');
    return;
  }
  
  const playerNames = Array.from(room.players.keys()).filter(name => name !== room.quizMaster);
  console.log(`Sending existing players list to quiz master in room ${roomId}: ${playerNames.join(', ')}`);
  
  playerNames.forEach(playerName => {
    const player = room.players.get(playerName);
    if (player) {
      ws.send(JSON.stringify({
        type: 'newPlayer',
        id: playerName,
        name: playerName,
        x: player.x,
        y: player.y,
        isQuizMaster: player.isQuizMaster
      }));
    }
  });
  
  ws.send(JSON.stringify({
    type: 'roomStats',
    roomId: roomId,
    playerCount: room.players.size,
    players: playerNames
  }));
}

function handleLeaderboardRequest(ws, data) {
  const roomId = ws.roomId;
  
  if (!roomId) {
    sendError(ws, '必須在房間中才能請求排行榜');
    return;
  }
  
  const leaderboard = roomManager.getLeaderboard(roomId);
  ws.send(JSON.stringify({
    type: 'leaderboard',
    roomId: roomId,
    leaderboard: leaderboard
  }));
}

function handlePlayerDisconnect(ws, code, reason) {
  const playerId = ws.playerId;
  const roomId = ws.roomId;
  
  if (playerId) {
    const player = roomManager.leaveRoom(playerId);
    if (player && roomId) {
      roomManager.broadcastToRoom(roomId, {
        type: 'playerLeft',
        id: playerId
      });
    }
    console.log(`Player ${playerId} disconnected from room ${roomId} (${code})`);
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
  roomManager.getAllRoomsStats().forEach(roomStats => {
    const room = roomManager.getRoom(roomStats.id);
    if (room) {
      room.players.forEach((player) => {
        const playerWs = player.ws;
        if (playerWs) {
          if (!playerWs.isAlive) {
            console.log(`Terminating inactive connection for player ${player.id}`);
            playerWs.terminate();
            roomManager.leaveRoom(player.id);
            return;
          }
          
          playerWs.isAlive = false;
          playerWs.ping();
        }
      });
    }
  });
}, 30000); // Every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  clearInterval(healthCheckInterval);
  
  roomManager.getAllRoomsStats().forEach(roomStats => {
    const room = roomManager.getRoom(roomStats.id);
    if (room) {
      room.players.forEach((player) => {
        if (player.ws) {
          player.ws.close(1000, 'Server shutting down');
        }
      });
      roomManager.closeRoom(roomStats.id);
    }
  });
  
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
console.log('Server started at:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV || 'development');
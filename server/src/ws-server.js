import { WebSocketServer, WebSocket } from 'ws';
import https from 'https';
import fs from 'fs';
import roomManager from './room-manager.js';
import { loadQuestions } from './questions.js';

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

// Disconnect grace period: playerId → setTimeout handle
const disconnectTimers = new Map();

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

        case 'loadQuestions':
          handleLoadQuestions(ws);
          break;

        case 'startGame':
          handleStartGame(ws, data);
          break;

        case 'nextQuestion':
          handleNextQuestion(ws);
          break;

        case 'revealAnswer':
          handleRevealAnswer(ws);
          break;

        case 'showLeaderboard':
          handleShowLeaderboard(ws);
          break;

        case 'endGame':
          handleEndGame(ws);
          break;

        case 'requestGameState':
          handleRequestGameState(ws);
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
    // 如果此連線已關聯舊房間，先離開並清理
    if (ws.playerId && ws.roomId) {
      const oldPlayer = roomManager.leaveRoom(ws.playerId);
      if (oldPlayer) {
        roomManager.broadcastToRoom(ws.roomId, {
          type: 'playerLeft',
          id: ws.playerId
        });
        console.log(`🧹 Cleaned up old room ${ws.roomId} before creating new room`);
      }
    }

    // Generate a unique ID for the quiz master, using the name as base
    const quizMasterPlayerId = `quiz_master_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const defaultTimer = data.defaultTimer ? parseInt(String(data.defaultTimer)) : null;
    const room = roomManager.createRoom(quizMasterName, quizMasterPlayerId, {
      defaultTimer: (defaultTimer && defaultTimer >= 5 && defaultTimer <= 120) ? defaultTimer : null,
    });
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

    // Clear any pending disconnect timer for this player (reconnection)
    const existingTimer = disconnectTimers.get(playerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      disconnectTimers.delete(playerId);
      console.log(`✅ Cleared disconnect timer for reconnecting player ${playerId}`);
    }

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

function verifyQuizMaster(ws) {
  const { playerId, roomId } = ws;
  if (!playerId || !roomId) return null;
  const room = roomManager.getRoom(roomId);
  if (!room) return null;
  if (playerId !== room.quizMasterPlayerId) return null;
  return room;
}

async function handleLoadQuestions(ws) {
  const roomId = ws.roomId;
  if (!roomId) {
    sendError(ws, '必須在房間中才能載入題目');
    return;
  }

  try {
    const questions = await loadQuestions();
    roomManager.setQuestions(roomId, questions);

    ws.send(JSON.stringify({
      type: 'questionsLoaded',
      count: questions.length
    }));

    console.log(`📋 Loaded ${questions.length} questions for room ${roomId}`);
  } catch (error) {
    console.error('Error loading questions:', error);
    sendError(ws, '載入題目失敗');
  }
}

function handleStartGame(ws, data) {
  const room = verifyQuizMaster(ws);
  if (!room) {
    sendError(ws, '只有Quiz Master可以開始遊戲');
    return;
  }

  const question = roomManager.getNextQuestion(room.id);
  if (!question) {
    sendError(ws, '沒有可用的題目，請先載入題目');
    return;
  }

  // 如果房間設定了預設倒數時間，覆蓋題目的倒數時間
  const broadcastQuestion = room.settings?.defaultTimer
    ? { ...question, 倒數時間: room.settings.defaultTimer }
    : question;

  const gs = room.gameState;
  roomManager.broadcastToRoom(room.id, {
    type: 'question',
    question: broadcastQuestion,
    questionIndex: gs.currentQuestionIndex,
    totalQuestions: gs.questions.length
  });

  console.log(`🎮 Game started in room ${room.id}, first question sent`);
}

function handleNextQuestion(ws) {
  const room = verifyQuizMaster(ws);
  if (!room) {
    sendError(ws, '只有Quiz Master可以控制題目');
    return;
  }

  const question = roomManager.getNextQuestion(room.id);
  if (question) {
    // 如果房間設定了預設倒數時間，覆蓋題目的倒數時間
    const broadcastQuestion = room.settings?.defaultTimer
      ? { ...question, 倒數時間: room.settings.defaultTimer }
      : question;

    const gs = room.gameState;
    roomManager.broadcastToRoom(room.id, {
      type: 'question',
      question: broadcastQuestion,
      questionIndex: gs.currentQuestionIndex,
      totalQuestions: gs.questions.length
    });
    console.log(`📝 Next question sent in room ${room.id} (index: ${gs.currentQuestionIndex})`);
  } else {
    // Send final leaderboard before ending the game
    const leaderboard = roomManager.getLeaderboard(room.id);
    roomManager.broadcastToRoom(room.id, {
      type: 'leaderboardUpdate',
      leaderboard: leaderboard
    });
    roomManager.broadcastToRoom(room.id, {
      type: 'gameEnded'
    });
    console.log(`🏁 No more questions in room ${room.id}, game ended`);
  }
}

function handleRevealAnswer(ws) {
  const room = verifyQuizMaster(ws);
  if (!room) {
    sendError(ws, '只有Quiz Master可以揭曉答案');
    return;
  }

  const question = roomManager.getCurrentQuestion(room.id);
  if (!question) {
    sendError(ws, '目前沒有進行中的題目');
    return;
  }

  roomManager.broadcastToRoom(room.id, {
    type: 'answer',
    correctAnswer: question.正確答案,
    score: question.分數
  });

  console.log(`✅ Answer revealed in room ${room.id}: ${question.正確答案}`);
}

function handleShowLeaderboard(ws) {
  const room = verifyQuizMaster(ws);
  if (!room) {
    sendError(ws, '只有Quiz Master可以顯示排行榜');
    return;
  }

  const leaderboard = roomManager.getLeaderboard(room.id);
  roomManager.broadcastToRoom(room.id, {
    type: 'leaderboardUpdate',
    leaderboard: leaderboard
  });

  console.log(`🏆 Leaderboard shown in room ${room.id}`);
}

function handleEndGame(ws) {
  const room = verifyQuizMaster(ws);
  if (!room) {
    sendError(ws, '只有Quiz Master可以結束遊戲');
    return;
  }

  // Send final leaderboard before ending the game
  const leaderboard = roomManager.getLeaderboard(room.id);
  roomManager.broadcastToRoom(room.id, {
    type: 'leaderboardUpdate',
    leaderboard: leaderboard
  });
  roomManager.broadcastToRoom(room.id, {
    type: 'gameEnded'
  });

  // 重置遊戲狀態，允許重新開始遊戲
  room.gameState.currentQuestion = null;
  room.gameState.currentQuestionIndex = -1;
  room.gameState.questionStartTime = null;

  console.log(`🔚 Game ended in room ${room.id}`);
}

function handlePlayerDisconnect(ws, code, reason) {
  const playerId = ws.playerId;
  const roomId = ws.roomId;

  if (!playerId) return;

  const room = roomManager.getRoom(roomId);
  if (!room || !room.players.has(playerId)) {
    console.log(`Player ${playerId} disconnected (not in room) (${code})`);
    return;
  }

  const player = room.players.get(playerId);
  player.ws = null;
  player.disconnectedAt = Date.now();

  console.log(`⏳ Player ${playerId} disconnected from room ${roomId} (${code}) — grace period started`);

  // Clear any existing timer for this player
  const existing = disconnectTimers.get(playerId);
  if (existing) clearTimeout(existing);

  // 10 second grace period before removing player
  const timer = setTimeout(() => {
    disconnectTimers.delete(playerId);

    const currentRoom = roomManager.getRoom(roomId);
    if (!currentRoom) return;

    const currentPlayer = currentRoom.players.get(playerId);
    if (currentPlayer && currentPlayer.ws === null) {
      // Player did not reconnect — remove them now
      const removed = roomManager.leaveRoom(playerId);
      if (removed) {
        roomManager.broadcastToRoom(roomId, {
          type: 'playerLeft',
          id: playerId
        });
      }
      console.log(`🗑️ Player ${playerId} removed after grace period (room ${roomId})`);
    }
  }, 10_000);

  disconnectTimers.set(playerId, timer);
}

function handleRequestGameState(ws) {
  const { playerId, roomId } = ws;
  if (!playerId || !roomId) {
    sendError(ws, 'Must be in a room to request game state');
    return;
  }

  const room = roomManager.getRoom(roomId);
  if (!room || !room.gameState.isActive) {
    ws.send(JSON.stringify({ type: 'roomClosed', message: 'Room no longer exists' }));
    return;
  }

  const gs = room.gameState;
  const currentQuestion = gs.currentQuestionIndex >= 0
    ? gs.questions[gs.currentQuestionIndex] : null;
  const broadcastQuestion = (currentQuestion && room.settings?.defaultTimer)
    ? { ...currentQuestion, 倒數時間: room.settings.defaultTimer }
    : currentQuestion;

  const existingPlayers = [];
  room.players.forEach((p, pid) => {
    if (pid !== playerId) {
      existingPlayers.push({
        id: p.name || pid,
        playerId: pid,
        name: p.name || pid,
        x: p.x,
        y: p.y,
        isQuizMaster: p.isQuizMaster,
        avatar: p.avatar,
      });
    }
  });

  ws.send(JSON.stringify({
    type: 'gameState',
    roomId,
    phase: gs.currentQuestionIndex < 0 ? 'waiting' : 'question',
    currentQuestion: broadcastQuestion,
    questionIndex: gs.currentQuestionIndex,
    totalQuestions: gs.questions.length,
    playerScore: room.scores.get(playerId) || 0,
    leaderboard: roomManager.getLeaderboard(roomId),
    players: existingPlayers,
    isActive: gs.isActive,
  }));

  console.log(`📋 Game state sent to ${playerId} in room ${roomId}`);
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
        if (!playerWs) return;

        // 跳過已被重新分配到其他房間的連線（ws.roomId 已更新但 player 仍在舊房間）
        if (playerWs.roomId !== roomStats.id) {
          console.log(`🔄 Removing stale player ${player.id} from room ${roomStats.id} (ws now in room ${playerWs.roomId})`);
          room.players.delete(player.id);
          return;
        }

        if (!playerWs.isAlive) {
          console.log(`Terminating inactive connection for player ${player.id}`);
          playerWs.terminate();
          roomManager.leaveRoom(player.id);
          return;
        }

        playerWs.isAlive = false;
        playerWs.ping();
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
import dataStore from './data-store.js';
import { WebSocket } from 'ws';

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.players = new Map();
    this.roomIdCounter = 1000;
    
    this.loadPersistedData();
  }

  loadPersistedData() {
    try {
      const persistedRooms = dataStore.getAllRooms();
      
      Object.entries(persistedRooms).forEach(([roomId, roomData]) => {
        const id = parseInt(roomId);
        
        // 跳過已存在的房間（除非是強制重載）
        if (this.rooms.has(id)) {
          console.log(`Skipping existing room ${id} (already in memory)`);
          return;
        }
        
        const room = {
          id: id,
          quizMaster: roomData.quizMaster,
          quizMasterPlayerId: roomData.quizMasterPlayerId || roomData.quizMaster,
          players: dataStore.loadRoomPlayers(id),
          scores: new Map(Object.entries(dataStore.loadRoomScores(id) || {})),
          settings: {
            defaultTimer: null,
            ...(roomData.settings || {})
          },
          gameState: {
            currentQuestion: null,
            questionStartTime: null,
            isActive: true,
            questions: [],
            currentQuestionIndex: -1,
            ...(roomData.gameState || {})
          },
          createdAt: roomData.createdAt,
          lastActivity: roomData.lastActivity
        };
        
        this.rooms.set(id, room);
        
        room.players.forEach((player, playerId) => {
          this.players.set(playerId, { ...player, roomId: id });
        });
        
        if (id >= this.roomIdCounter) {
          this.roomIdCounter = id + 1;
        }
      });
      
      console.log(`📤 Loaded ${this.rooms.size} rooms from persistent storage`);
    } catch (error) {
      console.error('❌ Failed to load persisted data:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // 重新載入持久化數據（用於檢測新房間）
  reloadPersistedData() {
    console.log('🔄 Reloading persisted data to check for new rooms...');
    console.log(`Current rooms in memory: [${Array.from(this.rooms.keys()).join(', ')}]`);
    
    // 強制重載：檢查持久化數據中是否有新房間
    const persistedRooms = dataStore.getAllRooms();
    const persistedRoomIds = Object.keys(persistedRooms).map(id => parseInt(id));
    const memoryRoomIds = Array.from(this.rooms.keys());
    
    console.log(`Persisted rooms: [${persistedRoomIds.join(', ')}]`);
    console.log(`Memory rooms: [${memoryRoomIds.join(', ')}]`);
    
    // 找出不在內存中但在持久化數據中的房間
    const missingRooms = persistedRoomIds.filter(id => !memoryRoomIds.includes(id));
    if (missingRooms.length > 0) {
      console.log(`Found missing rooms: [${missingRooms.join(', ')}]`);
      this.loadPersistedData();
    } else {
      console.log('No new rooms found in persistent storage');
    }
    
    console.log(`Rooms after reload: [${Array.from(this.rooms.keys()).join(', ')}]`);
  }

  createRoom(quizMasterName, quizMasterPlayerId = null, options = {}) {
    const roomId = this.generateRoomId();
    const room = {
      id: roomId,
      quizMaster: quizMasterName,
      quizMasterPlayerId: quizMasterPlayerId || quizMasterName,
      players: new Map(),
      scores: new Map(),
      settings: {
        defaultTimer: options.defaultTimer || null, // null = 使用題目內建的倒數時間
      },
      gameState: {
        currentQuestion: null,
        questionStartTime: null,
        isActive: true,
        questions: [],
        currentQuestionIndex: -1
      },
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.rooms.set(roomId, room);
    this.persistRoom(roomId);
    console.log(`🏠 Room ${roomId} created by ${quizMasterName}`);
    return room;
  }

  generateRoomId() {
    let roomId;
    do {
      roomId = this.roomIdCounter++;
    } while (this.rooms.has(roomId));
    return roomId;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, playerName, ws, playerId = null) {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error('房間不存在');
    }

    if (!room.gameState.isActive) {
      throw new Error('房間已關閉');
    }

    // 使用playerId作為唯一識別符，如果沒有提供則使用playerName
    const uniqueId = playerId || playerName;

    // 檢查是否已有相同的playerId
    if (room.players.has(uniqueId)) {
      // 如果是相同的玩家重新連接，更新WebSocket連接
      const existingPlayer = room.players.get(uniqueId);
      if (existingPlayer.name === playerName) {
        existingPlayer.ws = ws;
        existingPlayer.lastActive = Date.now();
        console.log(`🔄 Player ${playerName} (ID: ${uniqueId}) reconnected to room ${roomId}, isQuizMaster: ${existingPlayer.isQuizMaster}`);
        return existingPlayer;
      } else {
        throw new Error('玩家ID已被使用');
      }
    }

    // 檢查是否有相同的玩家名稱但不同ID（防止重複名稱）
    for (const [pid, player] of room.players) {
      if (player.name === playerName && pid !== uniqueId) {
        throw new Error('玩家名稱已被使用');
      }
    }

    const player = {
      id: uniqueId,
      name: playerName,
      roomId: roomId,
      ws: ws,
      x: 50,
      y: 50,
      joinTime: Date.now(),
      lastActive: Date.now(),
      isQuizMaster: uniqueId === room.quizMasterPlayerId
    };

    room.players.set(uniqueId, player);
    this.players.set(uniqueId, player);
    room.lastActivity = Date.now();

    // 只為非quiz master初始化分數
    if (!room.scores.has(uniqueId) && !player.isQuizMaster) {
      room.scores.set(uniqueId, 0);
    }

    this.persistRoom(roomId);
    this.persistRoomPlayers(roomId);
    this.persistRoomScores(roomId);

    console.log(`👤 Player ${playerName} (ID: ${uniqueId}) joined room ${roomId}. Room size: ${room.players.size}`);
    return player;
  }

  leaveRoom(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    const room = this.getRoom(player.roomId);
    if (room) {
      room.players.delete(playerId);
      room.lastActivity = Date.now();
      
      this.persistRoom(player.roomId);
      this.persistRoomPlayers(player.roomId);
      
      if (player.isQuizMaster) {
        this.closeRoom(room.id);
      }
    }

    this.players.delete(playerId);
    console.log(`👤 Player ${playerId} left room ${player.roomId}`);
    return player;
  }

  closeRoom(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.gameState.isActive = false;
    
    room.players.forEach(player => {
      if (player.ws && player.ws.readyState === player.ws.OPEN) {
        try {
          player.ws.send(JSON.stringify({
            type: 'roomClosed',
            message: '房間已關閉'
          }));
        } catch (error) {
          console.error(`Failed to notify player ${player.id}:`, error);
        }
      }
    });

    room.players.forEach(player => {
      this.players.delete(player.id);
    });

    this.rooms.delete(roomId);
    
    dataStore.deleteRoom(roomId);
    dataStore.deleteRoomScores(roomId);
    dataStore.deleteRoomPlayers(roomId);
    
    console.log(`🏠 Room ${roomId} closed and deleted from storage`);
  }

  updateScore(playerId, scoreToAdd) {
    const player = this.players.get(playerId);
    if (!player) return null;

    const room = this.getRoom(player.roomId);
    if (!room) return null;

    // 不為quiz master更新分數
    if (player.isQuizMaster) {
      console.log(`🚫 Ignoring score update for quiz master: ${playerId}`);
      return null;
    }

    const currentScore = room.scores.get(playerId) || 0;
    const newScore = currentScore + scoreToAdd;
    room.scores.set(playerId, newScore);
    room.lastActivity = Date.now();

    this.persistRoom(player.roomId);
    this.persistRoomScores(player.roomId);

    console.log(`🎯 Score update: ${playerId} += ${scoreToAdd} (total: ${newScore}) in room ${room.id}`);
    return {
      playerId,
      scoreAdded: scoreToAdd,
      totalScore: newScore,
      roomId: room.id
    };
  }

  getLeaderboard(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return [];

    const leaderboard = Array.from(room.scores.entries())
      .filter(([playerId]) => {
        // 排除quiz master（通過檢查player的isQuizMaster屬性）
        const player = room.players.get(playerId);
        return !player?.isQuizMaster;
      })
      .map(([playerId, score]) => {
        const player = room.players.get(playerId);
        return {
          id: player?.name || playerId, // 顯示名稱作為id（向後兼容）
          playerId: playerId, // 實際的唯一ID
          name: player?.name || playerId, // 玩家顯示名稱
          score: score,
          avatar: player?.avatar
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    return leaderboard;
  }

  broadcastToRoom(roomId, data, excludePlayer = null) {
    const room = this.getRoom(roomId);
    if (!room) return 0;

    const message = JSON.stringify(data);
    let successCount = 0;
    const failedPlayers = [];

    room.players.forEach((player, playerId) => {
      if (excludePlayer && playerId === excludePlayer) return;

      try {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
          player.ws.send(message);
          successCount++;
        } else {
          failedPlayers.push(playerId);
        }
      } catch (error) {
        console.error(`Failed to send message to player ${playerId}:`, error);
        failedPlayers.push(playerId);
      }
    });

    // Remove disconnected players after iteration to avoid modifying map during forEach
    for (const playerId of failedPlayers) {
      console.log(`🧹 Removing disconnected player ${playerId} from room ${roomId}`);
      room.players.delete(playerId);
      this.players.delete(playerId);
    }

    const recipients = Array.from(room.players.keys()).filter(id => !excludePlayer || id !== excludePlayer);
    console.log(`📡 Room ${roomId} broadcast: ${data.type} to ${successCount} players (${failedPlayers.length} failed) - Recipients: ${recipients.join(', ')}`);

    return successCount;
  }

  setQuestions(roomId, questions) {
    const room = this.getRoom(roomId);
    if (!room) return false;
    room.gameState.questions = questions;
    // Only reset index if game hasn't started yet (preserve progress during reload)
    if (room.gameState.currentQuestionIndex < 0) {
      room.gameState.currentQuestionIndex = -1;
    }
    room.lastActivity = Date.now();
    return true;
  }

  getNextQuestion(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const nextIndex = room.gameState.currentQuestionIndex + 1;
    if (nextIndex >= room.gameState.questions.length) return null;

    room.gameState.currentQuestionIndex = nextIndex;
    room.gameState.currentQuestion = room.gameState.questions[nextIndex];
    room.gameState.questionStartTime = Date.now();
    room.lastActivity = Date.now();

    return room.gameState.questions[nextIndex];
  }

  getCurrentQuestion(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const index = room.gameState.currentQuestionIndex;
    if (index < 0 || index >= room.gameState.questions.length) return null;

    return room.gameState.questions[index];
  }

  cleanupRooms() {
    const now = Date.now();
    const maxInactiveTime = 30 * 60 * 1000; // 30分鐘

    this.rooms.forEach((room, roomId) => {
      if (now - room.lastActivity > maxInactiveTime) {
        console.log(`🧹 Cleaning up inactive room ${roomId}`);
        this.closeRoom(roomId);
      }
    });
  }

  getRoomStats(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    return {
      id: room.id,
      quizMaster: room.quizMaster,
      playerCount: room.players.size,
      players: Array.from(room.players.keys()),
      isActive: room.gameState.isActive,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    };
  }

  getAllRoomsStats() {
    return Array.from(this.rooms.keys())
      .map(roomId => this.getRoomStats(roomId))
      .filter((stats) => stats !== null);
  }

  persistRoom(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const roomData = {
      id: room.id,
      quizMaster: room.quizMaster,
      quizMasterPlayerId: room.quizMasterPlayerId,
      settings: room.settings,
      gameState: room.gameState,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    };

    return dataStore.saveRoom(roomId, roomData);
  }

  persistRoomScores(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const scoresObj = {};
    room.scores.forEach((score, playerId) => {
      scoresObj[playerId] = score;
    });

    return dataStore.saveRoomScores(roomId, scoresObj);
  }

  persistRoomPlayers(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    return dataStore.saveRoomPlayers(roomId, room.players);
  }

  getStorageStats() {
    return {
      memory: {
        totalRooms: this.rooms.size,
        totalPlayers: this.players.size,
        activeRooms: Array.from(this.rooms.values()).filter(r => r.gameState.isActive).length
      },
      persistent: dataStore.getStorageStats()
    };
  }
}

const roomManager = new RoomManager();

setInterval(() => {
  roomManager.cleanupRooms();
}, 5 * 60 * 1000); // 每5分鐘清理一次

setInterval(() => {
  roomManager.getAllRoomsStats().forEach(roomStats => {
    if (roomStats.isActive) {
      roomManager.persistRoom(roomStats.id);
      roomManager.persistRoomScores(roomStats.id);
      roomManager.persistRoomPlayers(roomStats.id);
    }
  });
  console.log('💾 Periodic data persistence completed');
}, 2 * 60 * 1000); // 每2分鐘持久化一次

export default roomManager;
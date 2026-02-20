import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataStore {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.roomsFile = path.join(this.dataDir, 'rooms.json');
    this.scoresFile = path.join(this.dataDir, 'scores.json');
    this.playersFile = path.join(this.dataDir, 'players.json');
    
    this.ensureDataDirectory();
    this.initializeFiles();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log('📁 Created data directory:', this.dataDir);
    }
  }

  initializeFiles() {
    const files = [
      { path: this.roomsFile, defaultData: {} },
      { path: this.scoresFile, defaultData: {} },
      { path: this.playersFile, defaultData: {} }
    ];

    files.forEach(({ path, defaultData }) => {
      if (!fs.existsSync(path)) {
        this.writeJsonFile(path, defaultData);
        console.log('📄 Created data file:', path);
      }
    });
  }

  readJsonFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`⚠️ Failed to read ${filePath}:`, error instanceof Error ? error.message : 'Unknown error');
      return {};
    }
  }

  writeJsonFile(filePath, data) {
    try {
      const tempPath = filePath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (error) {
      console.error(`❌ Failed to write ${filePath}:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  saveRoom(roomId, roomData) {
    const rooms = this.readJsonFile(this.roomsFile);
    rooms[roomId] = {
      ...roomData,
      lastSaved: Date.now()
    };
    
    const success = this.writeJsonFile(this.roomsFile, rooms);
    if (success) {
      console.log(`💾 Room ${roomId} saved to persistent storage`);
    }
    return success;
  }

  loadRoom(roomId) {
    const rooms = this.readJsonFile(this.roomsFile);
    return rooms[roomId] || null;
  }

  deleteRoom(roomId) {
    const rooms = this.readJsonFile(this.roomsFile);
    if (rooms[roomId]) {
      delete rooms[roomId];
      const success = this.writeJsonFile(this.roomsFile, rooms);
      if (success) {
        console.log(`🗑️ Room ${roomId} deleted from persistent storage`);
      }
      return success;
    }
    return true;
  }

  getAllRooms() {
    return this.readJsonFile(this.roomsFile);
  }

  saveRoomScores(roomId, scores) {
    const allScores = this.readJsonFile(this.scoresFile);
    allScores[roomId] = {
      scores: scores,
      lastUpdated: Date.now()
    };
    
    const success = this.writeJsonFile(this.scoresFile, allScores);
    if (success) {
      console.log(`📊 Scores for room ${roomId} saved to persistent storage`);
    }
    return success;
  }

  loadRoomScores(roomId) {
    const allScores = this.readJsonFile(this.scoresFile);
    return allScores[roomId]?.scores || {};
  }

  deleteRoomScores(roomId) {
    const allScores = this.readJsonFile(this.scoresFile);
    if (allScores[roomId]) {
      delete allScores[roomId];
      const success = this.writeJsonFile(this.scoresFile, allScores);
      if (success) {
        console.log(`🗑️ Scores for room ${roomId} deleted from persistent storage`);
      }
      return success;
    }
    return true;
  }

  saveRoomPlayers(roomId, players) {
    const allPlayers = this.readJsonFile(this.playersFile);
    
    const playersData = {};
    players.forEach((player, playerId) => {
      playersData[playerId] = {
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        joinTime: player.joinTime,
        lastActive: player.lastActive,
        isQuizMaster: player.isQuizMaster
      };
    });
    
    allPlayers[roomId] = {
      players: playersData,
      lastUpdated: Date.now()
    };
    
    const success = this.writeJsonFile(this.playersFile, allPlayers);
    if (success) {
      console.log(`👥 Players for room ${roomId} saved to persistent storage`);
    }
    return success;
  }

  loadRoomPlayers(roomId) {
    const allPlayers = this.readJsonFile(this.playersFile);
    const roomData = allPlayers[roomId];
    
    if (!roomData) {
      return new Map();
    }
    
    const players = new Map();
    Object.entries(roomData.players).forEach(([playerId, playerData]) => {
      players.set(playerId, playerData);
    });
    
    return players;
  }

  deleteRoomPlayers(roomId) {
    const allPlayers = this.readJsonFile(this.playersFile);
    if (allPlayers[roomId]) {
      delete allPlayers[roomId];
      const success = this.writeJsonFile(this.playersFile, allPlayers);
      if (success) {
        console.log(`🗑️ Players for room ${roomId} deleted from persistent storage`);
      }
      return success;
    }
    return true;
  }

  cleanupOldData(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;

    const rooms = this.readJsonFile(this.roomsFile);
    const validRooms = {};
    Object.entries(rooms).forEach(([roomId, roomData]) => {
      if (roomData.lastSaved && now - roomData.lastSaved < maxAge) {
        validRooms[roomId] = roomData;
      } else {
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.writeJsonFile(this.roomsFile, validRooms);
      
      const scores = this.readJsonFile(this.scoresFile);
      const players = this.readJsonFile(this.playersFile);
      
      Object.keys(rooms).forEach(roomId => {
        if (!validRooms[roomId]) {
          delete scores[roomId];
          delete players[roomId];
        }
      });
      
      this.writeJsonFile(this.scoresFile, scores);
      this.writeJsonFile(this.playersFile, players);
      
      console.log(`🧹 Cleaned up ${cleaned} old rooms and their data`);
    }

    return cleaned;
  }

  getStorageStats() {
    const rooms = this.readJsonFile(this.roomsFile);
    const scores = this.readJsonFile(this.scoresFile);
    const players = this.readJsonFile(this.playersFile);

    return {
      totalRooms: Object.keys(rooms).length,
      totalScoreRecords: Object.keys(scores).length,
      totalPlayerRecords: Object.keys(players).length,
      dataDirectory: this.dataDir,
      files: {
        rooms: this.roomsFile,
        scores: this.scoresFile,
        players: this.playersFile
      }
    };
  }

  exportAllData() {
    return {
      rooms: this.readJsonFile(this.roomsFile),
      scores: this.readJsonFile(this.scoresFile),
      players: this.readJsonFile(this.playersFile),
      exportTime: Date.now()
    };
  }

  importAllData(data) {
    try {
      if (data.rooms) this.writeJsonFile(this.roomsFile, data.rooms);
      if (data.scores) this.writeJsonFile(this.scoresFile, data.scores);
      if (data.players) this.writeJsonFile(this.playersFile, data.players);
      
      console.log('📥 Data import completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Data import failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

const dataStore = new DataStore();

setInterval(() => {
  dataStore.cleanupOldData();
}, 30 * 60 * 1000);

export default dataStore;
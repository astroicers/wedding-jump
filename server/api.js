import express from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import roomManager from './room-manager.js';
import dataStore from './data-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3002;

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://localhost:3000', 'https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Cache for questions to avoid repeated file reads
let questionsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 minute

function validateQuestion(question) {
  return !!(question.題目 && 
         question.倒數時間 && 
         question.正確答案 && 
         question.分數 &&
         /^[OX]$/.test(question.正確答案) &&
         !isNaN(parseInt(question.倒數時間)) &&
         !isNaN(parseInt(question.分數)));
}

async function loadQuestions() {
  return new Promise((resolve, reject) => {
    const results = [];
    const csvPath = path.join(__dirname, 'questions.csv');
    
    if (!fs.existsSync(csvPath)) {
      reject(new Error('Questions file not found'));
      return;
    }
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (validateQuestion(data)) {
          results.push({
            題目: data.題目.trim(),
            倒數時間: parseInt(data.倒數時間),
            正確答案: data.正確答案.trim(),
            分數: parseInt(data.分數)
          });
        } else {
          console.warn('Invalid question data:', data);
        }
      })
      .on('end', () => {
        console.log(`Loaded ${results.length} questions from CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

app.get('/questions', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache validity
    if (questionsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Serving questions from cache');
      return res.json({
        success: true,
        data: questionsCache,
        cached: true,
        timestamp: cacheTimestamp
      });
    }
    
    // Load fresh questions
    const questions = await loadQuestions();
    
    // Update cache
    questionsCache = questions;
    cacheTimestamp = now;
    
    res.json({
      success: true,
      data: questions,
      cached: false,
      timestamp: now
    });
    
  } catch (error) {
    console.error('Error loading questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    questionsLoaded: questionsCache ? questionsCache.length : 0
  });
});

// 房間管理API
app.post('/api/rooms', (req, res) => {
  try {
    const { quizMaster } = req.body;
    
    if (!quizMaster || typeof quizMaster !== 'string' || quizMaster.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Quiz Master name is required'
      });
    }
    
    // 為 quiz master 生成唯一的 playerId
    const quizMasterPlayerId = `quiz_master_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const room = roomManager.createRoom(quizMaster.trim(), quizMasterPlayerId);
    
    res.json({
      success: true,
      room: {
        id: room.id,
        quizMaster: room.quizMaster,
        quizMasterPlayerId: quizMasterPlayerId,
        createdAt: room.createdAt
      }
    });
    
    console.log(`API: Room ${room.id} created for ${quizMaster} with playerId ${quizMasterPlayerId}`);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 獲取房間信息
app.get('/api/rooms/:roomId', (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    const roomStats = roomManager.getRoomStats(roomId);
    
    if (!roomStats) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    res.json({
      success: true,
      room: roomStats
    });
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 獲取房間排行榜
app.get('/api/rooms/:roomId/leaderboard', (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    const leaderboard = roomManager.getLeaderboard(roomId);
    
    res.json({
      success: true,
      roomId: roomId,
      leaderboard: leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 獲取所有房間統計
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = roomManager.getAllRoomsStats();
    
    res.json({
      success: true,
      rooms: rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rooms',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 關閉房間
app.delete('/api/rooms/:roomId', (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const { quizMaster } = req.body;
    
    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid room ID'
      });
    }
    
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // 檢查是否為房間的Quiz Master
    if (quizMaster && room.quizMaster !== quizMaster) {
      return res.status(403).json({
        success: false,
        error: 'Only the Quiz Master can close the room'
      });
    }
    
    roomManager.closeRoom(roomId);
    
    res.json({
      success: true,
      message: `Room ${roomId} closed successfully`
    });
    
    console.log(`API: Room ${roomId} closed`);
  } catch (error) {
    console.error('Error closing room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 獲取存儲統計
app.get('/api/storage/stats', (req, res) => {
  try {
    const stats = roomManager.getStorageStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 導出所有數據（備份）
app.get('/api/storage/export', (req, res) => {
  try {
    const data = dataStore.exportAllData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 導入數據（恢復）
app.post('/api/storage/import', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'No data provided for import'
      });
    }
    
    const success = dataStore.importAllData(data);
    
    if (success) {
      res.json({
        success: true,
        message: 'Data imported successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to import data'
      });
    }
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 清理過期數據
app.delete('/api/storage/cleanup', (req, res) => {
  try {
    const { maxAge } = req.body;
    const maxAgeMs = maxAge ? parseInt(maxAge) : 24 * 60 * 60 * 1000; // 預設24小時
    
    const cleaned = dataStore.cleanupOldData(maxAgeMs);
    
    res.json({
      success: true,
      message: `Cleaned up ${cleaned} old records`,
      cleanedCount: cleaned
    });
  } catch (error) {
    console.error('Error cleaning up data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Wedding Jump API',
    version: '2.0.0',
    endpoints: {
      '/questions': 'GET - Retrieve quiz questions',
      '/health': 'GET - Health check',
      '/api/info': 'GET - API information',
      '/api/rooms': 'GET - Get all rooms, POST - Create room',
      '/api/rooms/:roomId': 'GET - Get room info, DELETE - Close room',
      '/api/rooms/:roomId/leaderboard': 'GET - Get room leaderboard',
      '/api/storage/stats': 'GET - Get storage statistics',
      '/api/storage/export': 'GET - Export all data for backup',
      '/api/storage/import': 'POST - Import data from backup',
      '/api/storage/cleanup': 'DELETE - Cleanup old data records'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('API server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('API server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log('Server started at:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Pre-load questions on startup
  loadQuestions()
    .then(questions => {
      questionsCache = questions;
      cacheTimestamp = Date.now();
      console.log(`Pre-loaded ${questions.length} questions`);
    })
    .catch(error => {
      console.error('Failed to pre-load questions:', error.message);
    });
});
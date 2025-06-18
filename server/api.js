import express from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3002;

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://localhost:3000', 'https://your-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
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
  return question.題目 && 
         question.倒數時間 && 
         question.正確答案 && 
         question.分數 &&
         /^[OX]$/.test(question.正確答案) &&
         !isNaN(parseInt(question.倒數時間)) &&
         !isNaN(parseInt(question.分數));
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
      message: error.message
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

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Wedding Jump API',
    version: '1.0.0',
    endpoints: {
      '/questions': 'GET - Retrieve quiz questions',
      '/health': 'GET - Health check',
      '/api/info': 'GET - API information'
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
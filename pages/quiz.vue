<template>
  <div class="quiz-master-container">
    <div class="quiz-header">
      <h1>🎯 Quiz Master</h1>
      <div class="stats">
        <span>題目: {{ questions.length }}</span>
        <span>玩家: {{ Object.keys(scores).length }}</span>
      </div>
    </div>
    
    <div class="main-content">
      <div class="question-panel">
        <div v-if="!gameStarted" class="start-screen">
          <!-- 匯入功能 -->
          <div class="questions-management">
            <div class="import-section">
              <label for="csv-upload" class="upload-button">
                📁 匯入 CSV 題目
              </label>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                @change="handleFileUpload" 
                style="display: none;"
              />
              <div v-if="uploadedFileName" class="file-info">
                已選擇: {{ uploadedFileName }}
              </div>
            </div>
            
            <div class="questions-preview">
              <h4>目前題目:</h4>
              <div class="questions-list">
                <div v-for="(q, index) in questions.slice(0, 3)" :key="index" class="question-item">
                  {{ index + 1 }}. {{ q.題目 }} ({{ q.分數 }}分)
                </div>
                <div v-if="questions.length > 3" class="more-questions">
                  ... 還有 {{ questions.length - 3 }} 道題目
                </div>
              </div>
            </div>
          </div>
          
          <div class="game-controls">
            <h2>準備開始遊戲</h2>
            <p>已載入 {{ questions.length }} 道題目</p>
            <button class="start-button" @click="startGame" :disabled="questions.length === 0">
              ▶️ 開始遊戲
            </button>
          </div>
        </div>
        
        <div v-else class="game-screen">
          <div v-if="currentQuestion" class="question-display">
            <div class="question-header">
              <span>第 {{ currentQuestionIndex + 1 }} 題 / {{ questions.length }}</span>
              <span>💰 {{ currentQuestion.分數 }} 分</span>
            </div>
            
            <h2 class="question-text">{{ currentQuestion.題目 }}</h2>
            
            <div v-if="countdown > 0" class="countdown">
              <div class="countdown-number">{{ countdown }}</div>
              <p>秒後公布答案</p>
            </div>
            
            <div v-else class="answer-section">
              <div class="correct-answer">
                正確答案: {{ currentQuestion.正確答案 === 'O' ? '✅ 正確 (O)' : '❌ 錯誤 (X)' }}
              </div>
              <button class="next-button" @click="nextQuestion">
                <span v-if="currentQuestionIndex < questions.length - 1">下一題 →</span>
                <span v-else>遊戲結束 🏁</span>
              </button>
            </div>
          </div>
          
          <div v-else class="game-complete">
            <h2>🎉 遊戲結束！</h2>
            <p>感謝所有玩家的參與</p>
          </div>
        </div>
      </div>
      
      <div class="scoreboard">
        <h3>🏆 即時排行榜 <span class="live-indicator">🔴 LIVE</span></h3>
        <div class="scoreboard-info">
          <span>線上玩家: {{ sortedScores.length }}</span>
          <span v-if="gameStarted">遊戲進行中</span>
          <span v-else>等待開始</span>
        </div>
        <div v-if="sortedScores.length === 0" class="no-players">
          等待玩家加入...
        </div>
        <div v-else class="score-list">
          <div v-for="(score, index) in sortedScores" :key="score.id" class="score-item" :class="{ 'top-player': index === 0 && score.score > 0 }">
            <span class="rank">{{ index + 1 }}</span>
            <span class="player-name">{{ score.id }}</span>
            <span class="score-value">{{ score.score }}分</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-master-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.quiz-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quiz-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.stats {
  display: flex;
  gap: 2rem;
  font-weight: 600;
  color: #667eea;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.question-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.start-screen {
  text-align: center;
}

.questions-management {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 15px;
  border: 2px dashed #dee2e6;
}

.import-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  border: none;
}

.file-info {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #666;
}

.questions-preview h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.questions-list {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  max-height: 150px;
  overflow-y: auto;
}

.question-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
  color: #555;
}

.question-item:last-child {
  border-bottom: none;
}

.more-questions {
  padding: 0.5rem 0;
  font-style: italic;
  color: #888;
  text-align: center;
}

.game-controls h2 {
  color: #333;
  margin-bottom: 1rem;
}

.game-controls p {
  color: #666;
  margin-bottom: 2rem;
}

.start-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1.25rem 2.5rem;
  border-radius: 15px;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.question-display {
  text-align: center;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
  font-weight: 600;
}

.question-text {
  font-size: 2.2rem;
  color: #333;
  margin: 2rem 0;
}

.countdown {
  margin: 2rem 0;
}

.countdown-number {
  font-size: 4rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 1rem;
}

.answer-section {
  margin: 2rem 0;
}

.correct-answer {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.next-button {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
}

.game-complete {
  text-align: center;
}

.game-complete h2 {
  color: #333;
  margin-bottom: 1rem;
}

.scoreboard {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  height: fit-content;
}

.scoreboard h3 {
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.live-indicator {
  font-size: 0.7rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.scoreboard-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #666;
}

.no-players {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.rank {
  font-weight: 700;
  color: #667eea;
  min-width: 30px;
}

.player-name {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.score-value {
  font-weight: 700;
  color: #667eea;
}

.top-player {
  background: linear-gradient(135deg, #ffd700, #ffed4e) !important;
  border: 2px solid #f39c12;
  transform: scale(1.02);
}

.top-player .rank {
  color: #d68910 !important;
}

.top-player .player-name {
  color: #d68910 !important;
  font-weight: 700;
}

.top-player .score-value {
  color: #d68910 !important;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { useNuxtApp, useRuntimeConfig } from '#app';

const { $websocket } = useNuxtApp();
const questions = ref([]);
const currentQuestionIndex = ref(0);
const countdown = ref(0);
const scores = ref({});
const gameStarted = ref(false);
const uploadedFileName = ref('');

// 初始化預設題目
questions.value = [
  { 題目: "1+1=2?", 倒數時間: 5, 正確答案: "O", 分數: 10 },
  { 題目: "地球是平的嗎?", 倒數時間: 5, 正確答案: "X", 分數: 15 },
  { 題目: "5乘以6等於30嗎?", 倒數時間: 5, 正確答案: "O", 分數: 30 }
];

const currentQuestion = computed(() => {
  if (currentQuestionIndex.value >= 0 && currentQuestionIndex.value < questions.value.length) {
    return questions.value[currentQuestionIndex.value];
  }
  return null;
});

const sortedScores = computed(() => {
  const entries = Object.entries(scores.value)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
  
  console.log('Scoreboard updated:', entries);
  return entries;
});

onMounted(async () => {
  // 載入題目
  try {
    const config = useRuntimeConfig();
    const apiUrl = config.public.apiUrl || 'http://localhost:3002';
    const response = await axios.get(`${apiUrl}/questions`);
    const questionsData = response.data.success ? response.data.data : response.data;
    questions.value = questionsData;
  } catch (error) {
    console.error('Error loading questions:', error);
  }

  // WebSocket 連接和消息處理
  console.log('💡 Starting WebSocket setup for quiz master');
  console.log('📊 WebSocket object:', $websocket);
  console.log('📊 WebSocket readyState:', $websocket?.readyState);
  
  if ($websocket) {
    let isQuizMasterConnected = false;
    let connectionAttempts = 0;
    const maxAttempts = 10;
    
    // WebSocket連接處理
    const connectQuizMaster = () => {
      connectionAttempts++;
      console.log(`🔗 Quiz master connection attempt ${connectionAttempts}/${maxAttempts}`);
      console.log(`📡 WebSocket readyState: ${$websocket.readyState} (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3)`);
      
      if ($websocket.readyState === WebSocket.OPEN) {
        const joinMessage = { type: 'join', name: 'quiz_master' };
        console.log('📤 Sending join message:', joinMessage);
        
        const success = $websocket.send(JSON.stringify(joinMessage));
        console.log('📤 Send result:', success);
        
        if (success !== false) {
          isQuizMasterConnected = true;
          console.log('✅ Quiz master successfully sent join message');
          
          // 連接成功後請求現有玩家
          setTimeout(() => {
            if ($websocket.readyState === WebSocket.OPEN) {
              $websocket.send(JSON.stringify({ type: 'requestExistingPlayers' }));
              console.log('📋 Requested existing players list');
            }
          }, 1000);
        } else {
          console.error('❌ Failed to send join message');
        }
      } else if (connectionAttempts < maxAttempts) {
        console.log(`⏳ WebSocket not ready (state: ${$websocket.readyState}), retrying in 500ms...`);
        setTimeout(connectQuizMaster, 500);
      } else {
        console.error('❌ Max connection attempts reached for quiz master');
      }
    };

    // 監聽WebSocket連接狀態
    window.addEventListener('websocket-connected', () => {
      console.log('🌐 WebSocket connected event received, connecting quiz master...');
      setTimeout(connectQuizMaster, 100);
    });

    // 立即嘗試連接（如果已經連接）
    setTimeout(connectQuizMaster, 100);

    // 處理WebSocket消息
    const handleWebSocketMessage = (event) => {
      const data = event.detail;
      console.log('📨 Quiz received WebSocket message:', data);
      
      if (data.type === 'scoreUpdate') {
        // 處理分數更新
        if (data.id && data.id !== 'quiz_master') {
          const newScore = data.totalScore !== undefined ? data.totalScore : (scores.value[data.id] || 0) + (data.score || 0);
          
          // 強制響應性更新
          scores.value = {
            ...scores.value,
            [data.id]: newScore
          };
          
          console.log(`🎯 Score updated: ${data.id} = ${newScore} points (gained ${data.score})`, 'Total players:', Object.keys(scores.value).length);
          
          // 手動觸發排行榜更新
          nextTick(() => {
            console.log('📊 Scoreboard should now update');
          });
        }
      } else if (data.type === 'newPlayer') {
        // 處理新玩家加入
        if (data.id && data.id !== 'quiz_master') {
          if (!scores.value.hasOwnProperty(data.id)) {
            scores.value = {
              ...scores.value,
              [data.id]: 0
            };
            console.log(`👤 New player joined: ${data.id}`, 'Total players:', Object.keys(scores.value).length);
          }
        }
      } else if (data.type === 'playerLeft') {
        // 處理玩家離開
        if (data.id && scores.value.hasOwnProperty(data.id)) {
          const newScores = { ...scores.value };
          delete newScores[data.id];
          scores.value = newScores;
          console.log(`👋 Player left: ${data.id}`, 'Total players:', Object.keys(scores.value).length);
        }
      }
    };

    // 監聽WebSocket消息
    window.addEventListener('websocket-message', handleWebSocketMessage);
    
    // 清理函數
    onUnmounted(() => {
      window.removeEventListener('websocket-message', handleWebSocketMessage);
    });
  }
});

function startGame() {
  if (questions.value.length === 0) return;
  
  gameStarted.value = true;
  currentQuestionIndex.value = 0;
  
  // 保留現有玩家，只重置分數為0，使用響應性更新方式
  const resetScores = {};
  Object.keys(scores.value).forEach(playerId => {
    resetScores[playerId] = 0;
  });
  scores.value = resetScores;
  
  console.log('Game started with players:', Object.keys(scores.value), 'Count:', Object.keys(scores.value).length);
  startCountdown();
}

function startCountdown() {
  if (currentQuestion.value) {
    countdown.value = parseInt(currentQuestion.value.倒數時間);
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value === 0) {
        clearInterval(timer);
        if ($websocket && $websocket.readyState === WebSocket.OPEN) {
          const message = {
            type: 'answer',
            correctAnswer: currentQuestion.value.正確答案,
            score: parseInt(currentQuestion.value.分數)
          };
          const success = $websocket.send(JSON.stringify(message));
          console.log('📢 Broadcasting answer:', message, success ? '✅ Success' : '❌ Failed');
        } else {
          console.error('❌ Cannot broadcast answer - WebSocket not connected');
        }
      }
    }, 1000);
  }
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    startCountdown();
  } else {
    currentQuestionIndex.value = null;
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFileName.value = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csv = e.target.result;
      const parsedQuestions = parseCSV(csv);
      
      if (parsedQuestions.length > 0) {
        questions.value = parsedQuestions;
        setTimeout(() => {
          uploadedFileName.value = `✅ 已匯入 ${parsedQuestions.length} 道題目`;
        }, 500);
      } else {
        uploadedFileName.value = '❌ 沒有找到有效題目';
      }
    } catch (error) {
      uploadedFileName.value = '❌ 檔案格式錯誤';
    }
  };
  
  reader.readAsText(file, 'UTF-8');
}

function parseCSV(csv) {
  const lines = csv.split('\n').filter(line => line.trim());
  const questions = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line);
    
    if (columns.length >= 4) {
      const question = {
        題目: columns[0].replace(/^"|"$/g, '').trim(),
        倒數時間: parseInt(columns[1]) || 5,
        正確答案: columns[2].trim().toUpperCase(),
        分數: parseInt(columns[3]) || 10
      };
      
      if (question.題目 && 
          (question.正確答案 === 'O' || question.正確答案 === 'X') &&
          question.倒數時間 > 0 && 
          question.分數 > 0) {
        questions.push(question);
      }
    }
  }
  
  return questions;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}
</script>
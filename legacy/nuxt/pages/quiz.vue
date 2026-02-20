<template>
  <div class="quiz-master-container">
    <!-- 房間創建頁面 -->
    <div v-if="!roomCreated" class="room-setup">
      <div class="setup-card">
        <h1>🎮 創建 Quiz 房間</h1>
        <form @submit.prevent="createRoom" class="setup-form">
          <div class="input-group">
            <label for="quizMaster">👨‍🏫 Quiz Master 名稱:</label>
            <input 
              id="quizMaster"
              v-model="quizMasterName" 
              type="text" 
              placeholder="輸入您的名稱" 
              required
              maxlength="20"
              class="name-input"
            />
          </div>
          <button type="submit" class="create-room-btn" :disabled="isCreatingRoom">
            <span v-if="isCreatingRoom">正在創建...</span>
            <span v-else>🏠 創建房間</span>
          </button>
        </form>
        
        <div v-if="createError" class="error-message">
          {{ createError }}
        </div>
      </div>
    </div>
    
    <!-- Quiz Master 主頁面 -->
    <div v-else>
      <div class="quiz-header">
        <div class="room-info">
          <h1>🎯 Quiz Master</h1>
          <div class="room-details">
            <span class="room-id">🏠 房間號: {{ roomId }}</span>
            <span class="quiz-master-name">👨‍🏫 {{ quizMasterName }}</span>
          </div>
        </div>
        <div class="stats">
          <span>題目: {{ questions.length }}</span>
          <span>玩家: {{ Object.keys(scores).length }}</span>
          <button class="reset-button" @click="resetSession" title="重新開始">
            🔄 重置
          </button>
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
              <p class="room-info-display">
                玩家可使用房間號 <strong>{{ roomId }}</strong> 加入遊戲
              </p>
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
                <div class="answer-actions">
                  <button class="next-button" @click="nextQuestion">
                    <span v-if="currentQuestionIndex < questions.length - 1">下一題 →</span>
                    <span v-else>遊戲結束 🏁</span>
                  </button>
                  <button v-if="currentQuestionIndex === questions.length - 1" class="download-csv-btn-inline" @click="downloadLeaderboardCSV">
                    📈 下載排行榜
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else class="game-complete">
              <h2>🎉 遊戲結束！</h2>
              <p>感謝所有玩家的參與</p>
              <div class="game-complete-actions">
                <button class="download-csv-btn" @click="downloadLeaderboardCSV">
                  📈 下載排行榜 (CSV)
                </button>
              </div>
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
            <div v-for="(score, index) in sortedScores" :key="score.playerId || score.id" class="score-item" :class="{ 'top-player': index === 0 && score.score > 0 }">
              <span class="rank">{{ index + 1 }}</span>
              <span class="player-name">{{ score.name || score.id }}</span>
              <span class="score-value">{{ score.score }}分</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { useNuxtApp, useRuntimeConfig } from '#app';

const { $websocket } = useNuxtApp();
const questions = ref([]);
const currentQuestionIndex = ref(0);
const countdown = ref(0);
const scores = ref({});
const leaderboard = ref([]); // 新增排行榜數據
const gameStarted = ref(false);
const uploadedFileName = ref('');

// 房間管理狀態
const roomCreated = ref(false);
const roomId = ref(null);
const quizMasterName = ref('');
const quizMasterPlayerId = ref(''); // 保存 quiz master 的 playerId
const isCreatingRoom = ref(false);
const createError = ref('');

// LocalStorage keys
const STORAGE_KEYS = {
  QUIZ_MASTER: 'wedding_quiz_master',
  QUIZ_MASTER_PLAYER_ID: 'wedding_quiz_master_player_id',
  ROOM_ID: 'wedding_room_id',
  ROOM_CREATED: 'wedding_room_created',
  GAME_STARTED: 'wedding_game_started',
  CURRENT_QUESTION: 'wedding_current_question',
  SCORES: 'wedding_scores'
};

// 保存到localStorage
const saveToStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.QUIZ_MASTER, quizMasterName.value);
    localStorage.setItem(STORAGE_KEYS.QUIZ_MASTER_PLAYER_ID, quizMasterPlayerId.value);
    localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId.value?.toString() || '');
    localStorage.setItem(STORAGE_KEYS.ROOM_CREATED, roomCreated.value.toString());
    localStorage.setItem(STORAGE_KEYS.GAME_STARTED, gameStarted.value.toString());
    localStorage.setItem(STORAGE_KEYS.CURRENT_QUESTION, currentQuestionIndex.value.toString());
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores.value));
  }
};

// 從localStorage載入
const loadFromStorage = () => {
  if (typeof window !== 'undefined') {
    const savedQuizMaster = localStorage.getItem(STORAGE_KEYS.QUIZ_MASTER);
    const savedQuizMasterPlayerId = localStorage.getItem(STORAGE_KEYS.QUIZ_MASTER_PLAYER_ID);
    const savedRoomId = localStorage.getItem(STORAGE_KEYS.ROOM_ID);
    const savedRoomCreated = localStorage.getItem(STORAGE_KEYS.ROOM_CREATED);
    const savedGameStarted = localStorage.getItem(STORAGE_KEYS.GAME_STARTED);
    const savedCurrentQuestion = localStorage.getItem(STORAGE_KEYS.CURRENT_QUESTION);
    const savedScores = localStorage.getItem(STORAGE_KEYS.SCORES);

    if (savedQuizMaster) quizMasterName.value = savedQuizMaster;
    if (savedQuizMasterPlayerId) quizMasterPlayerId.value = savedQuizMasterPlayerId;
    if (savedRoomId) roomId.value = parseInt(savedRoomId);
    if (savedRoomCreated) roomCreated.value = savedRoomCreated === 'true';
    if (savedGameStarted) gameStarted.value = savedGameStarted === 'true';
    if (savedCurrentQuestion) currentQuestionIndex.value = parseInt(savedCurrentQuestion);
    if (savedScores) {
      try {
        scores.value = JSON.parse(savedScores);
      } catch (e) {
        console.error('Failed to parse saved scores:', e);
      }
    }
  }
};

// 清理localStorage
const clearStorage = () => {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    // 清空內存中的值
    quizMasterPlayerId.value = '';
  }
};

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
  // 優先使用leaderboard數據，如果沒有則使用scores數據（向後兼容）
  if (leaderboard.value && leaderboard.value.length > 0) {
    console.log('Scoreboard updated (from leaderboard):', leaderboard.value);
    return leaderboard.value;
  }
  
  // 如果沒有leaderboard數據，從本地scores生成，但要排除quiz master
  const entries = Object.entries(scores.value)
    .filter(([id]) => id !== quizMasterName.value) // 排除quiz master
    .map(([id, score]) => ({ id, name: id, score }))
    .sort((a, b) => b.score - a.score);
  
  console.log('Scoreboard updated (from scores):', entries);
  return entries;
});

// 創建房間
const createRoom = async () => {
  if (!quizMasterName.value.trim()) {
    createError.value = '請輸入Quiz Master名稱';
    return;
  }
  
  isCreatingRoom.value = true;
  createError.value = '';
  
  try {
    const config = useRuntimeConfig();
    const apiUrl = config.public.apiUrl || 'http://localhost:3002';
    
    const response = await axios.post(`${apiUrl}/api/rooms`, {
      quizMaster: quizMasterName.value.trim()
    });
    
    if (response.data.success) {
      roomId.value = response.data.room.id;
      roomCreated.value = true;
      // 保存 API 返回的 quizMasterPlayerId
      if (response.data.room.quizMasterPlayerId) {
        quizMasterPlayerId.value = response.data.room.quizMasterPlayerId;
      }
      console.log(`🏠 Room created: ${roomId.value} with playerId: ${quizMasterPlayerId.value}`);
      
      // 保存到localStorage
      saveToStorage();
      
      // 初始化WebSocket連接
      initializeQuizMaster();
    } else {
      createError.value = response.data.error || '創建房間失敗';
    }
  } catch (error) {
    console.error('Error creating room:', error);
    createError.value = '網路錯誤，請稍後再試';
  } finally {
    isCreatingRoom.value = false;
  }
};

onMounted(async () => {
  // 從localStorage載入狀態
  loadFromStorage();
  
  // 如果已有房間狀態，重新初始化WebSocket連接
  if (roomCreated.value && roomId.value) {
    console.log('🔄 Restoring quiz master session for room:', roomId.value);
    initializeQuizMaster();
  }
  
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
});

const initializeQuizMaster = () => {
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
        // Quiz master 使用 joinRoom 而不是 createRoom，因為房間已經通過 API 創建
        const joinRoomMessage = { 
          type: 'joinRoom', 
          roomId: roomId.value,
          playerName: quizMasterName.value,
          playerId: quizMasterPlayerId.value || `quiz_master_${roomId.value}_${Date.now()}` // 使用 API 返回的 playerId
        };
        console.log('📤 Sending join room message as quiz master:', joinRoomMessage);
        
        const success = $websocket.send(JSON.stringify(joinRoomMessage));
        console.log('📤 Send result:', success);
        
        if (success !== false) {
          isQuizMasterConnected = true;
          console.log('✅ Quiz master successfully connected to room');
          
          // 連接成功後請求現有玩家
          setTimeout(() => {
            if ($websocket.readyState === WebSocket.OPEN) {
              $websocket.send(JSON.stringify({ type: 'requestExistingPlayers' }));
              console.log('📋 Requested existing players list');
            }
          }, 1000);
        } else {
          console.error('❌ Failed to send create room message');
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
      
      if (data.type === 'roomCreated') {
        console.log('🏠 Room created via WebSocket:', data);
        // WebSocket確認房間創建成功，保存quiz master的playerId
        if (data.playerId) {
          quizMasterPlayerId.value = data.playerId;
          saveToStorage();
        }
      } else if (data.type === 'joinedRoom') {
        console.log('🏠 Quiz master joined room via WebSocket:', data);
        // 當 quiz master 加入房間時，更新 playerId
        if (data.playerId && data.isQuizMaster) {
          quizMasterPlayerId.value = data.playerId;
          saveToStorage();
        }
      } else if (data.type === 'leaderboardUpdate') {
        // 處理排行榜更新
        if (data.leaderboard) {
          leaderboard.value = data.leaderboard;
          // 同時更新scores以保持向後兼容
          const newScores = {};
          data.leaderboard.forEach(player => {
            newScores[player.name || player.id] = player.score;
          });
          scores.value = newScores;
          console.log('🏆 Leaderboard updated:', data.leaderboard);
        }
      } else if (data.type === 'scoreUpdate') {
        // 處理分數更新 - 排除quiz master的分數更新
        if (data.id && data.playerId !== quizMasterPlayerId.value) {
          const newScore = data.totalScore !== undefined ? data.totalScore : (scores.value[data.id] || 0) + (data.score || 0);
          
          // 強制響應性更新
          scores.value = {
            ...scores.value,
            [data.id]: newScore
          };
          
          // 保存分數更新
          saveToStorage();
          
          console.log(`🎯 Score updated: ${data.id} = ${newScore} points (gained ${data.score})`, 'Total players:', Object.keys(scores.value).length);
          
          // 手動觸發排行榜更新
          nextTick(() => {
            console.log('📊 Scoreboard should now update');
          });
        }
      } else if (data.type === 'newPlayer') {
        // 處理新玩家加入 - 排除quiz master
        if (data.id && data.playerId !== quizMasterPlayerId.value && !data.isQuizMaster) {
          if (!scores.value.hasOwnProperty(data.id)) {
            scores.value = {
              ...scores.value,
              [data.id]: 0
            };
            // 保存新玩家狀態
            saveToStorage();
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
};

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
  
  // 保存遊戲狀態
  saveToStorage();
  
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
    // 保存進度
    saveToStorage();
    startCountdown();
  } else {
    currentQuestionIndex.value = null;
    // 保存完成狀態
    saveToStorage();
  }
}

function downloadLeaderboardCSV() {
  const data = sortedScores.value;
  if (!data || data.length === 0) {
    alert('沒有排行榜數據可以下載');
    return;
  }
  
  // 建立 CSV 標題
  const headers = ['排名', '玩家名稱', '分數'];
  const csvContent = [
    headers.join(','),
    ...data.map((player, index) => [
      index + 1,
      `"${player.name || player.id}"`, // 用引號包圍玩家名稱以防特殊字符
      player.score
    ].join(','))
  ].join('\n');
  
  // 創建 Blob 並下載
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // 加入 BOM 支援中文
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `排行榜_房間${roomId.value}_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('📊 Leaderboard CSV downloaded:', data);
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

// 重置會話
const resetSession = () => {
  if (confirm('確定要重新開始？這將清除所有遊戲數據並返回房間創建頁面。')) {
    // 清理localStorage
    clearStorage();
    
    // 重置所有狀態
    roomCreated.value = false;
    roomId.value = null;
    quizMasterName.value = '';
    gameStarted.value = false;
    currentQuestionIndex.value = 0;
    scores.value = {};
    
    // 重新載入頁面
    window.location.reload();
  }
};
</script>

<style scoped>
.quiz-master-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 房間設置樣式 */
.room-setup {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.setup-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.setup-card h1 {
  margin-bottom: 2rem;
  color: #333;
  font-size: 2.5rem;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.name-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: border-color 0.3s;
}

.name-input:focus {
  outline: none;
  border-color: #667eea;
}

.create-room-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1.25rem 2rem;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.create-room-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.create-room-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: #ffe6e6;
  color: #cc0000;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid #ffcccc;
}

/* 主頁面樣式 */
.quiz-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #333;
}

.room-details {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #666;
}

.room-id {
  background: #e3f2fd;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  color: #1976d2;
}

.quiz-master-name {
  background: #f3e5f5;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  color: #7b1fa2;
}

.stats {
  display: flex;
  gap: 2rem;
  font-weight: 600;
  color: #667eea;
  align-items: center;
}

.reset-button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background: #ff5252;
  transform: translateY(-1px);
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

.room-info-display {
  background: #e8f5e8;
  padding: 1rem;
  border-radius: 10px;
  border: 2px solid #4caf50;
  color: #2e7d32;
  font-weight: 600;
  margin: 1rem 0;
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

.answer-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
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
  transition: all 0.3s ease;
}

.next-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
}

.download-csv-btn-inline {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-csv-btn-inline:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
}

.game-complete {
  text-align: center;
}

.game-complete h2 {
  color: #333;
  margin-bottom: 1rem;
}

.game-complete-actions {
  margin-top: 1.5rem;
}

.download-csv-btn {
  background: linear-gradient(135deg, #17a2b8, #138496);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-csv-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(23, 162, 184, 0.3);
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
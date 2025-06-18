<template>
  <div class="game-board" @click="move">
    <div class="game-header">
      <div class="player-info">
        <span class="player-name">{{ username }}</span>
        <span class="connection-status" :class="{ 'connected': isConnected }">{{ isConnected ? '🟢 已連線' : '🔴 未連線' }}</span>
      </div>
      <div class="game-stats">
        <span class="online-count">🧑‍🤝‍🧑 線上: {{ players.length }}</span>
      </div>
    </div>
    
    <div class="game-zone">
      <div class="choice-area top-area" :class="{ 'active': currentChoice === 'O' }">
        <div class="choice-icon">✅</div>
        <div class="choice-label">正確 (O)</div>
        <div class="choice-hint">點擊上半部選擇</div>
      </div>
      
      <div class="divider">
        <div class="divider-line"></div>
        <div class="divider-text">選擇你的答案</div>
      </div>
      
      <div class="choice-area bottom-area" :class="{ 'active': currentChoice === 'X' }">
        <div class="choice-icon">❌</div>
        <div class="choice-label">錯誤 (X)</div>
        <div class="choice-hint">點擊下半部選擇</div>
      </div>
    </div>
    
    <div class="players-container">
      <div 
        v-for="player in players" 
        :key="player.id" 
        :style="playerStyle(player)"
        class="player-avatar"
        :class="{ 'current-player': player.id === username }"
      >
        <div class="player-bubble">
          <span class="player-emoji">👤</span>
          <span class="player-text">{{ player.id }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="showFeedback" class="feedback-overlay">
      <div class="feedback-content" :class="feedbackType">
        <div class="feedback-icon">
          {{ feedbackType === 'correct' ? '🎉' : '😔' }}
        </div>
        <div class="feedback-text">{{ feedbackMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const username = route.query.name;
const { $websocket } = useNuxtApp();

const players = ref([]);
const position = ref({ x: 50, y: 50 });
const isConnected = ref(false);
const currentChoice = ref(null);
const showFeedback = ref(false);
const feedbackType = ref('');
const feedbackMessage = ref('');

function move(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const targetX = ((e.clientX - rect.left) / rect.width) * 100;
  const targetY = ((e.clientY - rect.top) / rect.height) * 100;

  const newX = position.value.x + (targetX - position.value.x) / 3;
  const newY = position.value.y + (targetY - position.value.y) / 3;

  // 更新位置數據
  position.value = { x: newX, y: newY };
  currentChoice.value = newY < 50 ? 'O' : 'X';

  // 更新玩家陣列中的當前玩家位置
  const currentPlayer = players.value.find(p => p.id === username);
  if (currentPlayer) {
    currentPlayer.x = newX;
    currentPlayer.y = newY;
  }

  // 發送移動數據到WebSocket服務器
  if ($websocket && $websocket.readyState === WebSocket.OPEN) {
    $websocket.send(JSON.stringify({
      type: 'move',
      id: username,
      x: newX,
      y: newY
    }));
    console.log(`Player ${username} moved to (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
  } else {
    console.warn('WebSocket not connected, cannot send move data');
  }
}

function showAnswerFeedback(isCorrect, score) {
  showFeedback.value = true;
  feedbackType.value = isCorrect ? 'correct' : 'incorrect';
  feedbackMessage.value = isCorrect ? `答對了！獲得 ${score} 分` : '答錯了，下次加油！';
  
  setTimeout(() => {
    showFeedback.value = false;
  }, 3000);
}

onMounted(() => {
  // 監聽 WebSocket 狀態變化
  const updateConnectionStatus = () => {
    isConnected.value = $websocket && $websocket.readyState === WebSocket.OPEN;
  };

  // 監聽WebSocket連接狀態事件
  window.addEventListener('websocket-connected', () => {
    isConnected.value = true;
    console.log('WebSocket status updated: connected');
    
    // 連接成功後立即加入遊戲
    if ($websocket && $websocket.readyState === WebSocket.OPEN) {
      const joinMessage = { type: 'join', name: username };
      $websocket.send(JSON.stringify(joinMessage));
      console.log('Sent join message after connection:', joinMessage);
    }
  });

  window.addEventListener('websocket-disconnected', () => {
    isConnected.value = false;
    console.log('WebSocket status updated: disconnected');
  });

  window.addEventListener('websocket-error', () => {
    isConnected.value = false;
    console.log('WebSocket status updated: error');
  });

  // 監聽WebSocket消息事件
  window.addEventListener('websocket-message', (event) => {
    const data = event.detail;
    console.log('Game received WebSocket message:', data);
    
    if (data.type === 'newPlayer' && data.id !== 'quiz_master') {
      // 處理新玩家加入（包括自己）
      if (!players.value.find(p => p.id === data.id)) {
        const newPlayer = {
          id: data.id,
          x: data.x || 50,
          y: data.y || 50
        };
        players.value.push(newPlayer);
        console.log(`Player added: ${data.id}`, newPlayer);
        
        // 如果是自己，同步位置數據
        if (data.id === username) {
          position.value = { x: newPlayer.x, y: newPlayer.y };
        }
      }
    } else if (data.type === 'positionUpdate' && data.id !== 'quiz_master') {
      // 處理玩家位置更新
      const player = players.value.find(p => p.id === data.id);
      if (player) {
        player.x = data.x;
        player.y = data.y;
      }
    } else if (data.type === 'playerLeft' && data.id !== 'quiz_master') {
      // 處理玩家離開
      players.value = players.value.filter(p => p.id !== data.id);
      console.log(`Player left: ${data.id}`);
    } else if (data.type === 'answer') {
      // 處理答案廣播
      console.log('Received answer from server', data);
      const playerChoice = position.value.y < 50 ? 'O' : 'X';
      const isCorrect = playerChoice === data.correctAnswer;
      const score = isCorrect ? data.score : 0;
      
      showAnswerFeedback(isCorrect, score);
      
      // 發送分數更新
      if ($websocket && $websocket.readyState === WebSocket.OPEN) {
        const scoreMessage = {
          type: 'scoreUpdate',
          id: username,
          score: score
        };
        $websocket.send(JSON.stringify(scoreMessage));
        console.log('Sent score update to server:', scoreMessage);
      }
    }
  });

  if ($websocket) {
    console.log('WebSocket initialized in game.vue');
    updateConnectionStatus();
    
    // 如果已經連接，立即加入遊戲
    if ($websocket.readyState === WebSocket.OPEN) {
      const joinMessage = { type: 'join', name: username };
      $websocket.send(JSON.stringify(joinMessage));
      console.log('Sent join message immediately:', joinMessage);
    }
  }
});

const playerStyle = (player) => ({
  position: 'absolute',
  left: `${player.x}%`,
  top: `${player.y}%`,
  transform: 'translate(-50%, -50%)',
  zIndex: player.id === username ? 10 : 5
});
</script>

<style scoped>
.game-board {
  height: 100vh;
  width: 100vw;
  position: relative;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  overflow: hidden;
  cursor: crosshair;
}

.game-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.connection-status {
  font-size: 0.9rem;
  color: #666;
}

.connection-status.connected {
  color: #27ae60;
}

.game-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.95rem;
  color: #666;
}

.game-zone {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.choice-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  user-select: none;
}

.top-area {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.2));
  border-bottom: 2px dashed rgba(255, 255, 255, 0.3);
}

.bottom-area {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.2));
  border-top: 2px dashed rgba(255, 255, 255, 0.3);
}

.choice-area.active {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.02);
}

.choice-area:hover {
  background: rgba(255, 255, 255, 0.15);
}

.choice-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.choice-label {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.choice-hint {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.divider {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.divider-line {
  height: 4px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  width: 100%;
  position: absolute;
}

.divider-text {
  background: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.players-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.player-avatar {
  pointer-events: auto;
  transition: all 0.3s ease;
}

.player-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1rem;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 2px solid transparent;
  min-width: 80px;
}

.current-player .player-bubble {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border-color: #f39c12;
  transform: scale(1.1);
}

.player-emoji {
  font-size: 1.5rem;
}

.player-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feedback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.feedback-content {
  background: white;
  padding: 2rem 3rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.feedback-content.correct {
  border-left: 5px solid #27ae60;
}

.feedback-content.incorrect {
  border-left: 5px solid #e74c3c;
}

.feedback-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feedback-text {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .game-header {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .choice-icon {
    font-size: 3rem;
  }
  
  .choice-label {
    font-size: 1.5rem;
  }
  
  .choice-hint {
    font-size: 1rem;
  }
  
  .player-bubble {
    padding: 0.5rem 0.75rem;
    min-width: 60px;
  }
  
  .feedback-content {
    padding: 1.5rem 2rem;
    margin: 1rem;
  }
}
</style>

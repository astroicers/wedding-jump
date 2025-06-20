<template>
  <!-- 登入頁面 -->
  <div v-if="!joinedRoom" class="login-screen">
    <div class="login-card">
      <h1>🎮 加入 Quiz 遊戲</h1>
      <form @submit.prevent="joinRoom" class="login-form">
        <div class="input-group">
          <label for="playerName">👤 玩家名稱:</label>
          <input 
            id="playerName"
            v-model="playerName" 
            type="text" 
            placeholder="輸入您的名稱" 
            required
            maxlength="20"
            class="name-input"
          />
        </div>
        <div class="input-group">
          <label for="roomId">🏠 房間號:</label>
          <input 
            id="roomId"
            v-model="roomId" 
            type="number" 
            placeholder="輸入房間號" 
            required
            class="room-input"
          />
        </div>
        <button type="submit" class="join-btn" :disabled="isJoining">
          <span v-if="isJoining">正在加入...</span>
          <span v-else>🚀 加入遊戲</span>
        </button>
      </form>
      
      <div v-if="joinError" class="error-message">
        {{ joinError }}
      </div>
    </div>
  </div>

  <!-- 遊戲頁面 -->
  <div v-else class="game-board" @click="move">
    <div class="game-header">
      <div class="player-info">
        <span class="player-name">{{ playerName }}</span>
        <span class="room-info">🏠 房間: {{ roomId }}</span>
        <span class="connection-status" :class="{ 'connected': isConnected }">{{ isConnected ? '🟢 已連線' : '🔴 未連線' }}</span>
      </div>
      <div class="game-stats">
        <span class="online-count">🧑‍🤝‍🧑 線上: {{ activePlayers.length }}</span>
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
        v-for="(player, index) in sortedActivePlayers" 
        :key="player.id" 
        :style="playerStyle(player, index)"
        class="player-avatar"
        :class="{ 
          'current-player': player.id === playerName || player.name === playerName,
          'top-player': getPlayerRank(player)?.rank <= 3 && !player.isQuizMaster,
          'first-place': getPlayerRank(player)?.rank === 1,
          'second-place': getPlayerRank(player)?.rank === 2,
          'third-place': getPlayerRank(player)?.rank === 3
        }"
      >
        <div class="player-bubble">
          <div class="player-rank" v-if="getPlayerRank(player)?.medal">
            {{ getPlayerRank(player).medal }}
          </div>
          <span class="player-emoji">👤</span>
          <span class="player-text">{{ player.id }}</span>
          <span class="player-score" v-if="!player.isQuizMaster">{{ player.score }}分</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const router = useRouter();
const { $websocket } = useNuxtApp();

// 登入狀態
const joinedRoom = ref(false);
const playerName = ref(route.query.name || '');
const roomId = ref(route.query.room || '');
const playerId = ref(''); // 唯一玩家ID
const isJoining = ref(false);
const joinError = ref('');

// 遊戲狀態
const players = ref([]);
const playerScores = ref({}); // 玩家分數記錄
const position = ref({ x: 50, y: 50 });
const isConnected = ref(false);
const currentChoice = ref(null);
const showFeedback = ref(false);
const feedbackType = ref('');
const feedbackMessage = ref('');

// 活躍玩家過濾 (20秒內有活動)
const PLAYER_TIMEOUT = 20 * 1000; // 20秒
const activePlayers = computed(() => {
  const now = Date.now();
  return players.value.filter(player => {
    // Quiz master 總是顯示
    if (player.isQuizMaster) return true;
    
    // 檢查玩家最後活動時間
    const lastActive = player.lastActive || player.joinTime || now;
    return (now - lastActive) <= PLAYER_TIMEOUT;
  });
});

// 排序玩家：按分數排序，前三名有特殊顯示
const sortedActivePlayers = computed(() => {
  const activeList = activePlayers.value;
  
  // 添加分數資訊並排序
  const playersWithScores = activeList.map(player => ({
    ...player,
    score: playerScores.value[player.playerId] || playerScores.value[player.id] || 0
  }));
  
  // 排序：Quiz Master 總是在最後，其他按分數降序
  return playersWithScores.sort((a, b) => {
    if (a.isQuizMaster && !b.isQuizMaster) return 1;
    if (!a.isQuizMaster && b.isQuizMaster) return -1;
    if (a.isQuizMaster && b.isQuizMaster) return 0;
    
    // 普通玩家按分數排序
    return b.score - a.score;
  });
});

// 獲取玩家排名和獎牌
const getPlayerRank = (player) => {
  if (player.isQuizMaster) return null;
  
  const nonQuizMasterPlayers = sortedActivePlayers.value.filter(p => !p.isQuizMaster);
  const rank = nonQuizMasterPlayers.findIndex(p => p.playerId === player.playerId || p.id === player.id) + 1;
  
  if (rank === 1) return { rank, medal: '🥇', color: '#FFD700' }; // 金牌
  if (rank === 2) return { rank, medal: '🥈', color: '#C0C0C0' }; // 銀牌
  if (rank === 3) return { rank, medal: '🥉', color: '#CD7F32' }; // 銅牌
  return { rank, medal: null, color: null };
};

// LocalStorage keys for game
const GAME_STORAGE_KEYS = {
  PLAYER_ID: 'wedding_player_id',
  PLAYER_NAME: 'wedding_player_name',
  ROOM_ID: 'wedding_player_room_id',
  JOINED_ROOM: 'wedding_player_joined',
  POSITION: 'wedding_player_position',
  NAME_TO_ID_MAP: 'wedding_name_to_id_map',
  PLAYER_SCORES: 'wedding_player_scores'
};

// 生成唯一玩家ID
const generatePlayerId = () => {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 獲取或創建玩家ID
const getOrCreatePlayerId = (name) => {
  if (typeof window === 'undefined') return '';
  
  // 檢查是否已有此名稱的ID映射
  const nameToIdMap = JSON.parse(localStorage.getItem(GAME_STORAGE_KEYS.NAME_TO_ID_MAP) || '{}');
  
  if (nameToIdMap[name]) {
    return nameToIdMap[name];
  }
  
  // 創建新ID
  const newId = generatePlayerId();
  nameToIdMap[name] = newId;
  localStorage.setItem(GAME_STORAGE_KEYS.NAME_TO_ID_MAP, JSON.stringify(nameToIdMap));
  
  console.log(`📝 Created new player ID: ${newId} for name: ${name}`);
  return newId;
};

// 保存遊戲狀態
const saveGameState = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GAME_STORAGE_KEYS.PLAYER_ID, playerId.value);
    localStorage.setItem(GAME_STORAGE_KEYS.PLAYER_NAME, playerName.value);
    localStorage.setItem(GAME_STORAGE_KEYS.ROOM_ID, roomId.value);
    localStorage.setItem(GAME_STORAGE_KEYS.JOINED_ROOM, joinedRoom.value.toString());
    localStorage.setItem(GAME_STORAGE_KEYS.POSITION, JSON.stringify(position.value));
  }
};

// 載入遊戲狀態
const loadGameState = () => {
  if (typeof window !== 'undefined') {
    const savedPlayerId = localStorage.getItem(GAME_STORAGE_KEYS.PLAYER_ID);
    const savedPlayerName = localStorage.getItem(GAME_STORAGE_KEYS.PLAYER_NAME);
    const savedRoomId = localStorage.getItem(GAME_STORAGE_KEYS.ROOM_ID);
    const savedJoinedRoom = localStorage.getItem(GAME_STORAGE_KEYS.JOINED_ROOM);
    const savedPosition = localStorage.getItem(GAME_STORAGE_KEYS.POSITION);

    if (savedPlayerId) playerId.value = savedPlayerId;
    if (savedPlayerName) playerName.value = savedPlayerName;
    if (savedRoomId) roomId.value = savedRoomId;
    if (savedJoinedRoom) joinedRoom.value = savedJoinedRoom === 'true';
    if (savedPosition) {
      try {
        position.value = JSON.parse(savedPosition);
      } catch (e) {
        console.error('Failed to parse saved position:', e);
      }
    }

    // 如果有玩家名稱但沒有ID，創建ID
    if (savedPlayerName && !savedPlayerId) {
      playerId.value = getOrCreatePlayerId(savedPlayerName);
      saveGameState(); // 保存新創建的ID
    }
  }
};

// 清理遊戲狀態
const clearGameState = () => {
  if (typeof window !== 'undefined') {
    Object.values(GAME_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

// 如果URL已經有參數，直接嘗試加入
onMounted(() => {
  // 載入保存的狀態
  loadGameState();
  
  // 確保玩家有ID
  if (playerName.value && !playerId.value) {
    playerId.value = getOrCreatePlayerId(playerName.value);
    saveGameState();
  }
  
  // 如果已經加入房間，重新初始化遊戲
  if (joinedRoom.value && playerName.value && roomId.value) {
    console.log('🔄 Restoring player session:', playerName.value, 'Room:', roomId.value, 'ID:', playerId.value);
    initializeGame();
  } else if (playerName.value && roomId.value) {
    joinRoom();
  }
});

const joinRoom = async () => {
  if (!playerName.value.trim() || !roomId.value) {
    joinError.value = '請填寫完整資料';
    return;
  }
  
  isJoining.value = true;
  joinError.value = '';
  
  try {
    await initializeGame();
  } catch (error) {
    console.error('Error joining room:', error);
    joinError.value = error.message || '加入房間失敗，請檢查房間號是否正確';
    isJoining.value = false;
  }
};

const initializeGame = async () => {
  console.log(`🎮 Initializing game for player: ${playerName.value} in room: ${roomId.value}`);
  
  if ($websocket) {
    let connectionAttempts = 0;
    const maxAttempts = 10;
    
    const connectPlayer = () => {
      connectionAttempts++;
      console.log(`🔗 Player connection attempt ${connectionAttempts}/${maxAttempts}`);
      console.log(`📡 WebSocket readyState: ${$websocket.readyState}`);
      
      if ($websocket.readyState === WebSocket.OPEN) {
        // 確保玩家有ID
        if (!playerId.value) {
          playerId.value = getOrCreatePlayerId(playerName.value);
          saveGameState();
        }
        
        const joinMessage = { 
          type: 'joinRoom', 
          playerName: playerName.value,
          playerId: playerId.value,
          roomId: parseInt(roomId.value)
        };
        console.log('📤 Sending join room message:', joinMessage);
        
        const success = $websocket.send(JSON.stringify(joinMessage));
        console.log('📤 Send result:', success);
        
        if (success !== false) {
          console.log('✅ Join room message sent successfully');
          // 等待服務器回應
        } else {
          throw new Error('發送加入房間消息失敗');
        }
      } else if (connectionAttempts < maxAttempts) {
        console.log(`⏳ WebSocket not ready (state: ${$websocket.readyState}), retrying in 500ms...`);
        setTimeout(connectPlayer, 500);
      } else {
        throw new Error('WebSocket連接超時，請重新整理頁面');
      }
    };

    // 監聽WebSocket連接狀態
    window.addEventListener('websocket-connected', () => {
      console.log('🌐 WebSocket connected event received, connecting player...');
      setTimeout(connectPlayer, 100);
    });

    // 立即嘗試連接（如果已經連接）
    setTimeout(connectPlayer, 100);

    // 處理WebSocket消息
    const handleWebSocketMessage = (event) => {
      const data = event.detail;
      console.log('📨 Game received WebSocket message:', data);
      
      if (data.type === 'joinedRoom') {
        // 成功加入房間
        console.log('🏠 Successfully joined room:', data);
        joinedRoom.value = true;
        isJoining.value = false;
        
        // 更新URL
        router.replace({ 
          query: { 
            name: playerName.value, 
            room: roomId.value 
          } 
        });
        
        // 初始化玩家位置
        position.value = { x: data.x || 50, y: data.y || 50 };
        
        // 確保將自己添加到玩家列表中
        const selfPlayer = {
          id: data.playerName || playerName.value,
          playerId: data.playerId || playerId.value,
          name: data.playerName || playerName.value,
          x: data.x || 50,
          y: data.y || 50,
          isQuizMaster: data.isQuizMaster || false
        };
        
        // 檢查是否已存在，避免重複添加
        if (!players.value.find(p => p.playerId === selfPlayer.playerId)) {
          players.value.push(selfPlayer);
          console.log(`👤 Self player added to list:`, selfPlayer);
        }
        
        // 保存遊戲狀態
        saveGameState();
        
      } else if (data.type === 'error') {
        // 加入房間失敗
        console.error('❌ Join room error:', data.message);
        joinError.value = data.message;
        isJoining.value = false;
        
      } else if (data.type === 'newPlayer') {
        // 處理新玩家加入（包括自己和其他玩家）
        const playerKey = data.playerId || data.id;
        if (!players.value.find(p => p.playerId === playerKey || p.id === data.id)) {
          const newPlayer = {
            id: data.id, // 顯示名稱
            playerId: data.playerId || data.id, // 唯一ID
            name: data.name || data.id, // 玩家名稱
            x: data.x || 50,
            y: data.y || 50,
            isQuizMaster: data.isQuizMaster || false
          };
          players.value.push(newPlayer);
          console.log(`👤 Player added: ${data.id} (ID: ${newPlayer.playerId})`, newPlayer);
          
          // 如果是自己，同步位置數據（通過名稱比較）
          if (data.id === playerName.value || data.name === playerName.value) {
            position.value = { x: newPlayer.x, y: newPlayer.y };
          }
        }
        
      } else if (data.type === 'positionUpdate') {
        // 處理玩家位置更新
        const player = players.value.find(p => p.id === data.id || p.playerId === data.playerId);
        if (player) {
          player.x = data.x;
          player.y = data.y;
          player.lastActive = Date.now(); // 更新最後活動時間
        }
        
      } else if (data.type === 'playerLeft') {
        // 處理玩家離開
        players.value = players.value.filter(p => p.id !== data.id && p.playerId !== data.playerId);
        console.log(`👋 Player left: ${data.id}`);
        
      } else if (data.type === 'answer') {
        // 處理答案廣播
        console.log('📢 Received answer from server', data);
        const playerChoice = position.value.y < 50 ? 'O' : 'X';
        const isCorrect = playerChoice === data.correctAnswer;
        const score = isCorrect ? data.score : 0;
        
        showAnswerFeedback(isCorrect, score);
        
        // 發送分數更新
        if ($websocket && $websocket.readyState === WebSocket.OPEN) {
          const scoreMessage = {
            type: 'scoreUpdate',
            id: playerName.value,
            playerId: playerId.value,
            score: score
          };
          $websocket.send(JSON.stringify(scoreMessage));
          console.log('📊 Sent score update to server:', scoreMessage);
        }
        
      } else if (data.type === 'scoreUpdate') {
        // 處理分數更新廣播
        if (data.id || data.playerId) {
          const playerKey = data.playerId || data.id;
          playerScores.value = {
            ...playerScores.value,
            [playerKey]: data.totalScore !== undefined ? data.totalScore : (playerScores.value[playerKey] || 0) + (data.score || 0)
          };
          console.log(`📊 Score updated: ${data.id} = ${playerScores.value[playerKey]} points`);
        }
        
      } else if (data.type === 'roomClosed') {
        // 房間關閉
        alert('房間已關閉，請重新加入新的房間');
        joinedRoom.value = false;
        players.value = [];
        playerScores.value = {};
      }
    };

    // 監聽WebSocket狀態變化
    const updateConnectionStatus = () => {
      isConnected.value = $websocket && $websocket.readyState === WebSocket.OPEN;
    };

    window.addEventListener('websocket-connected', () => {
      isConnected.value = true;
      console.log('WebSocket status updated: connected');
    });

    window.addEventListener('websocket-disconnected', () => {
      isConnected.value = false;
      console.log('WebSocket status updated: disconnected');
    });

    window.addEventListener('websocket-error', () => {
      isConnected.value = false;
      console.log('WebSocket status updated: error');
    });

    // 監聽WebSocket消息
    window.addEventListener('websocket-message', handleWebSocketMessage);
    
    // 初始狀態檢查
    updateConnectionStatus();
    
    // 清理函數
    const cleanup = () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage);
      window.removeEventListener('websocket-connected', updateConnectionStatus);
      window.removeEventListener('websocket-disconnected', updateConnectionStatus);
      window.removeEventListener('websocket-error', updateConnectionStatus);
    };
    
    // 在組件卸載時清理
    onUnmounted(() => {
      cleanup();
    });
    
  } else {
    throw new Error('WebSocket未初始化，請重新整理頁面');
  }
};

function move(e) {
  if (!joinedRoom.value) return;
  
  const rect = e.currentTarget.getBoundingClientRect();
  const targetX = ((e.clientX - rect.left) / rect.width) * 100;
  const targetY = ((e.clientY - rect.top) / rect.height) * 100;

  const newX = position.value.x + (targetX - position.value.x) / 3;
  const newY = position.value.y + (targetY - position.value.y) / 3;

  // 更新位置數據
  position.value = { x: newX, y: newY };
  currentChoice.value = newY < 50 ? 'O' : 'X';

  // 更新玩家陣列中的當前玩家位置（優先使用 playerId 匹配）
  const currentPlayer = players.value.find(p => 
    p.playerId === playerId.value || 
    p.id === playerName.value || 
    p.name === playerName.value
  );
  if (currentPlayer) {
    currentPlayer.x = newX;
    currentPlayer.y = newY;
    currentPlayer.lastActive = Date.now(); // 更新最後活動時間
    console.log(`Updated current player position:`, currentPlayer);
  } else {
    console.warn(`Current player not found in players array. PlayerName: ${playerName.value}, PlayerId: ${playerId.value}`);
    console.log(`Available players:`, players.value);
  }

  // 發送移動數據到WebSocket服務器
  if ($websocket && $websocket.readyState === WebSocket.OPEN) {
    $websocket.send(JSON.stringify({
      type: 'move',
      id: playerName.value,
      playerId: playerId.value,
      x: newX,
      y: newY
    }));
    console.log(`Player ${playerName.value} moved to (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
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

const playerStyle = (player, index) => {
  const rankInfo = getPlayerRank(player);
  let zIndex = 5;
  
  // 當前玩家最高層級
  if (player.id === playerName.value || player.name === playerName.value) {
    zIndex = 100;
  } 
  // Quiz Master 中等層級
  else if (player.isQuizMaster) {
    zIndex = 50;
  }
  // 前三名玩家較高層級，排名越高層級越高
  else if (rankInfo?.rank <= 3) {
    zIndex = 30 - rankInfo.rank; // 第1名=29, 第2名=28, 第3名=27
  }
  // 其他玩家按排序順序分層，分數越高層級越高
  else {
    zIndex = Math.max(5, 25 - index);
  }
  
  return {
    position: 'absolute',
    left: `${player.x}%`,
    top: `${player.y}%`,
    transform: 'translate(-50%, -50%)',
    zIndex
  };
};
</script>

<style scoped>
/* 登入頁面樣式 */
.login-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.login-card h1 {
  margin-bottom: 2rem;
  color: #333;
  font-size: 2.5rem;
}

.login-form {
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

.name-input, .room-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: border-color 0.3s;
}

.name-input:focus, .room-input:focus {
  outline: none;
  border-color: #1e3c72;
}

.join-btn {
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  color: white;
  border: none;
  padding: 1.25rem 2rem;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.join-btn:disabled {
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

/* 遊戲頁面樣式 */
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

.room-info {
  font-size: 0.8rem;
  color: #1976d2;
  background: #e3f2fd;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
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

/* 前三名特殊樣式 */
.top-player .player-bubble {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.first-place .player-bubble {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border: 3px solid #FFD700;
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
}

.second-place .player-bubble {
  background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
  border: 3px solid #C0C0C0;
  box-shadow: 0 6px 20px rgba(192, 192, 192, 0.4);
}

.third-place .player-bubble {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
  border: 3px solid #CD7F32;
  box-shadow: 0 6px 20px rgba(205, 127, 50, 0.4);
}

.player-rank {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.player-score {
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.15rem 0.4rem;
  border-radius: 8px;
  margin-top: 0.25rem;
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
  
  .login-card {
    padding: 2rem;
  }
  
  .login-card h1 {
    font-size: 2rem;
  }
}
</style>
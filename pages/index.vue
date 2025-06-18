<template>
  <div class="home-container">
    <div class="content-wrapper">
      <h1>Wedding Jump</h1>
      <p>互動問答遊戲</p>
      
      <div class="join-form">
        <input 
          v-model="name" 
          type="text" 
          placeholder="輸入你的名字" 
          @keyup.enter="joinGame"
        />
        
        <button @click="joinGame" :disabled="!name.trim()">
          🎮 加入遊戲
        </button>
        
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.content-wrapper {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #333;
}

p {
  color: #666;
  margin-bottom: 2rem;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input {
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 1.1rem;
}

button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.2rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  font-size: 0.9rem;
}
</style>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const name = ref('');
const errorMessage = ref('');
const router = useRouter();

function joinGame() {
  const playerName = name.value.trim();
  
  if (!playerName) {
    errorMessage.value = '請輸入你的名字';
    return;
  }
  
  if (playerName.length < 2) {
    errorMessage.value = '名字至少需要2個字元';
    return;
  }
  
  if (playerName.length > 10) {
    errorMessage.value = '名字不能超過10個字';
    return;
  }
  
  // 跳轉到遊戲頁面
  router.push({ path: '/game', query: { name: playerName } });
}
</script>
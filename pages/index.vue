<template>
  <div class="join-game">
    <input v-model="name" type="text" placeholder="輸入你的名字" />
    <button @click="joinGame">加入遊戲</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const { $websocket } = useNuxtApp(); // 確保你使用的是 $websocket 而不是 websocket 變量
const name = ref('');
const router = useRouter();

function joinGame() {
  console.log('加入遊戲按鈕被點擊'); // 用於調試
  if (name.value.trim()) {
    if ($websocket && $websocket.readyState === WebSocket.OPEN) {
      console.log('發送加入遊戲請求', { type: 'join', name: name.value }); // 用於調試
      $websocket.send(JSON.stringify({ type: 'join', name: name.value }));
      router.push({ path: '/game', query: { name: name.value } });
    } else {
      console.error('WebSocket is not connected.');
    }
  } else {
    alert("請輸入名字");
  }
}
</script>

<style>
.join-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

input[type="text"] {
  margin-bottom: 10px;
  padding: 8px;
  width: 200px;
}

button {
  padding: 10px 20px;
  cursor: pointer;
}
</style>

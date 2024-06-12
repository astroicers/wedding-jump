<template>
  <div class="join-game">
    <input v-model="name" type="text" placeholder="輸入你的名字" />
    <button @click="joinGame">加入遊戲</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const { $websocket } = useNuxtApp();
const name = ref('');
const router = useRouter();
const existingNames = ref([]);

onMounted(() => {
  if ($websocket) {
    $websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'existingPlayers') {
        existingNames.value = data.names;
      }
    };
    if ($websocket.readyState === WebSocket.OPEN) {
      $websocket.send(JSON.stringify({ type: 'requestExistingPlayers' }));
    } else {
      $websocket.onopen = () => {
        $websocket.send(JSON.stringify({ type: 'requestExistingPlayers' }));
      };
    }
  }
});

function joinGame() {
  console.log('加入遊戲按鈕被點擊'); // 用於調試
  if (name.value.trim().length === 0) {
    alert("請輸入名字");
  } else if (name.value.length > 10) {
    alert("名字不能超過10個字");
  } else if (existingNames.value.includes(name.value.trim())) {
    alert("該名稱已被使用，請換一個名稱");
  } else {
    if ($websocket && $websocket.readyState === WebSocket.OPEN) {
      console.log('發送加入遊戲請求', { type: 'join', name: name.value }); // 用於調試
      $websocket.send(JSON.stringify({ type: 'join', name: name.value }));
      router.push({ path: '/game', query: { name: name.value } });
    } else {
      console.error('WebSocket is not connected.');
    }
  }
}
</script>

<style scoped>
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

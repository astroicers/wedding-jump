<template>
  <div class="game-board" @click="move">
    <div class="game-zone">
      <h1 class="top">O</h1>
      <hr />
      <h1 class="bottom">X</h1>
    </div>
    <div v-for="player in players" :key="player.id" :style="playerStyle(player)">
      {{ player.id }}
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

const players = ref([{ id: username, x: 50, y: 50 }]); // 初始化玩家自己
const position = ref({ x: 50, y: 50 });

function move(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const targetX = ((e.clientX - rect.left) / rect.width) * 100;
  const targetY = ((e.clientY - rect.top) / rect.height) * 100;

  const newX = position.value.x + (targetX - position.value.x) / 5;
  const newY = position.value.y + (targetY - position.value.y) / 5;

  position.value = { x: newX, y: newY };

  if ($websocket && $websocket.readyState === WebSocket.OPEN) {
    $websocket.send(JSON.stringify({
      type: 'move',
      id: username,
      x: newX,
      y: newY
    }));
  }
}

onMounted(() => {
  if ($websocket) {
    console.log('WebSocket connected in game.vue');
    $websocket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    $websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message from server', data);
      if (data.type === 'newPlayer' && data.id !== username && data.id !== 'quiz_master') {
        if (!players.value.find(p => p.id === data.id)) {
          players.value.push({
            id: data.id,
            x: data.x,
            y: data.y
          });
        }
      } else if (data.type === 'positionUpdate' && data.id !== 'quiz_master') {
        const player = players.value.find(p => p.id === data.id);
        if (player) {
          player.x = data.x;
          player.y = data.y;
        }
      } else if (data.type === 'playerLeft' && data.id !== 'quiz_master') {
        players.value = players.value.filter(p => p.id !== data.id);
      } else if (data.type === 'answer' && data.id !== 'quiz_master') {
        console.log('Received answer from server', data);
        const playerChoice = position.value.y < 50 ? 'O' : 'X'; // Y 坐標小於 50 代表選擇 O
        const isCorrect = playerChoice === data.correctAnswer;
        const scoreMessage = {
          type: 'scoreUpdate',
          id: username,
          isCorrect,
          score: isCorrect ? data.score : 0
        };
        $websocket.send(JSON.stringify(scoreMessage));
        console.log('Sent score update to server', scoreMessage);
      }
    };

    // 加入遊戲
    const joinMessage = { type: 'join', name: username };
    $websocket.send(JSON.stringify(joinMessage));
    console.log('Sent join message', joinMessage);
  }
});

const playerStyle = (player) => ({
  position: 'absolute',
  left: `${player.x}%`,
  top: `${player.y}%`,
  transform: 'translate(-50%, -50%)',
  backgroundColor: player.id === username ? 'yellow' : 'lightblue',
  padding: '20px',
  borderRadius: '10px',
  fontSize: '32px', // 調整玩家名稱字體大小
  userSelect: 'none' // 防止文字選中
});
</script>

<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  position: relative;
  background: url('https://www.freecodecamp.org/news/content/images/size/w2000/2021/06/w-qjCHPZbeXCQ-unsplash.jpg') no-repeat center center;
  /* 背景圖片 */
  background-size: cover;
}

.game-zone {
  width: 100%;
  text-align: center;
  position: relative;
  height: 400px;
  /* 增加高度 */
}

.top,
.bottom {
  margin: 0;
  padding: 20px;
  font-size: 120px;
  /* 增加字體大小 */
  user-select: none; /* 防止文字選中 */
}

hr {
  border: none;
  height: 10px;
  /* 增加高度 */
  background-color: black;
  width: 100%;
}

.username {
  position: absolute;
  font-size: 24px;
  transition: left 0.3s ease, top 0.3s ease;
}
</style>

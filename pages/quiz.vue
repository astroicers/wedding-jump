<template>
  <div class="quiz-container">
    <div class="question-area">
      <div v-if="!gameStarted">
        <button class="large-button" @click="startGame">開始</button>
      </div>
      <div v-else>
        <div v-if="currentQuestion">
          <h1>{{ currentQuestion.題目 }}</h1>
          <div v-if="countdown > 0">
            <h2>倒數計時: {{ countdown }} 秒</h2>
          </div>
          <div v-else>
            <h2>正確答案: {{ currentQuestion.正確答案 }}</h2>
            <button class="large-button" @click="nextQuestion">下一題</button>
          </div>
        </div>
        <div v-else>
          <h1>所有題目已經完成！</h1>
        </div>
      </div>
    </div>
    <div class="scoreboard">
      <h1>排行榜</h1>
      <div class="score-columns">
        <ul>
          <li v-for="(score, index) in sortedScores.slice(0, 10)" :key="index" :class="{'top-three': index < 3}">
            {{ index + 1 }}. {{ score.id }}: {{ score.score }}
          </li>
        </ul>
        <ul>
          <li v-for="(score, index) in sortedScores.slice(10, 20)" :key="index">
            {{ index + 11 }}. {{ score.id }}: {{ score.score }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  display: grid;
  grid-template-columns: 1fr 1000px; /* 框限寬度 */
  gap: 40px; /* 間距 */
  height: 100vh;
  text-align: center;
  align-items: center;
}

.question-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 2em; /* 文字放大兩倍 */
}

.scoreboard {
  padding: 40px; /* 內邊距放大兩倍 */
  background-color: #f9f9f9;
  border: 4px solid #ddd; /* 邊框寬度放大兩倍 */
  border-radius: 16px; /* 圓角放大兩倍 */
}

.scoreboard h1 {
  margin-bottom: 20px; /* 下邊距放大兩倍 */
  font-size: 4em; /* 文字放大兩倍 */
  text-align: left; /* 標題左對齊 */
}

.score-columns {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 分為兩列 */
  gap: 20px; /* 列間距 */
  text-align: left; /* 標題左對齊 */
}

.scoreboard ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.scoreboard li {
  font-size: 32px; /* 文字放大兩倍 */
  margin-bottom: 16px; /* 下邊距放大兩倍 */
}

.scoreboard li.top-three {
  font-size: 40px; /* 文字放大兩倍 */
  font-weight: bold;
}

.large-button {
  padding: 20px 40px; /* 增加按鈕的填充空間 */
  font-size: 1.5em; /* 放大按鈕文字 */
  cursor: pointer;
  border-radius: 8px; /* 增加圓角 */
  border: none; /* 移除邊框 */
  background-color: #007BFF; /* 設置背景色 */
  color: white; /* 設置文字顏色 */
}

.large-button:hover {
  background-color: #0056b3; /* 設置懸停時的背景色 */
}
</style>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useNuxtApp } from '#app';

const { $websocket } = useNuxtApp();
const username = 'quiz_master'; // 為 quiz.vue 分配一個唯一的玩家名
const questions = ref([]);
const currentQuestionIndex = ref(0);
const countdown = ref(0);
const scores = ref({});
const gameStarted = ref(false); // 添加控制變量來管理問答遊戲的開始狀態
const currentQuestion = computed(() => {
  if (currentQuestionIndex.value !== null && currentQuestionIndex.value < questions.value.length) {
    return questions.value[currentQuestionIndex.value];
  }
  return null;
});

const sortedScores = computed(() => {
  const scoresArray = Object.entries(scores.value)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
  return scoresArray.length ? scoresArray : [];
});

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3002/questions');
    questions.value = response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
  }

  if ($websocket) {
    console.log('WebSocket connected in quiz.vue');
    // 加入遊戲
    const joinMessage = { type: 'join', name: username };
    $websocket.send(JSON.stringify(joinMessage));
    console.log('Sent join message', joinMessage);
    $websocket.onopen = () => {
      console.log('WebSocket connection opened');
    };
    $websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message from server in quiz.vue', data); // 調試輸出
      if (data.type === 'scoreUpdate') {
        console.log('Processing score update:', data); // 新增的調試輸出
        if (scores.value[data.id]) {
          scores.value[data.id] += data.score;
        } else {
          scores.value[data.id] = data.score;
        }
        console.log('Updated scores', scores.value);
      }
    };
  }
});

function startCountdown() {
  if (currentQuestion.value) {
    countdown.value = parseInt(currentQuestion.value.倒數時間);
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value === 0) {
        clearInterval(timer);
        // 發送正確答案至所有玩家
        if ($websocket) {
          const message = {
            type: 'answer',
            correctAnswer: currentQuestion.value.正確答案,
            score: parseInt(currentQuestion.value.分數)
          };
          $websocket.send(JSON.stringify(message));
          console.log('Sent answer to all players', message);
        }
      }
    }, 1000);
  }
}

function startGame() {
  gameStarted.value = true;
  startCountdown();
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    startCountdown();
  } else {
    currentQuestionIndex.value = null; // 所有題目已完成
  }
}
</script>

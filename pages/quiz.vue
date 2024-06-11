<template>
    <div class="quiz-container">
      <div v-if="currentQuestion">
        <h1>{{ currentQuestion.題目 }}</h1>
        <div v-if="countdown > 0">
          <h2>倒數計時: {{ countdown }} 秒</h2>
        </div>
        <div v-else>
          <h2>正確答案: {{ currentQuestion.正確答案 }}</h2>
          <button @click="nextQuestion">下一題</button>
        </div>
      </div>
      <div v-else>
        <h1>所有題目已經完成！</h1>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import axios from 'axios';
  
  const questions = ref([]);
  const currentQuestionIndex = ref(0);
  const countdown = ref(0);
  const currentQuestion = computed(() => {
    if (currentQuestionIndex.value !== null && currentQuestionIndex.value < questions.value.length) {
      return questions.value[currentQuestionIndex.value];
    }
    return null;
  });
  
  onMounted(async () => {
    try {
      const response = await axios.get('http://localhost:3002/questions');
      console.log('Fetched questions:', response.data); // 調試輸出
      questions.value = response.data;
      startCountdown();
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  });
  
  watch(questions, (newQuestions) => {
    console.log('Updated questions:', newQuestions); // 調試輸出
  });
  
  function startCountdown() {
    if (currentQuestion.value) {
      console.log('Starting countdown for:', currentQuestion.value); // 調試輸出
      countdown.value = parseInt(currentQuestion.value.倒數時間);
      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    }
  }
  
  function nextQuestion() {
    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++;
      startCountdown();
    } else {
      currentQuestionIndex.value = null; // 設置為 null 表示所有題目已完成
    }
  }
  </script>
  
  <style scoped>
  .quiz-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }
  </style>
  
<template>
  <div>
    <!-- 頭部，可以包括標題或導航 -->
    <header>
      <h1>Wedding Jump</h1>
    </header>

    <!-- 主內容區，NuxtPage 用於渲染當前頁面的組件 -->
    <main>
      <NuxtPage />
    </main>

    <!-- 頁腳，可以包括版權信息或連結 -->
    <footer>
      <p>版權所有 © 2024 Fall in Love</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 創建一個可響應的數據，用來存儲計數器的值
const counter = ref(0);

// 定義一個方法來增加計數器的值
function incrementCounter() {
  counter.value++;
}

// 透過 provide 函数提供計數器數據和方法給所有的子組件
provide('counter', counter);
provide('incrementCounter', incrementCounter);
</script>


<style>
/* 全局樣式 */
body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f4f4f4;
}

header {
  background-color: #333;
  color: white;
  padding: 10px 20px;
  text-align: center;
}

main {
  min-height: 80vh;  /* 確保主內容有足夠的高度 */
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

footer {
  text-align: center;
  padding: 10px 20px;
  background-color: #333;
  color: white;
  margin-top: auto;  /* 確保頁腳始終在頁面底部 */
}
</style>


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
* {
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f8f9fa;
  line-height: 1.6;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

main {
  min-height: calc(100vh - 140px);
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

footer {
  text-align: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.9rem;
  margin-top: auto;
}

/* 響應式設計 */
@media (max-width: 768px) {
  header {
    padding: 0.75rem 1rem;
  }
  
  header h1 {
    font-size: 1.5rem;
  }
  
  main {
    min-height: calc(100vh - 120px);
  }
  
  footer {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  header h1 {
    font-size: 1.3rem;
  }
  
  main {
    min-height: calc(100vh - 100px);
  }
}

/* 全局動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 通用按鈕樣式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

/* 通用卡片樣式 */
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin: 1rem;
}

/* 載入動畫 */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>


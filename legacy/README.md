# Legacy - Nuxt 3 前端 (已棄用)

此目錄包含原始的 Nuxt 3/Vue 前端實作，已於 v2 重構中被 React 前端取代。

## 目錄結構

```
legacy/
└── nuxt/
    ├── .nuxt/              # Nuxt 建構輸出
    ├── pages/              # Vue 頁面元件
    │   ├── index.vue       # 首頁 (玩家加入)
    │   ├── game.vue        # 遊戲頁面
    │   ├── quiz.vue        # 題目主持人介面
    │   ├── game-old.vue    # 舊版遊戲頁面
    │   └── quiz-old.vue    # 舊版題目介面
    ├── plugins/            # Nuxt 外掛
    │   └── ws-client.js    # WebSocket 客戶端
    ├── composables/        # Vue 組合式 API
    │   └── useDirectWebSocket.js
    ├── app.vue             # 根元件
    └── nuxt.config.js      # Nuxt 配置
```

## 注意事項

- 此版本僅供參考，不再維護
- 新開發請使用 `client/` 目錄下的 React 前端
- 如需啟動舊版，需要還原 node_modules 和配置

## 啟動舊版 (僅供參考)

```bash
# 從專案根目錄
cd legacy/nuxt
npm install
npm run dev
```

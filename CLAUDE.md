# CLAUDE.md

此檔案提供 Claude Code (claude.ai/code) 在此專案中工作時的指引。

## 專案概述

Wedding Jump 是一個即時多人問答遊戲，專為婚禮設計。賓客加入遊戲後可在遊戲板上移動至答案區域，並參與計時問答題目進行即時計分競賽。

## 目前架構（v2.0 — React）

應用程式採用 npm workspaces monorepo，前後端分離：

```
wedding-jump/
├── client/                 # React 前端 (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # UI 元件 (common/6, host/5, player/3)
│   │   ├── pages/          # 頁面元件 (6 頁)
│   │   ├── hooks/          # 自訂 Hooks (useWs, useTimer, useSessionRecovery)
│   │   ├── stores/         # Zustand 狀態 (gameStore, playerStore, roomStore, wsStore, languageStore) — persist middleware
│   │   ├── i18n/           # 國際化 (types, en, zh, useTranslation hook)
│   │   ├── types/          # TypeScript 類型 (game, player, question, websocket)
│   │   └── utils/          # 工具函數 (api, avatars, constants, session)
│   └── e2e/                # Playwright E2E 測試
│
├── server/                 # Express API + WebSocket
│   ├── src/
│   │   ├── api.js          # REST API 伺服器 (Port 3002)
│   │   ├── ws-server.js    # WebSocket 伺服器 (Port 3001)
│   │   ├── room-manager.js # 房間與玩家管理
│   │   ├── questions.js    # CSV 題目載入與驗證
│   │   └── data-store.js   # JSON 檔案持久化
│   └── data/               # CSV 題目 + JSON 資料
│
├── design/                 # 設計資源 (style-guide.md, stitch-ui.txt)
├── docs/                   # 技術文件 (8 份)
├── docker/                 # Docker 部署配置
├── scripts/                # 工具腳本
└── legacy/                 # 舊版 Nuxt 前端 (已棄用)
```

### 關鍵檔案

| 檔案 | 用途 |
|------|------|
| `client/src/stores/wsStore.ts` | 全域 WebSocket 連線管理 (singleton, 自動重連 + onReconnect 回調) |
| `client/src/hooks/useWs.ts` | WebSocket Hook — 訂閱訊息、重連事件、自動連線 |
| `client/src/hooks/useSessionRecovery.ts` | 頁面刷新後自動重連恢復 hook |
| `client/src/stores/gameStore.ts` | 遊戲狀態：題目、答案、計時、分數、進度 (persist) |
| `client/src/stores/playerStore.ts` | 玩家狀態：位置、分數、排行榜 (persist) |
| `client/src/stores/roomStore.ts` | 房間狀態：roomId、quizMaster、連線 (persist) |
| `client/src/stores/languageStore.ts` | 語言偏好 zh/en (localStorage persist) |
| `client/src/i18n/useTranslation.ts` | `useTranslation()` hook — 回傳 `t(key, params?)` 翻譯函數 |
| `client/src/i18n/zh.ts` / `en.ts` | 中英文翻譯檔 (~118 key) |
| `client/src/components/common/LanguageToggle.tsx` | ZH \| EN 語言切換按鈕 |
| `client/src/utils/session.ts` | 清除遊戲 session (clearGameSession) |
| `server/src/ws-server.js` | WebSocket 伺服器 — 14 種訊息處理（含斷線寬限期 10 秒） |
| `server/src/room-manager.js` | 房間管理：players、scores、settings、gameState |
| `server/src/questions.js` | CSV 題目載入、驗證、類型偵測 |
| `server/src/api.js` | Express REST API 伺服器 |
| `server/src/data-store.js` | 資料持久化層 (JSON 檔案) |

### 前端路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | Home | 首頁：選擇主持人或玩家 |
| `/join` | PlayerJoin | 玩家加入：輸入房間代碼、暱稱、選頭像 |
| `/game` | PlayerGame | 玩家遊戲：移動到答案區域 |
| `/host` | HostDashboard | 主持人：建立房間、設定倒數時間、載入題目 |
| `/host/game` | HostGame | 主持人遊戲：控制題目進度 |
| `/rankings` | FinalRankings | 最終排行榜 |

### WebSocket 訊息協定

**客戶端 → 伺服器（14 種）：**
`createRoom`, `joinRoom`, `move`, `scoreUpdate`, `answer`,
`requestExistingPlayers`, `requestLeaderboard`, `requestGameState`,
`startGame`, `nextQuestion`, `revealAnswer`, `showLeaderboard`, `endGame`, `loadQuestions`

**伺服器 → 客戶端（16 種）：**
`roomCreated`, `joinedRoom`, `newPlayer`, `positionUpdate`, `scoreUpdate`,
`leaderboardUpdate`, `leaderboard`, `answer`, `playerLeft`, `roomStats`,
`error`, `question`, `questionsLoaded`, `gameEnded`, `roomClosed`, `gameState`

### 房間設定

建立房間時可設定：
- `defaultTimer`：預設倒數時間（秒），`null` 表示使用各題目內建的 `倒數時間`，有效範圍 5-120 秒

### 題目格式

`server/data/questions.csv` 支援兩種格式：

- **O/X 二選一**：`題目,倒數時間,正確答案,分數`（答案為 O 或 X）
- **A/B/C/D 四選一**：`題目,選項A,選項B,選項C,選項D,倒數時間,正確答案,分數`

系統根據 CSV 欄位自動偵測格式。

### 遊戲狀態機

```
waiting → question → answering → reveal → question (循環) → ended
```

- `waiting`：等待主持人開始
- `question`：顯示題目，倒數計時中
- `answering`：玩家已選答案（移動到區域）
- `reveal`：揭曉正確答案
- `ended`：遊戲結束，顯示排行榜

### 連線生命週期

- **自動重連**：斷線後自動嘗試重連（最多 5 次，間隔 3 秒）
- **重連回調**：`onReconnect` 機制讓頁面在重連後自動重新加入房間
- **斷線寬限期**：伺服器在 WebSocket 關閉後 10 秒內不移除玩家，允許頁面刷新重連
- **Session Recovery**：Zustand stores 用 `sessionStorage` 持久化，搭配 `useSessionRecovery` hook 自動恢復
- **房間關閉通知**：`roomClosed` 訊息讓客戶端清理 session 並導回首頁
- **健康檢查**：伺服器每 30 秒 ping/pong，偵測並清除失效連線
- **主持人離開 → 房間關閉**：Quiz Master 離開觸發 `closeRoom`，通知所有玩家

### 國際化 (i18n)

- **架構**：自製輕量方案 — `languageStore` (Zustand + localStorage) + `useTranslation` hook
- **語言**：中文 (zh, 預設) / 英文 (en)
- **翻譯檔**：`client/src/i18n/zh.ts` 和 `en.ts`，共 ~118 個 key，平面 dot notation（如 `home.subtitle`、`gameControls.startQuestion`）
- **使用方式**：`const { t } = useTranslation();` → `t('key')` 或 `t('key', { param: value })`
- **切換元件**：`<LanguageToggle />` 顯示在 Home、PlayerJoin、HostDashboard、FinalRankings；遊戲中隱藏
- **不翻譯**：品牌名 "Wedding Jump"、答案標籤 (A/B/C/D, O/X)、數字分數
- **測試**：`test-setup.ts` 預設 `language: 'en'`，確保既有英文斷言不變

## 開發指令

```bash
# 安裝依賴（npm workspaces 自動安裝 client + server）
npm install

# 開發模式（同時啟動前端 + 後端）
npm run dev

# 分開啟動
npm run dev:client    # React 前端 http://localhost:5173
npm run dev:server    # API http://localhost:3002 + WS ws://localhost:3001

# 建構
npm run build         # 建構前端至 client/dist/

# 啟動生產環境
npm start
```

### 測試

```bash
# 全部測試（client + server 共 290 個單元測試）
npm test

# 分開執行
npm run test:client    # Vitest — 156 tests (13 test files)
npm run test:server    # Vitest — 134 tests (4 test files)
npm run test:e2e       # Playwright E2E (需啟動服務)

# Watch 模式
cd client && npm run test:watch
cd server && npm run test:watch
```

### Docker 部署

```bash
# 可從任何目錄執行
./scripts/docker-start.sh         # 啟動
./scripts/docker-logs.sh -f       # 檢視日誌
./scripts/docker-stop.sh          # 停止
./docker/docker-compose-rebuild.sh  # 重建並啟動
```

Docker 連接埠對應：前端 8000 → 3000、WebSocket 8001 → 3001、API 8002 → 3002

## 環境變數

複製 `.env.example` 為 `.env` 並設定：

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `VITE_WS_URL` | WebSocket 伺服器 URL | `ws://localhost:3001` |
| `VITE_API_URL` | API 伺服器 URL | `http://localhost:3002` |
| `WS_PORT` | WebSocket 連接埠 | `3001` |
| `API_PORT` | API 連接埠 | `3002` |

## 技術棧

### 前端
- React 19 + TypeScript 5.9
- Vite 7.3 (建構 + 開發伺服器)
- Tailwind CSS 4.2
- Zustand 5 (狀態管理)
- React Router v7

### 後端
- Express 4 (REST API)
- ws 8 (WebSocket)
- csv-parser 3

### 測試
- Vitest 4 (單元測試)
- @testing-library/react (元件測試)
- Playwright (E2E 測試)
- Supertest (API 測試)

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/questions` | GET | 取得題目列表 |
| `/health` | GET | 健康檢查 |
| `/api/info` | GET | API 資訊 |
| `/api/rooms` | GET/POST | 房間列表 / 建立房間 |
| `/api/rooms/:id` | GET/DELETE | 房間詳情 / 關閉房間 |
| `/api/rooms/:id/leaderboard` | GET | 排行榜 |
| `/api/storage/stats` | GET | 存儲統計 |
| `/api/storage/export` | GET | 匯出資料 |
| `/api/storage/import` | POST | 匯入資料 |
| `/api/storage/cleanup` | DELETE | 清理過期資料 |

## 遊戲完整流程

```
HostDashboard:
  createRoom(quizMaster, defaultTimer?) → roomCreated
  → loadQuestions → questionsLoaded(count)
  → Start Game → startGame → navigate('/host/game')

HostGame:
  收到 question(question, questionIndex, totalQuestions)
  → 顯示題目 + 倒數計時
  → Reveal → revealAnswer → answer(correctAnswer)
  → Show Leaderboard → leaderboardUpdate
  → Next → nextQuestion → 下一題
  → 最後一題結束 → gameEnded

PlayerGame:
  收到 question → 看到題目 + 倒數計時
  → 點擊答案區 → move(x, y)
  → 收到 answer → 顯示正確答案 + scoreUpdate
  → 收到下一題 → 重新開始
  → gameEnded → navigate('/rankings')

連線中斷 / 頁面刷新:
  → WebSocket 自動重連 (最多 5 次)
  → Zustand stores 從 sessionStorage hydrate
  → useSessionRecovery: joinRoom(原 playerId) → requestGameState → 恢復遊戲
  → 伺服器 10 秒寬限期：玩家不會被立即移除

房間結束:
  → endGame → gameEnded 廣播 → 重置 gameState
  → Quiz Master 離開 → roomClosed 廣播 → 玩家清理狀態
```

## 設計資源

- 設計規範：`design/style-guide.md`
- 主持人介面原型：`design/stitch-ui.txt`
- UI 設計文件：`docs/ui-design.md`

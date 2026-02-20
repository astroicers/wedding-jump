# 系統架構

## 概覽

Wedding Jump 採用前後端分離架構，透過 REST API 和 WebSocket 進行通訊。前端為 React SPA，後端為 Express API + WebSocket 伺服器。

```
┌─────────────────────────────────────────────────────────────────┐
│                        用戶端                                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   玩家手機        │              │   主持人大螢幕     │         │
│  │   (React SPA)    │              │   (React SPA)    │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼─────────────────────────────────┼───────────────────┘
            │                                 │
            │ HTTP/WebSocket                  │ HTTP/WebSocket
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        伺服器端                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Express API    │              │  WebSocket Server │         │
│  │   (Port 3002)    │              │   (Port 3001)    │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                 │                   │
│           └───────────────┬─────────────────┘                   │
│                           │                                     │
│                   ┌───────▼───────┐                             │
│                   │ Room Manager  │                             │
│                   └───────┬───────┘                             │
│                           │                                     │
│                   ┌───────▼───────┐                             │
│                   │  Data Store   │                             │
│                   │  (JSON Files) │                             │
│                   └───────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## 前端架構

### 元件層級

```
App (Router)
├── Home                    # 首頁 — 選擇主持人/玩家
│
├── PlayerJoin              # 玩家加入 — 房間代碼、暱稱、頭像
│   └── AvatarSelector
│
├── PlayerGame              # 玩家遊戲畫面
│   ├── GameArena           # 遊戲區域 — 玩家位置、答案區
│   │   └── AnswerZone      # 答案區域 (O/X 或 A/B/C/D)
│   ├── Timer               # 倒數計時器
│   └── ProgressBar         # 題目進度條
│
├── HostDashboard           # 主持人 — 建立房間、設定倒數時間、載入題目
│
├── HostGame                # 主持人遊戲畫面
│   ├── QuestionCard        # 題目卡片
│   ├── AnswerGrid          # 答案選項格
│   ├── GameControls        # 遊戲控制按鈕
│   ├── PlayerCounter       # 線上玩家數
│   ├── Timer               # 倒數計時器
│   └── LeaderboardPopup    # 排行榜彈出
│
└── FinalRankings           # 最終排行榜
    └── Leaderboard
```

### 狀態管理（Zustand）

```
┌─────────────────────────────────────────────────────┐
│                   Zustand Stores                     │
├──────────────┬──────────────┬───────────┬───────────┤
│  wsStore     │  roomStore   │ gameStore │playerStore│
│              │  (persist)   │ (persist) │ (persist) │
│ status       │ roomId       │ phase     │ players   │
│ isConnected  │ quizMaster   │ questions │ current   │
│ _ws (single) │ isQuizMaster │ timer     │ leaderboard│
│ _handlers    │ isJoined     │ scores    │ positions │
│              │ isConnected  │           │           │
│ connect()    │ setRoom()    │ setPhase()│ addPlayer()│
│ disconnect() │ clearRoom()  │ nextQ()   │ update()  │
│ send()       │              │ reset()   │           │
│ subscribe()  │              │           │           │
└──────┬───────┴──────────────┴───────────┴───────────┘
       │
       └── useWs() hook ← 所有頁面共享同一個 WebSocket 連線

**狀態持久化（Session Recovery）**

`roomStore`、`playerStore`、`gameStore` 使用 Zustand `persist` middleware 搭配 `sessionStorage`，確保頁面刷新後可恢復遊戲狀態。

| Store | 持久化欄位 | 排除欄位 |
|-------|-----------|---------|
| `roomStore` | roomId, roomCode, quizMaster, isQuizMaster, isJoined | isConnected |
| `playerStore` | currentPlayer | players (Map), leaderboard |
| `gameStore` | phase, currentQuestionIndex, totalQuestions | questions, currentQuestion, selectedAnswer |

`wsStore` 不持久化（WebSocket 連線必須每次重建）。

頁面刷新後由 `useSessionRecovery` hook 自動重新加入房間並恢復遊戲狀態。
```

**重要設計決策：WebSocket 共享連線**

`wsStore` 是唯一管理 WebSocket 連線的 Zustand store。各頁面透過 `useWs` Hook 訂閱訊息，不會各自建立連線。這解決了頁面切換時的斷線問題。

```
wsStore (Zustand singleton)
  ├── 管理唯一 WebSocket 實例
  ├── 自動重連（最多 5 次，間隔 3 秒）
  ├── subscribe/unsubscribe 模式通知各頁面
  └── onReconnect 回調：重連後通知頁面重新加入房間

useWs (React Hook)
  ├── 從 wsStore 取得 send/status/isConnected
  ├── 訂閱 onMessage callback
  ├── 訂閱 onReconnect callback（重連事件）
  └── autoConnect 選項（預設 true）
```

### 前端元件

| 元件 | 說明 |
|------|------|
| React SPA | 單頁應用程式，使用 Vite 建構 |
| Zustand | 輕量級狀態管理（4 stores） |
| React Router v7 | 客戶端路由（6 頁） |
| useWs Hook | 共享 WebSocket 連線 |
| useTimer Hook | 倒數計時 |
| useSessionRecovery Hook | 頁面刷新後自動重連恢復 |

### 後端元件

| 元件 | 說明 |
|------|------|
| Express API | REST API 伺服器，處理題目和房間管理 |
| WebSocket Server | 處理即時遊戲通訊 |
| Room Manager | 房間和玩家生命週期管理 |
| Data Store | JSON 檔案持久化存儲 |

## 資料流

### 1. 建立房間

```
主持人 ──────► Express API ──────► Room Manager ──────► Data Store
  │           POST /api/rooms      createRoom()        rooms.json
  │
  └──────────► WebSocket ─────────► Room Manager
               createRoom          joinRoom()
```

### 2. 玩家加入

```
玩家 ──────────► WebSocket ─────────► Room Manager
                joinRoom             joinRoom()
                    │
                    ▼
              廣播給房間內所有人
              type: 'newPlayer'
```

### 3. 遊戲進行

```
主持人 ──────► WebSocket ──────► Room Manager ──────► 廣播
             type: 'answer'     broadcastToRoom()    所有玩家

玩家 ────────► WebSocket ──────► Room Manager ──────► 廣播
             type: 'move'       updatePosition()     其他玩家

玩家 ────────► WebSocket ──────► Room Manager ──────► 廣播
             type: 'scoreUpdate' updateScore()       排行榜
```

### 4. 遊戲狀態機

```
waiting ──► question ──► answering ──► reveal ──► question (loop)
                                         │
                                         └──► finished ──► ended
```

| 階段 | 說明 | 觸發者 |
|------|------|--------|
| `waiting` | 等待開始 | 初始狀態 |
| `question` | 顯示題目 | 主持人按「Start Question」 |
| `answering` | 玩家移動到答案區 | 計時中 |
| `reveal` | 揭曉正確答案 | 主持人按「Reveal Answer」 |
| `finished` | 最後一題結束 | 無更多題目時 |
| `ended` | 遊戲結束 | 主持人按「End Game」 |

### 5. 遊戲結束

```
主持人 ──────► Express API ──────► Room Manager ──────► Data Store
              DELETE /api/rooms   closeRoom()         清理資料
```

## 檔案存儲

資料持久化使用 JSON 檔案：

```
server/data/
├── rooms.json      # 房間資料
├── players.json    # 玩家資料
├── scores.json     # 分數資料
└── questions.csv   # 題目資料
```

## 通訊協定

| 類型 | 用途 | 協定 |
|------|------|------|
| 題目載入 | 取得題目列表 | HTTP GET |
| 房間管理 | 建立/查詢/關閉房間 | HTTP REST |
| 即時遊戲 | 玩家移動、答題、分數 | WebSocket |

詳細 WebSocket 協定參考 [websocket-protocol.md](./websocket-protocol.md)

## 測試架構

```
┌───────────────────────────────────────────┐
│              Test Pyramid                  │
├───────────────────────────────────────────┤
│         E2E Tests (Playwright)            │
│       ──────────────────────              │
│      Integration (Supertest)              │  21 tests (API endpoints)
│     ────────────────────────              │
│    Unit Tests (Vitest + RTL)              │  289 tests (17 test files)
│   ──────────────────────────              │
│  Client: utils, stores, hooks, components │  156 tests (13 files)
│  Server: data-store, room-manager, api,   │  133 tests (4 files)
│          questions                        │
└───────────────────────────────────────────┘
```

## 擴展性考量

- **水平擴展**: WebSocket 連線需使用 Redis Pub/Sub 同步多實例
- **資料庫**: 大規模使用時可替換 JSON 為 PostgreSQL/MongoDB
- **快取**: 題目已實作記憶體快取 (60 秒)
- **最大玩家數**: 目前設定 200 (`MAX_PLAYERS` 常數)

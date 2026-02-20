# Wedding Jump

即時多人婚禮問答遊戲 — 讓賓客在婚禮中互動，透過回答關於新人的問題來競爭排名！

## 功能特色

- **即時多人遊戲** — 支援上百位玩家同時參與
- **雙模式題目** — 支援 O/X 二選一和 A/B/C/D 四選一
- **頭像系統** — 預設可愛動物頭像（DiceBear API）
- **即時排行榜** — 分數即時更新，競爭更刺激
- **主持人控制台** — 大螢幕投影專用介面（16:9）
- **響應式設計** — 手機玩家端 + 大螢幕主持人端
- **自動重連** — WebSocket 斷線自動重連，玩家端自動重新加入房間
- **可設定倒數時間** — 建立房間時可統一設定倒數秒數，或使用每題內建時間
- **中英文切換** — 內建 ZH/EN 語言切換，偏好自動儲存至 localStorage

## 快速開始

### 環境需求

- Node.js 18+
- npm 9+

### 安裝

```bash
git clone https://github.com/your-repo/wedding-jump.git
cd wedding-jump
npm install
```

### 開發模式

```bash
# 同時啟動前端和後端
npm run dev

# 或分別啟動
npm run dev:client    # React 前端 http://localhost:5173
npm run dev:server    # API + WebSocket http://localhost:3002, ws://localhost:3001
```

### 測試

```bash
# 執行全部測試 (290 單元測試)
npm test

# 分開執行
npm run test:client    # 前端 156 tests (13 files)
npm run test:server    # 後端 134 tests (4 files)
npm run test:e2e       # E2E (需啟動服務)
```

### 生產部署

```bash
npm run build    # 建構前端
npm start        # 啟動伺服器
```

### Docker 部署

```bash
cd docker
bash docker-compose-rebuild.sh    # 重建並啟動（推薦）
docker-compose up -d              # 啟動
docker-compose logs -f            # 日誌
docker-compose down               # 停止
```

Docker 連接埠：前端 `8000`、WebSocket `8001`、API `8002`

## 專案結構

```
wedding-jump/
├── client/           # React 前端 (Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/   # UI 元件 (common/6, host/5, player/3)
│   │   ├── pages/        # 頁面元件 (6 頁)
│   │   ├── hooks/        # 自訂 Hooks (useWs, useTimer, useSessionRecovery)
│   │   ├── stores/       # Zustand 狀態管理 (5 stores)
│   │   ├── i18n/         # 國際化 (zh/en 翻譯、useTranslation hook)
│   │   ├── types/        # TypeScript 類型定義 (5 files)
│   │   └── utils/        # 工具函數 (api, avatars, constants, session)
│   └── e2e/              # Playwright E2E 測試
├── server/           # Express API + WebSocket
│   ├── src/              # api, ws-server, room-manager, questions, data-store
│   └── data/             # CSV 題目 + JSON 資料
├── docs/             # 技術文件 (8 份)
├── design/           # 設計規範與原型
├── docker/           # Docker 配置
├── scripts/          # 工具腳本
└── legacy/           # 舊版 Nuxt 前端 (已棄用)
```

## 技術棧

### 前端

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 5.9 | 型別安全 |
| Vite | 7.3 | 建構工具 |
| Tailwind CSS | 4.2 | 樣式系統 |
| Zustand | 5 | 狀態管理 |
| React Router | v7 | 客戶端路由 |

### 後端

| 技術 | 版本 | 用途 |
|------|------|------|
| Express | 4 | REST API |
| ws | 8 | WebSocket 即時通訊 |
| csv-parser | 3 | CSV 題目解析 |

### 測試

| 技術 | 用途 |
|------|------|
| Vitest | 單元測試 (client + server) |
| @testing-library/react | React 元件測試 |
| Supertest | API 端點測試 |
| Playwright | E2E 瀏覽器測試 |

## 使用方式

### 主持人

1. 開啟主持人介面 `/host`
2. 輸入主持人名稱，選擇倒數時間（Auto / 10s / 15s / 20s / 30s）
3. 建立新房間，取得房間代碼
4. 將房間代碼分享給賓客
5. 等待玩家加入，題目自動載入
6. 按 Start Game 開始遊戲
7. 控制題目進度：出題 → 揭曉答案 → 顯示排行 → 下一題

### 玩家

1. 手機掃 QR Code 或輸入網址
2. 輸入房間代碼和暱稱
3. 選擇頭像
4. 按 GET READY 加入
5. 看到題目後，點擊你認為正確的答案區域

## 頁面路由

| 路徑 | 說明 |
|------|------|
| `/` | 首頁 — 選擇主持人或玩家 |
| `/join` | 玩家加入 — 輸入房間代碼、暱稱、選頭像 |
| `/game` | 玩家遊戲 — 移動到答案區域 |
| `/host` | 主持人控制台 — 建立房間、設定倒數時間 |
| `/host/game` | 主持人遊戲 — 控制題目進度 |
| `/rankings` | 最終排行榜 |

## 文件

- [系統架構](docs/architecture.md)
- [API 文件](docs/api-reference.md)
- [WebSocket 協定](docs/websocket-protocol.md)
- [UI 設計文件](docs/ui-design.md)
- [開發指南](docs/development.md)
- [部署指南](docs/deployment.md)
- [題目格式](docs/question-format.md)
- [設計規範](design/style-guide.md)

## 環境變數

複製 `.env.example` 為 `.env` 並設定：

```env
# 前端
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3002

# 後端
WS_PORT=3001
API_PORT=3002
NODE_ENV=development
```

## 授權

MIT License

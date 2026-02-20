# 開發指南

## 環境設定

### 前置需求

- Node.js 18+
- npm 9+
- Git

### 初始化

```bash
# 克隆專案
git clone https://github.com/your-repo/wedding-jump.git
cd wedding-jump

# 安裝依賴（npm workspaces 會自動安裝 client + server）
npm install

# 複製環境變數
cp .env.example .env
```

### 啟動開發伺服器

```bash
# 同時啟動前後端（推薦）
npm run dev

# 或分別啟動
npm run dev:client    # 前端 http://localhost:5173
npm run dev:server    # 後端 http://localhost:3002, ws://localhost:3001
```

---

## 專案結構

```
wedding-jump/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/     # Avatar, Button, Timer, Leaderboard, ProgressBar
│   │   │   ├── host/       # AnswerGrid, GameControls, QuestionCard, LeaderboardPopup, PlayerCounter
│   │   │   └── player/     # AnswerZone, AvatarSelector, GameArena
│   │   ├── pages/          # Home, PlayerJoin, PlayerGame, HostDashboard, HostGame, FinalRankings
│   │   ├── hooks/          # useWs (共享 WebSocket + onReconnect), useTimer, useSessionRecovery
│   │   ├── stores/         # gameStore, playerStore, roomStore, wsStore
│   │   ├── types/          # game, player, question, websocket
│   │   └── utils/          # api, avatars, constants, session
│   ├── e2e/                # Playwright E2E 測試
│   ├── vite.config.ts
│   └── package.json
│
├── server/                 # Express 後端
│   ├── src/
│   │   ├── api.js          # REST API
│   │   ├── ws-server.js    # WebSocket
│   │   ├── room-manager.js # 房間管理
│   │   ├── questions.js    # 題目載入/驗證（共用模組）
│   │   └── data-store.js   # JSON 持久化
│   ├── data/               # CSV 題目 + JSON 資料
│   └── package.json
│
├── design/                 # 設計資源
│   ├── style-guide.md      # 設計規範
│   └── stitch-ui.txt       # 主持人介面 HTML 原型
│
├── docs/                   # 技術文件
├── docker/                 # Docker 配置
├── scripts/                # 工具腳本
└── legacy/                 # 舊版 Nuxt (已棄用)
```

---

## 前端開發

### 技術棧

- React 19 + TypeScript 5.9
- Vite 7.3
- Tailwind CSS 4.2
- Zustand 5
- React Router v7

### 新增元件

```tsx
// client/src/components/common/Example.tsx
import { FC } from 'react';

interface ExampleProps {
  title: string;
}

export const Example: FC<ExampleProps> = ({ title }) => {
  return (
    <div className="p-4 bg-primary rounded-lg">
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
};
```

### 使用 Zustand 狀態

```tsx
import { useGameStore } from '../stores/gameStore';

function ScoreDisplay() {
  const { lastScoreGained, phase } = useGameStore();
  return <div>Score: {lastScoreGained}</div>;
}
```

### WebSocket 連線架構

專案使用 **共享 WebSocket 連線** 模式，由 `wsStore` 管理唯一 WebSocket 實例，元件透過 `useWs` Hook 訂閱訊息。

**架構圖：**

```
┌──────────────┐
│   wsStore    │  Zustand singleton — 管理 WebSocket 連線、重連、狀態
│  (唯一實例)   │  connect(), disconnect(), send(), subscribe(), onReconnect()
└──────┬───────┘
       │
       ├── useWs({ onMessage, onReconnect })  ← 各頁面的 Hook
       │     └── PlayerGame    (onReconnect: 重新 joinRoom + requestGameState)
       │     └── HostGame      (onReconnect: 重新 joinRoom + requestGameState + loadQuestions)
       │     └── PlayerJoin
       │
       └── useWs({ autoConnect })  ← 自動連線
```

**使用範例：**

```tsx
import { useWs } from '../hooks/useWs';

function PlayerGame() {
  const { send, isConnected } = useWs({
    onMessage: (message) => {
      switch (message.type) {
        case 'answer':
          // 處理正確答案揭曉
          break;
        case 'leaderboardUpdate':
          // 更新排行榜
          break;
        case 'roomClosed':
          // 清除狀態，導回首頁
          break;
      }
    },
    onReconnect: () => {
      // 重連後自動重新加入房間
      send({ type: 'joinRoom', roomId, playerName, playerId });
    },
  });

  const handleMove = (x: number, y: number) => {
    send({ type: 'move', x, y });
  };

  return <div>連線狀態: {isConnected ? '已連線' : '未連線'}</div>;
}
```

**重要：** 不要直接使用 `useWebSocket` Hook（舊版），改用 `useWs` 搭配 `wsStore`。`useWs` 不會建立新的 WebSocket 連線，而是共享全域連線。

---

## 後端開發

### 技術棧

- Express 4 (REST API)
- ws 8 (WebSocket)
- csv-parser 3

### 新增 API 端點

```javascript
// server/src/api.js

app.get('/api/example', (req, res) => {
  res.json({
    success: true,
    data: { message: 'Hello World' }
  });
});
```

### 新增 WebSocket 訊息處理

```javascript
// server/src/ws-server.js

case 'customMessage':
  handleCustomMessage(ws, data);
  break;

function handleCustomMessage(ws, data) {
  ws.send(JSON.stringify({
    type: 'customResponse',
    data: data
  }));
}
```

---

## 樣式開發

### Tailwind 自訂色彩

```
Primary:      #f48c25    (主色調、按鈕)
Accent Pink:  #ff4d94    (CTA、重要操作)
Bg Light:     #f8f7f5    (淺色背景)
Bg Dark:      #221910    (深色背景)
Zone A Red:   #ff4d4d    (遊戲區域 A)
Zone B Blue:  #4d79ff    (遊戲區域 B)
Zone C Yellow:#ffcc00    (遊戲區域 C)
Zone D Green: #2ecc71    (遊戲區域 D)
```

### 字體

- 主字體：Spline Sans (Google Fonts)
- 圖標：Google Material Symbols Outlined

### 設計規範

完整設計規範參考 [design/style-guide.md](../design/style-guide.md)

UI 設計文件參考 [docs/ui-design.md](./ui-design.md)

---

## 測試

### 測試架構

| 層級 | 框架 | 檔案位置 | 測試數 |
|------|------|----------|--------|
| Client 單元測試 | Vitest + @testing-library/react + jsdom | `client/src/**/*.test.{ts,tsx}` | 156 |
| Server 單元測試 | Vitest + Supertest | `server/src/**/*.test.js` | 133 |
| E2E 測試 | Playwright | `client/e2e/` | - |
| **合計** | | | **289** |

### 測試指令

```bash
# 全部單元測試
npm test

# 前端單元測試
npm run test:client

# 後端單元測試
npm run test:server

# E2E 測試（需先啟動服務）
npm run test:e2e

# Watch 模式
cd client && npm run test:watch
cd server && npm run test:watch
```

### 測試覆蓋

**Client 測試 (13 files, 156 tests):**

| 類別 | 檔案 | 測試數 |
|------|------|--------|
| Utils | `avatars.test.ts`, `api.test.ts` | 31 |
| Stores | `gameStore.test.ts`, `playerStore.test.ts`, `roomStore.test.ts`, `wsStore.test.ts` | 63 |
| Hooks | `useTimer.test.ts` | 12 |
| Components | `Avatar.test.tsx`, `Button.test.tsx`, `ProgressBar.test.tsx`, `Timer.test.tsx`, `GameControls.test.tsx`, `AnswerZone.test.tsx` | 50 |

**Server 測試 (4 files, 133 tests):**

| 檔案 | 測試數 |
|------|--------|
| `data-store.test.js` | 15 |
| `room-manager.test.js` | 69 |
| `questions.test.js` | 28 |
| `api.test.js` | 21 |

### 測試模式

**Zustand Store 測試：**
```ts
import { useGameStore } from './gameStore';

beforeEach(() => {
  useGameStore.setState({ phase: 'waiting', questions: [] });
});

it('should set phase', () => {
  useGameStore.getState().setPhase('question');
  expect(useGameStore.getState().phase).toBe('question');
});
```

**元件測試：**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

it('should fire onClick', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);
  fireEvent.click(screen.getByText('Click'));
  expect(onClick).toHaveBeenCalled();
});
```

**Timer Hook 測試（使用 fake timers）：**
```ts
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('should count down', () => {
  const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));
  act(() => result.current.start());
  act(() => vi.advanceTimersByTime(3000));
  expect(result.current.seconds).toBe(7);
});
```

**API 測試（Supertest）：**
```js
import request from 'supertest';
import { app } from './api.js';

it('GET /health → 200', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('healthy');
});
```

### 手動測試

1. 開啟兩個瀏覽器視窗
2. 一個作為主持人 (`/host`)
3. 一個作為玩家 (`/join`)
4. 測試完整流程

### WebSocket 測試

```bash
wscat -c ws://localhost:3001

# 發送測試訊息
{"type":"joinRoom","roomId":123456,"playerName":"測試","playerId":"test_123"}
```

### API 測試

```bash
curl http://localhost:3002/health
curl http://localhost:3002/questions
curl -X POST http://localhost:3002/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"quizMaster":"測試主持人"}'
```

---

## 程式碼風格

### TypeScript

- 使用嚴格模式
- 定義明確的類型（參考 `client/src/types/`）
- 避免使用 `any`

### 命名規範

| 類型 | 規範 | 範例 |
|------|------|------|
| 元件 | PascalCase | `PlayerCard.tsx` |
| Hook | camelCase + use 前綴 | `useWs.ts` |
| Store | camelCase + Store 後綴 | `gameStore.ts` |
| 工具函數 | camelCase | `avatars.ts` |
| 常數 | UPPER_SNAKE_CASE | `MAX_PLAYERS` |
| 類型 | PascalCase | `GamePhase`, `Question` |

### 檔案組織

- 元件放在 `components/{common,host,player}/`
- 測試檔與源碼同目錄，命名為 `*.test.{ts,tsx}`
- 類型定義統一在 `types/`，由 `types/index.ts` 匯出

---

## Git 工作流

### 分支命名

- `feature/xxx` - 新功能
- `fix/xxx` - 修復
- `refactor/xxx` - 重構
- `docs/xxx` - 文件

### 提交訊息

```
feat: 新增玩家頭像選擇功能
fix: 修復 WebSocket 重連問題
docs: 更新 API 文件
refactor: 重構排行榜元件
test: 新增 gameStore 單元測試
```

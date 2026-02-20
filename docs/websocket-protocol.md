# WebSocket 協定

## 連線資訊

- **URL**: `ws://localhost:3001`（開發）/ `wss://your-domain.com/ws`（生產）
- **協定**: WebSocket
- **訊息格式**: JSON
- **TypeScript 定義**: `client/src/types/websocket.ts`

## 客戶端連線架構

前端使用 `wsStore`（Zustand singleton）管理唯一 WebSocket 連線，搭配 `useWs` Hook 訂閱訊息。

```
wsStore.connect()      →  new WebSocket(WS_URL)
wsStore.send()         →  ws.send(JSON.stringify(message))
wsStore.subscribe()    →  註冊 onMessage callback
wsStore.onReconnect()  →  註冊重連回調（重連後自動 re-join room）
```

**自動重連**: 斷線後自動重連，最多 5 次，間隔 3 秒。重連成功後觸發 `onReconnect` 回調，玩家端會自動重新發送 `joinRoom`。

## 連線流程

### 主持人建立房間

```
主持人                       伺服器
  │                            │
  │──── WebSocket Connect ────►│
  │                            │
  │──── createRoom ───────────►│
  │                            │
  │◄─── roomCreated ──────────│  (含 roomId, playerId)
  │                            │
```

### 玩家加入房間

```
玩家                         伺服器
  │                            │
  │──── WebSocket Connect ────►│
  │                            │
  │──── joinRoom ─────────────►│
  │                            │
  │◄─── joinedRoom ────────────│
  │◄─── roomStats ─────────────│  (房間內現有玩家)
  │                            │
  │     [其他玩家收到]           │
  │     newPlayer ─────────────│──► 廣播
  │                            │
```

### 遊戲進行

```
主持人                       伺服器                    玩家
  │                            │                        │
  │── loadQuestions ──────────►│                        │
  │◄── questionsLoaded ────────│                        │
  │                            │                        │
  │── startGame ──────────────►│── question ──────────►│
  │                            │                        │
  │                            │◄── move ──────────────│
  │                            │── positionUpdate ────►│ (廣播)
  │                            │                        │
  │── answer (揭曉) ──────────►│── answer ────────────►│ (廣播)
  │                            │                        │
  │                            │◄── scoreUpdate ───────│
  │                            │── scoreUpdate ───────►│ (廣播)
  │                            │── leaderboardUpdate ─►│ (廣播)
  │                            │                        │
  │── nextQuestion ───────────►│── question ──────────►│
  │     ...                    │     ...                │
  │                            │                        │
  │── endGame ────────────────►│── gameEnded ─────────►│ (廣播)
  │                            │                        │
```

---

## 訊息類型

### 客戶端 → 伺服器

#### createRoom

主持人建立房間。

```json
{
  "type": "createRoom",
  "quizMaster": "主持人名稱",
  "defaultTimer": 20
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| quizMaster | string | N | 主持人名稱 |
| defaultTimer | number | N | 預設倒數時間（5-120 秒），省略則使用各題目內建時間 |

#### joinRoom

玩家加入房間。

```json
{
  "type": "joinRoom",
  "roomId": 123456,
  "playerName": "小明",
  "playerId": "player_unique_id",
  "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| roomId | number | Y | 房間 ID |
| playerName | string | Y | 玩家暱稱 |
| playerId | string | Y | 唯一玩家 ID |
| avatar | string | N | 頭像 URL |

#### move

玩家移動位置。

```json
{
  "type": "move",
  "x": 25.5,
  "y": 75.3
}
```

**座標說明：**
- `x`: 0-100，左右位置百分比
- `y`: 0-100，上下位置百分比

#### scoreUpdate

更新玩家分數。

```json
{
  "type": "scoreUpdate",
  "id": "小明",
  "playerId": "player_unique_id",
  "score": 100
}
```

#### answer

主持人廣播正確答案（僅限 Quiz Master）。

```json
{
  "type": "answer",
  "correctAnswer": "O",
  "score": 100
}
```

#### requestExistingPlayers

請求現有玩家列表。

```json
{
  "type": "requestExistingPlayers"
}
```

#### requestLeaderboard

請求排行榜。

```json
{
  "type": "requestLeaderboard"
}
```

#### loadQuestions

主持人請求載入題目。

```json
{
  "type": "loadQuestions"
}
```

#### startGame

主持人開始遊戲。

```json
{
  "type": "startGame",
  "roomId": 123456
}
```

#### nextQuestion

主持人進入下一題。

```json
{
  "type": "nextQuestion"
}
```

#### revealAnswer

主持人揭曉答案。

```json
{
  "type": "revealAnswer"
}
```

#### showLeaderboard

主持人顯示排行榜。

```json
{
  "type": "showLeaderboard"
}
```

#### endGame

主持人結束遊戲。

```json
{
  "type": "endGame"
}
```

#### requestGameState

頁面刷新後重連，請求當前遊戲狀態。

```json
{
  "type": "requestGameState"
}
```

---

### 伺服器 → 客戶端

#### roomCreated

房間建立成功（給主持人）。

```json
{
  "type": "roomCreated",
  "roomId": 123456,
  "quizMaster": "主持人名稱",
  "playerId": "quiz_master_xxx",
  "playerName": "主持人名稱",
  "isQuizMaster": true
}
```

#### joinedRoom

加入房間成功。

```json
{
  "type": "joinedRoom",
  "roomId": 123456,
  "playerId": "player_xxx",
  "playerName": "小明",
  "isQuizMaster": false,
  "x": 50,
  "y": 50
}
```

#### newPlayer

新玩家加入通知（廣播給其他人）。

```json
{
  "type": "newPlayer",
  "id": "小明",
  "playerId": "player_xxx",
  "name": "小明",
  "x": 50,
  "y": 50,
  "isQuizMaster": false,
  "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"
}
```

#### positionUpdate

玩家位置更新。

```json
{
  "type": "positionUpdate",
  "id": "小明",
  "playerId": "player_xxx",
  "x": 30,
  "y": 80
}
```

#### scoreUpdate

分數更新通知。

```json
{
  "type": "scoreUpdate",
  "id": "小明",
  "playerId": "player_xxx",
  "score": 100,
  "totalScore": 350
}
```

#### leaderboardUpdate

排行榜更新（廣播）。

```json
{
  "type": "leaderboardUpdate",
  "leaderboard": [
    {
      "playerId": "player_123",
      "name": "小明",
      "score": 350,
      "rank": 1,
      "avatar": "https://..."
    }
  ]
}
```

#### leaderboard

排行榜回應（針對 requestLeaderboard 請求）。

```json
{
  "type": "leaderboard",
  "roomId": 123456,
  "leaderboard": [
    {
      "playerId": "player_123",
      "name": "小明",
      "score": 350,
      "rank": 1,
      "avatar": "https://..."
    }
  ]
}
```

#### answer

正確答案廣播。

```json
{
  "type": "answer",
  "correctAnswer": "O",
  "score": 100
}
```

#### question

題目廣播（主持人出題時發送給所有玩家）。包含題目索引和總數，讓客戶端顯示進度。
若房間設定了 `defaultTimer`，題目的 `倒數時間` 會被覆蓋。

```json
{
  "type": "question",
  "question": {
    "type": "ox",
    "題目": "新郎最喜歡吃牛排？",
    "倒數時間": 30,
    "正確答案": "O",
    "分數": 100
  },
  "questionIndex": 0,
  "totalQuestions": 10
}
```

ABCD 格式的 question 額外包含選項欄位：

```json
{
  "type": "question",
  "question": {
    "type": "abcd",
    "題目": "新郎最喜歡的食物是？",
    "選項A": "牛排",
    "選項B": "壽司",
    "選項C": "披薩",
    "選項D": "義大利麵",
    "倒數時間": 30,
    "正確答案": "A",
    "分數": 100
  },
  "questionIndex": 3,
  "totalQuestions": 10
}
```

#### questionsLoaded

題目載入完成通知。

```json
{
  "type": "questionsLoaded",
  "count": 15
}
```

#### gameEnded

遊戲結束通知。

```json
{
  "type": "gameEnded"
}
```

#### gameState

遊戲狀態回應（回應 `requestGameState`）。用於頁面刷新後恢復遊戲狀態。

```json
{
  "type": "gameState",
  "roomId": 123456,
  "phase": "question",
  "currentQuestion": {
    "type": "ox",
    "題目": "新郎最喜歡吃牛排？",
    "倒數時間": 30,
    "正確答案": "O",
    "分數": 100
  },
  "questionIndex": 3,
  "totalQuestions": 10,
  "playerScore": 250,
  "leaderboard": [
    { "playerId": "player_123", "name": "小明", "score": 350, "rank": 1 }
  ],
  "players": [
    { "id": "小華", "playerId": "player_456", "name": "小華", "x": 30, "y": 70, "isQuizMaster": false }
  ],
  "isActive": true
}
```

| 欄位 | 類型 | 說明 |
|------|------|------|
| roomId | number | 房間 ID |
| phase | string | 遊戲階段 (waiting/question/reveal/ended) |
| currentQuestion | Question \| null | 當前題目 |
| questionIndex | number | 當前題目索引 |
| totalQuestions | number | 總題目數 |
| playerScore | number | 請求者的分數 |
| leaderboard | array | 排行榜 |
| players | array | 房間內其他玩家 |
| isActive | boolean | 遊戲是否進行中 |

#### playerLeft

玩家離開通知。

```json
{
  "type": "playerLeft",
  "id": "player_xxx"
}
```

#### roomStats

房間統計資訊。

```json
{
  "type": "roomStats",
  "roomId": 123456,
  "playerCount": 25,
  "players": ["小明", "小華", "小美"]
}
```

#### roomClosed

房間關閉通知（Quiz Master 離開或房間被關閉時）。

```json
{
  "type": "roomClosed",
  "message": "房間已關閉"
}
```

#### error

錯誤訊息。

```json
{
  "type": "error",
  "message": "無效的房間號"
}
```

---

## 訊息類型總覽

### 客戶端 → 伺服器（14 種）

| 類型 | 發送者 | 說明 |
|------|--------|------|
| `createRoom` | 主持人 | 建立房間 |
| `joinRoom` | 任何人 | 加入房間（也用於重連） |
| `move` | 玩家 | 移動位置 |
| `scoreUpdate` | 玩家 | 更新分數 |
| `answer` | 主持人 | 廣播正確答案 |
| `requestExistingPlayers` | 任何人 | 請求玩家列表 |
| `requestLeaderboard` | 任何人 | 請求排行榜 |
| `requestGameState` | 任何人 | 刷新後請求完整遊戲狀態 |
| `loadQuestions` | 主持人 | 載入題目 |
| `startGame` | 主持人 | 開始遊戲 |
| `nextQuestion` | 主持人 | 下一題 |
| `revealAnswer` | 主持人 | 揭曉答案 |
| `showLeaderboard` | 主持人 | 顯示排行榜 |
| `endGame` | 主持人 | 結束遊戲 |

### 伺服器 → 客戶端（16 種）

| 類型 | 接收者 | 說明 |
|------|--------|------|
| `roomCreated` | 主持人 | 房間已建立 |
| `joinedRoom` | 加入的玩家 | 加入成功 |
| `newPlayer` | 廣播 | 新玩家通知 |
| `positionUpdate` | 廣播 | 位置更新 |
| `scoreUpdate` | 廣播 | 分數更新 |
| `leaderboardUpdate` | 廣播 | 排行榜更新 |
| `leaderboard` | 請求者 | 排行榜回應 |
| `answer` | 廣播 | 正確答案 |
| `question` | 廣播 | 題目內容（含 questionIndex、totalQuestions） |
| `questionsLoaded` | 主持人 | 題目載入完成 |
| `gameState` | 請求者 | 完整遊戲狀態（刷新恢復用） |
| `gameEnded` | 廣播 | 遊戲結束 |
| `roomClosed` | 廣播 | 房間關閉（Quiz Master 離開） |
| `playerLeft` | 廣播 | 玩家離開（斷線 10 秒後觸發） |
| `roomStats` | 請求者 | 房間統計 |
| `error` | 當事人 | 錯誤訊息 |

---

## 錯誤處理

### 常見錯誤訊息

| 訊息 | 說明 |
|------|------|
| `無效的Quiz Master名稱` | Quiz Master 名稱格式錯誤 |
| `無效的玩家名稱` | 玩家名稱格式錯誤（1-20 字元） |
| `無效的玩家ID` | 缺少玩家 ID |
| `無效的房間號` | 房間 ID 格式錯誤或不存在 |
| `未授權的移動` | 玩家未加入房間 |
| `玩家不在房間中` | 玩家已離開或被移除 |
| `房間不存在` | 房間已關閉或不存在 |
| `房間已關閉` | 嘗試加入已關閉的房間 |
| `玩家ID已被使用` | 重連時 ID 相同但名稱不同 |
| `玩家名稱已被使用` | 房間內已有相同名稱的玩家 |
| `只有Quiz Master可以廣播答案` | 非主持人嘗試廣播答案 |

---

## 心跳機制

伺服器每 30 秒發送 ping，客戶端需回應 pong。

連線閒置超過 30 秒未回應將被斷開。

---

## 重連機制

### WebSocket 自動重連

客戶端（`wsStore`）實作自動重連：

| 參數 | 值 | 說明 |
|------|------|------|
| `MAX_RECONNECT_ATTEMPTS` | 5 | 最大重連次數 |
| `RECONNECT_INTERVAL` | 3000ms | 重連間隔 |

重連流程：
1. WebSocket `onclose` 觸發
2. 檢查重連次數 < 5
3. 等待 3 秒後呼叫 `connect()`
4. 重連成功後重置計數器
5. 觸發 `onReconnect` 回調
6. 玩家端/主持人端自動重新發送 `joinRoom`（使用原有 playerId）+ `requestGameState`

玩家 `joinRoom` 時，若 `playerId` 已存在且名稱相同，伺服器會視為重連（更新 WebSocket 連線，保留分數和位置）。

### 伺服器斷線寬限期

伺服器在 WebSocket 關閉時不會立即移除玩家，而是啟動 **10 秒寬限期**。在此期間玩家重連（如頁面刷新）可保留原有狀態。

```
玩家 ws 關閉 → player.ws = null → 啟動 10 秒計時器
                                         │
                          ┌───────────────┼────────────────┐
                          │               │                │
                    10 秒內重連       10 秒到期           房間關閉
                    清除計時器       移除玩家            不處理
                    恢復連線        廣播 playerLeft
```

### 頁面刷新恢復（Session Recovery）

使用 `useSessionRecovery` hook 實現頁面刷新後自動恢復：

1. Zustand stores 從 `sessionStorage` hydrate（roomId, playerId, phase 等）
2. 等待 WebSocket 連線成功
3. 發送 `joinRoom`（帶持久化的 playerId）→ 伺服器識別為重連
4. 發送 `requestGameState` → 伺服器回傳完整遊戲狀態
5. 恢復所有 store 狀態 → 遊戲繼續
6. 若房間已關閉或超時（5 秒）→ 清除 sessionStorage → 導回首頁

```
刷新 → hydrate from sessionStorage → ws connect → joinRoom → requestGameState
                                                                    │
                                                              ┌─────┴─────┐
                                                         gameState      error
                                                         恢復狀態     清除 session
```

---

## 使用範例

### React Hook（推薦）

```tsx
import { useWs } from '../hooks/useWs';

function PlayerGame() {
  const { send, isConnected } = useWs({
    onMessage: (message) => {
      switch (message.type) {
        case 'joinedRoom':
          console.log('加入房間', message.roomId);
          break;
        case 'answer':
          console.log('正確答案', message.correctAnswer);
          break;
        case 'leaderboardUpdate':
          console.log('排行榜更新', message.leaderboard);
          break;
        case 'roomClosed':
          console.log('房間已關閉');
          // 清理狀態，導回首頁
          break;
      }
    },
    onReconnect: () => {
      // 重連後自動重新加入房間
      send({ type: 'joinRoom', roomId, playerName, playerId });
    },
  });

  // 加入房間
  send({
    type: 'joinRoom',
    roomId: 123456,
    playerName: '小明',
    playerId: 'player_' + Date.now(),
  });

  // 移動
  send({ type: 'move', x: 25, y: 75 });
}
```

### 原生 JavaScript

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'joinRoom',
    roomId: 123456,
    playerName: '小明',
    playerId: 'player_' + Date.now()
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'joinedRoom':
      console.log('成功加入房間', data.roomId);
      break;
    case 'newPlayer':
      console.log('新玩家加入', data.name);
      break;
    case 'positionUpdate':
      console.log('玩家移動', data.id, data.x, data.y);
      break;
    case 'answer':
      console.log('正確答案', data.correctAnswer);
      break;
    case 'error':
      console.error('錯誤', data.message);
      break;
  }
};
```

# REST API 文件

## 基本資訊

- **Base URL**: `http://localhost:3002`
- **Content-Type**: `application/json`

## 端點列表

### 題目相關

#### GET /questions

取得所有題目列表。

**回應範例（O/X 題目）：**

```json
{
  "success": true,
  "data": [
    {
      "type": "ox",
      "題目": "新郎最喜歡吃牛排？",
      "倒數時間": 30,
      "正確答案": "O",
      "分數": 100
    }
  ],
  "cached": false,
  "timestamp": 1708300000000
}
```

**回應範例（A/B/C/D 題目）：**

```json
{
  "success": true,
  "data": [
    {
      "type": "abcd",
      "題目": "新郎最喜歡的食物是？",
      "選項A": "牛排",
      "選項B": "壽司",
      "選項C": "披薩",
      "選項D": "義大利麵",
      "倒數時間": 30,
      "正確答案": "A",
      "分數": 100
    }
  ],
  "cached": false,
  "timestamp": 1708300000000
}
```

**回應欄位：**

| 欄位 | 類型 | 說明 |
|------|------|------|
| success | boolean | 是否成功 |
| data | array | 題目列表 |
| data[].type | string | 題目類型：`"ox"` 或 `"abcd"` |
| cached | boolean | 是否從快取取得 |
| timestamp | number | 時間戳記 |

---

### 房間管理

#### POST /api/rooms

建立新遊戲房間。

**請求內容：**

```json
{
  "quizMaster": "主持人名稱"
}
```

**回應範例：**

```json
{
  "success": true,
  "room": {
    "id": 123456,
    "quizMaster": "主持人名稱",
    "quizMasterPlayerId": "quiz_master_1708300000_abc123",
    "createdAt": "2024-02-18T12:00:00.000Z"
  }
}
```

#### GET /api/rooms

取得所有房間列表。

**回應範例：**

```json
{
  "success": true,
  "rooms": [
    {
      "id": 123456,
      "quizMaster": "主持人名稱",
      "playerCount": 25,
      "createdAt": "2024-02-18T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### GET /api/rooms/:roomId

取得指定房間資訊。

**回應範例：**

```json
{
  "success": true,
  "room": {
    "id": 123456,
    "quizMaster": "主持人名稱",
    "playerCount": 25,
    "createdAt": "2024-02-18T12:00:00.000Z",
    "lastActive": "2024-02-18T12:30:00.000Z"
  }
}
```

#### DELETE /api/rooms/:roomId

關閉指定房間。

**請求內容：**

```json
{
  "quizMaster": "主持人名稱"
}
```

**回應範例：**

```json
{
  "success": true,
  "message": "Room 123456 closed successfully"
}
```

---

### 排行榜

#### GET /api/rooms/:roomId/leaderboard

取得房間排行榜。

**回應範例：**

```json
{
  "success": true,
  "roomId": 123456,
  "leaderboard": [
    {
      "playerId": "player_123",
      "name": "小明",
      "score": 350,
      "rank": 1
    },
    {
      "playerId": "player_456",
      "name": "小華",
      "score": 280,
      "rank": 2
    }
  ]
}
```

---

### 資料管理

#### GET /api/storage/stats

取得存儲統計資訊。

**回應範例：**

```json
{
  "success": true,
  "stats": {
    "roomCount": 5,
    "playerCount": 150,
    "scoreRecords": 1200
  }
}
```

#### GET /api/storage/export

導出所有資料（備份）。

**回應範例：**

```json
{
  "success": true,
  "data": {
    "rooms": [...],
    "players": [...],
    "scores": [...]
  }
}
```

#### POST /api/storage/import

導入資料（還原）。

**請求內容：**

```json
{
  "data": {
    "rooms": [...],
    "players": [...],
    "scores": [...]
  }
}
```

#### DELETE /api/storage/cleanup

清理過期資料。

**請求內容：**

```json
{
  "maxAge": 86400000
}
```

**回應範例：**

```json
{
  "success": true,
  "message": "Cleaned up 15 old records",
  "cleanedCount": 15
}
```

---

### 系統

#### GET /health

健康檢查端點。

**回應範例：**

```json
{
  "status": "healthy",
  "timestamp": "2024-02-18T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 30000000,
    "heapUsed": 20000000
  },
  "questionsLoaded": 20
}
```

#### GET /api/info

取得 API 資訊。

**回應範例：**

```json
{
  "name": "Wedding Jump API",
  "version": "2.0.0",
  "endpoints": {
    "/questions": "GET - Retrieve quiz questions",
    "/health": "GET - Health check",
    ...
  }
}
```

---

## 錯誤回應

所有錯誤回應格式：

```json
{
  "success": false,
  "error": "錯誤類型",
  "message": "詳細錯誤訊息"
}
```

### HTTP 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 400 | 請求錯誤（參數無效） |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 500 | 伺服器內部錯誤 |

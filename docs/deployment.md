# 部署指南

## 部署方式

| 方式 | 適用場景 |
|------|---------|
| Docker | 推薦，最簡單的部署方式 |
| 手動部署 | 需要更多控制或無 Docker 環境 |
| PM2 | 生產環境程序管理 |

---

## Docker 部署（推薦）

### 前置需求

- Docker 20.10+
- Docker Compose 2.0+

### 快速開始

```bash
# 進入 docker 目錄
cd docker

# 重建並啟動（推薦）
bash docker-compose-rebuild.sh

# 或手動啟動
docker-compose up -d

# 查看日誌
docker-compose logs -f
```

### 訪問應用

| 服務 | 網址 |
|------|------|
| 前端 | http://localhost:8000 |
| WebSocket | ws://localhost:8001 |
| API | http://localhost:8002 |

### Docker 指令

```bash
# 啟動
docker-compose up -d

# 停止
docker-compose down

# 重新建構
docker-compose up -d --build

# 查看日誌
docker-compose logs -f

# 進入容器
docker-compose exec server sh
```

### 環境變數

編輯 `docker/.env` 或使用 `-e` 參數：

```bash
docker-compose up -d \
  -e WS_PORT=3001 \
  -e API_PORT=3002 \
  -e NODE_ENV=production
```

---

## 手動部署

### 前置需求

- Node.js 18+
- npm 9+

### 步驟

```bash
# 1. 安裝依賴（npm workspaces 會自動安裝 client + server）
npm install

# 2. 建構前端
npm run build

# 3. 啟動後端
npm start
```

### 前端靜態檔案

建構後的前端位於 `client/dist/`，可使用 Nginx 或其他 Web 伺服器提供服務。

---

## PM2 部署

### 安裝 PM2

```bash
npm install -g pm2
```

### 配置檔案

建立 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'wedding-jump-api',
      script: 'server/src/api.js',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3002
      }
    },
    {
      name: 'wedding-jump-ws',
      script: 'server/src/ws-server.js',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001
      }
    }
  ]
};
```

### PM2 指令

```bash
# 啟動
pm2 start ecosystem.config.js

# 停止
pm2 stop all

# 重啟
pm2 restart all

# 查看狀態
pm2 status

# 查看日誌
pm2 logs

# 開機自動啟動
pm2 startup
pm2 save
```

---

## Nginx 配置

### 反向代理

```nginx
upstream frontend {
    server 127.0.0.1:5173;
}

upstream api {
    server 127.0.0.1:3002;
}

upstream websocket {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /questions {
        proxy_pass http://api;
    }

    location /health {
        proxy_pass http://api;
    }

    # WebSocket
    location /ws {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### SSL 配置

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... 其他配置同上
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 環境變數

### 完整列表

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `NODE_ENV` | 環境模式 | `development` |
| `WS_PORT` | WebSocket 端口 | `3001` |
| `API_PORT` | API 端口 | `3002` |
| `VITE_WS_URL` | 前端 WS 連線 URL | `ws://localhost:3001` |
| `VITE_API_URL` | 前端 API URL | `http://localhost:3002` |

### .env 範例

```env
NODE_ENV=production
WS_PORT=3001
API_PORT=3002
VITE_WS_URL=wss://your-domain.com/ws
VITE_API_URL=https://your-domain.com
```

---

## 故障排除

### 常見問題

#### 埠號衝突

```bash
# 檢查端口使用
lsof -i :3001
lsof -i :3002

# 修改 .env 中的端口
```

#### WebSocket 連線失敗

1. 檢查防火牆是否開放端口
2. 確認 Nginx WebSocket 配置正確
3. 檢查 SSL 憑證是否有效

#### 前端無法連線後端

1. 確認 `VITE_API_URL` 和 `VITE_WS_URL` 正確
2. 檢查 CORS 設定
3. 確認後端服務正在運行

### 健康檢查

```bash
# 檢查 API
curl http://localhost:3002/health

# 檢查 WebSocket
wscat -c ws://localhost:3001
```

---

## 備份與還原

### 備份資料

```bash
# 導出所有資料
curl http://localhost:3002/api/storage/export > backup.json
```

### 還原資料

```bash
# 導入資料
curl -X POST http://localhost:3002/api/storage/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

### 清理過期資料

```bash
# 清理 24 小時前的資料
curl -X DELETE http://localhost:3002/api/storage/cleanup \
  -H "Content-Type: application/json" \
  -d '{"maxAge": 86400000}'
```

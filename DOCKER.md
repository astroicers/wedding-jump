# Wedding Jump - Docker 部署指南

## 🚀 快速開始

### 前置需求
- Docker (版本 20.10 或更高)
- Docker Compose (版本 2.0 或更高)

### 🎯 一鍵啟動 (推薦)
```bash
# 自動檢測可用埠號並啟動
./scripts/docker-run.sh
```

### 簡單啟動
```bash
# 使用便利腳本啟動
./scripts/docker-start.sh

# 或者直接使用 Docker Compose
docker-compose up -d
```

### 訪問應用
- 🌐 前端應用: http://localhost:3000
- 🔌 API 服務: http://localhost:3002
- 📡 WebSocket: ws://localhost:3001

## 📋 詳細指令

### 啟動服務

```bash
# 基本啟動 (後台運行)
./scripts/docker-start.sh

# 前台運行 (查看即時日誌)
./scripts/docker-start.sh --foreground

# 強制重新建構映像
./scripts/docker-start.sh --build

# 包含 Nginx 反向代理
./scripts/docker-start.sh --with-nginx

# 包含 Redis 快取服務
./scripts/docker-start.sh --with-redis
```

### 查看日誌

```bash
# 查看所有服務日誌
./scripts/docker-logs.sh

# 即時跟蹤日誌
./scripts/docker-logs.sh -f

# 查看特定服務日誌
./scripts/docker-logs.sh --service wedding-jump -f

# 查看最後 50 行日誌
./scripts/docker-logs.sh --tail 50
```

### 停止服務

```bash
# 基本停止
./scripts/docker-stop.sh

# 停止並移除卷宗
./scripts/docker-stop.sh --remove-volumes

# 停止並移除映像
./scripts/docker-stop.sh --remove-images
```

### 開發模式

```bash
# 使用開發配置啟動 (支援熱重載)
docker-compose -f docker-compose.dev.yml up -d

# 進入容器進行除錯
docker-compose exec wedding-jump sh
```

## ⚙️ 環境配置

### 環境變數
複製 `.env.example` 到 `.env` 並根據需要修改:

```bash
cp .env.example .env
```

主要配置項目:
```env
# 服務埠號
NUXT_PORT=3000
WS_PORT=3001
API_PORT=3002

# 應用設定
NODE_ENV=production
NUXT_HOST=0.0.0.0

# 服務連接
NUXT_PUBLIC_WS_URL=ws://localhost:3001
NUXT_PUBLIC_API_URL=http://localhost:3002
```

### 產品環境配置

#### 使用 Nginx
```bash
# 啟動包含 Nginx 的完整部署
./scripts/docker-start.sh --with-nginx

# 訪問:
# http://localhost - 應用主頁
# http://localhost/api - API 端點
```

#### SSL/HTTPS 支援
1. 將 SSL 憑證放在 `ssl/` 目錄:
   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```

2. 取消註解 `nginx.conf` 中的 HTTPS 配置

3. 啟動服務:
   ```bash
   ./scripts/docker-start.sh --with-nginx
   ```

## 🔧 故障排除

### 常見問題

#### 1. 埠號衝突
```bash
# 檢查埠號使用情況
netstat -tulpn | grep :3000

# 修改 .env 檔案中的埠號
echo "NUXT_PORT=3001" >> .env
```

#### 2. 權限問題
```bash
# 確保腳本有執行權限
chmod +x scripts/*.sh

# 檢查 Docker 權限
sudo usermod -aG docker $USER
# 重新登入或執行: newgrp docker
```

#### 3. 容器無法啟動
```bash
# 查看詳細錯誤日誌
docker-compose logs wedding-jump

# 檢查容器狀態
docker-compose ps

# 重新建構映像
docker-compose build --no-cache
```

#### 4. WebSocket 連接失敗
```bash
# 檢查 WebSocket 服務狀態
curl -f http://localhost:3002/health

# 檢查網路連接
docker network ls
docker network inspect wedding-jump_wedding-jump-network
```

### 除錯指令

```bash
# 進入運行中的容器
docker-compose exec wedding-jump sh

# 查看容器資源使用
docker stats

# 檢查容器健康狀態
docker-compose ps

# 清理未使用的資源
docker system prune -f
```

## 📁 檔案結構

```
wedding-jump/
├── Dockerfile              # 主要容器映像定義
├── docker-compose.yml      # 產品環境服務配置
├── docker-compose.dev.yml  # 開發環境服務配置
├── .dockerignore           # Docker 建構忽略檔案
├── nginx.conf              # Nginx 反向代理配置
├── .env.example            # 環境變數範例
├── .env                    # 實際環境變數 (需自行建立)
└── scripts/
    ├── docker-start.sh     # 啟動腳本
    ├── docker-stop.sh      # 停止腳本
    └── docker-logs.sh      # 日誌查看腳本
```

## 🎯 效能優化

### 建構優化
- 使用多階段建構減少映像大小
- 優化 Docker 快取層級
- 排除不必要檔案 (`.dockerignore`)

### 運行優化
- 使用 PM2 進行程序管理
- 健康檢查確保服務可用性
- 適當的資源限制

### 監控建議
```bash
# 監控容器資源使用
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 查看應用日誌
./scripts/docker-logs.sh -f

# 檢查服務健康狀態
curl http://localhost:3002/health
```

## 🚀 部署至雲端

### 基本部署步驟
1. 複製專案到伺服器
2. 設定環境變數
3. 設定防火牆規則
4. 啟動服務

```bash
# 設定防火牆 (Ubuntu/Debian)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000

# 啟動應用
./scripts/docker-start.sh --with-nginx
```

### Docker Swarm 部署
```bash
# 初始化 Swarm
docker swarm init

# 部署服務堆疊
docker stack deploy -c docker-compose.yml wedding-jump
```

### Kubernetes 部署
請參考 Kubernetes 部署指南 (如果需要的話)。

## 📞 支援

如果遇到問題:
1. 檢查日誌: `./scripts/docker-logs.sh -f`
2. 查看容器狀態: `docker-compose ps`
3. 重新啟動服務: `./scripts/docker-stop.sh && ./scripts/docker-start.sh`

---

祝您使用愉快！🎮
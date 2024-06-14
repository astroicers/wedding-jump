# 使用官方 Node.js 圖像作為基礎圖像
FROM node:20-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製應用代碼到容器
COPY . .

# 編譯應用
RUN npm run build

# 暴露應用運行端口
EXPOSE 3000

# 設置啟動命令
CMD ["npm", "start"]

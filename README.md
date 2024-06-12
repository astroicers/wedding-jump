# Wedding Jump

`Wedding Jump` 是一個基於 Vue.js 和 WebSocket 的多人互動遊戲專案。玩家可以加入遊戲、回答問題並在排行榜上競爭。

## 安裝

1. 克隆這個倉庫到本地：

    ```bash
    git clone https://github.com/your-username/wedding-jump.git
    cd wedding-jump
    ```

2. 安裝所需的依賴：

    ```bash
    npm install
    ```

## 題目

`questions.csv` 文件用於存儲問答遊戲中的題目，每一行代表一個問題，格式如下：

```
題目,倒數時間,正確答案,分數
"1+1=2?",5,O,10
"地球是平的嗎?",5,X,15
"5乘以6等於30嗎?",5,O,30
```

- **題目**：問題文本
- **倒數時間**：回答問題的時間（秒）
- **正確答案**：問題的正確答案（O 表示是，X 表示否）
- **分數**：回答正確後獲得的分數

## 運行

1. 啟動 WebSocket 伺服器：

    ```bash
    node server/ws-server.js
    ```

2. 啟動 API 伺服器：

    ```bash
    node server/api.js
    ```

3. 啟動前端開發伺服器：

    ```bash
    npm run dev
    ```

    前端開發伺服器啟動後，可以在瀏覽器中訪問 `http://localhost:3000` 查看遊戲。

## 功能

- **加入遊戲**：玩家可以通過輸入名字加入遊戲。
- **回答問題**：玩家可以參加問答遊戲，並在排行榜上競爭。
- **實時更新**：使用 WebSocket 技術實現實時數據更新。

## 授權

此專案採用 MIT 許可證。詳情請參閱 [LICENSE](LICENSE) 文件。

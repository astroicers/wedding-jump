import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
let players = [];

function broadcast(data) {
  players.forEach(ws => ws.send(JSON.stringify(data)));
}

wss.on('connection', ws => {
  console.log('Client connected');
  
  ws.on('message', message => {
    const data = JSON.parse(message);
    if (data.type === 'join') {
      ws.id = data.name;
      ws.x = 50;  // 初始 X 位置
      ws.y = 50;  // 初始 Y 位置
      players.push(ws);
      // 廣播新玩家加入信息
      broadcast({ type: 'newPlayer', id: ws.id, name: ws.id, x: ws.x, y: ws.y });
      // 將當前所有玩家的信息發送給新玩家
      players.forEach(player => {
        if (player !== ws) {
          ws.send(JSON.stringify({ type: 'newPlayer', id: player.id, name: player.id, x: player.x, y: player.y }));
        }
      });
    } else if (data.type === 'move') {
      ws.x = data.x;
      ws.y = data.y;
      broadcast({ type: 'positionUpdate', id: ws.id, x: ws.x, y: ws.y });
    }
  });

  ws.on('close', () => {
    players = players.filter(player => player !== ws);
    broadcast({ type: 'playerLeft', id: ws.id });
  });
});

console.log('WebSocket server running on ws://localhost:3001');

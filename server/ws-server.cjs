import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });
let players = [];

function broadcast(data) {
  players.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    const data = JSON.parse(message);

    if (data.type === 'join') {
      ws.id = data.name;
      const player = { id: ws.id, x: 50, y: 50, ws };
      players.push(player);

      // 廣播給所有客戶端新玩家加入
      broadcast({ type: 'newPlayer', id: ws.id, name: ws.id, x: 50, y: 50 });

      // 向新玩家發送當前所有玩家的信息
      players.forEach(p => {
        if (p.id !== ws.id) {
          ws.send(JSON.stringify({ type: 'newPlayer', id: p.id, name: p.id, x: p.x, y: p.y }));
        }
      });
    } else if (data.type === 'move') {
      const player = players.find(p => p.id === ws.id);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        broadcast({ type: 'positionUpdate', id: player.id, x: player.x, y: player.y });
      }
    }
  });

  ws.on('close', () => {
    players = players.filter(player => player.ws !== ws);
    broadcast({ type: 'playerLeft', id: ws.id });
  });
});

console.log('WebSocket server running on ws://localhost:3001');

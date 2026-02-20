// 環境變數
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// 遊戲常數
export const MAX_PLAYERS = 200;
export const DEFAULT_COUNTDOWN = 30;
export const MIN_PLAYER_NAME_LENGTH = 1;
export const MAX_PLAYER_NAME_LENGTH = 20;

// Zone 配置
export const ZONE_CONFIG = {
  // O/X 模式 - 上下分區
  ox: {
    O: { label: 'O', position: 'top', color: '#2ecc71' },
    X: { label: 'X', position: 'bottom', color: '#ff4d4d' },
  },
  // A/B/C/D 模式 - 四象限
  abcd: {
    A: { label: 'A', position: 'top-left', color: '#ff4d4d' },
    B: { label: 'B', position: 'top-right', color: '#4d79ff' },
    C: { label: 'C', position: 'bottom-left', color: '#ffcc00' },
    D: { label: 'D', position: 'bottom-right', color: '#2ecc71' },
  },
};

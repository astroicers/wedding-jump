// 玩家類型定義
export interface Player {
  id: string;
  playerId: string;
  name: string;
  avatar?: string;
  x: number;
  y: number;
  score: number;
  isQuizMaster: boolean;
  lastActive?: number;
}

// 排行榜項目
export interface LeaderboardEntry {
  playerId: string;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
}

// 玩家加入資訊
export interface JoinInfo {
  playerName: string;
  playerId: string;
  roomId: number;
  avatar?: string;
}

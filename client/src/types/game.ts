// 遊戲狀態類型
export type GamePhase = 'waiting' | 'question' | 'answering' | 'reveal' | 'leaderboard' | 'finished' | 'ended';

export interface GameState {
  phase: GamePhase;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  correctAnswer: string | null;
}

// 答案區域類型
export type AnswerZone = 'O' | 'X' | 'A' | 'B' | 'C' | 'D';

export interface ZonePosition {
  zone: AnswerZone;
  x: number;
  y: number;
}

// 遊戲配色
export const ZONE_COLORS: Record<AnswerZone, { bg: string; border: string; text: string }> = {
  O: { bg: 'bg-game-green/20', border: 'border-game-green', text: 'text-game-green' },
  X: { bg: 'bg-game-red/20', border: 'border-game-red', text: 'text-game-red' },
  A: { bg: 'bg-game-red/20', border: 'border-game-red', text: 'text-game-red' },
  B: { bg: 'bg-game-blue/20', border: 'border-game-blue', text: 'text-game-blue' },
  C: { bg: 'bg-game-yellow/20', border: 'border-game-yellow', text: 'text-game-yellow' },
  D: { bg: 'bg-game-green/20', border: 'border-game-green', text: 'text-game-green' },
};

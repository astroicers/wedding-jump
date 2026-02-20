// WebSocket 訊息類型定義
import type { Question } from './question';

// === 客戶端發送的訊息 ===

export interface CreateRoomMessage {
  type: 'createRoom';
  quizMaster?: string;
  defaultTimer?: number;
}

export interface JoinRoomMessage {
  type: 'joinRoom';
  roomId: number;
  playerName: string;
  playerId: string;
  avatar?: string;
}

export interface MoveMessage {
  type: 'move';
  x: number;
  y: number;
}

export interface ScoreUpdateMessage {
  type: 'scoreUpdate';
  id: string;
  playerId: string;
  score: number;
}

export interface AnswerBroadcastMessage {
  type: 'answer';
  correctAnswer: string;
  score: number;
}

export interface RequestExistingPlayersMessage {
  type: 'requestExistingPlayers';
}

export interface RequestLeaderboardMessage {
  type: 'requestLeaderboard';
}

// 主持人端訊息
export interface StartGameMessage {
  type: 'startGame';
  roomId: number;
}

export interface NextQuestionMessage {
  type: 'nextQuestion';
}

export interface RevealAnswerMessage {
  type: 'revealAnswer';
}

export interface ShowLeaderboardMessage {
  type: 'showLeaderboard';
}

export interface EndGameMessage {
  type: 'endGame';
}

export interface LoadQuestionsMessage {
  type: 'loadQuestions';
}

export interface RequestGameStateMessage {
  type: 'requestGameState';
}

export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | MoveMessage
  | ScoreUpdateMessage
  | AnswerBroadcastMessage
  | RequestExistingPlayersMessage
  | RequestLeaderboardMessage
  | StartGameMessage
  | NextQuestionMessage
  | RevealAnswerMessage
  | ShowLeaderboardMessage
  | EndGameMessage
  | LoadQuestionsMessage
  | RequestGameStateMessage;

// === 伺服器發送的訊息 ===

export interface RoomCreatedMessage {
  type: 'roomCreated';
  roomId: number;
  quizMaster: string;
  playerId: string;
  playerName: string;
  isQuizMaster: true;
}

export interface JoinedRoomMessage {
  type: 'joinedRoom';
  roomId: number;
  playerId: string;
  playerName: string;
  isQuizMaster: boolean;
  x: number;
  y: number;
}

export interface NewPlayerMessage {
  type: 'newPlayer';
  id: string;
  playerId: string;
  name: string;
  x: number;
  y: number;
  isQuizMaster: boolean;
  avatar?: string;
}

export interface PositionUpdateMessage {
  type: 'positionUpdate';
  id: string;
  playerId: string;
  x: number;
  y: number;
}

export interface ScoreUpdatedMessage {
  type: 'scoreUpdate';
  id: string;
  playerId: string;
  score: number;
  totalScore: number;
}

export interface LeaderboardUpdateMessage {
  type: 'leaderboardUpdate';
  leaderboard: Array<{
    playerId: string;
    name: string;
    score: number;
    rank: number;
    avatar?: string;
  }>;
}

export interface LeaderboardMessage {
  type: 'leaderboard';
  roomId: number;
  leaderboard: Array<{
    playerId: string;
    name: string;
    score: number;
    rank: number;
    avatar?: string;
  }>;
}

export interface AnswerRevealMessage {
  type: 'answer';
  correctAnswer: string;
  score: number;
}

export interface PlayerLeftMessage {
  type: 'playerLeft';
  id: string;
}

export interface RoomStatsMessage {
  type: 'roomStats';
  roomId: number;
  playerCount: number;
  players: string[];
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

// 主持人端收到的訊息
export interface QuestionMessage {
  type: 'question';
  question: Question;
  questionIndex: number;
  totalQuestions: number;
}

export interface QuestionsLoadedMessage {
  type: 'questionsLoaded';
  count: number;
}

export interface GameEndedMessage {
  type: 'gameEnded';
}

export interface RoomClosedMessage {
  type: 'roomClosed';
  message: string;
}

export interface GameStateMessage {
  type: 'gameState';
  roomId: number;
  phase: string;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  playerScore: number;
  leaderboard: Array<{
    playerId: string;
    name: string;
    score: number;
    rank: number;
    avatar?: string;
  }>;
  players: Array<{
    id: string;
    playerId: string;
    name: string;
    x: number;
    y: number;
    isQuizMaster: boolean;
    avatar?: string;
  }>;
  isActive: boolean;
}

export type ServerMessage =
  | RoomCreatedMessage
  | JoinedRoomMessage
  | NewPlayerMessage
  | PositionUpdateMessage
  | ScoreUpdatedMessage
  | LeaderboardUpdateMessage
  | LeaderboardMessage
  | AnswerRevealMessage
  | PlayerLeftMessage
  | RoomStatsMessage
  | ErrorMessage
  | QuestionMessage
  | QuestionsLoadedMessage
  | GameEndedMessage
  | RoomClosedMessage
  | GameStateMessage;

import { API_URL } from './constants';
import type { QuestionsResponse } from '../types';

// 通用請求函數
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API 函數

// 取得題目列表
export async function getQuestions(): Promise<QuestionsResponse> {
  return request<QuestionsResponse>('/questions');
}

// 建立房間
export async function createRoom(quizMaster: string) {
  return request<{
    success: boolean;
    room: {
      id: number;
      quizMaster: string;
      quizMasterPlayerId: string;
      createdAt: string;
    };
  }>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ quizMaster }),
  });
}

// 取得房間資訊
export async function getRoom(roomId: number) {
  return request<{
    success: boolean;
    room: {
      id: number;
      quizMaster: string;
      playerCount: number;
      createdAt: string;
    };
  }>(`/api/rooms/${roomId}`);
}

// 取得所有房間
export async function getAllRooms() {
  return request<{
    success: boolean;
    rooms: Array<{
      id: number;
      quizMaster: string;
      playerCount: number;
    }>;
    count: number;
  }>('/api/rooms');
}

// 關閉房間
export async function closeRoom(roomId: number, quizMaster: string) {
  return request<{
    success: boolean;
    message: string;
  }>(`/api/rooms/${roomId}`, {
    method: 'DELETE',
    body: JSON.stringify({ quizMaster }),
  });
}

// 取得排行榜
export async function getLeaderboard(roomId: number) {
  return request<{
    success: boolean;
    roomId: number;
    leaderboard: Array<{
      playerId: string;
      name: string;
      score: number;
      rank: number;
    }>;
  }>(`/api/rooms/${roomId}/leaderboard`);
}

// 健康檢查
export async function healthCheck() {
  return request<{
    status: string;
    timestamp: string;
    uptime: number;
    questionsLoaded: number;
  }>('/health');
}

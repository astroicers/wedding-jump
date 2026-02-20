import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Player, LeaderboardEntry } from '../types';

interface PlayerState {
  // 當前玩家
  currentPlayer: Player | null;

  // 房間中的其他玩家
  players: Map<string, Player>;

  // 排行榜
  leaderboard: LeaderboardEntry[];

  // Actions
  setCurrentPlayer: (player: Player | null) => void;
  updateCurrentPlayerPosition: (x: number, y: number) => void;
  updateCurrentPlayerScore: (score: number) => void;

  addPlayer: (player: Player) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  removePlayer: (playerId: string) => void;
  clearPlayers: () => void;

  setLeaderboard: (entries: LeaderboardEntry[]) => void;

  // Getters
  getPlayerCount: () => number;
  getPlayer: (playerId: string) => Player | undefined;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentPlayer: null,
      players: new Map(),
      leaderboard: [],

      setCurrentPlayer: (player) => set({ currentPlayer: player }),

      updateCurrentPlayerPosition: (x, y) =>
        set((state) => ({
          currentPlayer: state.currentPlayer
            ? { ...state.currentPlayer, x, y }
            : null,
        })),

      updateCurrentPlayerScore: (score) =>
        set((state) => ({
          currentPlayer: state.currentPlayer
            ? { ...state.currentPlayer, score }
            : null,
        })),

      addPlayer: (player) =>
        set((state) => {
          const newPlayers = new Map(state.players);
          newPlayers.set(player.playerId, player);
          return { players: newPlayers };
        }),

      updatePlayer: (playerId, updates) =>
        set((state) => {
          const newPlayers = new Map(state.players);
          const existing = newPlayers.get(playerId);
          if (existing) {
            newPlayers.set(playerId, { ...existing, ...updates });
          }
          return { players: newPlayers };
        }),

      removePlayer: (playerId) =>
        set((state) => {
          const newPlayers = new Map(state.players);
          newPlayers.delete(playerId);
          return { players: newPlayers };
        }),

      clearPlayers: () => set({ players: new Map() }),

      setLeaderboard: (entries) => set({ leaderboard: entries }),

      getPlayerCount: () => get().players.size,

      getPlayer: (playerId) => get().players.get(playerId),
    }),
    {
      name: 'wedding-jump-player',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentPlayer: state.currentPlayer,
      }),
    }
  )
);

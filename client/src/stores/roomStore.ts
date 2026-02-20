import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RoomState {
  // 房間資訊
  roomId: number | null;
  roomCode: string | null;
  quizMaster: string | null;
  isQuizMaster: boolean;

  // 連線狀態
  isConnected: boolean;
  isJoined: boolean;

  // Actions
  setRoom: (roomId: number, quizMaster: string, isQuizMaster?: boolean) => void;
  setConnected: (connected: boolean) => void;
  setJoined: (joined: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      roomId: null,
      roomCode: null,
      quizMaster: null,
      isQuizMaster: false,
      isConnected: false,
      isJoined: false,

      setRoom: (roomId, quizMaster, isQuizMaster = false) =>
        set({
          roomId,
          roomCode: String(roomId),
          quizMaster,
          isQuizMaster,
        }),

      setConnected: (connected) => set({ isConnected: connected }),

      setJoined: (joined) => set({ isJoined: joined }),

      clearRoom: () =>
        set({
          roomId: null,
          roomCode: null,
          quizMaster: null,
          isQuizMaster: false,
          isJoined: false,
        }),
    }),
    {
      name: 'wedding-jump-room',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        roomId: state.roomId,
        roomCode: state.roomCode,
        quizMaster: state.quizMaster,
        isQuizMaster: state.isQuizMaster,
        isJoined: state.isJoined,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GamePhase, Question } from '../types';

interface GameState {
  // 遊戲狀態
  phase: GamePhase;

  // 題目相關
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;

  // 答案相關
  correctAnswer: string | null;
  selectedAnswer: string | null;

  // 計時
  timeRemaining: number;
  maxTime: number;

  // 分數
  lastScoreGained: number;

  // 題目總數（從伺服器取得）
  totalQuestions: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setQuestions: (questions: Question[]) => void;
  setTotalQuestions: (total: number) => void;
  nextQuestion: () => void;
  setCurrentQuestion: (question: Question | number, index?: number) => void;

  setCorrectAnswer: (answer: string | null) => void;
  setSelectedAnswer: (answer: string | null) => void;

  setTimeRemaining: (time: number) => void;
  setMaxTime: (time: number) => void;

  setLastScoreGained: (score: number) => void;

  resetGame: () => void;

  // Getters
  hasMoreQuestions: () => boolean;
  getProgress: () => { current: number; total: number };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'waiting',
      questions: [],
      currentQuestionIndex: 0,
      currentQuestion: null,
      correctAnswer: null,
      selectedAnswer: null,
      timeRemaining: 30,
      maxTime: 30,
      lastScoreGained: 0,
      totalQuestions: 0,

      setPhase: (phase) => set({ phase }),

      setQuestions: (questions) =>
        set({
          questions,
          currentQuestionIndex: 0,
          currentQuestion: questions[0] || null,
          totalQuestions: questions.length,
        }),

      setTotalQuestions: (total) => set({ totalQuestions: total }),

      nextQuestion: () =>
        set((state) => {
          const nextIndex = state.currentQuestionIndex + 1;
          if (nextIndex < state.questions.length) {
            return {
              currentQuestionIndex: nextIndex,
              currentQuestion: state.questions[nextIndex],
              correctAnswer: null,
              selectedAnswer: null,
              phase: 'question',
            };
          }
          return { phase: 'finished' };
        }),

      setCurrentQuestion: (questionOrIndex, index?) => {
        if (typeof questionOrIndex === 'number') {
          set((state) => ({
            currentQuestionIndex: questionOrIndex,
            currentQuestion: state.questions[questionOrIndex] || null,
            correctAnswer: null,
            selectedAnswer: null,
          }));
        } else {
          set((state) => ({
            currentQuestionIndex: index ?? state.currentQuestionIndex + 1,
            currentQuestion: questionOrIndex,
            correctAnswer: null,
            selectedAnswer: null,
          }));
        }
      },

      setCorrectAnswer: (answer) => set({ correctAnswer: answer }),
      setSelectedAnswer: (answer) => set({ selectedAnswer: answer }),

      setTimeRemaining: (time) => set({ timeRemaining: time }),
      setMaxTime: (time) => set({ maxTime: time, timeRemaining: time }),

      setLastScoreGained: (score) => set({ lastScoreGained: score }),

      resetGame: () =>
        set({
          phase: 'waiting',
          currentQuestionIndex: 0,
          currentQuestion: null,
          correctAnswer: null,
          selectedAnswer: null,
          timeRemaining: 30,
          maxTime: 30,
          lastScoreGained: 0,
          totalQuestions: 0,
        }),

      hasMoreQuestions: () => {
        const state = get();
        return state.currentQuestionIndex < state.questions.length - 1;
      },

      getProgress: () => {
        const state = get();
        return {
          current: state.currentQuestionIndex + 1,
          total: state.totalQuestions || state.questions.length,
        };
      },
    }),
    {
      name: 'wedding-jump-game',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        phase: state.phase,
        currentQuestionIndex: state.currentQuestionIndex,
        totalQuestions: state.totalQuestions,
      }),
    }
  )
);

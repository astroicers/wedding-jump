import { useGameStore } from './gameStore';
import type { Question, OXQuestion, ABCDQuestion } from '../types';

const mockOXQuestion: OXQuestion = {
  type: 'ox',
  題目: 'Test OX?',
  倒數時間: 10,
  正確答案: 'O',
  分數: 100,
};

const mockABCDQuestion: ABCDQuestion = {
  type: 'abcd',
  題目: 'Pick one?',
  選項A: 'Option A',
  選項B: 'Option B',
  選項C: 'Option C',
  選項D: 'Option D',
  倒數時間: 15,
  正確答案: 'A',
  分數: 200,
};

const mockQuestions: Question[] = [mockOXQuestion, mockABCDQuestion];

function resetStore() {
  useGameStore.setState({
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
  });
}

describe('gameStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useGameStore.getState();
      expect(state.phase).toBe('waiting');
      expect(state.questions).toEqual([]);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.currentQuestion).toBeNull();
      expect(state.correctAnswer).toBeNull();
      expect(state.selectedAnswer).toBeNull();
      expect(state.timeRemaining).toBe(30);
      expect(state.maxTime).toBe(30);
      expect(state.lastScoreGained).toBe(0);
    });
  });

  describe('setPhase', () => {
    it('changes the game phase', () => {
      useGameStore.getState().setPhase('question');
      expect(useGameStore.getState().phase).toBe('question');

      useGameStore.getState().setPhase('answering');
      expect(useGameStore.getState().phase).toBe('answering');

      useGameStore.getState().setPhase('ended');
      expect(useGameStore.getState().phase).toBe('ended');
    });
  });

  describe('setQuestions', () => {
    it('sets the questions array and currentQuestion to the first item, index to 0', () => {
      useGameStore.getState().setQuestions(mockQuestions);

      const state = useGameStore.getState();
      expect(state.questions).toEqual(mockQuestions);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.currentQuestion).toEqual(mockOXQuestion);
    });

    it('sets currentQuestion to null when given an empty array', () => {
      // First set some questions so we can verify the clear
      useGameStore.getState().setQuestions(mockQuestions);
      useGameStore.getState().setQuestions([]);

      const state = useGameStore.getState();
      expect(state.questions).toEqual([]);
      expect(state.currentQuestion).toBeNull();
      expect(state.currentQuestionIndex).toBe(0);
    });
  });

  describe('nextQuestion', () => {
    it('increments index, sets next question, clears answers, sets phase to question', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      useGameStore.getState().setCorrectAnswer('O');
      useGameStore.getState().setSelectedAnswer('X');

      useGameStore.getState().nextQuestion();

      const state = useGameStore.getState();
      expect(state.currentQuestionIndex).toBe(1);
      expect(state.currentQuestion).toEqual(mockABCDQuestion);
      expect(state.correctAnswer).toBeNull();
      expect(state.selectedAnswer).toBeNull();
      expect(state.phase).toBe('question');
    });

    it('sets phase to finished when at the last question', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      // Move to second (last) question
      useGameStore.getState().nextQuestion();
      expect(useGameStore.getState().currentQuestionIndex).toBe(1);

      // Try to go past the last question
      useGameStore.getState().nextQuestion();

      const state = useGameStore.getState();
      expect(state.phase).toBe('finished');
    });
  });

  describe('setCurrentQuestion', () => {
    it('sets question by index (number argument)', () => {
      useGameStore.getState().setQuestions(mockQuestions);

      useGameStore.getState().setCurrentQuestion(1);

      const state = useGameStore.getState();
      expect(state.currentQuestionIndex).toBe(1);
      expect(state.currentQuestion).toEqual(mockABCDQuestion);
      expect(state.correctAnswer).toBeNull();
      expect(state.selectedAnswer).toBeNull();
    });

    it('sets question by Question object (increments index)', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      // currentQuestionIndex starts at 0

      const customQuestion: OXQuestion = {
        type: 'ox',
        題目: 'Custom?',
        倒數時間: 20,
        正確答案: 'X',
        分數: 50,
      };

      useGameStore.getState().setCurrentQuestion(customQuestion);

      const state = useGameStore.getState();
      expect(state.currentQuestionIndex).toBe(1); // incremented from 0
      expect(state.currentQuestion).toEqual(customQuestion);
      expect(state.correctAnswer).toBeNull();
      expect(state.selectedAnswer).toBeNull();
    });

    it('clears correctAnswer and selectedAnswer when called with number', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      useGameStore.getState().setCorrectAnswer('O');
      useGameStore.getState().setSelectedAnswer('X');

      useGameStore.getState().setCurrentQuestion(0);

      expect(useGameStore.getState().correctAnswer).toBeNull();
      expect(useGameStore.getState().selectedAnswer).toBeNull();
    });

    it('accepts explicit index parameter', () => {
      const state = useGameStore.getState();
      state.setCurrentQuestion(mockOXQuestion, 5);
      const updated = useGameStore.getState();
      expect(updated.currentQuestionIndex).toBe(5);
      expect(updated.currentQuestion).toEqual(mockOXQuestion);
      expect(updated.correctAnswer).toBeNull();
      expect(updated.selectedAnswer).toBeNull();
    });

    it('uses explicit index 0 without defaulting to increment', () => {
      useGameStore.setState({ currentQuestionIndex: 3 });
      useGameStore.getState().setCurrentQuestion(mockABCDQuestion, 0);
      expect(useGameStore.getState().currentQuestionIndex).toBe(0);
      expect(useGameStore.getState().currentQuestion).toEqual(mockABCDQuestion);
    });

    it('falls back to incrementing when index is undefined', () => {
      useGameStore.setState({ currentQuestionIndex: 2 });
      useGameStore.getState().setCurrentQuestion(mockOXQuestion);
      expect(useGameStore.getState().currentQuestionIndex).toBe(3);
    });
  });

  describe('setCorrectAnswer', () => {
    it('sets the correct answer', () => {
      useGameStore.getState().setCorrectAnswer('O');
      expect(useGameStore.getState().correctAnswer).toBe('O');
    });

    it('can be set to null', () => {
      useGameStore.getState().setCorrectAnswer('O');
      useGameStore.getState().setCorrectAnswer(null);
      expect(useGameStore.getState().correctAnswer).toBeNull();
    });
  });

  describe('setSelectedAnswer', () => {
    it('sets the selected answer', () => {
      useGameStore.getState().setSelectedAnswer('X');
      expect(useGameStore.getState().selectedAnswer).toBe('X');
    });

    it('can be set to null', () => {
      useGameStore.getState().setSelectedAnswer('A');
      useGameStore.getState().setSelectedAnswer(null);
      expect(useGameStore.getState().selectedAnswer).toBeNull();
    });
  });

  describe('setTimeRemaining', () => {
    it('sets the time remaining', () => {
      useGameStore.getState().setTimeRemaining(15);
      expect(useGameStore.getState().timeRemaining).toBe(15);
    });
  });

  describe('setMaxTime', () => {
    it('sets both maxTime and timeRemaining', () => {
      useGameStore.getState().setMaxTime(60);

      const state = useGameStore.getState();
      expect(state.maxTime).toBe(60);
      expect(state.timeRemaining).toBe(60);
    });
  });

  describe('setLastScoreGained', () => {
    it('sets the last score gained', () => {
      useGameStore.getState().setLastScoreGained(250);
      expect(useGameStore.getState().lastScoreGained).toBe(250);
    });
  });

  describe('resetGame', () => {
    it('resets game state to defaults but preserves the questions array', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      useGameStore.getState().setPhase('answering');
      useGameStore.getState().setCorrectAnswer('O');
      useGameStore.getState().setSelectedAnswer('X');
      useGameStore.getState().setTimeRemaining(5);
      useGameStore.getState().setMaxTime(60);
      useGameStore.getState().setLastScoreGained(100);
      useGameStore.getState().nextQuestion(); // index=1

      useGameStore.getState().resetGame();

      const state = useGameStore.getState();
      expect(state.phase).toBe('waiting');
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.currentQuestion).toBeNull();
      expect(state.correctAnswer).toBeNull();
      expect(state.selectedAnswer).toBeNull();
      expect(state.timeRemaining).toBe(30);
      expect(state.maxTime).toBe(30);
      expect(state.lastScoreGained).toBe(0);
      // questions array is NOT cleared by resetGame
      expect(state.questions).toEqual(mockQuestions);
    });
  });

  describe('hasMoreQuestions', () => {
    it('returns false when there are no questions', () => {
      expect(useGameStore.getState().hasMoreQuestions()).toBe(false);
    });

    it('returns true when more questions exist after current', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      // index=0, length=2 => has more
      expect(useGameStore.getState().hasMoreQuestions()).toBe(true);
    });

    it('returns false when on the last question', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      useGameStore.getState().nextQuestion(); // index=1, length=2
      expect(useGameStore.getState().hasMoreQuestions()).toBe(false);
    });
  });

  describe('getProgress', () => {
    it('returns {current: 1, total: 0} initially', () => {
      const progress = useGameStore.getState().getProgress();
      expect(progress).toEqual({ current: 1, total: 0 });
    });

    it('returns correct values after setQuestions', () => {
      useGameStore.getState().setQuestions(mockQuestions);

      const progress = useGameStore.getState().getProgress();
      expect(progress).toEqual({ current: 1, total: 2 });
    });

    it('updates current after nextQuestion', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      useGameStore.getState().nextQuestion();

      const progress = useGameStore.getState().getProgress();
      expect(progress).toEqual({ current: 2, total: 2 });
    });
  });

  describe('setTotalQuestions', () => {
    it('sets totalQuestions', () => {
      useGameStore.getState().setTotalQuestions(10);
      expect(useGameStore.getState().totalQuestions).toBe(10);
    });

    it('affects getProgress total', () => {
      useGameStore.getState().setTotalQuestions(5);
      const progress = useGameStore.getState().getProgress();
      expect(progress.total).toBe(5);
    });

    it('totalQuestions takes priority over questions.length in getProgress', () => {
      useGameStore.getState().setQuestions(mockQuestions); // length = 2
      useGameStore.getState().setTotalQuestions(10);
      const progress = useGameStore.getState().getProgress();
      expect(progress.total).toBe(10);
    });

    it('falls back to questions.length when totalQuestions is 0', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      useGameStore.getState().setTotalQuestions(0);
      const progress = useGameStore.getState().getProgress();
      expect(progress.total).toBe(2); // falls back to questions.length
    });

    it('is reset by resetGame', () => {
      useGameStore.getState().setTotalQuestions(15);
      useGameStore.getState().resetGame();
      expect(useGameStore.getState().totalQuestions).toBe(0);
    });

    it('is set by setQuestions', () => {
      useGameStore.getState().setQuestions(mockQuestions);
      expect(useGameStore.getState().totalQuestions).toBe(2);
    });
  });
});

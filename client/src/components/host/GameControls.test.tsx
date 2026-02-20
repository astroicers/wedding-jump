import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from './GameControls';
import type { GamePhase } from '../../types';

const defaultProps = {
  phase: 'waiting' as GamePhase,
  onStartQuestion: vi.fn(),
  onRevealAnswer: vi.fn(),
  onShowLeaderboard: vi.fn(),
  onNextQuestion: vi.fn(),
  onEndGame: vi.fn(),
};

function renderControls(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<GameControls {...props} />);
}

describe('GameControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Start Question" button in waiting phase', () => {
    renderControls({ phase: 'waiting' });

    expect(screen.getByText('Start Question')).toBeInTheDocument();
  });

  it('should call onStartQuestion when "Start Question" is clicked', () => {
    const onStartQuestion = vi.fn();
    renderControls({ phase: 'waiting', onStartQuestion });

    fireEvent.click(screen.getByText('Start Question'));

    expect(onStartQuestion).toHaveBeenCalledTimes(1);
  });

  it('should show "Reveal Answer" button in question phase', () => {
    renderControls({ phase: 'question' });

    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
  });

  it('should show "Reveal Answer" button in answering phase', () => {
    renderControls({ phase: 'answering' });

    expect(screen.getByText('Reveal Answer')).toBeInTheDocument();
  });

  it('should show "Next Question" and "Show Leaderboard" in reveal phase with hasNextQuestion', () => {
    renderControls({ phase: 'reveal', hasNextQuestion: true });

    expect(screen.getByText('Next Question')).toBeInTheDocument();
    expect(screen.getByText('Show Leaderboard')).toBeInTheDocument();
  });

  it('should show "End Game" and "Show Leaderboard" in reveal phase without hasNextQuestion', () => {
    renderControls({ phase: 'reveal', hasNextQuestion: false });

    expect(screen.getByText('End Game')).toBeInTheDocument();
    expect(screen.getByText('Show Leaderboard')).toBeInTheDocument();
    expect(screen.queryByText('Next Question')).not.toBeInTheDocument();
  });

  it('should show "Final Rankings" button in ended phase', () => {
    renderControls({ phase: 'ended' });

    expect(screen.getByText('Final Rankings')).toBeInTheDocument();
  });

  it('should call the correct callbacks when buttons are clicked', () => {
    const onRevealAnswer = vi.fn();
    const onShowLeaderboard = vi.fn();
    const onNextQuestion = vi.fn();
    const onEndGame = vi.fn();

    // Test Reveal Answer callback
    const { unmount: unmount1 } = renderControls({ phase: 'question', onRevealAnswer });
    fireEvent.click(screen.getByText('Reveal Answer'));
    expect(onRevealAnswer).toHaveBeenCalledTimes(1);
    unmount1();

    // Test Show Leaderboard and Next Question callbacks
    const { unmount: unmount2 } = renderControls({
      phase: 'reveal',
      hasNextQuestion: true,
      onShowLeaderboard,
      onNextQuestion,
    });
    fireEvent.click(screen.getByText('Show Leaderboard'));
    expect(onShowLeaderboard).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Next Question'));
    expect(onNextQuestion).toHaveBeenCalledTimes(1);
    unmount2();

    // Test End Game callback
    renderControls({
      phase: 'reveal',
      hasNextQuestion: false,
      onEndGame,
    });
    fireEvent.click(screen.getByText('End Game'));
    expect(onEndGame).toHaveBeenCalledTimes(1);
  });
});

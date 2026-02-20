import { FC } from 'react';
import { Button } from '../common';
import type { GamePhase } from '../../types';
import { useTranslation } from '../../i18n';

interface GameControlsProps {
  phase: GamePhase;
  onStartQuestion: () => void;
  onRevealAnswer: () => void;
  onShowLeaderboard: () => void;
  onNextQuestion: () => void;
  onEndGame: () => void;
  onCloseRoom?: () => void;
  hasNextQuestion?: boolean;
  className?: string;
}

export const GameControls: FC<GameControlsProps> = ({
  phase,
  onStartQuestion,
  onRevealAnswer,
  onShowLeaderboard,
  onNextQuestion,
  onEndGame,
  onCloseRoom,
  hasNextQuestion = true,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* 等待開始 */}
      {phase === 'waiting' && (
        <Button
          variant="primary"
          size="lg"
          onClick={onStartQuestion}
          icon={<span className="material-symbols-outlined">play_arrow</span>}
        >
          {t('gameControls.startQuestion')}
        </Button>
      )}

      {/* 題目進行中 */}
      {(phase === 'question' || phase === 'answering') && (
        <Button
          variant="accent"
          size="lg"
          onClick={onRevealAnswer}
          icon={<span className="material-symbols-outlined">visibility</span>}
        >
          {t('gameControls.revealAnswer')}
        </Button>
      )}

      {/* 答案揭曉 */}
      {phase === 'reveal' && (
        <>
          <Button
            variant="secondary"
            size="lg"
            onClick={onShowLeaderboard}
            icon={<span className="material-symbols-outlined">leaderboard</span>}
          >
            {t('gameControls.showLeaderboard')}
          </Button>
          {hasNextQuestion ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onNextQuestion}
              icon={<span className="material-symbols-outlined">skip_next</span>}
            >
              {t('gameControls.nextQuestion')}
            </Button>
          ) : (
            <Button
              variant="accent"
              size="lg"
              onClick={onEndGame}
              icon={<span className="material-symbols-outlined">flag</span>}
            >
              {t('gameControls.endGame')}
            </Button>
          )}
        </>
      )}

      {/* 遊戲結束 */}
      {phase === 'ended' && (
        <>
          <Button
            variant="primary"
            size="lg"
            onClick={onShowLeaderboard}
            icon={<span className="material-symbols-outlined">emoji_events</span>}
          >
            {t('gameControls.finalRankings')}
          </Button>
          {onCloseRoom && (
            <Button
              variant="secondary"
              size="lg"
              onClick={onCloseRoom}
              icon={<span className="material-symbols-outlined">home</span>}
            >
              {t('gameControls.closeRoom')}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

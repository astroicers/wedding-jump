import { FC, useMemo } from 'react';
import { AnswerZone } from './AnswerZone';
import { Avatar } from '../common/Avatar';
import type { Player, Question, AnswerZone as AnswerZoneType } from '../../types';
import { isOXQuestion } from '../../types';
import { useTranslation } from '../../i18n';

interface GameArenaProps {
  question: Question;
  players: Player[];
  currentPlayer: Player | null;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  isRevealed: boolean;
  onSelectAnswer: (answer: AnswerZoneType) => void;
}

export const GameArena: FC<GameArenaProps> = ({
  question,
  players,
  currentPlayer,
  selectedAnswer,
  correctAnswer,
  isRevealed,
  onSelectAnswer,
}) => {
  const { t } = useTranslation();
  const isOX = isOXQuestion(question);

  // 計算玩家在各區域的位置
  const playerPositions = useMemo(() => {
    return players.map((player) => ({
      ...player,
      style: {
        top: `${player.y}%`,
        left: `${player.x}%`,
        transform: 'translate(-50%, -50%)',
      },
    }));
  }, [players]);

  // O/X 模式（上下分區）
  if (isOX) {
    return (
      <div className="relative h-full w-full rounded-xl overflow-hidden border-2 border-primary/5">
        <div className="grid grid-rows-2 h-full gap-2 p-2">
          <AnswerZone
            zone="O"
            label="O"
            isSelected={selectedAnswer === 'O'}
            isCorrect={correctAnswer === 'O'}
            isRevealed={isRevealed}
            onClick={() => !isRevealed && onSelectAnswer('O')}
          />
          <AnswerZone
            zone="X"
            label="X"
            isSelected={selectedAnswer === 'X'}
            isCorrect={correctAnswer === 'X'}
            isRevealed={isRevealed}
            onClick={() => !isRevealed && onSelectAnswer('X')}
          />
        </div>

        {/* 玩家頭像層 */}
        <div className="absolute inset-0 pointer-events-none p-6">
          {playerPositions.map((player) => (
            <div
              key={player.playerId}
              className="absolute transition-all duration-500 ease-out"
              style={player.style}
            >
              <Avatar
                src={player.avatar}
                name={player.name}
                size={player.playerId === currentPlayer?.playerId ? 'md' : 'sm'}
                className={player.playerId === currentPlayer?.playerId ? 'ring-4 ring-primary' : 'opacity-80'}
              />
              {player.playerId === currentPlayer?.playerId && (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t('common.you')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // A/B/C/D 模式（四象限）
  const abcdQuestion = question as { 選項A: string; 選項B: string; 選項C: string; 選項D: string };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border-2 border-primary/5">
      <div className="grid grid-cols-2 grid-rows-2 h-full gap-2 p-2">
        <AnswerZone
          zone="A"
          label={abcdQuestion.選項A}
          isSelected={selectedAnswer === 'A'}
          isCorrect={correctAnswer === 'A'}
          isRevealed={isRevealed}
          onClick={() => !isRevealed && onSelectAnswer('A')}
        />
        <AnswerZone
          zone="B"
          label={abcdQuestion.選項B}
          isSelected={selectedAnswer === 'B'}
          isCorrect={correctAnswer === 'B'}
          isRevealed={isRevealed}
          onClick={() => !isRevealed && onSelectAnswer('B')}
        />
        <AnswerZone
          zone="C"
          label={abcdQuestion.選項C}
          isSelected={selectedAnswer === 'C'}
          isCorrect={correctAnswer === 'C'}
          isRevealed={isRevealed}
          onClick={() => !isRevealed && onSelectAnswer('C')}
        />
        <AnswerZone
          zone="D"
          label={abcdQuestion.選項D}
          isSelected={selectedAnswer === 'D'}
          isCorrect={correctAnswer === 'D'}
          isRevealed={isRevealed}
          onClick={() => !isRevealed && onSelectAnswer('D')}
        />
      </div>

      {/* 玩家頭像層 */}
      <div className="absolute inset-0 pointer-events-none p-6">
        {playerPositions.map((player) => (
          <div
            key={player.playerId}
            className="absolute transition-all duration-500 ease-out"
            style={player.style}
          >
            <Avatar
              src={player.avatar}
              name={player.name}
              size={player.playerId === currentPlayer?.playerId ? 'md' : 'sm'}
              className={player.playerId === currentPlayer?.playerId ? 'ring-4 ring-primary' : 'opacity-80'}
            />
            {player.playerId === currentPlayer?.playerId && (
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {t('common.you')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

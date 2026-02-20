import { FC } from 'react';
import type { AnswerZone as AnswerZoneType } from '../../types';
import { useTranslation } from '../../i18n';

interface AnswerZoneProps {
  zone: AnswerZoneType;
  label: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  isRevealed?: boolean;
  playerCount?: number;
  onClick?: () => void;
}

const ZONE_STYLES: Record<AnswerZoneType, { bg: string; border: string; text: string; solid: string }> = {
  O: { bg: 'bg-game-green/10', border: 'border-game-green/50', text: 'text-game-green', solid: 'bg-game-green' },
  X: { bg: 'bg-game-red/10', border: 'border-game-red/50', text: 'text-game-red', solid: 'bg-game-red' },
  A: { bg: 'bg-game-red/10', border: 'border-game-red/50', text: 'text-game-red', solid: 'bg-game-red' },
  B: { bg: 'bg-game-blue/10', border: 'border-game-blue/50', text: 'text-game-blue', solid: 'bg-game-blue' },
  C: { bg: 'bg-game-yellow/10', border: 'border-game-yellow/50', text: 'text-game-yellow', solid: 'bg-game-yellow' },
  D: { bg: 'bg-game-green/10', border: 'border-game-green/50', text: 'text-game-green', solid: 'bg-game-green' },
};

export const AnswerZone: FC<AnswerZoneProps> = ({
  zone,
  label,
  isSelected = false,
  isCorrect = false,
  isRevealed = false,
  playerCount,
  onClick,
}) => {
  const { t } = useTranslation();
  const style = ZONE_STYLES[zone];

  const getContainerClass = () => {
    if (isRevealed) {
      if (isCorrect) {
        return `${style.bg} border-4 ${style.border} shadow-lg`;
      }
      return 'bg-gray-300/50 border-2 border-gray-400/50 opacity-40 grayscale';
    }
    if (isSelected) {
      return `${style.bg} border-4 ${style.border}`;
    }
    return `${style.bg} border-2 ${style.border}`;
  };

  return (
    <div
      className={`
        relative rounded-lg flex flex-col items-center justify-center overflow-hidden
        cursor-pointer transition-all duration-300
        ${getContainerClass()}
      `}
      onClick={onClick}
    >
      {/* 區域標籤 */}
      <span className={`text-4xl font-black ${style.text}/20 absolute top-2 left-2`}>
        {zone}
      </span>

      {/* 答案文字 */}
      <div className={`
        px-4 py-2 rounded-full shadow-sm z-10
        ${isRevealed && isCorrect
          ? `${style.solid} text-white`
          : 'bg-white/80 backdrop-blur-sm border border-gray-200'}
      `}>
        <p className={`font-bold ${isRevealed && isCorrect ? 'text-white' : style.text}`}>
          {label}
        </p>
      </div>

      {/* 玩家計數（主持人視角） */}
      {playerCount !== undefined && (
        <div className={`
          absolute bottom-2 right-2 flex flex-col items-center justify-center
          px-3 py-2 rounded-xl shadow-xl ${style.solid} text-white
        `}>
          <span className="text-xl font-bold">{playerCount}</span>
          <span className="text-[8px] uppercase font-bold">{t('common.players')}</span>
        </div>
      )}

      {/* 正確答案標記 */}
      {isRevealed && isCorrect && (
        <div className="absolute top-2 right-2">
          <span className="material-symbols-outlined text-white text-2xl filled">
            check_circle
          </span>
        </div>
      )}
    </div>
  );
};

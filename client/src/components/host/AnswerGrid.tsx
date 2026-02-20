import { FC } from 'react';
import { Avatar } from '../common';
import type { Question, Player } from '../../types';
import { useTranslation } from '../../i18n';

interface AnswerGridProps {
  question: Question;
  players: Player[];
  showAnswer?: boolean;
  className?: string;
}

type ZoneKey = 'O' | 'X' | 'A' | 'B' | 'C' | 'D';

interface Zone {
  key: ZoneKey;
  label: string;
  color: string;
  bgColor: string;
  position: { x: [number, number]; y: [number, number] };
}

const OX_ZONES: Zone[] = [
  { key: 'O', label: 'O', color: 'text-game-green', bgColor: 'bg-game-green/20', position: { x: [0, 100], y: [0, 50] } },
  { key: 'X', label: 'X', color: 'text-game-red', bgColor: 'bg-game-red/20', position: { x: [0, 100], y: [50, 100] } },
];

const ABCD_ZONES: Zone[] = [
  { key: 'A', label: 'A', color: 'text-game-red', bgColor: 'bg-game-red/20', position: { x: [0, 50], y: [0, 50] } },
  { key: 'B', label: 'B', color: 'text-game-blue', bgColor: 'bg-game-blue/20', position: { x: [50, 100], y: [0, 50] } },
  { key: 'C', label: 'C', color: 'text-game-yellow', bgColor: 'bg-game-yellow/20', position: { x: [0, 50], y: [50, 100] } },
  { key: 'D', label: 'D', color: 'text-game-green', bgColor: 'bg-game-green/20', position: { x: [50, 100], y: [50, 100] } },
];

export const AnswerGrid: FC<AnswerGridProps> = ({
  question,
  players,
  showAnswer = false,
  className = '',
}) => {
  const isOX = question.type === 'ox';
  const zones = isOX ? OX_ZONES : ABCD_ZONES;
  const { t } = useTranslation();

  // 依據玩家位置分配到各區域
  const getPlayersInZone = (zone: Zone) => {
    return players.filter((player) => {
      const x = player.x ?? 50;
      const y = player.y ?? 50;
      return (
        x >= zone.position.x[0] &&
        x < zone.position.x[1] &&
        y >= zone.position.y[0] &&
        y < zone.position.y[1]
      );
    });
  };

  return (
    <div className={`relative aspect-video bg-bg-dark rounded-2xl overflow-hidden ${className}`}>
      {/* 網格線 */}
      <div className="absolute inset-0 pointer-events-none">
        {isOX ? (
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/20" />
        ) : (
          <>
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20" />
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/20" />
          </>
        )}
      </div>

      {/* 區域 */}
      {zones.map((zone) => {
        const zonePlayers = getPlayersInZone(zone);
        const isCorrect = question.正確答案 === zone.key;
        const zoneStyle = isOX
          ? {
              left: '0%',
              top: zone.key === 'O' ? '0%' : '50%',
              width: '100%',
              height: '50%',
            }
          : {
              left: zone.position.x[0] === 0 ? '0%' : '50%',
              top: zone.position.y[0] === 0 ? '0%' : '50%',
              width: '50%',
              height: '50%',
            };

        return (
          <div
            key={zone.key}
            className={`
              absolute flex flex-col items-center justify-center transition-all duration-500
              ${showAnswer && isCorrect ? zone.bgColor : ''}
              ${showAnswer && !isCorrect ? 'opacity-50' : ''}
            `}
            style={zoneStyle}
          >
            {/* 區域標籤 */}
            <span
              className={`
                text-6xl font-black opacity-20 absolute
                ${zone.color}
              `}
            >
              {zone.label}
            </span>

            {/* 答案正確指示 */}
            {showAnswer && isCorrect && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-game-green text-white px-4 py-2 rounded-full shadow-lg z-20">
                <span className="material-symbols-outlined filled">check_circle</span>
                {t('common.correct')}
              </div>
            )}

            {/* 玩家頭像 */}
            <div className="relative z-10 flex flex-wrap justify-center gap-2 p-4 max-w-full">
              {zonePlayers.slice(0, 20).map((player) => (
                <div
                  key={player.playerId}
                  className={`
                    transition-all duration-300
                    ${showAnswer && isCorrect ? 'scale-110' : ''}
                    ${showAnswer && !isCorrect ? 'grayscale' : ''}
                  `}
                >
                  <Avatar
                    src={player.avatar}
                    name={player.name}
                    size="sm"
                    className="border-2 border-white shadow-md"
                  />
                </div>
              ))}
              {zonePlayers.length > 20 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 text-xs font-bold text-text-primary">
                  +{zonePlayers.length - 20}
                </div>
              )}
            </div>

            {/* 玩家計數 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-bold">
              {t('answerGrid.nPlayers', { n: zonePlayers.length })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

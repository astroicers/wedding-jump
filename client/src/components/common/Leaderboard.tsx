import { FC } from 'react';
import { Avatar } from './Avatar';
import type { LeaderboardEntry } from '../../types';
import { useTranslation } from '../../i18n';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  maxDisplay?: number;
  showRank?: boolean;
  showMedals?: boolean;
  compact?: boolean;
  title?: string;
}

export const Leaderboard: FC<LeaderboardProps> = ({
  entries,
  currentPlayerId,
  maxDisplay = 5,
  showRank = true,
  showMedals = true,
  compact = false,
  title = 'Leaderboard',
}) => {
  const displayEntries = entries.slice(0, maxDisplay);
  const { t } = useTranslation();

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-primary text-white';
      case 2:
        return 'bg-slate-400 text-white';
      case 3:
        return 'bg-orange-600 text-white';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getRowStyle = (rank: number, playerId: string) => {
    const isCurrentPlayer = playerId === currentPlayerId;
    if (isCurrentPlayer) {
      return 'bg-primary/20 border-primary/30';
    }
    if (rank === 1) {
      return 'bg-primary/10 border-primary/20';
    }
    return 'bg-white/5 border-white/10';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {displayEntries.map((entry) => (
          <div
            key={entry.playerId}
            className={`
              flex items-center gap-2 p-2 rounded-lg border
              ${getRowStyle(entry.rank, entry.playerId)}
            `}
          >
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${getRankStyle(entry.rank)}
              `}
            >
              {entry.rank}
            </div>
            <Avatar src={entry.avatar} name={entry.name} size="xs" />
            <span className="flex-1 font-medium truncate text-sm">{entry.name}</span>
            <span className="text-sm font-bold text-primary">{entry.score}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
      {title && (
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-yellow-500 filled">
            trophy
          </span>
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {displayEntries.map((entry) => (
          <div
            key={entry.playerId}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all
              ${getRowStyle(entry.rank, entry.playerId)}
            `}
          >
            {showRank && (
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${getRankStyle(entry.rank)}
                `}
              >
                {entry.rank}
              </div>
            )}
            <Avatar src={entry.avatar} name={entry.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{entry.name}</p>
              <p className="text-xs opacity-70">{t('common.scorePts', { score: entry.score.toLocaleString() })}</p>
            </div>
            {entry.rank === 1 && (
              <span className="material-symbols-outlined text-primary">
                keyboard_double_arrow_up
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

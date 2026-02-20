import { FC } from 'react';
import { Avatar, Leaderboard } from '../common';
import type { LeaderboardEntry } from '../../types';
import { useTranslation } from '../../i18n';

interface LeaderboardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseRoom?: () => void;
  leaderboard: LeaderboardEntry[];
  title?: string;
  isFinal?: boolean;
}

export const LeaderboardPopup: FC<LeaderboardPopupProps> = ({
  isOpen,
  onClose,
  onCloseRoom,
  leaderboard,
  title = 'Leaderboard',
  isFinal = false,
}) => {
  if (!isOpen) return null;

  const top3 = leaderboard.slice(0, 3);
  const [first, second, third] = [
    top3[0] || { playerId: '', name: '---', score: 0, rank: 1 },
    top3[1] || { playerId: '', name: '---', score: 0, rank: 2 },
    top3[2] || { playerId: '', name: '---', score: 0, rank: 3 },
  ];
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-scale-in">
        {/* 標題 */}
        <div className="bg-primary/10 px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl filled">
              emoji_events
            </span>
            <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-text-muted">close</span>
          </button>
        </div>

        {/* 頒獎台 */}
        <div className="px-8 py-6">
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* 第二名 */}
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-3">
                <Avatar
                  src={second.avatar}
                  name={second.name}
                  size="lg"
                  className="border-4 border-slate-300 shadow-lg"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white">
                  2
                </div>
              </div>
              <div className="bg-slate-100 w-full h-20 rounded-t-xl flex flex-col items-center justify-center">
                <p className="font-bold text-sm truncate px-2 text-center">{second.name}</p>
                <p className="text-xs text-primary font-medium">{t('common.scorePts', { score: second.score.toLocaleString() })}</p>
              </div>
            </div>

            {/* 第一名 */}
            <div className="flex flex-col items-center flex-1 z-10">
              <div className="relative mb-3 -mt-8">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary">
                  <span className="material-symbols-outlined text-4xl filled">workspace_premium</span>
                </div>
                <Avatar
                  src={first.avatar}
                  name={first.name}
                  size="xl"
                  className="border-4 border-primary shadow-xl ring-8 ring-primary/10"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-base font-bold border-2 border-white">
                  1
                </div>
              </div>
              <div className="bg-primary w-full h-28 rounded-t-xl flex flex-col items-center justify-center">
                <p className="font-bold text-white truncate px-2 text-center">{first.name}</p>
                <p className="text-sm text-white/80 font-medium">{t('common.scorePts', { score: first.score.toLocaleString() })}</p>
                <div className="mt-2 px-3 py-1 bg-white/20 rounded-full text-[10px] text-white font-bold uppercase tracking-wider">
                  {t('common.champion')}
                </div>
              </div>
            </div>

            {/* 第三名 */}
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-3">
                <Avatar
                  src={third.avatar}
                  name={third.name}
                  size="md"
                  className="border-4 border-orange-300 shadow-lg"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                  3
                </div>
              </div>
              <div className="bg-orange-100 w-full h-16 rounded-t-xl flex flex-col items-center justify-center">
                <p className="font-bold text-sm truncate px-2 text-center">{third.name}</p>
                <p className="text-xs text-primary font-medium">{t('common.scorePts', { score: third.score.toLocaleString() })}</p>
              </div>
            </div>
          </div>

          {/* 其他排名 */}
          {leaderboard.length > 3 && (
            <div className="border-t border-gray-100 pt-4">
              <Leaderboard
                entries={leaderboard.slice(3, 10)}
                maxDisplay={7}
                showMedals={false}
              />
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="bg-gray-50 px-8 py-4 flex justify-center gap-4">
          {isFinal && onCloseRoom ? (
            <button
              onClick={onCloseRoom}
              className="px-6 py-2 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">home</span>
              {t('leaderboardPopup.closeRoom')}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors"
            >
              {t('leaderboardPopup.continueGame')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

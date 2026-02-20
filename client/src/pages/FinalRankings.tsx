import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, LanguageToggle } from '../components/common';
import { useTranslation } from '../i18n';
import { usePlayerStore } from '../stores';
import { clearGameSession } from '../utils/session';

export const FinalRankings: FC = () => {
  const navigate = useNavigate();
  const leaderboard = usePlayerStore((state) => state.leaderboard);
  const currentPlayer = usePlayerStore((state) => state.currentPlayer);
  const { t } = useTranslation();

  // 取得前三名和其餘排名
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 5);

  // 確保至少有 3 個元素用於排列
  const [first, second, third] = [
    top3[0] || { playerId: '', name: '---', score: 0, rank: 1 },
    top3[1] || { playerId: '', name: '---', score: 0, rank: 2 },
    top3[2] || { playerId: '', name: '---', score: 0, rank: 3 },
  ];

  return (
    <div className="min-h-screen bg-bg-light flex flex-col overflow-hidden max-w-md mx-auto">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(#f48c25 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-10 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* 頂部導航 */}
      <div className="relative flex items-center p-4 justify-between z-10">
        <button
          onClick={() => navigate('/game')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 className="text-lg font-bold text-text-primary">{t('finalRankings.title')}</h2>
        <LanguageToggle className="text-text-primary" />
      </div>

      {/* 成功訊息 */}
      <div className="relative z-10 flex flex-col items-center pt-6 pb-2 px-4 text-center">
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
          <span className="material-symbols-outlined text-[16px] filled">celebration</span>
          {t('finalRankings.gameCompleted')}
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">{t('finalRankings.congratulations')}</h1>
        <p className="text-text-secondary text-sm max-w-[280px]">
          {t('finalRankings.championsDesc')}
        </p>
      </div>

      {/* 頒獎台 */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-4 pb-4">
        <div className="flex items-end justify-center gap-2 h-full max-h-[320px] mb-8">
          {/* 第二名 */}
          <div className="flex flex-col items-center flex-1">
            <div className="relative mb-3">
              <Avatar
                src={second.avatar}
                name={second.name}
                size="lg"
                className="border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                2
              </div>
            </div>
            <div className="bg-gradient-to-t from-primary/10 to-primary/5 w-full h-24 rounded-t-xl border border-primary/10 flex flex-col items-center pt-4">
              <p className="text-xs font-bold truncate px-1">{second.name}</p>
              <p className="text-[10px] text-primary font-medium">{t('common.scorePts', { score: second.score.toLocaleString() })}</p>
            </div>
          </div>

          {/* 第一名 */}
          <div className="flex flex-col items-center flex-1 z-20">
            <div className="relative mb-3 -mt-12">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary">
                <span className="material-symbols-outlined text-4xl filled">workspace_premium</span>
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-primary shadow-xl overflow-hidden bg-white ring-8 ring-primary/5">
                <Avatar
                  src={first.avatar}
                  name={first.name}
                  size="xl"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white">
                1
              </div>
            </div>
            <div className="bg-primary w-full h-40 rounded-t-xl shadow-lg flex flex-col items-center pt-6">
              <p className="text-white text-sm font-bold truncate px-1">{first.name}</p>
              <p className="text-white/80 text-xs font-medium">{t('common.scorePts', { score: first.score.toLocaleString() })}</p>
              <div className="mt-4 px-2 py-1 bg-white/20 rounded-full text-[10px] text-white font-bold uppercase tracking-tighter">
                {t('common.mvp')}
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
                className="border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white">
                3
              </div>
            </div>
            <div className="bg-gradient-to-t from-primary/10 to-primary/5 w-full h-20 rounded-t-xl border border-primary/10 flex flex-col items-center pt-3">
              <p className="text-xs font-bold truncate px-1">{third.name}</p>
              <p className="text-[10px] text-primary font-medium">{t('common.scorePts', { score: third.score.toLocaleString() })}</p>
            </div>
          </div>
        </div>

        {/* 第 4-5 名 */}
        {rest.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
            {rest.map((entry, index) => (
              <div key={entry.playerId}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-muted w-4">{entry.rank}</span>
                    <Avatar src={entry.avatar} name={entry.name} size="sm" />
                    <span className="text-sm font-semibold">{entry.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{t('common.scorePts', { score: entry.score.toLocaleString() })}</span>
                </div>
                {index < rest.length - 1 && <div className="h-px bg-gray-100 mt-3" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部行動區域 */}
      <div className="relative z-10 px-4 pb-8 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => { clearGameSession(); navigate('/'); }}
          icon={<span className="material-symbols-outlined">home</span>}
          iconPosition="left"
        >
          {t('finalRankings.backToHome')}
        </Button>
        <p className="text-center text-[10px] text-text-muted mt-4 uppercase tracking-[0.2em] font-bold">
          {t('finalRankings.footer')}
        </p>
      </div>
    </div>
  );
};

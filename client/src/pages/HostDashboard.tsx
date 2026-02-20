import { FC, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar, LanguageToggle } from '../components/common';
import { PlayerCounter } from '../components/host';
import { useWs } from '../hooks';
import { useRoomStore, usePlayerStore, useWsStore } from '../stores';
import { clearGameSession } from '../utils/session';
import { logger } from '../utils/logger';
import { useTranslation } from '../i18n';
import type { ServerMessage } from '../types';

export const HostDashboard: FC = () => {
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [hostName, setHostName] = useState('QuizMaster');
  const [defaultTimer, setDefaultTimer] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasAttemptedRecovery = useRef(false);
  const { t } = useTranslation();

  const players = usePlayerStore((state) => state.players);
  const addPlayer = usePlayerStore((state) => state.addPlayer);
  const removePlayer = usePlayerStore((state) => state.removePlayer);
  const clearPlayers = usePlayerStore((state) => state.clearPlayers);
  const setCurrentPlayer = usePlayerStore((state) => state.setCurrentPlayer);
  const currentPlayer = usePlayerStore((state) => state.currentPlayer);

  const roomId = useRoomStore((state) => state.roomId);
  const setRoom = useRoomStore((state) => state.setRoom);
  const setJoined = useRoomStore((state) => state.setJoined);
  const clearRoom = useRoomStore((state) => state.clearRoom);
  const isJoined = useRoomStore((state) => state.isJoined);

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'roomCreated':
        setRoom(message.roomId, '', true);
        setJoined(true);
        setIsCreating(false);
        // Persist host identity for session recovery
        setCurrentPlayer({
          id: message.playerName,
          playerId: message.playerId,
          name: message.playerName,
          x: 50,
          y: 50,
          score: 0,
          isQuizMaster: true,
        });
        break;

      case 'newPlayer':
        addPlayer({
          id: message.id,
          playerId: message.playerId,
          name: message.name,
          x: message.x,
          y: message.y,
          score: 0,
          isQuizMaster: message.isQuizMaster,
          avatar: message.avatar,
        });
        break;

      case 'playerLeft':
        removePlayer(message.id);
        break;

      case 'questionsLoaded':
        setQuestionCount(message.count);
        break;

      case 'error':
        logger.error('Error:', message.message);
        setErrorMessage(message.message);
        setIsCreating(false);
        setTimeout(() => setErrorMessage(null), 5000);
        break;

      case 'roomClosed':
        setQuestionCount(0);
        clearPlayers();
        clearRoom();
        clearGameSession();
        setErrorMessage(message.message || 'Room was closed');
        setTimeout(() => setErrorMessage(null), 5000);
        break;
    }
  }, [addPlayer, removePlayer, setRoom, setJoined, setCurrentPlayer, clearPlayers, clearRoom]);

  const { send, isConnected } = useWs({
    onMessage: handleMessage,
    autoConnect: true,
  });

  // 建立房間
  const handleCreateRoom = () => {
    if (!hostName.trim()) return;
    setIsCreating(true);
    setErrorMessage(null);
    clearPlayers();
    send({
      type: 'createRoom',
      quizMaster: hostName.trim(),
      ...(defaultTimer ? { defaultTimer } : {}),
    });
  };

  // 開始遊戲 — navigate first, HostGame will send startGame after mounting
  const handleStartGame = () => {
    navigate('/host/game', { state: { startGame: true } });
  };

  // 載入題目
  useEffect(() => {
    if (roomId && isJoined) {
      send({ type: 'loadQuestions' });
    }
  }, [roomId, isJoined, send]);

  // Session recovery: if we have a persisted room, rejoin on connect
  useEffect(() => {
    if (!isConnected || hasAttemptedRecovery.current) return;
    if (!roomId || !isJoined || !currentPlayer?.playerId) return;

    hasAttemptedRecovery.current = true;
    logger.log('[HostDashboard] Recovering session — rejoining room', roomId);

    const { send: wsSend } = useWsStore.getState();
    wsSend({
      type: 'joinRoom',
      roomId,
      playerName: currentPlayer.name,
      playerId: currentPlayer.playerId,
    });
  }, [isConnected, roomId, isJoined, currentPlayer]);

  const playersArray = Array.from(players.values());

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* 頂部狀態欄 */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-xl">
            <span className="material-symbols-outlined text-primary text-2xl filled">
              favorite
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Wedding Jump</h1>
            <p className="text-xs text-white/60">{t('hostDashboard.title')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isConnected ? 'bg-game-green/20' : 'bg-game-red/20'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-game-green animate-pulse' : 'bg-game-red'}`} />
            <span className={`text-xs font-bold ${isConnected ? 'text-game-green' : 'text-game-red'}`}>
              {isConnected ? t('common.connected') : t('common.disconnected')}
            </span>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="relative z-10 flex-1 p-8">
        {!roomId ? (
          /* 建立房間畫面 */
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/10 text-center max-w-md">
              <div className="mb-8">
                <span className="material-symbols-outlined text-primary text-6xl filled">
                  celebration
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">{t('hostDashboard.createRoom')}</h2>
              <p className="text-white/60 mb-6">
                {t('hostDashboard.createRoomDesc')}
              </p>
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-white/60 font-bold mb-2">
                  {t('hostDashboard.hostName')}
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder={t('hostDashboard.hostNamePlaceholder')}
                  maxLength={20}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-white/60 font-bold mb-2">
                  {t('hostDashboard.countdownTimer')}
                </label>
                <div className="flex gap-2">
                  {[null, 10, 15, 20, 30].map((val) => (
                    <button
                      key={val ?? 'auto'}
                      onClick={() => setDefaultTimer(val)}
                      className={`flex-1 px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
                        defaultTimer === val
                          ? 'bg-primary text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {val ? `${val}s` : t('hostDashboard.auto')}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/40 mt-1">
                  {t('hostDashboard.autoDesc')}
                </p>
              </div>
              {errorMessage && (
                <div className="mb-4 px-4 py-2 bg-game-red/20 border border-game-red/40 rounded-xl text-game-red text-sm">
                  {errorMessage}
                </div>
              )}
              <Button
                variant="accent"
                size="xl"
                fullWidth
                onClick={handleCreateRoom}
                disabled={!isConnected || isCreating || !hostName.trim()}
                loading={isCreating}
                icon={<span className="material-symbols-outlined">add</span>}
              >
                {t('hostDashboard.createRoom')}
              </Button>
            </div>
          </div>
        ) : (
          /* 等待玩家畫面 */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* 左側：房間資訊 */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* 房間代碼 */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <p className="text-xs uppercase tracking-widest text-white/60 font-bold mb-2">
                  {t('hostDashboard.roomCode')}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black text-primary tracking-wider">
                    {roomId}
                  </span>
                  <button
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    onClick={() => navigator.clipboard.writeText(String(roomId))}
                  >
                    <span className="material-symbols-outlined text-white/80">content_copy</span>
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  {t('hostDashboard.shareCode')}
                </p>
              </div>

              {/* 玩家計數 */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <PlayerCounter
                  count={playersArray.length}
                  className="text-white [&_*]:text-white [&_.text-text-primary]:text-white [&_.text-text-muted]:text-white/60"
                />
              </div>

              {/* 題目數量 */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-primary text-2xl">quiz</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-white/60 font-bold block">
                      {t('hostDashboard.questionsReady')}
                    </span>
                    <span className="text-3xl font-black text-white">{questionCount}</span>
                  </div>
                </div>
              </div>

              {/* 倒數時間設定 */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-primary text-2xl">timer</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-white/60 font-bold block">
                      {t('hostDashboard.timer')}
                    </span>
                    <span className="text-3xl font-black text-white">
                      {defaultTimer ? `${defaultTimer}s` : t('hostDashboard.auto')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 開始按鈕 */}
              <Button
                variant="accent"
                size="xl"
                fullWidth
                onClick={handleStartGame}
                disabled={playersArray.length === 0 || questionCount === 0}
                icon={<span className="material-symbols-outlined">play_arrow</span>}
              >
                {t('hostDashboard.startGame')}
              </Button>
            </div>

            {/* 右側：玩家列表 */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{t('hostDashboard.playersJoined')}</h3>
                <span className="text-sm text-white/60">
                  {t('hostDashboard.nPlayers', { n: playersArray.length, s: playersArray.length !== 1 ? 's' : '' })}
                </span>
              </div>
              <div className="p-6 overflow-y-auto max-h-[500px]">
                {playersArray.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-white/20 text-6xl mb-4">
                      hourglass_empty
                    </span>
                    <p className="text-white/40">{t('hostDashboard.waitingForPlayers')}</p>
                    <p className="text-white/20 text-sm mt-2">
                      {t('hostDashboard.shareCodeToStart')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {playersArray.map((player) => (
                      <div
                        key={player.playerId}
                        className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl"
                      >
                        <Avatar
                          src={player.avatar}
                          name={player.name}
                          size="lg"
                          className="border-2 border-white/20"
                        />
                        <span className="text-sm font-medium text-white truncate max-w-full">
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部資訊 */}
      <div className="relative z-10 px-8 py-4 border-t border-white/10 flex justify-between items-center">
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
          {t('hostDashboard.footer')}
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          {t('hostDashboard.exitToHome')}
        </button>
      </div>
    </div>
  );
};

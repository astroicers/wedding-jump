import { FC, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common';
import { AvatarSelector } from '../components/player';
import { useWs } from '../hooks';
import { usePlayerStore, useRoomStore } from '../stores';
import type { ServerMessage } from '../types';
import { useTranslation } from '../i18n';
import { LanguageToggle } from '../components/common';

export const PlayerJoin: FC = () => {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  const { t } = useTranslation();

  const setCurrentPlayer = usePlayerStore((state) => state.setCurrentPlayer);
  const existingPlayer = usePlayerStore((state) => state.currentPlayer);
  const setRoom = useRoomStore((state) => state.setRoom);
  const setJoined = useRoomStore((state) => state.setJoined);
  const existingRoomId = useRoomStore((state) => state.roomId);
  const isAlreadyJoined = useRoomStore((state) => state.isJoined);

  // If player already has a valid session, redirect to game
  useEffect(() => {
    if (isAlreadyJoined && existingRoomId && existingPlayer?.playerId) {
      navigate('/game');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'joinedRoom':
        setCurrentPlayer({
          id: message.playerName,
          playerId: message.playerId,
          name: message.playerName,
          avatar: selectedAvatar || undefined,
          x: message.x,
          y: message.y,
          score: 0,
          isQuizMaster: message.isQuizMaster,
        });
        setRoom(message.roomId, '', message.isQuizMaster);
        setJoined(true);
        setIsJoining(false);
        navigate('/game');
        break;

      case 'roomStats':
        setOnlineCount(message.playerCount);
        break;

      case 'error':
        setError(message.message);
        setIsJoining(false);
        break;
    }
  }, [navigate, selectedAvatar, setCurrentPlayer, setRoom, setJoined]);

  const { send, isConnected } = useWs({
    onMessage: handleMessage,
  });

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError(t('playerJoin.nicknameRequired'));
      return;
    }
    if (!roomCode.trim()) {
      setError(t('playerJoin.roomCodeRequired'));
      return;
    }

    setError(null);
    setIsJoining(true);

    // Reuse existing playerId if available (reconnection scenario)
    const playerId = existingPlayer?.playerId
      || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    send({
      type: 'joinRoom',
      roomId: parseInt(roomCode),
      playerName: nickname.trim(),
      playerId,
      avatar: selectedAvatar || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(#f48c25 10%, transparent 10%), radial-gradient(#ff4d94 10%, transparent 10%)`,
            backgroundPosition: '0 0, 25px 25px',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* 頂部導航 */}
      <div className="relative z-10 flex items-center p-4 justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-text-primary">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold text-text-primary">{t('playerJoin.title')}</h2>
        <LanguageToggle className="text-text-primary" />
      </div>

      {/* 歡迎區域 */}
      <div className="relative z-10 px-6 pt-8 pb-4 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {t('playerJoin.welcome')}
        </h1>
        <p className="text-text-secondary">
          {t('playerJoin.welcomeDesc')}
        </p>
      </div>

      {/* 房間代碼輸入 */}
      <div className="relative z-10 px-6 py-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider px-2">
            {t('playerJoin.roomCode')}
          </span>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder={t('playerJoin.roomCodePlaceholder')}
            className="w-full h-14 px-6 text-lg font-medium rounded-full border-2 border-primary/20
              focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none
              bg-white text-text-primary placeholder:text-text-muted/50 transition-all"
          />
        </label>
      </div>

      {/* 暱稱輸入 */}
      <div className="relative z-10 px-6 py-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider px-2">
            {t('playerJoin.nickname')}
          </span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('playerJoin.nicknamePlaceholder')}
            maxLength={20}
            className="w-full h-14 px-6 text-lg font-medium rounded-full border-2 border-primary/20
              focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none
              bg-white text-text-primary placeholder:text-text-muted/50 transition-all"
          />
        </label>
      </div>

      {/* 頭像選擇 */}
      <div className="relative z-10 mt-4 px-4">
        <AvatarSelector
          selectedAvatar={selectedAvatar}
          onSelect={setSelectedAvatar}
        />
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="relative z-10 mx-6 mt-4 p-4 bg-game-red/10 border border-game-red/30 rounded-xl">
          <p className="text-game-red text-sm font-medium">{error}</p>
        </div>
      )}

      {/* 底部行動區域 */}
      <div className="mt-auto relative z-10 flex flex-col items-center gap-4 p-6 pb-10">
        {/* 在線人數 */}
        {onlineCount > 0 && (
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/10">
            <span className="w-2 h-2 rounded-full bg-game-green animate-pulse" />
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
              {t('playerJoin.playersJoined', { n: onlineCount })}
            </p>
          </div>
        )}

        {/* 連線狀態 */}
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-game-green' : 'bg-game-red'}`} />
          <span className="text-text-muted">
            {isConnected ? t('common.connected') : t('common.connecting')}
          </span>
        </div>

        {/* 加入按鈕 */}
        <Button
          variant="accent"
          size="xl"
          fullWidth
          onClick={handleJoin}
          disabled={!isConnected || isJoining}
          loading={isJoining}
          icon={<span className="material-symbols-outlined">celebration</span>}
        >
          {t('playerJoin.getReady')}
        </Button>

        <p className="text-xs text-text-muted">
          {t('playerJoin.waitingForHost')}
        </p>
      </div>
    </div>
  );
};

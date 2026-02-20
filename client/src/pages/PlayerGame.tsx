import { FC, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Avatar } from '../components/common';
import { GameArena } from '../components/player';
import { useWs, useTimer, useSessionRecovery } from '../hooks';
import { usePlayerStore, useRoomStore, useGameStore, useWsStore } from '../stores';
import { clearGameSession } from '../utils/session';
import { logger } from '../utils/logger';
import { useTranslation } from '../i18n';
import type { ServerMessage, AnswerZone, Player, QuestionMessage } from '../types';

export const PlayerGame: FC = () => {
  const navigate = useNavigate();

  // Stores
  const currentPlayer = usePlayerStore((state) => state.currentPlayer);
  const players = usePlayerStore((state) => state.players);
  const addPlayer = usePlayerStore((state) => state.addPlayer);
  const updatePlayer = usePlayerStore((state) => state.updatePlayer);
  const removePlayer = usePlayerStore((state) => state.removePlayer);
  const updateCurrentPlayerPosition = usePlayerStore((state) => state.updateCurrentPlayerPosition);
  const updateCurrentPlayerScore = usePlayerStore((state) => state.updateCurrentPlayerScore);
  const leaderboard = usePlayerStore((state) => state.leaderboard);
  const setLeaderboard = usePlayerStore((state) => state.setLeaderboard);

  const roomId = useRoomStore((state) => state.roomId);
  const isJoined = useRoomStore((state) => state.isJoined);
  const clearRoom = useRoomStore((state) => state.clearRoom);

  const clearPlayers = usePlayerStore((state) => state.clearPlayers);

  const phase = useGameStore((state) => state.phase);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const selectedAnswer = useGameStore((state) => state.selectedAnswer);
  const correctAnswer = useGameStore((state) => state.correctAnswer);
  const setPhase = useGameStore((state) => state.setPhase);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setSelectedAnswer = useGameStore((state) => state.setSelectedAnswer);
  const setCorrectAnswer = useGameStore((state) => state.setCorrectAnswer);
  const setLastScoreGained = useGameStore((state) => state.setLastScoreGained);
  const setTotalQuestions = useGameStore((state) => state.setTotalQuestions);
  const getProgress = useGameStore((state) => state.getProgress);
  const resetGame = useGameStore((state) => state.resetGame);

  const { t } = useTranslation();

  const { seconds, maxSeconds, start: startTimer } = useTimer({
    initialSeconds: 30,
    onComplete: () => {
      // 時間到，等待答案揭曉
    },
  });

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'newPlayer':
        if (message.playerId !== currentPlayer?.playerId) {
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
        }
        break;

      case 'positionUpdate':
        if (message.playerId !== currentPlayer?.playerId) {
          updatePlayer(message.playerId, { x: message.x, y: message.y });
        }
        break;

      case 'scoreUpdate':
        if (message.playerId === currentPlayer?.playerId) {
          updateCurrentPlayerScore(message.totalScore);
          setLastScoreGained(message.score);
        }
        break;

      case 'leaderboardUpdate':
        setLeaderboard(message.leaderboard);
        break;

      case 'question': {
        const qMsg = message as QuestionMessage;
        if (qMsg.totalQuestions) {
          setTotalQuestions(qMsg.totalQuestions);
        }
        setCurrentQuestion(qMsg.question as import('../types').Question, qMsg.questionIndex);
        setSelectedAnswer(null);
        setPhase('question');
        startTimer(qMsg.question.倒數時間 || 30);
        break;
      }

      case 'answer':
        setCorrectAnswer(message.correctAnswer);
        setPhase('reveal');
        // 計算得分
        if (selectedAnswer === message.correctAnswer) {
          // 答對了！
        }
        break;

      case 'gameEnded':
        setPhase('ended');
        navigate('/rankings');
        break;

      case 'playerLeft':
        removePlayer(message.id);
        break;

      case 'roomClosed':
        clearRoom();
        resetGame();
        clearPlayers();
        clearGameSession();
        navigate('/join');
        break;
    }
  }, [currentPlayer, addPlayer, updatePlayer, removePlayer, updateCurrentPlayerScore, setLeaderboard, setCurrentQuestion, setTotalQuestions, setSelectedAnswer, setCorrectAnswer, setPhase, selectedAnswer, setLastScoreGained, startTimer, navigate, clearRoom, resetGame, clearPlayers]);

  const handleReconnect = useCallback(() => {
    if (roomId && currentPlayer) {
      logger.log('[PlayerGame] Reconnecting — re-joining room', roomId);
      const { send: wsSend } = useWsStore.getState();
      wsSend({
        type: 'joinRoom',
        roomId,
        playerName: currentPlayer.name,
        playerId: currentPlayer.playerId,
        avatar: currentPlayer.avatar,
      });
      // Request game state after a short delay to ensure join is processed
      setTimeout(() => {
        useWsStore.getState().send({ type: 'requestGameState' });
      }, 500);
    }
  }, [roomId, currentPlayer]);

  const { send, isConnected } = useWs({
    onMessage: handleMessage,
    onReconnect: handleReconnect,
    autoConnect: true,
  });

  // Session recovery on page refresh
  const [isRecovering, setIsRecovering] = useState(true);

  useSessionRecovery({
    isHost: false,
    onRecoveryFailed: () => setIsRecovering(false),
    onRecoveryComplete: () => setIsRecovering(false),
  });

  // 未加入房間則導回首頁（等 recovery 完成後才判斷）
  useEffect(() => {
    if (!isRecovering && (!isJoined || !roomId)) {
      navigate('/join');
    }
  }, [isRecovering, isJoined, roomId, navigate]);

  // 選擇答案並移動
  const handleSelectAnswer = useCallback((zone: AnswerZone) => {
    if (phase !== 'question' && phase !== 'answering') return;

    setSelectedAnswer(zone);
    setPhase('answering');

    // 計算對應區域的座標
    let x: number, y: number;
    switch (zone) {
      case 'O':
        x = 50; y = 25;
        break;
      case 'X':
        x = 50; y = 75;
        break;
      case 'A':
        x = 25; y = 25;
        break;
      case 'B':
        x = 75; y = 25;
        break;
      case 'C':
        x = 25; y = 75;
        break;
      case 'D':
        x = 75; y = 75;
        break;
      default:
        x = 50; y = 50;
    }

    // 加入一些隨機偏移
    x += (Math.random() - 0.5) * 20;
    y += (Math.random() - 0.5) * 20;

    updateCurrentPlayerPosition(x, y);

    // 發送移動訊息
    send({ type: 'move', x, y });
  }, [phase, setSelectedAnswer, setPhase, updateCurrentPlayerPosition, send]);

  const progress = getProgress();
  const currentRank = currentPlayer
    ? leaderboard.findIndex((e) => e.playerId === currentPlayer.playerId) + 1 || '-'
    : '-';
  const playersArray = Array.from(players.values());
  if (currentPlayer) {
    playersArray.push(currentPlayer);
  }

  // 題目未載入時顯示 loading
  if (!currentQuestion) {
    return (
      <div className="h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-muted">{t('common.waitingForQuestion')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-light flex flex-col overflow-hidden">
      {/* 頂部狀態欄 */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-bg-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-full">
            <span className="material-symbols-outlined text-primary text-xl">groups</span>
          </div>
          <span className="font-bold text-sm">{t('common.nPlayers', { n: playersArray.length })}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
              {t('playerGame.rank')}
            </span>
            <span className="font-bold text-primary">#{currentRank}</span>
          </div>

          <Timer
            seconds={seconds}
            maxSeconds={maxSeconds}
            size="sm"
          />
        </div>
      </div>

      {/* 題目卡片 */}
      <div className="px-4 py-2 z-40">
        <div className="bg-white rounded-xl p-4 shadow-xl border-b-4 border-primary/10">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/10 px-2 py-1 rounded-full">
              {t('playerGame.questionProgress', { current: progress.current, total: progress.total || '?' })}
            </span>
            <span className="material-symbols-outlined text-text-muted">info</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary">
            {currentQuestion.題目}
          </h1>
        </div>
      </div>

      {/* 遊戲區域 */}
      <div className="flex-1 relative mt-4 px-2 pb-24 overflow-hidden">
        <GameArena
          question={currentQuestion}
          players={playersArray}
          currentPlayer={currentPlayer}
          selectedAnswer={selectedAnswer}
          correctAnswer={correctAnswer}
          isRevealed={phase === 'reveal'}
          onSelectAnswer={handleSelectAnswer}
        />

        {/* 操作提示 */}
        {phase === 'question' && !selectedAnswer && (
          <div className="absolute bottom-28 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
              <span className="material-symbols-outlined animate-pulse text-primary">touch_app</span>
              <p className="text-sm font-medium">{t('playerGame.tapToMove')}</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部導航欄 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-8 pt-3 px-6 flex justify-around items-center z-50 max-w-md mx-auto">
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined filled">gamepad</span>
          <span className="text-[10px] font-bold">{t('playerGame.play')}</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-text-muted"
          onClick={() => navigate('/rankings')}
        >
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[10px] font-bold">{t('playerGame.ranks')}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted">
          <span className="material-symbols-outlined">forum</span>
          <span className="text-[10px] font-bold">{t('playerGame.chat')}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold">{t('playerGame.me')}</span>
        </button>
      </div>
    </div>
  );
};

import { FC, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timer, ProgressBar } from '../components/common';
import { QuestionCard, AnswerGrid, GameControls, LeaderboardPopup, PlayerCounter } from '../components/host';
import { useWs, useTimer, useSessionRecovery } from '../hooks';
import { usePlayerStore, useRoomStore, useGameStore, useWsStore } from '../stores';
import { clearGameSession } from '../utils/session';
import { useTranslation } from '../i18n';
import type { ServerMessage, Question, QuestionMessage } from '../types';

export const HostGame: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldStartGame = (location.state as { startGame?: boolean })?.startGame === true;
  const hasStartedGame = useRef(false);
  const { t } = useTranslation();

  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Stores
  const players = usePlayerStore((state) => state.players);
  const addPlayer = usePlayerStore((state) => state.addPlayer);
  const updatePlayer = usePlayerStore((state) => state.updatePlayer);
  const removePlayer = usePlayerStore((state) => state.removePlayer);
  const leaderboard = usePlayerStore((state) => state.leaderboard);
  const setLeaderboard = usePlayerStore((state) => state.setLeaderboard);
  const clearPlayers = usePlayerStore((state) => state.clearPlayers);
  const currentPlayer = usePlayerStore((state) => state.currentPlayer);

  const roomId = useRoomStore((state) => state.roomId);
  const isJoined = useRoomStore((state) => state.isJoined);
  const clearRoom = useRoomStore((state) => state.clearRoom);

  const phase = useGameStore((state) => state.phase);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const correctAnswer = useGameStore((state) => state.correctAnswer);
  const setPhase = useGameStore((state) => state.setPhase);
  const setCurrentQuestion = useGameStore((state) => state.setCurrentQuestion);
  const setCorrectAnswer = useGameStore((state) => state.setCorrectAnswer);
  const setTotalQuestions = useGameStore((state) => state.setTotalQuestions);
  const getProgress = useGameStore((state) => state.getProgress);
  const resetGame = useGameStore((state) => state.resetGame);

  const { seconds, maxSeconds, start: startTimer } = useTimer({
    initialSeconds: 30,
    onComplete: () => {
      // 時間到，自動揭曉答案
      handleRevealAnswer();
    },
  });

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
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

      case 'positionUpdate':
        updatePlayer(message.playerId, { x: message.x, y: message.y });
        break;

      case 'leaderboardUpdate':
        setLeaderboard(message.leaderboard);
        break;

      case 'playerLeft':
        removePlayer(message.id);
        break;

      case 'question': {
        const qMsg = message as QuestionMessage;
        if (qMsg.totalQuestions) {
          setTotalQuestions(qMsg.totalQuestions);
        }
        setCurrentQuestion(qMsg.question as Question, qMsg.questionIndex);
        setPhase('question');
        startTimer(qMsg.question.倒數時間 || 30);
        break;
      }

      case 'answer':
        setCorrectAnswer(message.correctAnswer);
        setPhase('reveal');
        break;

      case 'gameEnded':
        setPhase('ended');
        setShowLeaderboard(true);
        break;

      case 'roomClosed':
        clearRoom();
        resetGame();
        clearPlayers();
        clearGameSession();
        navigate('/host');
        break;
    }
  }, [addPlayer, updatePlayer, removePlayer, setLeaderboard, setCurrentQuestion, setTotalQuestions, setPhase, setCorrectAnswer, startTimer, clearRoom, resetGame, clearPlayers, navigate]);

  const handleReconnect = useCallback(() => {
    if (roomId && currentPlayer) {
      console.log('[HostGame] Reconnecting — re-joining room', roomId);
      const { send: wsSend } = useWsStore.getState();
      wsSend({
        type: 'joinRoom',
        roomId,
        playerName: currentPlayer.name,
        playerId: currentPlayer.playerId,
      });
      setTimeout(() => {
        useWsStore.getState().send({ type: 'requestGameState' });
        useWsStore.getState().send({ type: 'loadQuestions' });
      }, 500);
    }
  }, [roomId, currentPlayer]);

  const { send, isConnected } = useWs({
    onMessage: handleMessage,
    onReconnect: handleReconnect,
    autoConnect: true,
  });

  // Session recovery on page refresh (skip if navigated from dashboard)
  const [isRecovering, setIsRecovering] = useState(!shouldStartGame);

  useSessionRecovery({
    isHost: true,
    skip: shouldStartGame,
    onRecoveryFailed: () => { setIsRecovering(false); },
    onRecoveryComplete: () => {
      setIsRecovering(false);
      // Host also needs to re-fetch questions
      send({ type: 'loadQuestions' });
    },
  });

  // 未加入房間則導回首頁（等 recovery 完成後才判斷）
  useEffect(() => {
    if (!isRecovering && (!isJoined || !roomId)) {
      navigate('/host');
    }
  }, [isRecovering, isJoined, roomId, navigate]);

  // Send startGame after mount + connection ready (navigated from dashboard)
  useEffect(() => {
    if (!shouldStartGame || hasStartedGame.current) return;
    if (!isConnected || !roomId) return;

    hasStartedGame.current = true;
    send({ type: 'startGame', roomId });

    // Clear the navigation state so refresh doesn't re-trigger
    window.history.replaceState({}, '');
  }, [shouldStartGame, isConnected, roomId, send]);

  // 開始題目
  const handleStartQuestion = () => {
    send({ type: 'nextQuestion' });
  };

  // 揭曉答案（防止 timer onComplete + 手動點擊重複觸發）
  const handleRevealAnswer = () => {
    if (phase !== 'question') return;
    send({ type: 'revealAnswer' });
  };

  // 顯示排行榜
  const handleShowLeaderboard = () => {
    send({ type: 'showLeaderboard' });
    setShowLeaderboard(true);
  };

  // 下一題
  const handleNextQuestion = () => {
    setShowLeaderboard(false);
    send({ type: 'nextQuestion' });
  };

  // 結束遊戲
  const handleEndGame = () => {
    send({ type: 'endGame' });
  };

  // 關閉房間，回到首頁
  const handleCloseRoom = () => {
    clearRoom();
    resetGame();
    clearPlayers();
    clearGameSession();
    navigate('/host');
  };

  const progress = getProgress();
  const playersArray = Array.from(players.values());

  // 模擬題目（實際應從 WebSocket 接收）
  const mockQuestion: Question = currentQuestion || {
    type: 'abcd',
    題目: 'What year did the couple first meet?',
    選項A: '2018',
    選項B: '2019',
    選項C: '2020',
    選項D: '2021',
    倒數時間: 30,
    正確答案: 'B',
    分數: 100,
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* 頂部狀態欄 */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-xl">
              <span className="material-symbols-outlined text-primary text-xl filled">favorite</span>
            </div>
            <span className="text-lg font-bold text-white">Wedding Jump</span>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <PlayerCounter
            count={playersArray.length}
            className="text-white [&_*]:text-white [&_.text-text-primary]:text-white [&_.text-text-muted]:text-white/60 scale-75 origin-left"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* 進度 */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <span className="text-xs font-bold text-white/60 uppercase">{t('hostGame.question')}</span>
            <span className="text-lg font-black text-primary">
              {progress.current}/{progress.total || '?'}
            </span>
          </div>

          {/* 計時器 */}
          <Timer seconds={seconds} maxSeconds={maxSeconds} size="lg" />
        </div>
      </div>

      {/* 主要內容 */}
      <div className="relative z-10 flex-1 p-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左側：題目卡片 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <QuestionCard
            question={mockQuestion}
            questionNumber={progress.current}
            totalQuestions={progress.total}
            showAnswer={phase === 'reveal'}
          />

          {/* 遊戲控制 */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <GameControls
              phase={phase}
              onStartQuestion={handleStartQuestion}
              onRevealAnswer={handleRevealAnswer}
              onShowLeaderboard={handleShowLeaderboard}
              onNextQuestion={handleNextQuestion}
              onEndGame={handleEndGame}
              onCloseRoom={handleCloseRoom}
              hasNextQuestion={progress.current < (progress.total || 1)}
            />
          </div>
        </div>

        {/* 右側：遊戲畫面 */}
        <div className="lg:col-span-3">
          <AnswerGrid
            question={mockQuestion}
            players={playersArray}
            showAnswer={phase === 'reveal'}
            className="h-full"
          />
        </div>
      </div>

      {/* 底部進度條 */}
      <div className="relative z-10 px-8 pb-4">
        <ProgressBar
          current={progress.current}
          total={progress.total || 10}
          showLabel
          className="bg-white/10"
        />
      </div>

      {/* 排行榜彈窗 */}
      <LeaderboardPopup
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        onCloseRoom={handleCloseRoom}
        leaderboard={leaderboard}
        title={phase === 'ended' ? t('leaderboardPopup.finalRankings') : t('leaderboardPopup.currentStandings')}
        isFinal={phase === 'ended'}
      />
    </div>
  );
};

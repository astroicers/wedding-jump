import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore, usePlayerStore, useGameStore, useWsStore } from '../stores';
import { clearGameSession } from '../utils/session';
import type { ServerMessage, GameStateMessage, Question } from '../types';

interface UseSessionRecoveryOptions {
  onRecoveryFailed: () => void;
  onRecoveryComplete: () => void;
  isHost: boolean;
  skip?: boolean;
}

export function useSessionRecovery(options: UseSessionRecoveryOptions) {
  const { onRecoveryFailed, onRecoveryComplete, isHost, skip = false } = options;
  const hasAttemptedRecovery = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roomId = useRoomStore((s) => s.roomId);
  const isJoined = useRoomStore((s) => s.isJoined);
  const clearRoom = useRoomStore((s) => s.clearRoom);

  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const addPlayer = usePlayerStore((s) => s.addPlayer);
  const setLeaderboard = usePlayerStore((s) => s.setLeaderboard);
  const updateCurrentPlayerScore = usePlayerStore((s) => s.updateCurrentPlayerScore);
  const clearPlayers = usePlayerStore((s) => s.clearPlayers);

  const setPhase = useGameStore((s) => s.setPhase);
  const setCurrentQuestion = useGameStore((s) => s.setCurrentQuestion);
  const setTotalQuestions = useGameStore((s) => s.setTotalQuestions);
  const resetGame = useGameStore((s) => s.resetGame);

  const isConnected = useWsStore((s) => s.isConnected);
  const send = useWsStore((s) => s.send);
  const subscribe = useWsStore((s) => s.subscribe);

  const handleFail = useCallback(() => {
    clearGameSession();
    clearRoom();
    resetGame();
    clearPlayers();
    onRecoveryFailed();
  }, [clearRoom, resetGame, clearPlayers, onRecoveryFailed]);

  useEffect(() => {
    // Only attempt recovery once, when:
    // 1. We have persisted session data
    // 2. WebSocket just connected
    // 3. We haven't already attempted recovery
    if (!isConnected || hasAttemptedRecovery.current) return;
    if (skip || !roomId || !isJoined || !currentPlayer?.playerId) {
      // No session to recover or skip requested — skip recovery
      onRecoveryFailed();
      return;
    }

    hasAttemptedRecovery.current = true;

    console.log('[SessionRecovery] Attempting to rejoin room', roomId, 'as', currentPlayer.playerId);

    let waitingForGameState = false;

    // Listen for server responses
    const unsubscribe = subscribe((message: ServerMessage) => {
      switch (message.type) {
        case 'joinedRoom':
          // Successfully re-joined — now request full game state
          console.log('[SessionRecovery] Re-joined room, requesting game state');
          waitingForGameState = true;
          send({ type: 'requestGameState' });
          break;

        case 'gameState': {
          if (!waitingForGameState) break;
          const gs = message as GameStateMessage;

          // Restore game state from server
          if (gs.currentQuestion) {
            setCurrentQuestion(gs.currentQuestion as Question, gs.questionIndex);
          }
          setTotalQuestions(gs.totalQuestions);
          if (gs.playerScore !== undefined) {
            updateCurrentPlayerScore(gs.playerScore);
          }
          setLeaderboard(gs.leaderboard);

          // Restore other players
          gs.players.forEach((p) => {
            addPlayer({
              id: p.id,
              playerId: p.playerId,
              name: p.name,
              x: p.x,
              y: p.y,
              score: 0,
              isQuizMaster: p.isQuizMaster,
              avatar: p.avatar,
            });
          });

          // Set phase based on server state
          if (gs.phase === 'waiting' && gs.questionIndex < 0) {
            setPhase('waiting');
          } else if (gs.currentQuestion) {
            setPhase('question');
          }

          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          unsubscribe();
          console.log('[SessionRecovery] Recovery complete');
          onRecoveryComplete();
          break;
        }

        case 'error':
          console.log('[SessionRecovery] Error during rejoin:', (message as { message?: string }).message);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          unsubscribe();
          handleFail();
          break;

        case 'roomClosed':
          console.log('[SessionRecovery] Room was closed');
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          unsubscribe();
          handleFail();
          break;
      }
    });

    // Send the joinRoom message with persisted playerId
    send({
      type: 'joinRoom',
      roomId,
      playerName: currentPlayer.name,
      playerId: currentPlayer.playerId,
      avatar: currentPlayer.avatar,
    });

    // Timeout: if no response within 5 seconds, recovery failed
    timeoutRef.current = setTimeout(() => {
      console.log('[SessionRecovery] Timeout waiting for rejoin response');
      unsubscribe();
      handleFail();
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps
}

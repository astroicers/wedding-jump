import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data-store before importing room-manager
vi.mock('./data-store.js', () => {
  return {
    default: {
      getAllRooms: vi.fn(() => ({})),
      loadRoomPlayers: vi.fn(() => new Map()),
      loadRoomScores: vi.fn(() => ({})),
      saveRoom: vi.fn(() => true),
      saveRoomScores: vi.fn(() => true),
      saveRoomPlayers: vi.fn(() => true),
      deleteRoom: vi.fn(() => true),
      deleteRoomScores: vi.fn(() => true),
      deleteRoomPlayers: vi.fn(() => true),
      getStorageStats: vi.fn(() => ({
        totalRooms: 0,
        totalScoreRecords: 0,
        totalPlayerRecords: 0,
        dataDirectory: '/tmp/test',
        files: { rooms: '', scores: '', players: '' },
      })),
    },
  };
});

import roomManager from './room-manager.js';
import dataStore from './data-store.js';

function createMockWs() {
  return {
    readyState: 1,
    OPEN: 1,
    send: vi.fn(),
    close: vi.fn(),
  };
}

describe('RoomManager', () => {
  beforeEach(() => {
    // Reset the singleton's internal state between tests
    roomManager.rooms = new Map();
    roomManager.players = new Map();
    roomManager.roomIdCounter = 1000;

    // Clear mock call history
    vi.clearAllMocks();
  });

  // ─── Room Management ──────────────────────────────────────

  describe('createRoom', () => {
    it('should return a room with id >= 1000', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      expect(room.id).toBeGreaterThanOrEqual(1000);
    });

    it('should set quizMaster name', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      expect(room.quizMaster).toBe('Alice');
      expect(room.quizMasterPlayerId).toBe('qm_alice');
    });

    it('should increment roomIdCounter', () => {
      const room1 = roomManager.createRoom('Alice', 'qm_alice');
      const room2 = roomManager.createRoom('Bob', 'qm_bob');
      expect(room2.id).toBeGreaterThan(room1.id);
    });

    it('should have default settings with null defaultTimer', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      expect(room.settings).toBeDefined();
      expect(room.settings.defaultTimer).toBeNull();
    });

    it('should accept defaultTimer option', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice', { defaultTimer: 15 });
      expect(room.settings.defaultTimer).toBe(15);
    });
  });

  describe('getRoom', () => {
    it('should return an existing room', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const found = roomManager.getRoom(room.id);
      expect(found).toBeDefined();
      expect(found.quizMaster).toBe('Alice');
    });

    it('should return undefined for non-existent room', () => {
      const found = roomManager.getRoom(9999);
      expect(found).toBeUndefined();
    });
  });

  describe('closeRoom', () => {
    it('should broadcast roomClosed to all players', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      roomManager.joinRoom(room.id, 'Alice', ws1, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', ws2, 'bob_123');

      roomManager.closeRoom(room.id);

      // Both players should have received roomClosed
      expect(ws1.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'roomClosed', message: '房間已關閉' })
      );
      expect(ws2.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'roomClosed', message: '房間已關閉' })
      );
    });

    it('should remove room from rooms Map', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.closeRoom(room.id);
      expect(roomManager.getRoom(room.id)).toBeUndefined();
    });
  });

  // ─── Player Management ────────────────────────────────────

  describe('joinRoom', () => {
    it('should add player to room', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      roomManager.joinRoom(room.id, 'Bob', ws, 'bob_123');

      expect(room.players.size).toBe(1);
      expect(room.players.has('bob_123')).toBe(true);
    });

    it('should return player with correct fields', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      const player = roomManager.joinRoom(room.id, 'Bob', ws, 'bob_123');

      expect(player.id).toBe('bob_123');
      expect(player.name).toBe('Bob');
      expect(player.roomId).toBe(room.id);
      expect(player.ws).toBe(ws);
      expect(player.joinTime).toBeTypeOf('number');
      expect(player.lastActive).toBeTypeOf('number');
      expect(player.isQuizMaster).toBe(false);
    });

    it('should set player position to (50, 50)', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      const player = roomManager.joinRoom(room.id, 'Bob', ws, 'bob_123');

      expect(player.x).toBe(50);
      expect(player.y).toBe(50);
    });

    it('should allow reconnect with same playerId and name', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      roomManager.joinRoom(room.id, 'Bob', ws1, 'bob_123');
      const reconnected = roomManager.joinRoom(room.id, 'Bob', ws2, 'bob_123');

      // ws should be updated
      expect(reconnected.ws).toBe(ws2);
      expect(reconnected.name).toBe('Bob');
    });

    it('should throw when same playerId but different name', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      roomManager.joinRoom(room.id, 'Bob', ws, 'bob_123');

      expect(() => {
        roomManager.joinRoom(room.id, 'Charlie', createMockWs(), 'bob_123');
      }).toThrow('玩家ID已被使用');
    });

    it('should throw when same name but different playerId', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      roomManager.joinRoom(room.id, 'Bob', ws, 'bob_123');

      expect(() => {
        roomManager.joinRoom(room.id, 'Bob', createMockWs(), 'bob_456');
      }).toThrow('玩家名稱已被使用');
    });

    it('should throw for non-existent room', () => {
      expect(() => {
        roomManager.joinRoom(9999, 'Bob', createMockWs(), 'bob_123');
      }).toThrow('房間不存在');
    });

    it('should throw for closed room', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      room.gameState.isActive = false;

      expect(() => {
        roomManager.joinRoom(room.id, 'Bob', createMockWs(), 'bob_123');
      }).toThrow('房間已關閉');
    });
  });

  describe('leaveRoom', () => {
    it('should remove player from room', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      roomManager.joinRoom(room.id, 'Bob', ws, 'bob_123');

      expect(room.players.has('bob_123')).toBe(true);

      const left = roomManager.leaveRoom('bob_123');
      expect(left).not.toBeNull();
      expect(left.name).toBe('Bob');
      expect(room.players.has('bob_123')).toBe(false);
    });

    it('should return null for non-existent player', () => {
      const result = roomManager.leaveRoom('nonexistent');
      expect(result).toBeNull();
    });

    it('should close room when quiz master leaves', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      roomManager.joinRoom(room.id, 'Alice', ws, 'qm_alice');

      roomManager.leaveRoom('qm_alice');
      expect(roomManager.getRoom(room.id)).toBeUndefined();
    });
  });

  // ─── Score & Leaderboard ──────────────────────────────────

  describe('updateScore', () => {
    it('should add score correctly', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      roomManager.joinRoom(room.id, 'Bob', ws, 'bob_123');

      const result = roomManager.updateScore('bob_123', 50);
      expect(result).not.toBeNull();
      expect(result.playerId).toBe('bob_123');
      expect(result.scoreAdded).toBe(50);
      expect(result.totalScore).toBe(50);

      const result2 = roomManager.updateScore('bob_123', 30);
      expect(result2.totalScore).toBe(80);
    });

    it('should return null for quiz master', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws = createMockWs();
      roomManager.joinRoom(room.id, 'Alice', ws, 'qm_alice');

      const result = roomManager.updateScore('qm_alice', 50);
      expect(result).toBeNull();
    });

    it('should return null for non-existent player', () => {
      const result = roomManager.updateScore('nonexistent', 50);
      expect(result).toBeNull();
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted scores', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', createMockWs(), 'bob_123');
      roomManager.joinRoom(room.id, 'Charlie', createMockWs(), 'charlie_123');

      roomManager.updateScore('bob_123', 30);
      roomManager.updateScore('charlie_123', 80);

      const leaderboard = roomManager.getLeaderboard(room.id);
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].name).toBe('Charlie');
      expect(leaderboard[0].score).toBe(80);
      expect(leaderboard[1].name).toBe('Bob');
      expect(leaderboard[1].score).toBe(30);
    });

    it('should exclude quiz master from leaderboard', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.joinRoom(room.id, 'Alice', createMockWs(), 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', createMockWs(), 'bob_123');

      roomManager.updateScore('bob_123', 50);

      const leaderboard = roomManager.getLeaderboard(room.id);
      const names = leaderboard.map((entry) => entry.name);
      expect(names).not.toContain('Alice');
      expect(names).toContain('Bob');
    });

    it('should return empty array for non-existent room', () => {
      const leaderboard = roomManager.getLeaderboard(9999);
      expect(leaderboard).toEqual([]);
    });
  });

  describe('getLeaderboard rank field', () => {
    let room;

    beforeEach(() => {
      room = roomManager.createRoom('Host', 'host_1');
      roomManager.joinRoom(room.id, 'Player1', { send: vi.fn(), readyState: 1 }, 'p1');
      roomManager.joinRoom(room.id, 'Player2', { send: vi.fn(), readyState: 1 }, 'p2');
      roomManager.joinRoom(room.id, 'Player3', { send: vi.fn(), readyState: 1 }, 'p3');
    });

    it('returns empty array for non-existent room', () => {
      expect(roomManager.getLeaderboard(9999)).toEqual([]);
    });

    it('returns leaderboard sorted by score descending', () => {
      roomManager.updateScore('p1', 100);
      roomManager.updateScore('p2', 300);
      roomManager.updateScore('p3', 200);

      const lb = roomManager.getLeaderboard(room.id);
      expect(lb[0].name).toBe('Player2');
      expect(lb[0].score).toBe(300);
      expect(lb[1].name).toBe('Player3');
      expect(lb[1].score).toBe(200);
      expect(lb[2].name).toBe('Player1');
      expect(lb[2].score).toBe(100);
    });

    it('includes rank field starting from 1', () => {
      roomManager.updateScore('p1', 100);
      roomManager.updateScore('p2', 300);
      roomManager.updateScore('p3', 200);

      const lb = roomManager.getLeaderboard(room.id);
      expect(lb[0].rank).toBe(1);
      expect(lb[1].rank).toBe(2);
      expect(lb[2].rank).toBe(3);
    });

    it('excludes quiz master from leaderboard', () => {
      roomManager.joinRoom(room.id, 'Host', { send: vi.fn(), readyState: 1 }, 'host_1');
      roomManager.updateScore('host_1', 500);
      roomManager.updateScore('p1', 100);

      const lb = roomManager.getLeaderboard(room.id);
      expect(lb.find(e => e.playerId === 'host_1')).toBeUndefined();
      // All 3 non-quiz-master players appear (p1, p2, p3 all have initialized scores)
      expect(lb.length).toBe(3);
      expect(lb[0].playerId).toBe('p1');
      expect(lb[0].rank).toBe(1);
    });

    it('includes playerId, name, and id fields', () => {
      roomManager.updateScore('p1', 100);

      const lb = roomManager.getLeaderboard(room.id);
      expect(lb[0]).toHaveProperty('playerId', 'p1');
      expect(lb[0]).toHaveProperty('name', 'Player1');
      expect(lb[0]).toHaveProperty('id', 'Player1');
    });

    it('handles single player', () => {
      // Create a room with only one non-quiz-master player
      const singleRoom = roomManager.createRoom('Host2', 'host_2');
      roomManager.joinRoom(singleRoom.id, 'Solo', { send: vi.fn(), readyState: 1 }, 'solo_1');
      roomManager.updateScore('solo_1', 50);

      const lb = roomManager.getLeaderboard(singleRoom.id);
      expect(lb).toHaveLength(1);
      expect(lb[0].rank).toBe(1);
      expect(lb[0].score).toBe(50);
    });

    it('handles players with equal scores', () => {
      roomManager.updateScore('p1', 100);
      roomManager.updateScore('p2', 100);

      const lb = roomManager.getLeaderboard(room.id);
      // All 3 players appear: p1 and p2 with score 100, p3 with score 0
      expect(lb).toHaveLength(3);
      expect(lb[0].rank).toBe(1);
      expect(lb[1].rank).toBe(2);
      expect(lb[2].rank).toBe(3);
      // First two have same score
      expect(lb[0].score).toBe(100);
      expect(lb[1].score).toBe(100);
      // Third player has initial score of 0
      expect(lb[2].score).toBe(0);
    });

    it('handles no scores (empty room)', () => {
      // Create a room with no non-quiz-master players
      const emptyRoom = roomManager.createRoom('Host3', 'host_3');
      const lb = roomManager.getLeaderboard(emptyRoom.id);
      expect(lb).toEqual([]);
    });
  });

  // ─── Broadcasting ─────────────────────────────────────────

  describe('broadcastToRoom', () => {
    it('should send to all players', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      roomManager.joinRoom(room.id, 'Alice', ws1, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', ws2, 'bob_123');

      const data = { type: 'test', message: 'hello' };
      const count = roomManager.broadcastToRoom(room.id, data);

      expect(count).toBe(2);
      const expected = JSON.stringify(data);
      expect(ws1.send).toHaveBeenCalledWith(expected);
      expect(ws2.send).toHaveBeenCalledWith(expected);
    });

    it('should skip excluded player', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      roomManager.joinRoom(room.id, 'Alice', ws1, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', ws2, 'bob_123');

      const data = { type: 'test', message: 'hello' };
      roomManager.broadcastToRoom(room.id, data, 'qm_alice');

      expect(ws1.send).not.toHaveBeenCalled();
      expect(ws2.send).toHaveBeenCalledWith(JSON.stringify(data));
    });

    it('should remove disconnected players (readyState != OPEN)', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const wsOpen = createMockWs();
      const wsClosed = createMockWs();
      wsClosed.readyState = 3; // WebSocket.CLOSED
      roomManager.joinRoom(room.id, 'Alice', wsOpen, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', wsClosed, 'bob_123');

      const data = { type: 'test', message: 'hello' };
      const count = roomManager.broadcastToRoom(room.id, data);

      expect(count).toBe(1);
      expect(wsOpen.send).toHaveBeenCalled();
      expect(wsClosed.send).not.toHaveBeenCalled();
      // Disconnected player should be removed
      expect(room.players.has('bob_123')).toBe(false);
    });

    it('should return 0 for non-existent room', () => {
      const count = roomManager.broadcastToRoom(9999, { type: 'test' });
      expect(count).toBe(0);
    });

    it('should not modify players map during iteration (deferred deletion)', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      const ws3 = createMockWs();
      ws2.readyState = 3; // CLOSED — will be marked for removal

      roomManager.joinRoom(room.id, 'Alice', ws1, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', ws2, 'bob_123');
      roomManager.joinRoom(room.id, 'Charlie', ws3, 'charlie_123');

      // Before broadcast, all 3 players are present
      expect(room.players.size).toBe(3);

      const data = { type: 'test', message: 'hello' };
      const count = roomManager.broadcastToRoom(room.id, data);

      // 2 players received the message (Alice and Charlie), Bob was closed
      expect(count).toBe(2);
      const expected = JSON.stringify(data);
      expect(ws1.send).toHaveBeenCalledWith(expected);
      expect(ws3.send).toHaveBeenCalledWith(expected);
      expect(ws2.send).not.toHaveBeenCalled();

      // After broadcast, remaining players map should have exactly 2 entries
      expect(room.players.size).toBe(2);
      expect(room.players.has('qm_alice')).toBe(true);
      expect(room.players.has('charlie_123')).toBe(true);
      expect(room.players.has('bob_123')).toBe(false);
    });

    it('should remove disconnected players after broadcast completes', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const wsOpen = createMockWs();
      const wsClosed1 = createMockWs();
      const wsClosed2 = createMockWs();
      wsClosed1.readyState = 3; // CLOSED
      wsClosed2.readyState = 0; // CONNECTING (not OPEN)

      roomManager.joinRoom(room.id, 'Alice', wsOpen, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', wsClosed1, 'bob_123');
      roomManager.joinRoom(room.id, 'Charlie', wsClosed2, 'charlie_123');

      expect(room.players.size).toBe(3);

      const data = { type: 'test', message: 'hello' };
      const count = roomManager.broadcastToRoom(room.id, data);

      expect(count).toBe(1);
      // Both disconnected players should be removed from room.players
      expect(room.players.has('bob_123')).toBe(false);
      expect(room.players.has('charlie_123')).toBe(false);
      // Also removed from the global players map
      expect(roomManager.players.has('bob_123')).toBe(false);
      expect(roomManager.players.has('charlie_123')).toBe(false);
      // Open player still present
      expect(room.players.has('qm_alice')).toBe(true);
      expect(roomManager.players.has('qm_alice')).toBe(true);
    });

    it('should handle all players disconnected gracefully', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const ws1 = createMockWs();
      const ws2 = createMockWs();
      ws1.readyState = 3; // CLOSED
      ws2.readyState = 3; // CLOSED

      roomManager.joinRoom(room.id, 'Alice', ws1, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', ws2, 'bob_123');

      const data = { type: 'test', message: 'hello' };
      const count = roomManager.broadcastToRoom(room.id, data);

      // No messages sent
      expect(count).toBe(0);
      expect(ws1.send).not.toHaveBeenCalled();
      expect(ws2.send).not.toHaveBeenCalled();

      // All players removed
      expect(room.players.size).toBe(0);
      expect(roomManager.players.has('qm_alice')).toBe(false);
      expect(roomManager.players.has('bob_123')).toBe(false);
    });

    it('should handle send errors and clean up failed players', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const wsGood = createMockWs();
      const wsBad = createMockWs();
      // wsBad has readyState = OPEN but send throws
      wsBad.send = vi.fn(() => {
        throw new Error('Connection reset');
      });

      roomManager.joinRoom(room.id, 'Alice', wsGood, 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', wsBad, 'bob_123');

      const data = { type: 'test', message: 'hello' };
      const count = roomManager.broadcastToRoom(room.id, data);

      // Only Alice's message succeeded
      expect(count).toBe(1);
      expect(wsGood.send).toHaveBeenCalledWith(JSON.stringify(data));
      expect(wsBad.send).toHaveBeenCalledWith(JSON.stringify(data));

      // Bob should be cleaned up after the broadcast due to the send error
      expect(room.players.has('bob_123')).toBe(false);
      expect(roomManager.players.has('bob_123')).toBe(false);
      // Alice should remain
      expect(room.players.has('qm_alice')).toBe(true);
      expect(roomManager.players.has('qm_alice')).toBe(true);
    });
  });

  // ─── Room Stats ───────────────────────────────────────────

  describe('getRoomStats', () => {
    it('should return null for non-existent room', () => {
      expect(roomManager.getRoomStats(9999)).toBeNull();
    });

    it('should return correct stats for existing room', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.joinRoom(room.id, 'Bob', createMockWs(), 'bob_123');

      const stats = roomManager.getRoomStats(room.id);
      expect(stats.id).toBe(room.id);
      expect(stats.quizMaster).toBe('Alice');
      expect(stats.playerCount).toBe(1);
      expect(stats.isActive).toBe(true);
    });
  });

  describe('getAllRoomsStats', () => {
    it('should return stats for all rooms', () => {
      roomManager.createRoom('Alice', 'qm_alice');
      roomManager.createRoom('Bob', 'qm_bob');

      const allStats = roomManager.getAllRoomsStats();
      expect(allStats).toHaveLength(2);
    });
  });

  describe('getStorageStats', () => {
    it('should return memory and persistent stats', () => {
      roomManager.createRoom('Alice', 'qm_alice');
      const stats = roomManager.getStorageStats();

      expect(stats.memory).toBeDefined();
      expect(stats.memory.totalRooms).toBe(1);
      expect(stats.persistent).toBeDefined();
      expect(dataStore.getStorageStats).toHaveBeenCalled();
    });
  });

  // ─── Question Management ──────────────────────────────────

  describe('setQuestions', () => {
    it('should store questions in room gameState', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const questions = [
        { type: 'ox', 題目: 'Q1', 倒數時間: 10, 正確答案: 'O', 分數: 50 },
        { type: 'abcd', 題目: 'Q2', 選項A: 'A', 選項B: 'B', 選項C: 'C', 選項D: 'D', 倒數時間: 20, 正確答案: 'B', 分數: 100 },
      ];

      const result = roomManager.setQuestions(room.id, questions);

      expect(result).toBe(true);
      expect(room.gameState.questions).toEqual(questions);
      expect(room.gameState.questions).toHaveLength(2);
    });

    it('should reset currentQuestionIndex to -1 when game has not started', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      expect(room.gameState.currentQuestionIndex).toBe(-1);

      roomManager.setQuestions(room.id, [{ type: 'ox', 題目: 'Q1', 倒數時間: 10, 正確答案: 'O', 分數: 50 }]);

      expect(room.gameState.currentQuestionIndex).toBe(-1);
    });

    it('should preserve currentQuestionIndex when game is in progress', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      room.gameState.currentQuestionIndex = 3;

      roomManager.setQuestions(room.id, [{ type: 'ox', 題目: 'Q1', 倒數時間: 10, 正確答案: 'O', 分數: 50 }]);

      expect(room.gameState.currentQuestionIndex).toBe(3);
    });

    it('should return false for non-existent room', () => {
      const result = roomManager.setQuestions(9999, []);
      expect(result).toBe(false);
    });
  });

  describe('getNextQuestion', () => {
    const sampleQuestions = [
      { type: 'ox', 題目: 'Q1', 倒數時間: 10, 正確答案: 'O', 分數: 50 },
      { type: 'ox', 題目: 'Q2', 倒數時間: 15, 正確答案: 'X', 分數: 100 },
      { type: 'abcd', 題目: 'Q3', 選項A: 'A', 選項B: 'B', 選項C: 'C', 選項D: 'D', 倒數時間: 20, 正確答案: 'C', 分數: 150 },
    ];

    it('should return the first question on first call', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.setQuestions(room.id, sampleQuestions);

      const question = roomManager.getNextQuestion(room.id);

      expect(question).toEqual(sampleQuestions[0]);
      expect(room.gameState.currentQuestionIndex).toBe(0);
    });

    it('should advance to next question on subsequent calls', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.setQuestions(room.id, sampleQuestions);

      roomManager.getNextQuestion(room.id); // index 0
      const q2 = roomManager.getNextQuestion(room.id); // index 1

      expect(q2).toEqual(sampleQuestions[1]);
      expect(room.gameState.currentQuestionIndex).toBe(1);
    });

    it('should return null when no more questions', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.setQuestions(room.id, [sampleQuestions[0]]);

      roomManager.getNextQuestion(room.id); // index 0
      const result = roomManager.getNextQuestion(room.id); // past end

      expect(result).toBeNull();
    });

    it('should update currentQuestion in gameState', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.setQuestions(room.id, sampleQuestions);

      roomManager.getNextQuestion(room.id);

      expect(room.gameState.currentQuestion).toEqual(sampleQuestions[0]);
    });

    it('should set questionStartTime', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.setQuestions(room.id, sampleQuestions);

      const before = Date.now();
      roomManager.getNextQuestion(room.id);
      const after = Date.now();

      expect(room.gameState.questionStartTime).toBeGreaterThanOrEqual(before);
      expect(room.gameState.questionStartTime).toBeLessThanOrEqual(after);
    });

    it('should return null for non-existent room', () => {
      const result = roomManager.getNextQuestion(9999);
      expect(result).toBeNull();
    });

    it('should return null when no questions loaded', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const result = roomManager.getNextQuestion(room.id);
      expect(result).toBeNull();
    });

    it('should iterate through all questions correctly', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.setQuestions(room.id, sampleQuestions);

      const q1 = roomManager.getNextQuestion(room.id);
      const q2 = roomManager.getNextQuestion(room.id);
      const q3 = roomManager.getNextQuestion(room.id);
      const q4 = roomManager.getNextQuestion(room.id);

      expect(q1.題目).toBe('Q1');
      expect(q2.題目).toBe('Q2');
      expect(q3.題目).toBe('Q3');
      expect(q4).toBeNull();
    });
  });

  describe('getCurrentQuestion', () => {
    it('should return null before any question is started', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      roomManager.setQuestions(room.id, [
        { type: 'ox', 題目: 'Q1', 倒數時間: 10, 正確答案: 'O', 分數: 50 },
      ]);

      const result = roomManager.getCurrentQuestion(room.id);
      expect(result).toBeNull();
    });

    it('should return current question after getNextQuestion', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const questions = [
        { type: 'ox', 題目: 'Q1', 倒數時間: 10, 正確答案: 'O', 分數: 50 },
        { type: 'ox', 題目: 'Q2', 倒數時間: 15, 正確答案: 'X', 分數: 100 },
      ];
      roomManager.setQuestions(room.id, questions);

      roomManager.getNextQuestion(room.id);
      const current = roomManager.getCurrentQuestion(room.id);

      expect(current).toEqual(questions[0]);
    });

    it('should return second question after two getNextQuestion calls', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const questions = [
        { type: 'ox', 題目: 'Q1', 倒數時間: 10, 正確答案: 'O', 分數: 50 },
        { type: 'ox', 題目: 'Q2', 倒數時間: 15, 正確答案: 'X', 分數: 100 },
      ];
      roomManager.setQuestions(room.id, questions);

      roomManager.getNextQuestion(room.id);
      roomManager.getNextQuestion(room.id);
      const current = roomManager.getCurrentQuestion(room.id);

      expect(current).toEqual(questions[1]);
    });

    it('should return null for non-existent room', () => {
      const result = roomManager.getCurrentQuestion(9999);
      expect(result).toBeNull();
    });

    it('should return null when no questions loaded', () => {
      const room = roomManager.createRoom('Alice', 'qm_alice');
      const result = roomManager.getCurrentQuestion(room.id);
      expect(result).toBeNull();
    });
  });

  // ─── Room Lifecycle (create → game → end → recreate) ────

  describe('room lifecycle', () => {
    it('leaveRoom of quiz master closes the room', () => {
      const ws = createMockWs();
      const room = roomManager.createRoom('Host', 'qm_host');
      roomManager.joinRoom(room.id, 'Host', ws, 'qm_host');
      roomManager.joinRoom(room.id, 'Player1', createMockWs(), 'p1');

      roomManager.leaveRoom('qm_host');

      // Room should be closed and deleted
      expect(roomManager.getRoom(room.id)).toBeUndefined();
    });

    it('leaveRoom of regular player does not close the room', () => {
      const ws = createMockWs();
      const room = roomManager.createRoom('Host', 'qm_host');
      roomManager.joinRoom(room.id, 'Host', ws, 'qm_host');
      roomManager.joinRoom(room.id, 'Player1', createMockWs(), 'p1');

      roomManager.leaveRoom('p1');

      expect(roomManager.getRoom(room.id)).toBeDefined();
      expect(roomManager.getRoom(room.id).players.size).toBe(1);
    });

    it('closeRoom removes room from memory', () => {
      const room = roomManager.createRoom('Host', 'qm_host');
      roomManager.joinRoom(room.id, 'Host', createMockWs(), 'qm_host');

      roomManager.closeRoom(room.id);

      expect(roomManager.getRoom(room.id)).toBeUndefined();
      expect(roomManager.rooms.has(room.id)).toBe(false);
    });

    it('closeRoom sends roomClosed to connected players', () => {
      const ws = createMockWs();
      const room = roomManager.createRoom('Host', 'qm_host');
      roomManager.joinRoom(room.id, 'Host', ws, 'qm_host');

      roomManager.closeRoom(room.id);

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'roomClosed', message: '房間已關閉' })
      );
    });

    it('game state can be reset after endGame for room reuse', () => {
      const room = roomManager.createRoom('Host', 'qm_host');
      roomManager.joinRoom(room.id, 'Host', createMockWs(), 'qm_host');

      const questions = [
        { 題目: 'Q1', 正確答案: 'O', 倒數時間: 10, 分數: 50, type: 'ox' },
        { 題目: 'Q2', 正確答案: 'X', 倒數時間: 10, 分數: 50, type: 'ox' },
      ];
      roomManager.setQuestions(room.id, questions);

      // Play through all questions
      roomManager.getNextQuestion(room.id); // Q1, index 0
      roomManager.getNextQuestion(room.id); // Q2, index 1
      expect(roomManager.getNextQuestion(room.id)).toBeNull(); // no more

      // Reset game state (simulating handleEndGame)
      room.gameState.currentQuestion = null;
      room.gameState.currentQuestionIndex = -1;
      room.gameState.questionStartTime = null;

      // Can reload and play again
      roomManager.setQuestions(room.id, questions);
      const firstQ = roomManager.getNextQuestion(room.id);
      expect(firstQ).toEqual(questions[0]);
    });

    it('creating a second room increments roomId', () => {
      const room1 = roomManager.createRoom('Host1', 'qm_1');
      const room2 = roomManager.createRoom('Host2', 'qm_2');

      expect(room2.id).toBeGreaterThan(room1.id);
    });

    it('players can join after game state is reset', () => {
      const room = roomManager.createRoom('Host', 'qm_host');
      roomManager.joinRoom(room.id, 'Host', createMockWs(), 'qm_host');

      // Simulate end game + reset
      room.gameState.currentQuestion = null;
      room.gameState.currentQuestionIndex = -1;

      // New player can still join
      const player = roomManager.joinRoom(room.id, 'NewPlayer', createMockWs(), 'new_p1');
      expect(player.name).toBe('NewPlayer');
      expect(room.players.size).toBe(2);
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock data-store before importing anything that depends on it
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
      exportAllData: vi.fn(() => ({
        rooms: {},
        scores: {},
        players: {},
        exportTime: Date.now(),
      })),
      importAllData: vi.fn(() => true),
      cleanupOldData: vi.fn(() => 0),
    },
  };
});

// Must import after mocks are set up
import { app } from './api.js';
import roomManager from './room-manager.js';

describe('API Endpoints', () => {
  beforeEach(() => {
    // Reset room manager state between tests
    roomManager.rooms = new Map();
    roomManager.players = new Map();
    roomManager.roomIdCounter = 1000;

    vi.clearAllMocks();
  });

  // ─── Health & Info ────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200 with status, timestamp, and uptime', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.uptime).toBeTypeOf('number');
    });
  });

  describe('GET /api/info', () => {
    it('should return 200 with name and version', async () => {
      const res = await request(app).get('/api/info');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Wedding Jump API');
      expect(res.body.version).toBe('2.0.0');
      expect(res.body.endpoints).toBeDefined();
    });
  });

  // ─── 404 Handling ─────────────────────────────────────────

  describe('GET /nonexistent', () => {
    it('should return 404', async () => {
      const res = await request(app).get('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Endpoint not found');
    });
  });

  // ─── Room Management ─────────────────────────────────────

  describe('POST /api/rooms', () => {
    it('should create a room with quizMaster', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({ quizMaster: 'Alice' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.room).toBeDefined();
      expect(res.body.room.id).toBeGreaterThanOrEqual(1000);
      expect(res.body.room.quizMaster).toBe('Alice');
      expect(res.body.room.quizMasterPlayerId).toBeDefined();
    });

    it('should return 400 without quizMaster', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Quiz Master name is required');
    });

    it('should return 400 with empty quizMaster string', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({ quizMaster: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/rooms', () => {
    it('should return 200 with rooms array', async () => {
      const res = await request(app).get('/api/rooms');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rooms).toBeInstanceOf(Array);
      expect(res.body.count).toBeTypeOf('number');
    });
  });

  describe('GET /api/rooms/:id', () => {
    it('should return 404 for non-existent room', async () => {
      const res = await request(app).get('/api/rooms/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Room not found');
    });

    it('should return 400 for invalid room ID', async () => {
      const res = await request(app).get('/api/rooms/abc');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid room ID');
    });

    it('should return room info after creation', async () => {
      // Create room first
      const createRes = await request(app)
        .post('/api/rooms')
        .send({ quizMaster: 'Alice' });

      const roomId = createRes.body.room.id;

      const res = await request(app).get(`/api/rooms/${roomId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.room).toBeDefined();
      expect(res.body.room.id).toBe(roomId);
      expect(res.body.room.quizMaster).toBe('Alice');
    });
  });

  describe('GET /api/rooms/:roomId/leaderboard', () => {
    it('should return 200 with leaderboard for existing room', async () => {
      const createRes = await request(app)
        .post('/api/rooms')
        .send({ quizMaster: 'Alice' });

      const roomId = createRes.body.room.id;

      const res = await request(app).get(`/api/rooms/${roomId}/leaderboard`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roomId).toBe(roomId);
      expect(res.body.leaderboard).toBeInstanceOf(Array);
    });

    it('should return 200 with empty leaderboard for non-existent room', async () => {
      const res = await request(app).get('/api/rooms/9999/leaderboard');

      // getLeaderboard returns [] for non-existent room, not an error
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.leaderboard).toEqual([]);
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    it('should return 404 for non-existent room', async () => {
      const res = await request(app).delete('/api/rooms/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Room not found');
    });

    it('should close an existing room', async () => {
      const createRes = await request(app)
        .post('/api/rooms')
        .send({ quizMaster: 'Alice' });

      const roomId = createRes.body.room.id;

      const res = await request(app).delete(`/api/rooms/${roomId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain(`Room ${roomId} closed`);
    });

    it('should return 403 when wrong quizMaster tries to close', async () => {
      const createRes = await request(app)
        .post('/api/rooms')
        .send({ quizMaster: 'Alice' });

      const roomId = createRes.body.room.id;

      const res = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .send({ quizMaster: 'Bob' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only the Quiz Master');
    });
  });

  // ─── Storage Endpoints ───────────────────────────────────

  describe('GET /api/storage/stats', () => {
    it('should return storage statistics', async () => {
      const res = await request(app).get('/api/storage/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
    });
  });

  describe('GET /api/storage/export', () => {
    it('should return exported data', async () => {
      const res = await request(app).get('/api/storage/export');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.rooms).toBeDefined();
      expect(res.body.data.scores).toBeDefined();
      expect(res.body.data.players).toBeDefined();
    });
  });

  describe('POST /api/storage/import', () => {
    it('should import data successfully', async () => {
      const res = await request(app)
        .post('/api/storage/import')
        .send({ data: { rooms: {}, scores: {}, players: {} } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when no data provided', async () => {
      const res = await request(app)
        .post('/api/storage/import')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No data provided');
    });
  });

  describe('DELETE /api/storage/cleanup', () => {
    it('should cleanup old data', async () => {
      const res = await request(app).delete('/api/storage/cleanup');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cleanedCount).toBeTypeOf('number');
    });
  });

  // ─── Questions ────────────────────────────────────────────

  describe('GET /questions', () => {
    it('should return 200 or 500 depending on CSV availability', async () => {
      const res = await request(app).get('/questions');

      // The CSV file may or may not exist in the test environment.
      // If it exists: 200 with questions array.
      // If not: 500 with error message.
      expect([200, 500]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
      } else {
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Failed to load questions');
      }
    });
  });
});

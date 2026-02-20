import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// We import the default export (singleton)
import dataStore from './data-store.js';

describe('DataStore', () => {
  let originalDataDir, originalRoomsFile, originalScoresFile, originalPlayersFile;
  let tempDir;

  beforeEach(() => {
    // Save originals
    originalDataDir = dataStore.dataDir;
    originalRoomsFile = dataStore.roomsFile;
    originalScoresFile = dataStore.scoresFile;
    originalPlayersFile = dataStore.playersFile;

    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'datastore-test-'));

    // Point to temp dir
    dataStore.dataDir = tempDir;
    dataStore.roomsFile = path.join(tempDir, 'rooms.json');
    dataStore.scoresFile = path.join(tempDir, 'scores.json');
    dataStore.playersFile = path.join(tempDir, 'players.json');

    // Initialize temp files
    dataStore.initializeFiles();
  });

  afterEach(() => {
    // Restore originals
    dataStore.dataDir = originalDataDir;
    dataStore.roomsFile = originalRoomsFile;
    dataStore.scoresFile = originalScoresFile;
    dataStore.playersFile = originalPlayersFile;

    // Cleanup temp dir
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('saveRoom + loadRoom', () => {
    it('should roundtrip room data correctly', () => {
      const roomData = {
        id: 1001,
        quizMaster: 'Alice',
        quizMasterPlayerId: 'qm_alice_123',
        gameState: { currentQuestion: null, questionStartTime: null, isActive: true },
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      dataStore.saveRoom(1001, roomData);
      const loaded = dataStore.loadRoom(1001);

      expect(loaded).not.toBeNull();
      expect(loaded.id).toBe(1001);
      expect(loaded.quizMaster).toBe('Alice');
      expect(loaded.quizMasterPlayerId).toBe('qm_alice_123');
      expect(loaded.gameState.isActive).toBe(true);
      // saveRoom adds lastSaved
      expect(loaded.lastSaved).toBeTypeOf('number');
    });
  });

  describe('loadRoom', () => {
    it('should return null for a non-existent room', () => {
      const loaded = dataStore.loadRoom(9999);
      expect(loaded).toBeNull();
    });
  });

  describe('deleteRoom', () => {
    it('should remove an existing room', () => {
      dataStore.saveRoom(1001, { id: 1001, quizMaster: 'Alice' });
      expect(dataStore.loadRoom(1001)).not.toBeNull();

      const result = dataStore.deleteRoom(1001);
      expect(result).toBe(true);
      expect(dataStore.loadRoom(1001)).toBeNull();
    });

    it('should return true for a non-existent room', () => {
      const result = dataStore.deleteRoom(9999);
      expect(result).toBe(true);
    });
  });

  describe('getAllRooms', () => {
    it('should return all saved rooms', () => {
      dataStore.saveRoom(1001, { id: 1001, quizMaster: 'Alice' });
      dataStore.saveRoom(1002, { id: 1002, quizMaster: 'Bob' });

      const rooms = dataStore.getAllRooms();
      expect(Object.keys(rooms)).toHaveLength(2);
      expect(rooms['1001'].quizMaster).toBe('Alice');
      expect(rooms['1002'].quizMaster).toBe('Bob');
    });
  });

  describe('saveRoomScores + loadRoomScores', () => {
    it('should roundtrip scores data correctly', () => {
      const scores = { player1: 100, player2: 200 };
      dataStore.saveRoomScores(1001, scores);

      const loaded = dataStore.loadRoomScores(1001);
      expect(loaded).toEqual({ player1: 100, player2: 200 });
    });
  });

  describe('loadRoomScores', () => {
    it('should return empty object for non-existent room', () => {
      const loaded = dataStore.loadRoomScores(9999);
      expect(loaded).toEqual({});
    });
  });

  describe('deleteRoomScores', () => {
    it('should remove scores for an existing room', () => {
      dataStore.saveRoomScores(1001, { player1: 50 });
      expect(dataStore.loadRoomScores(1001)).toEqual({ player1: 50 });

      const result = dataStore.deleteRoomScores(1001);
      expect(result).toBe(true);
      expect(dataStore.loadRoomScores(1001)).toEqual({});
    });
  });

  describe('saveRoomPlayers + loadRoomPlayers', () => {
    it('should roundtrip players Map correctly', () => {
      const players = new Map();
      const now = Date.now();
      players.set('player1', {
        id: 'player1',
        name: 'Alice',
        x: 10,
        y: 20,
        joinTime: now,
        lastActive: now,
        isQuizMaster: false,
      });
      players.set('player2', {
        id: 'player2',
        name: 'Bob',
        x: 30,
        y: 40,
        joinTime: now,
        lastActive: now,
        isQuizMaster: false,
      });

      dataStore.saveRoomPlayers(1001, players);
      const loaded = dataStore.loadRoomPlayers(1001);

      expect(loaded).toBeInstanceOf(Map);
      expect(loaded.size).toBe(2);
      expect(loaded.get('player1').name).toBe('Alice');
      expect(loaded.get('player1').x).toBe(10);
      expect(loaded.get('player2').name).toBe('Bob');
      expect(loaded.get('player2').y).toBe(40);
    });
  });

  describe('loadRoomPlayers', () => {
    it('should return empty Map for non-existent room', () => {
      const loaded = dataStore.loadRoomPlayers(9999);
      expect(loaded).toBeInstanceOf(Map);
      expect(loaded.size).toBe(0);
    });
  });

  describe('deleteRoomPlayers', () => {
    it('should remove players for an existing room', () => {
      const players = new Map();
      players.set('player1', { id: 'player1', name: 'Alice', x: 0, y: 0, joinTime: Date.now(), lastActive: Date.now(), isQuizMaster: false });
      dataStore.saveRoomPlayers(1001, players);

      expect(dataStore.loadRoomPlayers(1001).size).toBe(1);

      const result = dataStore.deleteRoomPlayers(1001);
      expect(result).toBe(true);
      expect(dataStore.loadRoomPlayers(1001).size).toBe(0);
    });
  });

  describe('cleanupOldData', () => {
    it('should remove rooms older than maxAge', () => {
      const oldTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      // Manually write room with old lastSaved
      const rooms = { 1001: { id: 1001, quizMaster: 'Alice', lastSaved: oldTime } };
      dataStore.writeJsonFile(dataStore.roomsFile, rooms);

      // Also save associated scores and players
      dataStore.saveRoomScores(1001, { player1: 100 });
      const players = new Map();
      players.set('player1', { id: 'player1', name: 'Alice', x: 0, y: 0, joinTime: oldTime, lastActive: oldTime, isQuizMaster: false });
      dataStore.saveRoomPlayers(1001, players);

      const cleaned = dataStore.cleanupOldData(60 * 60 * 1000); // 1 hour maxAge
      expect(cleaned).toBe(1);
      expect(dataStore.loadRoom(1001)).toBeNull();
      expect(dataStore.loadRoomScores(1001)).toEqual({});
      expect(dataStore.loadRoomPlayers(1001).size).toBe(0);
    });

    it('should keep recent rooms', () => {
      const recentRoom = { id: 1001, quizMaster: 'Alice', lastSaved: Date.now() };
      dataStore.writeJsonFile(dataStore.roomsFile, { 1001: recentRoom });

      const cleaned = dataStore.cleanupOldData(60 * 60 * 1000);
      expect(cleaned).toBe(0);
      expect(dataStore.loadRoom(1001)).not.toBeNull();
    });
  });

  describe('getStorageStats', () => {
    it('should return correct counts', () => {
      dataStore.saveRoom(1001, { id: 1001, quizMaster: 'Alice' });
      dataStore.saveRoom(1002, { id: 1002, quizMaster: 'Bob' });
      dataStore.saveRoomScores(1001, { player1: 50 });
      const players = new Map();
      players.set('player1', { id: 'player1', name: 'Alice', x: 0, y: 0, joinTime: Date.now(), lastActive: Date.now(), isQuizMaster: false });
      dataStore.saveRoomPlayers(1001, players);

      const stats = dataStore.getStorageStats();
      expect(stats.totalRooms).toBe(2);
      expect(stats.totalScoreRecords).toBe(1);
      expect(stats.totalPlayerRecords).toBe(1);
      expect(stats.dataDirectory).toBe(tempDir);
    });
  });

  describe('exportAllData + importAllData', () => {
    it('should roundtrip all data via export and import', () => {
      dataStore.saveRoom(1001, { id: 1001, quizMaster: 'Alice' });
      dataStore.saveRoomScores(1001, { player1: 100 });
      const players = new Map();
      players.set('player1', { id: 'player1', name: 'Alice', x: 5, y: 10, joinTime: Date.now(), lastActive: Date.now(), isQuizMaster: false });
      dataStore.saveRoomPlayers(1001, players);

      const exported = dataStore.exportAllData();
      expect(exported.rooms).toBeDefined();
      expect(exported.scores).toBeDefined();
      expect(exported.players).toBeDefined();
      expect(exported.exportTime).toBeTypeOf('number');

      // Clear all data
      dataStore.writeJsonFile(dataStore.roomsFile, {});
      dataStore.writeJsonFile(dataStore.scoresFile, {});
      dataStore.writeJsonFile(dataStore.playersFile, {});

      // Verify cleared
      expect(Object.keys(dataStore.getAllRooms())).toHaveLength(0);

      // Import
      const success = dataStore.importAllData(exported);
      expect(success).toBe(true);

      // Verify restored
      const room = dataStore.loadRoom(1001);
      expect(room).not.toBeNull();
      expect(room.quizMaster).toBe('Alice');
      expect(dataStore.loadRoomScores(1001)).toEqual({ player1: 100 });

      const loadedPlayers = dataStore.loadRoomPlayers(1001);
      expect(loadedPlayers.size).toBe(1);
      expect(loadedPlayers.get('player1').name).toBe('Alice');
    });
  });
});

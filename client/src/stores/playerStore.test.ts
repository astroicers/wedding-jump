import { usePlayerStore } from './playerStore';
import type { Player, LeaderboardEntry } from '../types';

const initialState = {
  currentPlayer: null,
  players: new Map<string, Player>(),
  leaderboard: [] as LeaderboardEntry[],
};

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'id-1',
    playerId: 'player-1',
    name: 'Alice',
    x: 0,
    y: 0,
    score: 0,
    isQuizMaster: false,
    ...overrides,
  };
}

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentPlayer: null,
      players: new Map(),
      leaderboard: [],
    });
  });

  describe('initial state', () => {
    it('has null currentPlayer', () => {
      const { currentPlayer } = usePlayerStore.getState();
      expect(currentPlayer).toBeNull();
    });

    it('has empty players Map', () => {
      const { players } = usePlayerStore.getState();
      expect(players).toBeInstanceOf(Map);
      expect(players.size).toBe(0);
    });

    it('has empty leaderboard', () => {
      const { leaderboard } = usePlayerStore.getState();
      expect(leaderboard).toEqual([]);
    });
  });

  describe('setCurrentPlayer', () => {
    it('sets the current player correctly', () => {
      const player = createMockPlayer();
      usePlayerStore.getState().setCurrentPlayer(player);

      const { currentPlayer } = usePlayerStore.getState();
      expect(currentPlayer).toEqual(player);
    });

    it('clears the current player when passed null', () => {
      const player = createMockPlayer();
      usePlayerStore.getState().setCurrentPlayer(player);
      usePlayerStore.getState().setCurrentPlayer(null);

      const { currentPlayer } = usePlayerStore.getState();
      expect(currentPlayer).toBeNull();
    });
  });

  describe('updateCurrentPlayerPosition', () => {
    it('updates x and y on the current player', () => {
      const player = createMockPlayer({ x: 0, y: 0 });
      usePlayerStore.getState().setCurrentPlayer(player);
      usePlayerStore.getState().updateCurrentPlayerPosition(5, 10);

      const { currentPlayer } = usePlayerStore.getState();
      expect(currentPlayer!.x).toBe(5);
      expect(currentPlayer!.y).toBe(10);
    });

    it('does nothing when there is no current player', () => {
      usePlayerStore.getState().updateCurrentPlayerPosition(5, 10);

      const { currentPlayer } = usePlayerStore.getState();
      expect(currentPlayer).toBeNull();
    });
  });

  describe('updateCurrentPlayerScore', () => {
    it('updates score on the current player', () => {
      const player = createMockPlayer({ score: 0 });
      usePlayerStore.getState().setCurrentPlayer(player);
      usePlayerStore.getState().updateCurrentPlayerScore(150);

      const { currentPlayer } = usePlayerStore.getState();
      expect(currentPlayer!.score).toBe(150);
    });
  });

  describe('addPlayer', () => {
    it('adds a player to the players Map', () => {
      const player = createMockPlayer();
      usePlayerStore.getState().addPlayer(player);

      const { players } = usePlayerStore.getState();
      expect(players.size).toBe(1);
      expect(players.get('player-1')).toEqual(player);
    });

    it('adds multiple players with correct count', () => {
      const player1 = createMockPlayer({ playerId: 'player-1', name: 'Alice' });
      const player2 = createMockPlayer({ playerId: 'player-2', name: 'Bob' });
      const player3 = createMockPlayer({ playerId: 'player-3', name: 'Charlie' });

      usePlayerStore.getState().addPlayer(player1);
      usePlayerStore.getState().addPlayer(player2);
      usePlayerStore.getState().addPlayer(player3);

      const { players } = usePlayerStore.getState();
      expect(players.size).toBe(3);
    });
  });

  describe('updatePlayer', () => {
    it('updates partial fields on an existing player', () => {
      const player = createMockPlayer({ playerId: 'player-1', name: 'Alice', score: 0 });
      usePlayerStore.getState().addPlayer(player);
      usePlayerStore.getState().updatePlayer('player-1', { score: 200, name: 'Alice Updated' });

      const updated = usePlayerStore.getState().players.get('player-1');
      expect(updated!.score).toBe(200);
      expect(updated!.name).toBe('Alice Updated');
      expect(updated!.playerId).toBe('player-1');
    });

    it('does nothing when updating a non-existent player', () => {
      usePlayerStore.getState().updatePlayer('non-existent', { score: 999 });

      const { players } = usePlayerStore.getState();
      expect(players.size).toBe(0);
    });
  });

  describe('removePlayer', () => {
    it('removes a player from the Map', () => {
      const player = createMockPlayer({ playerId: 'player-1' });
      usePlayerStore.getState().addPlayer(player);
      expect(usePlayerStore.getState().players.size).toBe(1);

      usePlayerStore.getState().removePlayer('player-1');
      expect(usePlayerStore.getState().players.size).toBe(0);
    });

    it('does nothing when removing a non-existent player', () => {
      const player = createMockPlayer({ playerId: 'player-1' });
      usePlayerStore.getState().addPlayer(player);

      usePlayerStore.getState().removePlayer('non-existent');
      expect(usePlayerStore.getState().players.size).toBe(1);
    });
  });

  describe('clearPlayers', () => {
    it('empties the players Map', () => {
      usePlayerStore.getState().addPlayer(createMockPlayer({ playerId: 'p1' }));
      usePlayerStore.getState().addPlayer(createMockPlayer({ playerId: 'p2' }));
      expect(usePlayerStore.getState().players.size).toBe(2);

      usePlayerStore.getState().clearPlayers();
      expect(usePlayerStore.getState().players.size).toBe(0);
    });
  });

  describe('setLeaderboard', () => {
    it('sets the leaderboard array', () => {
      const entries: LeaderboardEntry[] = [
        { playerId: 'p1', name: 'Alice', score: 300, rank: 1 },
        { playerId: 'p2', name: 'Bob', score: 200, rank: 2 },
      ];

      usePlayerStore.getState().setLeaderboard(entries);
      expect(usePlayerStore.getState().leaderboard).toEqual(entries);
    });
  });

  describe('getPlayerCount', () => {
    it('returns the correct count', () => {
      expect(usePlayerStore.getState().getPlayerCount()).toBe(0);

      usePlayerStore.getState().addPlayer(createMockPlayer({ playerId: 'p1' }));
      usePlayerStore.getState().addPlayer(createMockPlayer({ playerId: 'p2' }));

      expect(usePlayerStore.getState().getPlayerCount()).toBe(2);
    });
  });

  describe('getPlayer', () => {
    it('returns the correct player by playerId', () => {
      const player = createMockPlayer({ playerId: 'p1', name: 'Alice' });
      usePlayerStore.getState().addPlayer(player);

      const result = usePlayerStore.getState().getPlayer('p1');
      expect(result).toEqual(player);
    });

    it('returns undefined for a non-existent playerId', () => {
      const result = usePlayerStore.getState().getPlayer('non-existent');
      expect(result).toBeUndefined();
    });
  });
});

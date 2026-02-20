import { useRoomStore } from './roomStore';

const initialState = {
  roomId: null as number | null,
  roomCode: null as string | null,
  quizMaster: null as string | null,
  isQuizMaster: false,
  isConnected: false,
  isJoined: false,
};

describe('roomStore', () => {
  beforeEach(() => {
    useRoomStore.setState({
      roomId: null,
      roomCode: null,
      quizMaster: null,
      isQuizMaster: false,
      isConnected: false,
      isJoined: false,
    });
  });

  describe('initial state', () => {
    it('has all values as null or false', () => {
      const state = useRoomStore.getState();
      expect(state.roomId).toBeNull();
      expect(state.roomCode).toBeNull();
      expect(state.quizMaster).toBeNull();
      expect(state.isQuizMaster).toBe(false);
      expect(state.isConnected).toBe(false);
      expect(state.isJoined).toBe(false);
    });
  });

  describe('setRoom', () => {
    it('sets roomId, roomCode as String, and quizMaster', () => {
      useRoomStore.getState().setRoom(42, 'host-player');

      const state = useRoomStore.getState();
      expect(state.roomId).toBe(42);
      expect(state.roomCode).toBe('42');
      expect(state.quizMaster).toBe('host-player');
      expect(state.isQuizMaster).toBe(false);
    });

    it('sets isQuizMaster to true when specified', () => {
      useRoomStore.getState().setRoom(42, 'host-player', true);

      const state = useRoomStore.getState();
      expect(state.roomId).toBe(42);
      expect(state.roomCode).toBe('42');
      expect(state.quizMaster).toBe('host-player');
      expect(state.isQuizMaster).toBe(true);
    });
  });

  describe('setConnected', () => {
    it('toggles isConnected to true', () => {
      useRoomStore.getState().setConnected(true);
      expect(useRoomStore.getState().isConnected).toBe(true);
    });

    it('toggles isConnected to false', () => {
      useRoomStore.getState().setConnected(true);
      useRoomStore.getState().setConnected(false);
      expect(useRoomStore.getState().isConnected).toBe(false);
    });
  });

  describe('setJoined', () => {
    it('toggles isJoined', () => {
      useRoomStore.getState().setJoined(true);
      expect(useRoomStore.getState().isJoined).toBe(true);

      useRoomStore.getState().setJoined(false);
      expect(useRoomStore.getState().isJoined).toBe(false);
    });
  });

  describe('clearRoom', () => {
    it('resets room fields and isJoined but NOT isConnected', () => {
      useRoomStore.getState().setRoom(42, 'host-player', true);
      useRoomStore.getState().setJoined(true);
      useRoomStore.getState().setConnected(true);

      useRoomStore.getState().clearRoom();

      const state = useRoomStore.getState();
      expect(state.roomId).toBeNull();
      expect(state.roomCode).toBeNull();
      expect(state.quizMaster).toBeNull();
      expect(state.isQuizMaster).toBe(false);
      expect(state.isJoined).toBe(false);
      // isConnected is NOT touched by clearRoom
      expect(state.isConnected).toBe(true);
    });

    it('preserves isConnected=false after clearRoom', () => {
      useRoomStore.getState().setRoom(10, 'master');
      useRoomStore.getState().setConnected(false);

      useRoomStore.getState().clearRoom();

      expect(useRoomStore.getState().isConnected).toBe(false);
    });
  });
});

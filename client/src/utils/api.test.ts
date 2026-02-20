import {
  getQuestions,
  createRoom,
  getRoom,
  getAllRooms,
  closeRoom,
  getLeaderboard,
  healthCheck,
} from './api';

const API_URL = 'http://localhost:3002';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockOkResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  };
}

function mockErrorResponse(status: number, statusText: string) {
  return {
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({}),
  };
}

describe('getQuestions', () => {
  it('calls fetch with the correct URL (/questions)', async () => {
    const data = { questions: [] };
    fetchMock.mockResolvedValue(mockOkResponse(data));

    await getQuestions();

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/questions`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('returns the parsed JSON response', async () => {
    const data = { questions: [{ id: 1, text: 'Test?' }] };
    fetchMock.mockResolvedValue(mockOkResponse(data));

    const result = await getQuestions();

    expect(result).toEqual(data);
  });
});

describe('createRoom', () => {
  it('sends POST with quizMaster in the body', async () => {
    const data = { success: true, room: { id: 1, quizMaster: 'host' } };
    fetchMock.mockResolvedValue(mockOkResponse(data));

    await createRoom('host');

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/rooms`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ quizMaster: 'host' }),
      })
    );
  });

  it('calls the correct URL (/api/rooms)', async () => {
    fetchMock.mockResolvedValue(mockOkResponse({ success: true }));

    await createRoom('host');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/rooms`);
  });
});

describe('getRoom', () => {
  it('calls the correct URL with roomId', async () => {
    fetchMock.mockResolvedValue(mockOkResponse({ success: true }));

    await getRoom(42);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/rooms/42`);
  });
});

describe('getAllRooms', () => {
  it('calls GET /api/rooms', async () => {
    fetchMock.mockResolvedValue(mockOkResponse({ success: true, rooms: [], count: 0 }));

    await getAllRooms();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/rooms`);
  });
});

describe('closeRoom', () => {
  it('sends DELETE with quizMaster in the body', async () => {
    fetchMock.mockResolvedValue(mockOkResponse({ success: true, message: 'closed' }));

    await closeRoom(7, 'host');

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/rooms/7`,
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ quizMaster: 'host' }),
      })
    );
  });
});

describe('getLeaderboard', () => {
  it('calls the correct URL with roomId', async () => {
    fetchMock.mockResolvedValue(mockOkResponse({ success: true, leaderboard: [] }));

    await getLeaderboard(5);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/rooms/5/leaderboard`);
  });
});

describe('healthCheck', () => {
  it('calls GET /health', async () => {
    fetchMock.mockResolvedValue(mockOkResponse({ status: 'ok' }));

    await healthCheck();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/health`);
  });
});

describe('error handling', () => {
  it('throws an error on 404 response', async () => {
    fetchMock.mockResolvedValue(mockErrorResponse(404, 'Not Found'));

    await expect(getQuestions()).rejects.toThrow('API Error: 404 Not Found');
  });

  it('throws an error on 500 response', async () => {
    fetchMock.mockResolvedValue(mockErrorResponse(500, 'Internal Server Error'));

    await expect(healthCheck()).rejects.toThrow('API Error: 500 Internal Server Error');
  });
});

describe('request headers', () => {
  it('includes Content-Type: application/json header', async () => {
    fetchMock.mockResolvedValue(mockOkResponse({}));

    await getQuestions();

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });
});

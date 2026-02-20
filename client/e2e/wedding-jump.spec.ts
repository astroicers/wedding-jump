import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

test.describe('Home Page', () => {
  test('should display the home page with title and buttons', async ({ page }) => {
    await page.goto(BASE_URL);

    // Title
    await expect(page.getByText('Wedding Jump')).toBeVisible();
    await expect(page.getByText('即時多人婚禮問答遊戲')).toBeVisible();

    // Buttons
    await expect(page.getByRole('button', { name: /join game/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /host a game/i })).toBeVisible();
  });

  test('JOIN GAME button navigates to /join', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /join game/i }).click();
    await expect(page).toHaveURL(/\/join/);
    await expect(page.getByText('Welcome to the Celebration!')).toBeVisible();
  });

  test('Host a Game button navigates to /host', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /host a game/i }).click();
    await expect(page).toHaveURL(/\/host/);
    await expect(page.getByText('Create a Game Room')).toBeVisible();
  });
});

test.describe('Host Dashboard - Create Room', () => {
  test('should show Host Dashboard with connected status', async ({ page }) => {
    await page.goto(`${BASE_URL}/host`);

    // Wait for WebSocket connection
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Page elements
    await expect(page.getByText('Host Dashboard')).toBeVisible();
    await expect(page.getByText('Create a Game Room')).toBeVisible();
    await expect(page.getByText('Host Name')).toBeVisible();
  });

  test('should have default host name "QuizMaster"', async ({ page }) => {
    await page.goto(`${BASE_URL}/host`);
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    const hostNameInput = page.getByPlaceholder('Enter your name');
    await expect(hostNameInput).toHaveValue('QuizMaster');
  });

  test('Create Room button should be disabled when host name is empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/host`);
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    const hostNameInput = page.getByPlaceholder('Enter your name');
    await hostNameInput.clear();

    const createButton = page.getByRole('button', { name: /create room/i });
    await expect(createButton).toBeDisabled();
  });

  test('should create room successfully and show room code', async ({ page }) => {
    await page.goto(`${BASE_URL}/host`);
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Click Create Room
    const createButton = page.getByRole('button', { name: /create room/i });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // Should show room code section
    await expect(page.getByText('Room Code')).toBeVisible({ timeout: 10000 });

    // Should show Players Joined section
    await expect(page.getByText('Players Joined')).toBeVisible();
    await expect(page.getByText('Waiting for players to join...')).toBeVisible();

    // Should show Questions Ready
    await expect(page.getByText('Questions Ready')).toBeVisible();

    // Start Game button should exist but be disabled (no players)
    const startButton = page.getByRole('button', { name: /start game/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();
  });

  test('should allow custom host name', async ({ page }) => {
    await page.goto(`${BASE_URL}/host`);
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Change host name
    const hostNameInput = page.getByPlaceholder('Enter your name');
    await hostNameInput.clear();
    await hostNameInput.fill('TestHost');

    // Create room
    await page.getByRole('button', { name: /create room/i }).click();

    // Should succeed and show room code
    await expect(page.getByText('Room Code')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Player Join Page', () => {
  test('should display join form with all fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    await expect(page.getByText('Welcome to the Celebration!')).toBeVisible();
    await expect(page.getByText('Room Code')).toBeVisible();
    await expect(page.getByText('Your Nickname')).toBeVisible();
    await expect(page.getByPlaceholder('Enter room code...')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your nickname...')).toBeVisible();
    await expect(page.getByRole('button', { name: /get ready/i })).toBeVisible();
  });

  test('should show connection status', async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    // Should eventually show connected
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });
  });

  test('should show error when joining with empty nickname', async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Enter room code but no nickname
    await page.getByPlaceholder('Enter room code...').fill('12345');

    // Click GET READY
    await page.getByRole('button', { name: /get ready/i }).click();

    // Should show error
    await expect(page.getByText('請輸入暱稱')).toBeVisible();
  });

  test('should show error when joining with empty room code', async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);
    await expect(page.getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Enter nickname but no room code
    await page.getByPlaceholder('Enter your nickname...').fill('TestPlayer');

    // Click GET READY
    await page.getByRole('button', { name: /get ready/i }).click();

    // Should show error
    await expect(page.getByText('請輸入房間代碼')).toBeVisible();
  });

  test('back button should navigate to home', async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    // Click back button (arrow_back_ios_new icon)
    await page.locator('button:has(span.material-symbols-outlined)').first().click();

    await expect(page).toHaveURL(BASE_URL + '/');
  });
});

test.describe('Full Flow: Host creates room, Player joins', () => {
  test('host creates room and player joins with room code', async ({ browser }) => {
    // Host creates a room
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    // Capture console logs from host page
    const hostLogs: string[] = [];
    hostPage.on('console', (msg) => {
      hostLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await hostPage.goto(`${BASE_URL}/host`);
    await expect(hostPage.getByText('Connected')).toBeVisible({ timeout: 10000 });

    await hostPage.getByRole('button', { name: /create room/i }).click();
    await expect(hostPage.getByText('Room Code')).toBeVisible({ timeout: 10000 });

    // Get the room code number from the page
    const roomCodeElement = hostPage.locator('.text-5xl.font-black.text-primary');
    const roomCodeText = await roomCodeElement.textContent();
    expect(roomCodeText).toBeTruthy();
    const roomCode = roomCodeText!.trim();
    console.log(`Room code: ${roomCode}`);

    // Player joins the room
    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();

    const playerLogs: string[] = [];
    playerPage.on('console', (msg) => {
      playerLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await playerPage.goto(`${BASE_URL}/join`);
    await expect(playerPage.getByText('Connected')).toBeVisible({ timeout: 10000 });

    // Fill in room code and nickname
    await playerPage.getByPlaceholder('Enter room code...').fill(roomCode);
    await playerPage.getByPlaceholder('Enter your nickname...').fill('TestPlayer');

    // Click GET READY
    await playerPage.getByRole('button', { name: /get ready/i }).click();

    // Player should navigate to game page
    await expect(playerPage).toHaveURL(/\/game/, { timeout: 10000 });

    // Wait a moment for the broadcast to propagate
    await hostPage.waitForTimeout(2000);

    // Debug: print logs
    console.log('=== HOST LOGS ===');
    hostLogs.filter(l => l.includes('[WS]')).forEach(l => console.log(l));
    console.log('=== PLAYER LOGS ===');
    playerLogs.filter(l => l.includes('[WS]')).forEach(l => console.log(l));

    // Host should see the player count update
    await expect(hostPage.getByText('1 player')).toBeVisible({ timeout: 15000 });

    // Host should see the player name in the list
    await expect(hostPage.getByText('TestPlayer')).toBeVisible({ timeout: 5000 });

    // Cleanup
    await hostContext.close();
    await playerContext.close();
  });
});

test.describe('API Health Check', () => {
  test('API /health returns healthy', async ({ request }) => {
    const response = await request.get('http://localhost:8002/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.questionsLoaded).toBeGreaterThan(0);
  });

  test('API /questions returns questions', async ({ request }) => {
    const response = await request.get('http://localhost:8002/questions');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);
  });
});

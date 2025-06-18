import WebSocket from 'ws';

// WebSocket URL
const wsUrl = 'ws://localhost:8001';

console.log(`Connecting to ${wsUrl}...`);

// Create WebSocket connection
const ws = new WebSocket(wsUrl);

// Connection opened
ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send join message as quiz_master
  const joinMessage = {
    type: 'join',
    name: 'quiz_master'
  };
  
  console.log('Sending join message:', joinMessage);
  ws.send(JSON.stringify(joinMessage));
  
  // Set timeout to disconnect after 5 seconds
  setTimeout(() => {
    console.log('Closing connection after 5 seconds...');
    ws.close();
  }, 5000);
});

// Listen for messages
ws.on('message', (data) => {
  console.log('Received message:', data.toString());
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(data.toString());
    console.log('Parsed message:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    // Not JSON, just print as string
    console.log('Raw message:', data.toString());
  }
});

// Connection closed
ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

// Error handler
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, closing connection...');
  ws.close();
  process.exit(0);
});
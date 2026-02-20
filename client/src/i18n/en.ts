import type { Translations } from './types';

export const en: Translations = {
  // Common
  'common.loading': 'Loading...',
  'common.connected': 'Connected',
  'common.disconnected': 'Disconnected',
  'common.connecting': 'Connecting...',
  'common.seconds': 'Seconds',
  'common.players': 'Players',
  'common.nPlayers': '{n} Players',
  'common.playersOnline': 'Players Online',
  'common.scorePts': '{score} pts',
  'common.percentComplete': '{n}% Complete',
  'common.leaderboard': 'Leaderboard',
  'common.champion': 'Champion',
  'common.mvp': 'MVP',
  'common.correct': 'CORRECT',
  'common.you': 'YOU',

  // Home
  'home.subtitle': 'Real-time Multiplayer Wedding Quiz Game',
  'home.joinGame': 'JOIN GAME',
  'home.hostGame': 'Host a Game',
  'home.helpText': 'Ready to have fun? Ask your host for the room code!',

  // PlayerJoin
  'playerJoin.title': 'Join Game',
  'playerJoin.welcome': 'Welcome to the Celebration!',
  'playerJoin.welcomeDesc': 'Pick a name and a buddy to start playing.',
  'playerJoin.roomCode': 'Room Code',
  'playerJoin.roomCodePlaceholder': 'Enter room code...',
  'playerJoin.nickname': 'Your Nickname',
  'playerJoin.nicknamePlaceholder': 'Enter your nickname...',
  'playerJoin.nicknameRequired': 'Please enter a nickname',
  'playerJoin.roomCodeRequired': 'Please enter a room code',
  'playerJoin.playersJoined': '{n} Players already joined!',
  'playerJoin.getReady': 'GET READY',
  'playerJoin.waitingForHost': 'Waiting for host to start the fun...',

  // HostDashboard
  'hostDashboard.title': 'Host Dashboard',
  'hostDashboard.createRoom': 'Create a Game Room',
  'hostDashboard.createRoomDesc': 'Start a new game session and share the room code with your guests.',
  'hostDashboard.hostName': 'Host Name',
  'hostDashboard.hostNamePlaceholder': 'Enter your name',
  'hostDashboard.countdownTimer': 'Countdown Timer (seconds)',
  'hostDashboard.auto': 'Auto',
  'hostDashboard.autoDesc': "Auto uses each question's built-in timer",
  'hostDashboard.roomCode': 'Room Code',
  'hostDashboard.shareCode': 'Share this code with players to join',
  'hostDashboard.questionsReady': 'Questions Ready',
  'hostDashboard.timer': 'Timer',
  'hostDashboard.startGame': 'Start Game',
  'hostDashboard.playersJoined': 'Players Joined',
  'hostDashboard.nPlayers': '{n} player{s}',
  'hostDashboard.waitingForPlayers': 'Waiting for players to join...',
  'hostDashboard.shareCodeToStart': 'Share the room code above to get started',
  'hostDashboard.footer': 'Wedding Jump 2024',
  'hostDashboard.exitToHome': 'Exit to Home',

  // HostGame
  'hostGame.question': 'Question',

  // PlayerGame
  'playerGame.rank': 'Rank',
  'playerGame.questionProgress': 'Question {current} of {total}',
  'playerGame.tapToMove': 'Tap a zone to move!',
  'playerGame.play': 'Play',
  'playerGame.ranks': 'Ranks',
  'playerGame.chat': 'Chat',
  'playerGame.me': 'Me',

  // FinalRankings
  'finalRankings.title': 'Final Leaderboard',
  'finalRankings.gameCompleted': 'Game Completed',
  'finalRankings.congratulations': 'Congratulations!',
  'finalRankings.championsDesc': 'Amazing energy! Here are our champions.',
  'finalRankings.backToHome': 'Back to Home Screen',
  'finalRankings.footer': 'Wedding Trivia 2024',

  // GameControls
  'gameControls.startQuestion': 'Start Question',
  'gameControls.revealAnswer': 'Reveal Answer',
  'gameControls.showLeaderboard': 'Show Leaderboard',
  'gameControls.nextQuestion': 'Next Question',
  'gameControls.endGame': 'End Game',
  'gameControls.finalRankings': 'Final Rankings',
  'gameControls.closeRoom': 'Close Room',

  // QuestionCard
  'questionCard.questionNumber': 'Question {current} / {total}',
  'questionCard.trueFalse': 'True / False',
  'questionCard.multipleChoice': 'Multiple Choice',
  'questionCard.oYes': 'O (Yes)',
  'questionCard.xNo': 'X (No)',

  // AnswerGrid
  'answerGrid.nPlayers': '{n} players',

  // LeaderboardPopup
  'leaderboardPopup.continueGame': 'Continue Game',
  'leaderboardPopup.closeRoom': 'Close Room',
  'leaderboardPopup.finalRankings': 'Final Rankings',
  'leaderboardPopup.currentStandings': 'Current Standings',

  // AvatarSelector
  'avatarSelector.title': 'Choose Your Buddy',
  'avatarSelector.nOptions': '{n} options',
  'avatarSelector.all': 'All',
  'avatarSelector.animals': 'Animals',
  'avatarSelector.characters': 'Characters',
  'avatarSelector.robots': 'Robots',
  'avatarSelector.myPhoto': 'My Photo',
  'avatarSelector.upload': 'Upload',
  'avatarSelector.invalidFile': 'Please select an image file',
  'avatarSelector.fileTooLarge': 'Image size cannot exceed 500KB',
};

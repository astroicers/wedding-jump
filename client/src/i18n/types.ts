export type Language = 'zh' | 'en';

export interface Translations {
  // Common
  'common.loading': string;
  'common.connected': string;
  'common.disconnected': string;
  'common.connecting': string;
  'common.seconds': string;
  'common.players': string;
  'common.nPlayers': string;
  'common.playersOnline': string;
  'common.scorePts': string;
  'common.percentComplete': string;
  'common.leaderboard': string;
  'common.champion': string;
  'common.mvp': string;
  'common.correct': string;
  'common.you': string;

  // Home
  'home.subtitle': string;
  'home.joinGame': string;
  'home.hostGame': string;
  'home.helpText': string;

  // PlayerJoin
  'playerJoin.title': string;
  'playerJoin.welcome': string;
  'playerJoin.welcomeDesc': string;
  'playerJoin.roomCode': string;
  'playerJoin.roomCodePlaceholder': string;
  'playerJoin.nickname': string;
  'playerJoin.nicknamePlaceholder': string;
  'playerJoin.nicknameRequired': string;
  'playerJoin.roomCodeRequired': string;
  'playerJoin.playersJoined': string;
  'playerJoin.getReady': string;
  'playerJoin.waitingForHost': string;

  // HostDashboard
  'hostDashboard.title': string;
  'hostDashboard.createRoom': string;
  'hostDashboard.createRoomDesc': string;
  'hostDashboard.hostName': string;
  'hostDashboard.hostNamePlaceholder': string;
  'hostDashboard.countdownTimer': string;
  'hostDashboard.auto': string;
  'hostDashboard.autoDesc': string;
  'hostDashboard.roomCode': string;
  'hostDashboard.shareCode': string;
  'hostDashboard.questionsReady': string;
  'hostDashboard.timer': string;
  'hostDashboard.startGame': string;
  'hostDashboard.playersJoined': string;
  'hostDashboard.nPlayers': string;
  'hostDashboard.waitingForPlayers': string;
  'hostDashboard.shareCodeToStart': string;
  'hostDashboard.footer': string;
  'hostDashboard.exitToHome': string;

  // HostGame
  'hostGame.question': string;

  // PlayerGame
  'playerGame.rank': string;
  'playerGame.questionProgress': string;
  'playerGame.tapToMove': string;
  'playerGame.play': string;
  'playerGame.ranks': string;
  'playerGame.chat': string;
  'playerGame.me': string;

  // FinalRankings
  'finalRankings.title': string;
  'finalRankings.gameCompleted': string;
  'finalRankings.congratulations': string;
  'finalRankings.championsDesc': string;
  'finalRankings.backToHome': string;
  'finalRankings.footer': string;

  // GameControls
  'gameControls.startQuestion': string;
  'gameControls.revealAnswer': string;
  'gameControls.showLeaderboard': string;
  'gameControls.nextQuestion': string;
  'gameControls.endGame': string;
  'gameControls.finalRankings': string;
  'gameControls.closeRoom': string;

  // QuestionCard
  'questionCard.questionNumber': string;
  'questionCard.trueFalse': string;
  'questionCard.multipleChoice': string;
  'questionCard.oYes': string;
  'questionCard.xNo': string;

  // AnswerGrid
  'answerGrid.nPlayers': string;

  // LeaderboardPopup
  'leaderboardPopup.continueGame': string;
  'leaderboardPopup.closeRoom': string;
  'leaderboardPopup.finalRankings': string;
  'leaderboardPopup.currentStandings': string;

  // AvatarSelector
  'avatarSelector.title': string;
  'avatarSelector.nOptions': string;
  'avatarSelector.all': string;
  'avatarSelector.animals': string;
  'avatarSelector.characters': string;
  'avatarSelector.robots': string;
  'avatarSelector.myPhoto': string;
  'avatarSelector.upload': string;
  'avatarSelector.invalidFile': string;
  'avatarSelector.fileTooLarge': string;
}

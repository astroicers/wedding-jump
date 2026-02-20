import type { Translations } from './types';

export const zh: Translations = {
  // 通用
  'common.loading': '載入中...',
  'common.connected': '已連線',
  'common.disconnected': '已斷線',
  'common.connecting': '連線中...',
  'common.seconds': '秒',
  'common.players': '位玩家',
  'common.nPlayers': '{n} 位玩家',
  'common.playersOnline': '在線玩家',
  'common.scorePts': '{score} 分',
  'common.percentComplete': '已完成 {n}%',
  'common.leaderboard': '排行榜',
  'common.champion': '冠軍',
  'common.mvp': 'MVP',
  'common.correct': '正確',
  'common.you': '你',
  'common.errorTitle': '發生錯誤',
  'common.errorMessage': '發生了意外錯誤，請重試。',
  'common.retry': '重試',
  'common.waitingForQuestion': '等待題目中...',

  // 首頁
  'home.subtitle': '即時多人婚禮問答遊戲',
  'home.joinGame': '加入遊戲',
  'home.hostGame': '主持遊戲',
  'home.helpText': '準備好了嗎？向主持人索取房間代碼！',

  // 玩家加入
  'playerJoin.title': '加入遊戲',
  'playerJoin.welcome': '歡迎來到派對！',
  'playerJoin.welcomeDesc': '選一個名字和夥伴，開始遊戲吧。',
  'playerJoin.roomCode': '房間代碼',
  'playerJoin.roomCodePlaceholder': '請輸入房間代碼...',
  'playerJoin.nickname': '你的暱稱',
  'playerJoin.nicknamePlaceholder': '請輸入暱稱...',
  'playerJoin.nicknameRequired': '請輸入暱稱',
  'playerJoin.roomCodeRequired': '請輸入房間代碼',
  'playerJoin.playersJoined': '已有 {n} 位玩家加入！',
  'playerJoin.getReady': '準備好了',
  'playerJoin.waitingForHost': '等待主持人開始遊戲...',

  // 主持人控制台
  'hostDashboard.title': '主持人控制台',
  'hostDashboard.createRoom': '建立遊戲房間',
  'hostDashboard.createRoomDesc': '建立新的遊戲，並將房間代碼分享給來賓。',
  'hostDashboard.hostName': '主持人名稱',
  'hostDashboard.hostNamePlaceholder': '請輸入名稱',
  'hostDashboard.countdownTimer': '倒數計時（秒）',
  'hostDashboard.auto': '自動',
  'hostDashboard.autoDesc': '自動使用每道題目內建的倒數時間',
  'hostDashboard.roomCode': '房間代碼',
  'hostDashboard.shareCode': '將此代碼分享給玩家加入',
  'hostDashboard.questionsReady': '題目已就緒',
  'hostDashboard.timer': '計時器',
  'hostDashboard.startGame': '開始遊戲',
  'hostDashboard.playersJoined': '已加入的玩家',
  'hostDashboard.nPlayers': '{n} 位玩家',
  'hostDashboard.waitingForPlayers': '等待玩家加入...',
  'hostDashboard.shareCodeToStart': '分享上方的房間代碼來開始',
  'hostDashboard.footer': 'Wedding Jump 2024',
  'hostDashboard.exitToHome': '回到首頁',

  // 主持人遊戲
  'hostGame.question': '第',

  // 玩家遊戲
  'playerGame.rank': '排名',
  'playerGame.questionProgress': '第 {current} / {total} 題',
  'playerGame.tapToMove': '點擊區域移動！',
  'playerGame.play': '遊戲',
  'playerGame.ranks': '排行',
  'playerGame.chat': '聊天',
  'playerGame.me': '我',

  // 最終排行
  'finalRankings.title': '最終排行榜',
  'finalRankings.gameCompleted': '遊戲結束',
  'finalRankings.congratulations': '恭喜！',
  'finalRankings.championsDesc': '精彩的表現！以下是我們的冠軍。',
  'finalRankings.backToHome': '回到首頁',
  'finalRankings.footer': 'Wedding Trivia 2024',

  // 遊戲控制
  'gameControls.startQuestion': '開始答題',
  'gameControls.revealAnswer': '揭曉答案',
  'gameControls.showLeaderboard': '顯示排行榜',
  'gameControls.nextQuestion': '下一題',
  'gameControls.endGame': '結束遊戲',
  'gameControls.finalRankings': '最終排行',
  'gameControls.closeRoom': '關閉房間',

  // 題目卡片
  'questionCard.questionNumber': '第 {current} / {total} 題',
  'questionCard.trueFalse': '是非題',
  'questionCard.multipleChoice': '選擇題',
  'questionCard.oYes': 'O（是）',
  'questionCard.xNo': 'X（否）',

  // 答案網格
  'answerGrid.nPlayers': '{n} 位玩家',

  // 排行榜彈窗
  'leaderboardPopup.continueGame': '繼續遊戲',
  'leaderboardPopup.closeRoom': '關閉房間',
  'leaderboardPopup.finalRankings': '最終排行',
  'leaderboardPopup.currentStandings': '目前排名',

  // 頭像選擇
  'avatarSelector.title': '選擇你的夥伴',
  'avatarSelector.nOptions': '{n} 個選項',
  'avatarSelector.all': '全部',
  'avatarSelector.animals': '動物',
  'avatarSelector.characters': '角色',
  'avatarSelector.robots': '機器人',
  'avatarSelector.myPhoto': '我的照片',
  'avatarSelector.upload': '上傳',
  'avatarSelector.invalidFile': '請選擇圖片檔案',
  'avatarSelector.fileTooLarge': '圖片大小不能超過 500KB',
};

export function clearGameSession() {
  sessionStorage.removeItem('wedding-jump-room');
  sessionStorage.removeItem('wedding-jump-player');
  sessionStorage.removeItem('wedding-jump-game');
}

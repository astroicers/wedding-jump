import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Home,
  PlayerJoin,
  PlayerGame,
  FinalRankings,
  HostDashboard,
  HostGame,
} from './pages';

function App() {
  return (
    <Router>
      <Routes>
        {/* 共用頁面 */}
        <Route path="/" element={<Home />} />
        <Route path="/rankings" element={<FinalRankings />} />

        {/* 玩家端路由 */}
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/game" element={<PlayerGame />} />

        {/* 主持人端路由 */}
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/game" element={<HostGame />} />
      </Routes>
    </Router>
  );
}

export default App;

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const PlayerJoin = lazy(() => import('./pages/PlayerJoin').then((m) => ({ default: m.PlayerJoin })));
const PlayerGame = lazy(() => import('./pages/PlayerGame').then((m) => ({ default: m.PlayerGame })));
const FinalRankings = lazy(() => import('./pages/FinalRankings').then((m) => ({ default: m.FinalRankings })));
const HostDashboard = lazy(() => import('./pages/HostDashboard').then((m) => ({ default: m.HostDashboard })));
const HostGame = lazy(() => import('./pages/HostGame').then((m) => ({ default: m.HostGame })));

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import HeatmapPage from './pages/HeatmapPage';
import DemoPage from './pages/DemoPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Demo website - standalone page with tracker */}
        <Route path="/demo" element={<DemoPage />} />

        {/* Dashboard routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

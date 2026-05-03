import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './components/ui/Toast';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Candidates from './pages/Candidates';
import JobRoles from './pages/JobRoles';
import Screening from './pages/Screening';
import Analytics from './pages/Analytics';
import './App.css';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-layout" data-collapsed={sidebarCollapsed}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(p => !p)}
          />
          <div
            className="main-content"
            style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
          >
            <TopBar
              theme={theme}
              onToggleTheme={toggleTheme}
              onToggleMobileMenu={() => setSidebarCollapsed(p => !p)}
            />
            <main className="main-area">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/jobs" element={<JobRoles />} />
                <Route path="/screening" element={<Screening />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
            </main>
          </div>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

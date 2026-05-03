import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Users, Briefcase, Target, BarChart3,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/upload', icon: Upload, label: 'Upload Resumes' },
  { path: '/candidates', icon: Users, label: 'Candidates' },
  { path: '/jobs', icon: Briefcase, label: 'Job Roles' },
  { path: '/screening', icon: Target, label: 'Screen & Match' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <Sparkles size={22} />
          </div>
          {!collapsed && (
            <div className="sidebar__logo-text">
              <span className="sidebar__brand">SmartScreen</span>
              <span className="sidebar__sub">HR Platform</span>
            </div>
          )}
        </div>
        <button className="sidebar__toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="sidebar__link-icon" />
            {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            {!collapsed && (
              <div className="sidebar__link-indicator" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        {!collapsed && (
          <div className="sidebar__version">
            <span>v2.0.0</span>
            <span>AI-Powered</span>
          </div>
        )}
      </div>
    </aside>
  );
}

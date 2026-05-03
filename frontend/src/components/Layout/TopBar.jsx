import { Sun, Moon, Menu } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ theme, onToggleTheme, onToggleMobileMenu }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__mobile-menu" onClick={onToggleMobileMenu} aria-label="Menu">
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar__right">
        <button
          className="topbar__theme-btn"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="topbar__avatar">
          <span>HR</span>
        </div>
      </div>
    </header>
  );
}

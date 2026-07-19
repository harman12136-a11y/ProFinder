import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getUnreadCount } from '../utils/storage';
import Logo from './Logo';
import { LogOut, Plus, Compass, BookMarked, LayoutDashboard, Sun, Moon, MessageCircle, Briefcase } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ variant = 'default' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const unread = user ? getUnreadCount(user.id) : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav
      className={`navbar ${variant}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-inner page-container">
        <Link to="/" className="navbar-brand">
          <Logo className="navbar-logo" />
          <span className="navbar-name">Profinder</span>
        </Link>

        <div className="navbar-center">
          <Link to="/discover" className="nav-link">
            <Compass size={18} />
            Discover
          </Link>
          <Link to="/services" className="nav-link">
            <Briefcase size={18} />
            Services
          </Link>
          {user && (
            <Link to="/library" className="nav-link">
              <BookMarked size={18} />
              Library
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <Link to="/list-software" className="btn btn-primary nav-btn">
                <Plus size={18} />
                Start selling
              </Link>
              <Link to="/messages" className="nav-link nav-messages">
                <MessageCircle size={18} />
                Messages
                {unread > 0 && <span className="nav-badge">{unread}</span>}
              </Link>
              <Link to="/dashboard" className="nav-link">
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <button className="btn btn-ghost nav-logout" onClick={handleLogout}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Start selling</Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

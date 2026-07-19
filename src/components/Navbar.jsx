import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getUnreadCount } from '../utils/storage';
import Logo from './Logo';
import { LogOut, Plus, Compass, BookMarked, LayoutDashboard, Sun, Moon, MessageCircle, Briefcase, Search } from 'lucide-react';
import './Navbar.css';

const ENTRANCE_KEY = 'profinder-navbar-animated';

function NavTab({ to, icon: Icon, children, className = '' }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${className}${isActive ? ' active' : ''}`.trim()}
    >
      <Icon size={18} />
      <span className="nav-link-label">{children}</span>
    </NavLink>
  );
}

export default function Navbar({ variant = 'default' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const unread = user ? getUnreadCount(user.id) : 0;
  const entranceDone = sessionStorage.getItem(ENTRANCE_KEY) === '1';

  useEffect(() => {
    if (!entranceDone) {
      sessionStorage.setItem(ENTRANCE_KEY, '1');
    }
  }, [entranceDone]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav
      className={`navbar ${variant}`}
      initial={entranceDone ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <Logo className="navbar-logo" />
            <span className="navbar-name">Profinder</span>
          </Link>
          {user && (
            <NavTab to="/dashboard" icon={LayoutDashboard} className="nav-dashboard">
              Dashboard
            </NavTab>
          )}
        </div>

        <div className="navbar-center">
          {user && (
            <>
              <NavTab to="/discover" icon={Compass}>Discover</NavTab>
              <NavTab to="/services" icon={Briefcase}>Services</NavTab>
              <NavTab to="/jobs" icon={Search}>Jobs</NavTab>
              <NavTab to="/library" icon={BookMarked}>Library</NavTab>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <NavLink
                to="/messages"
                className={({ isActive }) => `nav-link nav-messages${isActive ? ' active' : ''}`}
              >
                <MessageCircle size={18} />
                <span className="nav-link-label">Messages</span>
                {unread > 0 && <span className="nav-badge">{unread}</span>}
              </NavLink>
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/list-software" className="btn btn-primary nav-btn">
                <Plus size={18} />
                Start selling
              </Link>
              <button type="button" className="btn btn-ghost nav-logout" onClick={handleLogout} aria-label="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/login" className="btn btn-outline">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Start selling</Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

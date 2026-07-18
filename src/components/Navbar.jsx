import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import Logo from './Logo';
import { LogOut, Plus, LayoutGrid, User, Sun, Moon } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ variant = 'default' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
              <Link to="/marketplace" className="nav-link">
                <LayoutGrid size={18} />
                Marketplace
              </Link>
              <Link to="/list-software" className="btn btn-primary nav-btn">
                <Plus size={18} />
                List Software
              </Link>
              <Link to="/dashboard" className="nav-link">
                <User size={18} />
                {user.name.split(' ')[0]}
              </Link>
              <button className="btn btn-ghost nav-logout" onClick={handleLogout}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Log In</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

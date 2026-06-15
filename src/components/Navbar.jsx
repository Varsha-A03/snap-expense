import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdUpload, MdHistory, MdLogout } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import '../styles/navbar.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { to: '/upload', label: 'Upload', icon: MdUpload },
  { to: '/history', label: 'History', icon: MdHistory },
];

function getInitials(email) {
  return email ? email.charAt(0).toUpperCase() : '?';
}

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch {
      setLoggingOut(false);
    }
  }

  const email = user?.email ?? '';

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="navbar-brand">
        SnapExpense
      </NavLink>

      <div className="navbar-right">
        <ul className="navbar-links">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `navbar-link${isActive ? ' active' : ''}`
                }
              >
                <Icon size={18} />
                <span className="navbar-link-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar-user">
          <div className="navbar-avatar" title={email}>
            {getInitials(email)}
          </div>
          <span className="navbar-email">{email}</span>
          <button
            type="button"
            className="navbar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
          >
            <MdLogout size={18} />
            <span className="navbar-logout-label">
              {loggingOut ? 'Signing out...' : 'Logout'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

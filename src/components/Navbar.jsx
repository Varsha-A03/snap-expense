import { NavLink } from 'react-router-dom';
import { MdDashboard, MdUpload, MdHistory } from 'react-icons/md';
import '../styles/navbar.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { to: '/upload', label: 'Upload', icon: MdUpload },
  { to: '/history', label: 'History', icon: MdHistory },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="navbar-brand">
        SnapExpense
      </NavLink>
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
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

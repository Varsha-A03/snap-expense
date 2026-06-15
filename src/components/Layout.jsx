import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-content">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

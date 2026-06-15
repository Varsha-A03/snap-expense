import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Upload from '../pages/Upload';
import Confirm from '../pages/Confirm';
import History from '../pages/History';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/history" element={<History />} />
          </Route>
          <Route path="/confirm" element={<Confirm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

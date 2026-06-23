import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Checking your session..." />;
  }

  if (!session) {
    const shared = new URLSearchParams(location.search).get('shared');
    const loginPath = shared ? `/?shared=${shared}` : '/';
    return <Navigate to={loginPath} replace />;
  }

  return <Outlet />;
}

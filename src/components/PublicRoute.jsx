import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

export default function PublicRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading SnapExpense..." />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

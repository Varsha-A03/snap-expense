import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

export default function PublicRoute() {
  const { session, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return <LoadingScreen message="Loading SnapExpense..." />;
  }

  if (session) {
    const shared = searchParams.get('shared');
    if (shared) {
      return <Navigate to={`/upload?shared=${shared}`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

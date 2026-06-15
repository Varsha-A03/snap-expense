import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}.</p>
      </header>
      <div className="page-card">
        <p className="page-card-placeholder">
          Spending summary and charts will appear here in the next phase.
        </p>
      </div>
    </>
  );
}

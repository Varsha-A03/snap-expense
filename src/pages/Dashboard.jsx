import { Link } from 'react-router-dom';
import { MdAccountBalanceWallet, MdCalendarMonth, MdReceipt } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import SummaryCard from '../components/SummaryCard';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import TransactionList from '../components/TransactionList';
import LoadingScreen from '../components/LoadingScreen';
import {
  formatCurrency,
  getTotalAmount,
  getCurrentMonthTransactions,
  groupByCategory,
  groupByMonth,
} from '../lib/transactionUtils';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, loading, error } = useTransactions();

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (error) {
    return <p className="page-error">{error}</p>;
  }

  const monthTransactions = getCurrentMonthTransactions(transactions);
  const totalSpend = getTotalAmount(transactions);
  const monthSpend = getTotalAmount(monthTransactions);
  const categoryData = groupByCategory(transactions);
  const monthlyData = groupByMonth(transactions);
  const recentTransactions = transactions.slice(0, 5);
  const topCategory = categoryData[0]?.name;

  return (
    <>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}.</p>
      </header>

      <section className="dashboard-summary">
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totalSpend)}
          subtitle="All time"
          icon={MdAccountBalanceWallet}
        />
        <SummaryCard
          title="This Month"
          value={formatCurrency(monthSpend)}
          subtitle={`${monthTransactions.length} transaction${monthTransactions.length !== 1 ? 's' : ''}`}
          icon={MdCalendarMonth}
        />
        <SummaryCard
          title="Transactions"
          value={String(transactions.length)}
          subtitle="Total saved"
          icon={MdReceipt}
        />
      </section>

      <section className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Category Breakdown</h2>
              <p className="chart-card-subtitle">
                {topCategory
                  ? `${topCategory} is your largest spending category`
                  : 'Your spending split will appear here'}
              </p>
            </div>
          </div>
          <CategoryPieChart data={categoryData} />
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Monthly Spending</h2>
              <p className="chart-card-subtitle">Your last six calendar months</p>
            </div>
          </div>
          <MonthlyBarChart data={monthlyData} />
        </div>
      </section>

      <section className="dashboard-recent">
        <div className="dashboard-recent-header">
          <h2>Recent Transactions</h2>
          {transactions.length > 0 && (
            <Link to="/history" className="dashboard-recent-link">
              View all
            </Link>
          )}
        </div>
        {transactions.length === 0 ? (
          <p className="page-card-placeholder">
            No transactions yet. Upload a screenshot to get started.
          </p>
        ) : (
          <TransactionList transactions={recentTransactions} compact />
        )}
      </section>
    </>
  );
}

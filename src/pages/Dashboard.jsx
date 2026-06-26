import { Link } from 'react-router-dom';
import {
  MdAccountBalanceWallet,
  MdCalendarMonth,
  MdReceipt,
  MdAdd,
  MdRemove,
} from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import SummaryCard from '../components/SummaryCard';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import TransactionList from '../components/TransactionList';
import SourceBreakdown from '../components/SourceBreakdown';
import LoadingScreen from '../components/LoadingScreen';
import {
  formatCurrency,
  getBalance,
  getTotalByDirection,
  getCurrentMonthTransactions,
  groupByCategory,
  groupByMonth,
  groupBySource,
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
  const balance = getBalance(transactions);
  const moneyIn = getTotalByDirection(transactions, 'credit');
  const moneyOut = getTotalByDirection(transactions, 'debit');
  const monthMoneyIn = getTotalByDirection(monthTransactions, 'credit');
  const monthMoneyOut = getTotalByDirection(monthTransactions, 'debit');
  const categoryData = groupByCategory(transactions);
  const monthlyData = groupByMonth(transactions);
  const sourceData = groupBySource(transactions);
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
          title="Account Balance"
          value={formatCurrency(balance)}
          subtitle="Money in minus money out"
          icon={MdAccountBalanceWallet}
        />
        <SummaryCard
          title="Money In"
          value={formatCurrency(moneyIn)}
          subtitle={`${formatCurrency(monthMoneyIn)} this month`}
          icon={MdAdd}
        />
        <SummaryCard
          title="Money Out"
          value={formatCurrency(moneyOut)}
          subtitle={`${formatCurrency(monthMoneyOut)} this month`}
          icon={MdRemove}
        />
        <SummaryCard
          title="This Month"
          value={formatCurrency(monthMoneyIn - monthMoneyOut)}
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

      <section className="dashboard-sources">
        <div className="dashboard-recent-header">
          <div>
            <h2>By Source</h2>
            <p className="dashboard-section-subtitle">
              How much you received and spent from each source
            </p>
          </div>
          <Link to="/sources" className="dashboard-recent-link">
            Manage sources
          </Link>
        </div>
        <SourceBreakdown data={sourceData} />
      </section>

      <section className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Spending by Category</h2>
              <p className="chart-card-subtitle">
                {topCategory
                  ? `${topCategory} is your largest spending category`
                  : 'Money-out transactions by category'}
              </p>
            </div>
          </div>
          <CategoryPieChart data={categoryData} />
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h2 className="chart-card-title">Monthly Net Change</h2>
              <p className="chart-card-subtitle">Money in minus money out per month</p>
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

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MdAccountBalanceWallet,
  MdCalendarMonth,
  MdReceipt,
  MdAdd,
  MdRemove,
  MdEventRepeat,
  MdWarningAmber,
} from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { useBudgets } from '../hooks/useBudgets';
import SummaryCard from '../components/SummaryCard';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import TransactionList from '../components/TransactionList';
import SourceBreakdown from '../components/SourceBreakdown';
import LoadingScreen from '../components/LoadingScreen';
import { deleteTransaction } from '../lib/transactions';
import { processDueRecurring } from '../lib/recurring';
import { getBudgetProgress } from '../lib/budgets';
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
import '../styles/budgets.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, loading, error, reload } = useTransactions();
  const { budgets } = useBudgets();
  const [deletingId, setDeletingId] = useState(null);
  const [recurringNotice, setRecurringNotice] = useState('');
  const recurringProcessed = useRef(false);

  useEffect(() => {
    if (!user?.id || recurringProcessed.current) return;
    recurringProcessed.current = true;

    processDueRecurring(user.id)
      .then((created) => {
        if (created > 0) {
          setRecurringNotice(
            `${created} recurring transaction${created !== 1 ? 's' : ''} added automatically.`,
          );
          reload();
        }
      })
      .catch(() => {
        // Recurring auto-creation is best-effort; rules stay due for next visit.
      });
  }, [user?.id, reload]);

  function handleEdit(transaction) {
    navigate('/confirm', { state: { editing: transaction } });
  }

  async function handleDelete(transaction) {
    const label = transaction.merchant || 'this transaction';
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) {
      return;
    }

    setDeletingId(transaction.id);
    try {
      await deleteTransaction(transaction.id, transaction.image_url);
      await reload();
    } catch (err) {
      window.alert(err.message || 'Could not delete transaction.');
    } finally {
      setDeletingId(null);
    }
  }

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
  const budgetProgress = getBudgetProgress(budgets, monthTransactions);
  const budgetAlerts = budgetProgress.filter((b) => b.over || b.near);

  return (
    <>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}.</p>
      </header>

      {recurringNotice && (
        <div className="dashboard-recurring-notice" role="status">
          <MdEventRepeat size={18} />
          {recurringNotice}
        </div>
      )}

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

      {budgetProgress.length > 0 && (
        <section className="dashboard-budgets">
          <div className="dashboard-recent-header">
            <div>
              <h2>Budgets This Month</h2>
              <p className="dashboard-section-subtitle">
                {budgetAlerts.length > 0
                  ? `${budgetAlerts.length} categor${budgetAlerts.length === 1 ? 'y' : 'ies'} need${budgetAlerts.length === 1 ? 's' : ''} attention`
                  : 'All categories within budget'}
              </p>
            </div>
            <Link to="/budgets" className="dashboard-recent-link">
              Manage budgets
            </Link>
          </div>
          <div className="dashboard-budgets-grid">
            {budgetProgress.map((b) => (
              <div key={b.id} className="dashboard-budget-item">
                <div className="dashboard-budget-top">
                  <span className="dashboard-budget-category">{b.category}</span>
                  {b.over ? (
                    <span className="budgets-status budgets-status-over">
                      <MdWarningAmber size={14} />
                      Over budget
                    </span>
                  ) : b.near ? (
                    <span className="budgets-status budgets-status-near">
                      <MdWarningAmber size={14} />
                      Almost there
                    </span>
                  ) : (
                    <span className="budgets-status budgets-status-ok">On track</span>
                  )}
                </div>
                <div className="budgets-progress-track">
                  <div
                    className={`budgets-progress-fill${b.over ? ' over' : b.near ? ' near' : ''}`}
                    style={{ width: `${b.percent}%` }}
                  />
                </div>
                <span className="dashboard-budget-amounts">
                  {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

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
          <TransactionList
            transactions={recentTransactions}
            compact
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </section>
    </>
  );
}

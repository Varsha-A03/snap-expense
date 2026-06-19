import { useMemo, useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionList from '../components/TransactionList';
import LoadingScreen from '../components/LoadingScreen';
import {
  CATEGORIES,
  filterTransactions,
  getMonthOptions,
} from '../lib/transactionUtils';
import '../styles/history.css';

export default function History() {
  const { transactions, loading, error } = useTransactions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [month, setMonth] = useState('');

  const monthOptions = useMemo(
    () => getMonthOptions(transactions),
    [transactions],
  );

  const filtered = useMemo(
    () => filterTransactions(transactions, { search, category, month }),
    [transactions, search, category, month],
  );

  if (loading) {
    return <LoadingScreen message="Loading transaction history..." />;
  }

  if (error) {
    return <p className="page-error">{error}</p>;
  }

  return (
    <>
      <header className="page-header">
        <h1>History</h1>
        <p>View and filter all your saved transactions.</p>
      </header>

      <div className="history-card">
        <div className="history-filters">
          <div className="history-filter history-filter-search">
            <label className="history-filter-label" htmlFor="history-search">
              Search merchant
            </label>
            <input
              id="history-search"
              type="search"
              className="history-filter-input"
              placeholder="e.g. Zomato, Swiggy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="history-filter">
            <label className="history-filter-label" htmlFor="history-category">
              Category
            </label>
            <select
              id="history-category"
              className="history-filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="history-filter">
            <label className="history-filter-label" htmlFor="history-month">
              Month
            </label>
            <select
              id="history-month"
              className="history-filter-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">All months</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="history-count">
          {filtered.length} of {transactions.length} transaction
          {transactions.length !== 1 ? 's' : ''}
          {(search || category !== 'All' || month) && ' (filtered)'}
        </p>

        {transactions.length === 0 ? (
          <p className="page-card-placeholder">
            No transactions yet. Save an expense from the Upload page to see it here.
          </p>
        ) : filtered.length === 0 ? (
          <p className="page-card-placeholder">
            No transactions match your filters. Try adjusting search or filters.
          </p>
        ) : (
          <TransactionList transactions={filtered} />
        )}
      </div>
    </>
  );
}

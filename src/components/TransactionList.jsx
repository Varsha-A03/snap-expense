import { formatCurrency, formatDate } from '../lib/transactionUtils';
import '../styles/transaction-list.css';

export default function TransactionList({ transactions, compact = false }) {
  if (!transactions.length) {
    return (
      <p className="transaction-list-empty">
        No transactions to show.
      </p>
    );
  }

  return (
    <ul className={`transaction-list${compact ? ' compact' : ''}`}>
      {transactions.map((t) => (
        <li key={t.id} className="transaction-item">
          <div className="transaction-item-main">
            <span className="transaction-merchant">{t.merchant}</span>
            <span className="transaction-amount">{formatCurrency(t.amount)}</span>
          </div>
          <div className="transaction-item-meta">
            <span className="transaction-category">{t.category}</span>
            <span className="transaction-date">{formatDate(t.transaction_date)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
